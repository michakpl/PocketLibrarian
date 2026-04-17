// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Mock session module so proxy doesn't pull in server-only indirectly through
// the real session module's module-level secret validation.
vi.mock('@/lib/session', () => ({
  decrypt: vi.fn(),
}))

import { decrypt } from '@/lib/session'
import proxy from '@/proxy'
import {ReadonlyRequestCookies} from "next/dist/server/web/spec-extension/adapters/request-cookies";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

function makeRequest(path: string) {
  return new NextRequest(new URL(`http://localhost:3000${path}`))
}

describe('proxy — unauthenticated user', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as ReadonlyRequestCookies)
    mockCookieStore.get.mockReturnValue(undefined) // no session cookie
    vi.mocked(decrypt).mockResolvedValue(null)
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
    userId: 'u1',
    name: 'Bob',
    email: 'bob@example.com',
    accessToken: 'tok',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as ReadonlyRequestCookies)
    mockCookieStore.get.mockReturnValue({ value: 'valid-token' })
    vi.mocked(decrypt).mockResolvedValue(fakeSession)
  })

  it('allows access to protected routes', async () => {
    const res = await proxy(makeRequest('/library'))
    expect(res.status).not.toBe(307)
  })

  it('redirects away from /auth to /library (already signed in)', async () => {
    const res = await proxy(makeRequest('/auth'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/library')
  })
})
