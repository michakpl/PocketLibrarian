// @vitest-environment node
import {describe, it, expect, vi, beforeEach} from 'vitest'
import {cookies} from 'next/headers'
import {encrypt, decrypt, createSession, deleteSession, getSession} from '@/lib/session'
import type {SessionPayload} from '@/lib/session'

const mockRedis = vi.hoisted(() => ({
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue('msal-token-xyz'),
    del: vi.fn().mockResolvedValue(1),
}))

vi.mock('@/lib/redis', () => ({
    default: mockRedis,
}))

interface CookieStoreMock {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
}

const mockCookieStore: CookieStoreMock = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
}

vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

const TEST_PAYLOAD: SessionPayload = {
    sessionId: 'session-id-123',
    userId: 'user-abc-123',
    name: 'Alice Reader',
    email: 'alice@example.com',
    accessToken: 'msal-token-xyz',
    accessTokenExpiresAt: Date.now() + 3600 * 1000,
}

describe('session — encrypt / decrypt', () => {
    it('decrypt returns null for undefined input', async () => {
        expect(await decrypt(undefined)).toBeNull()
    })

    it('decrypt returns null for an invalid token', async () => {
        expect(await decrypt('not.a.valid.jwt')).toBeNull()
    })

    it('decrypt returns null for a token signed with a different secret', async () => {
        const {SignJWT} = await import('jose')
        const differentKey = new TextEncoder().encode('completely-different-secret-key!!')
        const badToken = await new SignJWT({userId: 'x'})
            .setProtectedHeader({alg: 'HS256'})
            .setIssuedAt()
            .setExpirationTime('1d')
            .sign(differentKey)

        expect(await decrypt(badToken)).toBeNull()
    })
})

describe('session — createSession', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)
    })

    it('stores the accessToken in Redis (not in the cookie)', async () => {
        await createSession(TEST_PAYLOAD)

        expect(mockRedis.set).toHaveBeenCalledOnce()
        const [key, value] = mockRedis.set.mock.calls[0]
        expect(key).toContain(TEST_PAYLOAD.sessionId)
        expect(value).toBe(TEST_PAYLOAD.accessToken)
    })

    it('sets an httpOnly cookie that does NOT contain the accessToken', async () => {
        await createSession(TEST_PAYLOAD)

        expect(mockCookieStore.set).toHaveBeenCalledOnce()
        const [name, token, options] = mockCookieStore.set.mock.calls[0]
        expect(name).toBe('pocketlibrarian.session')
        expect(options.httpOnly).toBe(true)
        expect(options.sameSite).toBe('lax')
        expect(options.path).toBe('/')
        expect(typeof options.maxAge).toBe('number')

        const decoded = await decrypt(token)
        expect(decoded).not.toBeNull()
        expect((decoded as unknown as Record<string, unknown>)?.accessToken).toBeUndefined()
    })
})

describe('session — deleteSession', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)
    })

    it('deletes the session cookie', async () => {
        await deleteSession()
        expect(mockCookieStore.delete).toHaveBeenCalledWith('pocketlibrarian.session')
    })

    it('removes the Redis key when the cookie is present', async () => {
        const token = await encrypt(TEST_PAYLOAD)
        mockCookieStore.get.mockReturnValue({value: token})

        await deleteSession()

        expect(mockRedis.del).toHaveBeenCalledWith(`session:${TEST_PAYLOAD.sessionId}`)
    })
})

describe('session — getSession', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)
    })

    it('returns null when no cookie is present', async () => {
        mockCookieStore.get.mockReturnValue(undefined)
        expect(await getSession()).toBeNull()
    })

    it('returns the full session (with accessToken from Redis) when a valid cookie is present', async () => {
        const token = await encrypt(TEST_PAYLOAD)
        mockCookieStore.get.mockReturnValue({value: token})
        mockRedis.get.mockResolvedValue(TEST_PAYLOAD.accessToken)

        const session = await getSession()
        expect(session?.userId).toBe(TEST_PAYLOAD.userId)
        expect(session?.email).toBe(TEST_PAYLOAD.email)
        expect(session?.accessToken).toBe(TEST_PAYLOAD.accessToken)
    })

    it('returns null when the access token is missing from Redis (evicted)', async () => {
        const token = await encrypt(TEST_PAYLOAD)
        mockCookieStore.get.mockReturnValue({value: token})
        mockRedis.get.mockResolvedValue(null)

        expect(await getSession()).toBeNull()
    })

    it('returns null when the cookie value is an invalid token', async () => {
        mockCookieStore.get.mockReturnValue({value: 'garbage'})
        expect(await getSession()).toBeNull()
    })
})
