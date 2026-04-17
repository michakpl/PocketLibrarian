// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookies } from 'next/headers'
import { encrypt, decrypt, createSession, deleteSession, getSession } from '@/lib/session'
import type { SessionPayload } from '@/lib/session'
import {ReadonlyRequestCookies} from "next/dist/server/web/spec-extension/adapters/request-cookies";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(() => []),
}

vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as ReadonlyRequestCookies)

const TEST_PAYLOAD: SessionPayload = {
  userId: 'user-abc-123',
  name: 'Alice Reader',
  email: 'alice@example.com',
  accessToken: 'msal-token-xyz',
}

describe('session — encrypt / decrypt', () => {
  it('round-trips a payload through encrypt → decrypt', async () => {
    const token = await encrypt(TEST_PAYLOAD)
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // JWT format

    const result = await decrypt(token)
    expect(result?.userId).toBe(TEST_PAYLOAD.userId)
    expect(result?.name).toBe(TEST_PAYLOAD.name)
    expect(result?.email).toBe(TEST_PAYLOAD.email)
    expect(result?.accessToken).toBe(TEST_PAYLOAD.accessToken)
  })

  it('decrypt returns null for undefined input', async () => {
    expect(await decrypt(undefined)).toBeNull()
  })

  it('decrypt returns null for an invalid token', async () => {
    expect(await decrypt('not.a.valid.jwt')).toBeNull()
  })

  it('decrypt returns null for a token signed with a different secret', async () => {
    // Sign with a different secret manually
    const { SignJWT } = await import('jose')
    const differentKey = new TextEncoder().encode('completely-different-secret-key!!')
    const badToken = await new SignJWT({ userId: 'x' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(differentKey)

    expect(await decrypt(badToken)).toBeNull()
  })
})

describe('session — createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as ReadonlyRequestCookies)
  })

  it('encrypts the payload and sets an httpOnly cookie', async () => {
    await createSession(TEST_PAYLOAD)

    expect(mockCookieStore.set).toHaveBeenCalledOnce()
    const [name, options] = mockCookieStore.set.mock.calls[0]
    expect(name).toBe('pocketlibrarian.session')
    expect(options.httpOnly).toBe(true)
    expect(options.sameSite).toBe('lax')
    expect(options.path).toBe('/')
    expect(typeof options.maxAge).toBe('number')
  })
})

describe('session — deleteSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as ReadonlyRequestCookies)
  })

  it('deletes the session cookie', async () => {
    await deleteSession()
    expect(mockCookieStore.delete).toHaveBeenCalledWith('pocketlibrarian.session')
  })
})

describe('session — getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as ReadonlyRequestCookies)
  })

  it('returns null when no cookie is present', async () => {
    mockCookieStore.get.mockReturnValue(undefined)
    expect(await getSession()).toBeNull()
  })

  it('returns the decrypted payload when a valid cookie is present', async () => {
    const token = await encrypt(TEST_PAYLOAD)
    mockCookieStore.get.mockReturnValue({ value: token })

    const session = await getSession()
    expect(session?.userId).toBe(TEST_PAYLOAD.userId)
    expect(session?.email).toBe(TEST_PAYLOAD.email)
  })

  it('returns null when the cookie value is an invalid token', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'garbage' })
    expect(await getSession()).toBeNull()
  })
})
