#!/usr/bin/env node
/**
 * Standalone mock API server for E2E tests.
 *
 * Playwright starts this as a webServer entry (see playwright.config.ts).
 * It runs in its own process so it outlives any individual test file.
 *
 * Control endpoints (used by mock-client.ts):
 *   GET  /_mock/health           → 200 { ok: true }
 *   POST /_mock/register         → register a handler { method, path, status, body }
 *   DELETE /_mock/reset          → clear all registered handlers
 *
 * All other requests are matched against registered handlers in order.
 * Responds 404 if nothing matches.
 */

import http from 'node:http'

const PORT = Number(process.env.MOCK_API_PORT ?? 19876)

/** @type {{ method: string; path: string; status: number; body: unknown }[]} */
const handlers = []

/**
 * Read the full request body as a string.
 * @param {http.IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/**
 * @param {http.ServerResponse} res
 * @param {unknown} body
 * @param {number} status
 */
function json(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
  const method = req.method?.toUpperCase() ?? 'GET'
  const url = req.url ?? '/'

  // ── Control plane ──────────────────────────────────────────────────────────

  if (url === '/_mock/health') {
    return json(res, { ok: true })
  }

  if (url === '/_mock/register' && method === 'POST') {
    const raw = await readBody(req)
    const { method: m, path: p, status = 200, body } = JSON.parse(raw)
    // Replace any existing persistent handler for the same method+path
    const idx = handlers.findIndex((h) => h.method === m.toUpperCase() && h.path === p)
    const entry = { method: m.toUpperCase(), path: p, status, body }
    if (idx !== -1) handlers[idx] = entry
    else handlers.push(entry)
    return json(res, { ok: true })
  }

  if (url === '/_mock/reset' && method === 'DELETE') {
    handlers.length = 0
    return json(res, { ok: true })
  }

  // ── API request matching ───────────────────────────────────────────────────

  const urlPath = url.split('?')[0]

  const candidates = handlers
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h.method === method && urlPath.startsWith(h.path))
    .sort((a, b) => {
      const aExact = urlPath === a.h.path ? 1 : 0
      const bExact = urlPath === b.h.path ? 1 : 0
      if (bExact !== aExact) return bExact - aExact
      return b.h.path.length - a.h.path.length
    })

  const idx = candidates.length > 0 ? candidates[0].i : -1

  if (idx === -1) {
    console.warn(`[mock-server] No handler for ${method} ${url}`)
    res.writeHead(404, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: `No mock registered for ${method} ${url}` }))
  }

  const handler = handlers[idx]
  return json(res, handler.body, handler.status)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-server] Listening on http://127.0.0.1:${PORT}`)
})
