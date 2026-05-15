import { describe, it, expect, vi, afterEach } from 'vitest'
import { isAccessTokenExpired } from '@/lib/session-utils'
import type { SessionTokenMeta } from '@/lib/session-utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('isAccessTokenExpired', () => {
  describe('missing / falsy expiry', () => {
    it('returns true when accessTokenExpiresAt is 0', () => {
      const session: SessionTokenMeta = { accessTokenExpiresAt: 0 }
      expect(isAccessTokenExpired(session)).toBe(true)
    })
  })

  describe('token is clearly expired', () => {
    it('returns true when the token expired more than graceSeconds ago', () => {
      vi.useFakeTimers()
      // now = 1_000_000 s (Unix epoch seconds)
      vi.setSystemTime(1_000_000 * 1000)

      const session: SessionTokenMeta = { accessTokenExpiresAt: 1_000_000 - 120 }
      // expiresAt is 120 s in the past — well past the default 60 s grace
      expect(isAccessTokenExpired(session)).toBe(true)
    })

    it('returns true when the token expired exactly at the grace boundary', () => {
      vi.useFakeTimers()
      vi.setSystemTime(1_000_000 * 1000)

      // now (1_000_000) >= expiresAt (1_000_060) - grace (60) = 1_000_000  → true
      const session: SessionTokenMeta = { accessTokenExpiresAt: 1_000_060 }
      expect(isAccessTokenExpired(session)).toBe(true)
    })
  })

  describe('token is still valid', () => {
    it('returns false when the token expires well beyond the grace period', () => {
      vi.useFakeTimers()
      vi.setSystemTime(1_000_000 * 1000)

      // expires 1 hour from now — safely within validity window
      const session: SessionTokenMeta = { accessTokenExpiresAt: 1_000_000 + 3600 }
      expect(isAccessTokenExpired(session)).toBe(false)
    })

    it('returns false when the token expires just outside the grace period', () => {
      vi.useFakeTimers()
      vi.setSystemTime(1_000_000 * 1000)

      // expires 61 s from now — one second past the default grace of 60 s
      const session: SessionTokenMeta = { accessTokenExpiresAt: 1_000_000 + 61 }
      expect(isAccessTokenExpired(session)).toBe(false)
    })
  })

  describe('custom graceSeconds', () => {
    it('respects a custom grace period (0 s) — expired only when truly in the past', () => {
      vi.useFakeTimers()
      vi.setSystemTime(1_000_000 * 1000)

      const justExpired: SessionTokenMeta = { accessTokenExpiresAt: 1_000_000 - 1 }
      expect(isAccessTokenExpired(justExpired, 0)).toBe(true)

      const notYetExpired: SessionTokenMeta = { accessTokenExpiresAt: 1_000_000 + 1 }
      expect(isAccessTokenExpired(notYetExpired, 0)).toBe(false)
    })

    it('respects a larger custom grace period', () => {
      vi.useFakeTimers()
      vi.setSystemTime(1_000_000 * 1000)

      // expires in 5 minutes but grace is 10 minutes — should be considered expired
      const session: SessionTokenMeta = { accessTokenExpiresAt: 1_000_000 + 300 }
      expect(isAccessTokenExpired(session, 600)).toBe(true)
    })
  })
})

