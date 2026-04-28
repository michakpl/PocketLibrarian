/**
 * HTTP client for the standalone mock server (mock-server.mjs).
 *
 * Tests call these helpers to register/reset handlers.
 * The actual server runs in a separate process started by playwright.config.ts.
 */

export const MOCK_API_PORT = Number(process.env.MOCK_API_PORT ?? 19876)
const MOCK_BASE = `http://127.0.0.1:${MOCK_API_PORT}`

export interface RegisterOptions {
  method: string
  path: string
  status?: number
  body: unknown
}

export async function registerHandler(opts: RegisterOptions): Promise<void> {
  const res = await fetch(`${MOCK_BASE}/_mock/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 200, ...opts }),
  })
  if (!res.ok) throw new Error(`mock register failed: ${res.status}`)
}

export async function resetHandlers(): Promise<void> {
  const res = await fetch(`${MOCK_BASE}/_mock/reset`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`mock reset failed: ${res.status}`)
}
