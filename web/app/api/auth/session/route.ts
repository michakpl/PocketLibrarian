import { NextRequest, NextResponse } from 'next/server'
import { createSession, deleteSession, type SessionPayload } from '@/lib/session'

export async function POST(request: NextRequest) {
  const body = await request.json() as Partial<SessionPayload>

  if (!body.userId || !body.name || !body.email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await createSession({ userId: body.userId, name: body.name, email: body.email, accessToken: body.accessToken })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await deleteSession()
  return NextResponse.json({ ok: true })
}
