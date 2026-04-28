import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getLocations } from '@/lib/api/locations'
import { UnauthorizedError } from '@/lib/api/errors'

const MOCK_LOCATIONS = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    ownerId: 'a0000000-0000-4000-8000-000000000002',
    name: 'Shelf A',
    description: 'First shelf',
    code: 'A',
    parentId: null,
    locationPath: ['Shelf A'],
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    ownerId: 'a0000000-0000-4000-8000-000000000002',
    name: 'Row 1',
    description: 'Row one',
    code: 'A1',
    parentId: 'a0000000-0000-4000-8000-000000000001',
    locationPath: ['Shelf A', 'Row 1'],
  },
]

beforeEach(() => {
  vi.stubEnv('API_URL', 'http://api.test')
})

describe('getLocations', () => {
  it('returns array of locations on 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_LOCATIONS,
    })

    const result = await getLocations('token')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Shelf A')
    expect(result[1].locationPath).toEqual(['Shelf A', 'Row 1'])
  })

  it('sends Bearer token in Authorization header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    })

    await getLocations('my-access-token')
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer my-access-token',
    })
  })

  it('throws UnauthorizedError on 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 })
    await expect(getLocations('bad')).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('throws generic Error on other non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })
    await expect(getLocations('token')).rejects.toThrow('Failed to fetch locations')
  })

  it('throws if API_URL is not set', async () => {
    vi.stubEnv('API_URL', '')
    await expect(getLocations('token')).rejects.toThrow('API_URL')
  })
})
