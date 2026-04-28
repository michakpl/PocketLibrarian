import { SignJWT, importJWK } from 'jose'
import type { BrowserContext } from '@playwright/test'
import * as path from 'node:path'
import * as dotenv from 'dotenv'
import { randomUUID } from 'crypto'
import { E2E_TEST_PRIVATE_JWK, E2E_TEST_KID } from './test-keys'

// Load .env so we use the same SESSION_SECRET as the running dev server
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

const SECRET = process.env.SESSION_SECRET
if (!SECRET) throw new Error('SESSION_SECRET not found — check .env')

const BASE_URL = 'http://localhost:3001'
const SESSION_COOKIE = 'pocketlibrarian.session'
const SESSION_DURATION_S = 7 * 24 * 60 * 60

export interface FakeUser {
  userId: string
  name: string
  email: string
  accessToken: string
  accessTokenExpiresAt: number
}

export const DEFAULT_USER: FakeUser = {
  userId: randomUUID(),
  name: 'E2E Tester',
  email: 'e2e@pocketlibrarian.test',
  accessToken: 'fake-access-token',
  accessTokenExpiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_S,
}

export async function createSessionToken(
  user: FakeUser = DEFAULT_USER,
  sessionId: string = randomUUID(),
): Promise<string> {
  const key = new TextEncoder().encode(SECRET)
  const cookiePayload = {
    sessionId,
    userId: user.userId,
    name: user.name,
    email: user.email,
    accessTokenExpiresAt: user.accessTokenExpiresAt,
  }
  return new SignJWT(cookiePayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_S}s`)
    .sign(key)
}

export async function injectSession(
  context: BrowserContext,
  user: FakeUser = DEFAULT_USER,
): Promise<void> {
  // Call the e2e-only server endpoint so both the session cookie and the
  // in-memory Redis mock entry are written in the same Next.js process.
  const response = await context.request.post(`${BASE_URL}/api/auth/test-inject`, {
    data: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      accessToken: user.accessToken,
      accessTokenExpiresAt: user.accessTokenExpiresAt,
    },
  })
  if (!response.ok()) {
    throw new Error(`test-inject failed: ${response.status()} ${await response.text()}`)
  }
}

/** Removes the session cookie from the Playwright browser context. */
export async function clearSession(context: BrowserContext): Promise<void> {
  await context.clearCookies({ name: SESSION_COOKIE })
}

/**
 * Creates a signed Microsoft-style ID token using the static e2e test RSA key.
 * The local /api/auth/test-jwks endpoint serves the corresponding public key
 * (enabled when NEXT_PUBLIC_E2E=true / MICROSOFT_JWKS_URL points to it).
 */
export async function createFakeMicrosoftIdToken(
  user: Pick<FakeUser, 'userId' | 'name' | 'email'>,
  clientId: string,
): Promise<string> {
  const privateKey = await importJWK(E2E_TEST_PRIVATE_JWK, 'RS256')
  return new SignJWT({
    sub: user.userId,
    name: user.name,
    email: user.email,
    iss: 'https://login.microsoftonline.com/e2e-tenant/v2.0',
    aud: clientId,
  })
    .setProtectedHeader({ alg: 'RS256', kid: E2E_TEST_KID })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)
}
