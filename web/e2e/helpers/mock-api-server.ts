/**
 * Lightweight HTTP mock server for E2E tests.
 *
 * Why this exists:
 *   page.route() only intercepts browser-level requests.
 *   Next.js Server Components call the backend via Node.js fetch() on the
 *   server process, so Playwright cannot intercept those with page.route().
 *
 *   This server listens on a real TCP port so the Next.js process can reach
 *   it. The playwright.config.ts sets API_URL=http://localhost:<port> so all
 *   server-side fetches hit this mock instead of the real backend.
 */

import * as http from 'node:http'

export type MockHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => void | Promise<void>

export interface MockApiServer {
  /**
   * Register a one-shot handler for the next matching request.
   * Matched by method + path prefix (or exact path).
   */
  on(method: string, path: string, handler: MockHandler): void
  /**
   * Register a persistent handler (replaces previous one for the same key).
   */
  use(method: string, path: string, handler: MockHandler): void
  /** Remove all registered handlers. */
  reset(): void
  /** The base URL of this server, e.g. http://localhost:51234 */
  readonly baseUrl: string
  /** Call once at the end of the test suite. */
  close(): Promise<void>
}

interface Entry {
  method: string
  path: string
  handler: MockHandler
  oneShot: boolean
}

/** Fixed port used when MOCK_API_PORT env variable is set (e.g. in CI / playwright config). */
export const MOCK_API_PORT = process.env.MOCK_API_PORT ? Number(process.env.MOCK_API_PORT) : 0

export async function startMockApiServer(port = MOCK_API_PORT): Promise<MockApiServer> {
  const entries: Entry[] = []

  const server = http.createServer(async (req, res) => {
    const method = req.method?.toUpperCase() ?? 'GET'
    const url = req.url ?? '/'

    // Find matching entry (one-shot first, then persistent)
    const idx = entries.findIndex(
      (e) => e.method === method && url.startsWith(e.path),
    )

    if (idx === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: `No mock registered for ${method} ${url}` }))
      return
    }

    const entry = entries[idx]
    if (entry.oneShot) entries.splice(idx, 1)

    try {
      await entry.handler(req, res)
    } catch (err) {
      res.writeHead(500)
      res.end(String(err))
    }
  })

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))

  const address = server.address() as { port: number }
  const baseUrl = `http://127.0.0.1:${address.port}`

  return {
    get baseUrl() {
      return baseUrl
    },
    on(method, path, handler) {
      entries.push({ method: method.toUpperCase(), path, handler, oneShot: true })
    },
    use(method, path, handler) {
      const existing = entries.findIndex(
        (e) => !e.oneShot && e.method === method.toUpperCase() && e.path === path,
      )
      const entry: Entry = { method: method.toUpperCase(), path, handler, oneShot: false }
      if (existing !== -1) entries[existing] = entry
      else entries.push(entry)
    },
    reset() {
      entries.length = 0
    },
    close() {
      return new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      )
    },
  }
}

// ─── JSON response helper ─────────────────────────────────────────────────────

export function jsonResponse(
  res: http.ServerResponse,
  body: unknown,
  status = 200,
): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}