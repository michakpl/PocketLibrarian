// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/session', () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
}))

import { createSession, deleteSession } from '@/lib/session'
import { POST, DELETE } from '@/app/api/auth/session/route'

function makePostRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/session', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a session and returns 200 for a valid payload', async () => {
    const res = await POST(makePostRequest({
      userId: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      accessToken: 'tok',
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(createSession).toHaveBeenCalledWith({
      userId: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      accessToken: 'tok',
    })
  })

  it('returns 400 when userId is missing', async () => {
    const res = await POST(makePostRequest({ name: 'Alice', email: 'a@a.com' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
    expect(createSession).not.toHaveBeenCalled()
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makePostRequest({ userId: 'u1', email: 'a@a.com' }))
    expect(res.status).toBe(400)
    expect(createSession).not.toHaveBeenCalled()
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(makePostRequest({ userId: 'u1', name: 'Alice' }))
    expect(res.status).toBe(400)
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
