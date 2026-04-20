// @vitest-environment node
import {describe, it, expect, vi, beforeEach} from 'vitest'
import {NextRequest} from 'next/server'
import {decrypt} from '@/lib/session'
import {isAccessTokenExpired} from '@/lib/session-utils'
import proxy from '@/proxy'

vi.mock('@/lib/session', () => ({
    decrypt: vi.fn(),
}))

vi.mock('@/lib/session-utils', () => ({
    isAccessTokenExpired: vi.fn(),
}))

function makeRequest(path: string) {
    return new NextRequest(new URL(`http://localhost:3000${path}`))
}

function makeRequestWithCookie(path: string, cookieValue: string) {
    const req = new NextRequest(new URL(`http://localhost:3000${path}`))
    req.cookies.set('pocketlibrarian.session', cookieValue)
    return req
}

describe('proxy — unauthenticated user', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(decrypt).mockResolvedValue(null)
        vi.mocked(isAccessTokenExpired).mockReturnValue(false)
    })

    it('redirects to /auth when accessing a protected route', async () => {
        const res = await proxy(makeRequest('/library'))
        expect(res.status).toBe(307)
        expect(res.headers.get('location')).toContain('/auth')
    })

    it('redirects /library/sub-path to /auth', async () => {
        const res = await proxy(makeRequest('/library/some/nested'))
        expect(res.status).toBe(307)
        expect(res.headers.get('location')).toContain('/auth')
    })

    it('allows access to the /auth page', async () => {
        const res = await proxy(makeRequest('/auth'))
        expect(res.status).not.toBe(307)
    })

    it('allows access to public root without redirect', async () => {
        const res = await proxy(makeRequest('/'))
        expect(res.status).not.toBe(307)
    })
})

describe('proxy — authenticated user', () => {
    const fakeSession = {
        sessionId: 'sid-1',
        userId: 'u1',
        name: 'Bob',
        email: 'bob@example.com',
        accessTokenExpiresAt: new Date().getTime() + 10000,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(decrypt).mockResolvedValue(fakeSession)
        vi.mocked(isAccessTokenExpired).mockReturnValue(false)
    })

    it('allows access to protected routes', async () => {
        const res = await proxy(makeRequestWithCookie('/library', 'valid-token'))
        expect(res.status).not.toBe(307)
    })

    it('redirects away from /auth to /library (already signed in)', async () => {
        const res = await proxy(makeRequestWithCookie('/auth', 'valid-token'))
        expect(res.status).toBe(307)
        expect(res.headers.get('location')).toContain('/library')
    })
})

describe('proxy — expired token', () => {
    const expiredSession = {
        sessionId: 'sid-2',
        userId: 'u1',
        name: 'Bob',
        email: 'bob@example.com',
        accessTokenExpiresAt: new Date().getTime() - 10000,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(decrypt).mockResolvedValue(expiredSession)
        vi.mocked(isAccessTokenExpired).mockReturnValue(true)
    })

    it('redirects to /auth/refresh when accessing a protected route with an expired token', async () => {
        const res = await proxy(makeRequestWithCookie('/library', 'expired-token'))
        expect(res.status).toBe(307)
        expect(res.headers.get('location')).toContain('/auth/refresh')
    })

    it('includes callbackUrl in the refresh redirect', async () => {
        const res = await proxy(makeRequestWithCookie('/library/books', 'expired-token'))
        const location = res.headers.get('location') ?? ''
        expect(location).toContain('callbackUrl=%2Flibrary%2Fbooks')
    })

    it('allows access to /auth/refresh (always-allowed route)', async () => {
        const res = await proxy(makeRequestWithCookie('/auth/refresh', 'expired-token'))
        expect(res.status).not.toBe(307)
    })
})

