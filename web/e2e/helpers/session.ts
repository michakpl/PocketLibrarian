import { SignJWT } from 'jose'
import type { BrowserContext } from '@playwright/test'
import * as path from 'node:path'
import * as dotenv from 'dotenv'

// Load .env so we use the same SESSION_SECRET as the running dev server
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

const SECRET = process.env.SESSION_SECRET
if (!SECRET) throw new Error('SESSION_SECRET not found — check .env')

const SESSION_COOKIE = 'pocketlibrarian.session'
const SESSION_DURATION_S = 7 * 24 * 60 * 60

export interface FakeUser {
  userId: string
  name: string
  email: string
  accessToken: string
}

export const DEFAULT_USER: FakeUser = {
  userId: 'e2e-user-00000000',
  name: 'E2E Tester',
  email: 'e2e@pocketlibrarian.test',
  accessToken: 'fake-access-token',
}

/** Creates a signed JWT the Next.js app will accept as a valid session. */
export async function createSessionToken(user: FakeUser = DEFAULT_USER): Promise<string> {
  const key = new TextEncoder().encode(SECRET)
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_S}s`)
    .sign(key)
}

/** Injects a valid session cookie into the Playwright browser context. */
export async function injectSession(
  context: BrowserContext,
  user: FakeUser = DEFAULT_USER,
): Promise<void> {
  const token = await createSessionToken(user)
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + SESSION_DURATION_S,
    },
  ])
}

/** Removes the session cookie from the Playwright browser context. */
export async function clearSession(context: BrowserContext): Promise<void> {
  await context.clearCookies({ name: SESSION_COOKIE })
}
