import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/session'
import { randomUUID } from 'crypto'

/**
 * E2E-only endpoint: injects a session directly into the server-side session
 * store (in-memory Redis mock) and sets the session cookie.
 *
 * Only active when NEXT_PUBLIC_E2E=true — returns 404 otherwise.
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_E2E !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json() as {
    userId: string
    name: string
    email: string
    accessToken: string
    accessTokenExpiresAt: number
  }

  if (!body.userId || !body.name || !body.email || !body.accessToken) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await createSession({
    sessionId: randomUUID(),
    userId: body.userId,
    name: body.name,
    email: body.email,
    accessToken: body.accessToken,
    accessTokenExpiresAt: body.accessTokenExpiresAt,
  })

  return NextResponse.json({ ok: true })
}

