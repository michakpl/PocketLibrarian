import { test, expect } from '@playwright/test'
import { injectSession, clearSession, DEFAULT_USER, createFakeMicrosoftIdToken } from './helpers/session'

// ─── Unauthenticated flows ────────────────────────────────────────────────────

test.describe('unauthenticated user', () => {
  test.beforeEach(async ({ context }) => {
    await clearSession(context)
  })

  test('visiting / redirects to /auth', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/auth')
    expect(new URL(page.url()).pathname).toBe('/auth')
  })

  test('visiting /library redirects to /auth', async ({ page }) => {
    await page.goto('/library')
    await page.waitForURL('**/auth')
    expect(new URL(page.url()).pathname).toBe('/auth')
  })

  test('auth page renders the sign-in button', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('button', { name: /continue with microsoft/i })).toBeVisible()
  })

  test('auth page shows the app name', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { name: 'PocketLibrarian' })).toBeVisible()
  })

  test('sign-in button is enabled on idle state', async ({ page }) => {
    await page.goto('/auth')
    const btn = page.getByRole('button', { name: /continue with microsoft/i })
    await expect(btn).toBeEnabled()
  })
})

// ─── Authenticated flows ──────────────────────────────────────────────────────

test.describe('authenticated user', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  test('visiting / redirects to /library', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/library')
    expect(new URL(page.url()).pathname).toBe('/library')
  })

  test('visiting /library does not redirect to /auth', async ({ page }) => {
    await page.goto('/library')
    // The library layout redirects only if no session; if we have one, we stay
    expect(new URL(page.url()).pathname).toBe('/library')
  })

  test('visiting /auth redirects to /library (already signed in)', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForURL('**/library')
    expect(new URL(page.url()).pathname).toBe('/library')
  })

  test('session cookie is httpOnly (not accessible via JS)', async ({ page }) => {
    await page.goto('/library')
    const docCookie = await page.evaluate(() => document.cookie)
    expect(docCookie).not.toContain('pocketlibrarian.session')
  })
})

// ─── Sign-out flow ────────────────────────────────────────────────────────────

test.describe('sign out', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  test('DELETE /api/auth/session removes the cookie and returns ok', async ({ page }) => {
    await page.goto('/library')

    const response = await page.request.delete('/api/auth/session')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)

    // After the cookie is cleared, /library should redirect to /auth
    await page.goto('/library')
    await page.waitForURL('**/auth')
    expect(new URL(page.url()).pathname).toBe('/auth')
  })
})

// ─── Session API ──────────────────────────────────────────────────────────────

test.describe('POST /api/auth/session', () => {
  test('returns 400 for missing idToken', async ({ page }) => {
    await page.goto('/auth')
    const csrfRes = await page.request.get('/api/auth/session')
    const { csrfToken } = await csrfRes.json()

    const res = await page.request.post('/api/auth/session', {
      data: { accessToken: 'tok', accessTokenExpiresAt: 9999999999 }, // missing idToken
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'origin': 'http://localhost:3001',
      },
    })
    expect(res.status()).toBe(400)
  })

  test('returns 200 and sets a cookie for a valid payload', async ({ page }) => {
    await page.goto('/auth')

    const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? 'test-client-id'
    const idToken = await createFakeMicrosoftIdToken(DEFAULT_USER, clientId)

    const csrfRes = await page.request.get('/api/auth/session')
    const { csrfToken } = await csrfRes.json()

    const res = await page.request.post('/api/auth/session', {
      data: {
        idToken,
        accessToken: DEFAULT_USER.accessToken,
        accessTokenExpiresAt: DEFAULT_USER.accessTokenExpiresAt,
      },
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'origin': 'http://localhost:3001',
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)

    // The response should carry a Set-Cookie header for the session
    const setCookie = res.headers()['set-cookie']
    expect(setCookie).toBeTruthy()
    expect(setCookie).toContain('pocketlibrarian.session')
    expect(setCookie).toContain('HttpOnly')
  })
})
