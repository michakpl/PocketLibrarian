import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LocationPage from '@/app/library/locations/page'

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/api/locations', () => ({
  getLocations: vi.fn(),
}))

import { getSession } from '@/lib/session'
import { getLocations } from '@/lib/api/locations'
import { redirect } from 'next/navigation'

const MOCK_LOCATION = {
  id: 'loc-1',
  ownerId: 'owner-1',
  name: 'Bookshelf A',
  description: 'Main bookshelf',
  code: 'BSA',
  parentId: null,
  locationPath: null,
}

function makeSearchParams(params: Record<string, string> = {}) {
  return Promise.resolve(params)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSession).mockResolvedValue({
    userId: 'user-1',
    name: 'Tester',
    email: 'test@test.com',
    accessToken: 'token',
    accessTokenExpiresAt: 9999999999,
    sessionId: 'sid',
  })
})

describe('LocationPage', () => {
  it('renders a list of locations', async () => {
    vi.mocked(getLocations).mockResolvedValue([MOCK_LOCATION])

    const page = await LocationPage({ searchParams: makeSearchParams() })
    render(page)

    expect(screen.getByText('Bookshelf A')).toBeInTheDocument()
  })

  it('shows the correct location count', async () => {
    vi.mocked(getLocations).mockResolvedValue([MOCK_LOCATION, { ...MOCK_LOCATION, id: 'loc-2', name: 'Shelf B', code: 'SB' }])

    const page = await LocationPage({ searchParams: makeSearchParams() })
    render(page)

    expect(screen.getByText(/2 locations in your library/i)).toBeInTheDocument()
  })

  it('shows singular count for one location', async () => {
    vi.mocked(getLocations).mockResolvedValue([MOCK_LOCATION])

    const page = await LocationPage({ searchParams: makeSearchParams() })
    render(page)

    expect(screen.getByText(/1 locations? in your library/i)).toBeInTheDocument()
  })

  it('renders Add Location link', async () => {
    vi.mocked(getLocations).mockResolvedValue([])

    const page = await LocationPage({ searchParams: makeSearchParams() })
    render(page)

    const addLink = screen.getByRole('link', { name: /add location/i })
    expect(addLink).toBeInTheDocument()
    expect(addLink).toHaveAttribute('href', '/library/locations/add')
  })

  it('renders Locations heading', async () => {
    vi.mocked(getLocations).mockResolvedValue([])

    const page = await LocationPage({ searchParams: makeSearchParams() })
    render(page)

    expect(screen.getByRole('heading', { name: /locations/i })).toBeInTheDocument()
  })

  it('renders empty state with zero count when no locations', async () => {
    vi.mocked(getLocations).mockResolvedValue([])

    const page = await LocationPage({ searchParams: makeSearchParams() })
    render(page)

    expect(screen.getByText(/0 locations in your library/i)).toBeInTheDocument()
  })

  it('renders multiple locations', async () => {
    const locations = [
      MOCK_LOCATION,
      { ...MOCK_LOCATION, id: 'loc-2', name: 'Shelf B', code: 'SB' },
      { ...MOCK_LOCATION, id: 'loc-3', name: 'Cabinet C', code: 'CC' },
    ]
    vi.mocked(getLocations).mockResolvedValue(locations)

    const page = await LocationPage({ searchParams: makeSearchParams() })
    render(page)

    expect(screen.getByText('Bookshelf A')).toBeInTheDocument()
    expect(screen.getByText('Shelf B')).toBeInTheDocument()
    expect(screen.getByText('Cabinet C')).toBeInTheDocument()
  })

  it('redirects to /auth when no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    await LocationPage({ searchParams: makeSearchParams() }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/auth')
  })

  it('redirects to /auth/refresh on UnauthorizedError', async () => {
    const { UnauthorizedError } = await import('@/lib/api/errors')
    vi.mocked(getLocations).mockRejectedValue(new UnauthorizedError())

    await LocationPage({ searchParams: makeSearchParams() }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/auth/refresh?callbackUrl=/library/locations')
  })

  it('re-throws non-auth errors', async () => {
    const error = new Error('Network failure')
    vi.mocked(getLocations).mockRejectedValue(error)

    await expect(LocationPage({ searchParams: makeSearchParams() })).rejects.toThrow('Network failure')
  })

  it('calls getLocations with the session access token', async () => {
    vi.mocked(getLocations).mockResolvedValue([])

    await LocationPage({ searchParams: makeSearchParams() })
    expect(getLocations).toHaveBeenCalledWith('token')
  })
})

