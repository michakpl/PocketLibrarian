import 'server-only'
import Redis from 'ioredis'

declare global {
  var __redis: Redis | undefined
  var __redisMockStore: Map<string, { value: string; expiresAt: number }> | undefined
}

// ---------------------------------------------------------------------------
// In-memory mock — used only when NEXT_PUBLIC_E2E=true
// This avoids a real Redis dependency during e2e test runs.
// ---------------------------------------------------------------------------
function createRedisMock(): Redis {
  globalThis.__redisMockStore ??= new Map()
  const store = globalThis.__redisMockStore

  // Return a minimal proxy that satisfies the set / get / del interface
  return {
    set(_key: string, value: string, exMode?: string, ttl?: number) {
      const expiresAt = exMode === 'EX' && ttl ? Date.now() + ttl * 1000 : Infinity
      store.set(_key, { value, expiresAt })
      return Promise.resolve('OK')
    },
    get(_key: string) {
      const entry = store.get(_key)
      if (!entry) return Promise.resolve(null)
      if (Date.now() > entry.expiresAt) {
        store.delete(_key)
        return Promise.resolve(null)
      }
      return Promise.resolve(entry.value)
    },
    del(_key: string) {
      store.delete(_key)
      return Promise.resolve(1)
    },
    on() { return this },
    quit() { return Promise.resolve('OK') },
  } as unknown as Redis
}

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379'
  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 1000, 30_000),
  })
  client.on('error', (err) => {
    console.error('[redis] connection error', err)
  })
  return client
}

const redis: Redis | null = (() => {
  if (process.env.REDIS_ENABLED === 'false') return null
  if (globalThis.__redis) return globalThis.__redis
  const client = process.env.NEXT_PUBLIC_E2E === 'true' ? createRedisMock() : createRedisClient()
  globalThis.__redis = client
  return client
})()

export default redis
