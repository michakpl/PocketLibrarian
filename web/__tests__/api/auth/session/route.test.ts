// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/session', () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>()
  return {
    ...actual,
    createRemoteJWKSet: vi.fn().mockReturnValue({}),
    jwtVerify: vi.fn().mockResolvedValue({
      payload: {
        sub: 'user-oid-123',
        name: 'Alice',
        email: 'alice@example.com',
        iss: 'https://login.microsoftonline.com/tenant/v2.0',
        aud: 'test-client-id',
      },
    }),
  }
})

import { createSession, deleteSession } from '@/lib/session'
import { GET, POST, DELETE } from '@/app/api/auth/session/route'

const CSRF_TOKEN = 'test-csrf-token-1234'
const ORIGIN = 'http://localhost:3000'

function makePostRequest(body: object, {csrfToken = CSRF_TOKEN, origin = ORIGIN}: {csrfToken?: string | null; origin?: string | null} = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (origin) headers['origin'] = origin
  if (csrfToken) headers['x-csrf-token'] = csrfToken

  return new NextRequest(`${ORIGIN}/api/auth/session`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function addCsrfCookie(request: NextRequest, token = CSRF_TOKEN) {
  const url = request.url
  const init: RequestInit = {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      cookie: `csrf-token=${token}`,
    },
    body: request.body,
    signal: request.signal ?? undefined,
    // @ts-expect-error — duplex required for streaming body in Node
    duplex: 'half',
  } satisfies RequestInit & { duplex: string }
  return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1])
}

const validBody = {
  idToken: 'valid.id.token',
  accessToken: 'access-tok',
  accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
}

describe('GET /api/auth/session', () => {
  it('returns a csrfToken and sets the csrf-token cookie', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.csrfToken).toBe('string')
    expect(body.csrfToken).toHaveLength(36) // UUID

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('csrf-token=')
    expect(setCookie).toContain(body.csrfToken)
  })

  it('generates a new token on each call', async () => {
    const [res1, res2] = await Promise.all([GET(), GET()])
    const t1 = (await res1.json()).csrfToken
    const t2 = (await res2.json()).csrfToken
    expect(t1).not.toBe(t2)
  })
})

describe('POST /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_AZURE_CLIENT_ID = 'test-client-id'
  })

  it('creates a session and returns 200 for a valid request', async () => {
    const req = addCsrfCookie(makePostRequest(validBody))
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-oid-123',
      name: 'Alice',
      email: 'alice@example.com',
      accessToken: validBody.accessToken,
      accessTokenExpiresAt: validBody.accessTokenExpiresAt,
    }))
  })

  it('returns 403 when origin is invalid', async () => {
    const req = addCsrfCookie(makePostRequest(validBody, {origin: 'https://evil.example.com'}))
    const res = await POST(req)
    expect(res.status).toBe(403)
    expect(createSession).not.toHaveBeenCalled()
  })

  it('returns 403 when x-csrf-token header is missing', async () => {
    const req = addCsrfCookie(makePostRequest(validBody, {csrfToken: null}))
    const res = await POST(req)
    expect(res.status).toBe(403)
    expect(createSession).not.toHaveBeenCalled()
  })

  it('returns 403 when csrf cookie is missing', async () => {
    // No addCsrfCookie — cookie absent
    const req = makePostRequest(validBody)
    const res = await POST(req)
    expect(res.status).toBe(403)
    expect(createSession).not.toHaveBeenCalled()
  })

  it('returns 403 when csrf cookie does not match header', async () => {
    const req = addCsrfCookie(makePostRequest(validBody, {csrfToken: 'wrong-token'}))
    const res = await POST(req)
    expect(res.status).toBe(403)
    expect(createSession).not.toHaveBeenCalled()
  })

  it('returns 400 when idToken is missing', async () => {
    const bodyWithoutIdToken = {...validBody}
    bodyWithoutIdToken.idToken = ""
    const req = addCsrfCookie(makePostRequest(bodyWithoutIdToken))
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
    expect(createSession).not.toHaveBeenCalled()
  })

  it('returns 401 when idToken verification fails', async () => {
    const { jwtVerify } = await import('jose')
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('bad token'))

    const req = addCsrfCookie(makePostRequest(validBody))
    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(createSession).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/auth/session', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the session and returns 200', async () => {
    const res = await DELETE()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(deleteSession).toHaveBeenCalledOnce()
  })
})
