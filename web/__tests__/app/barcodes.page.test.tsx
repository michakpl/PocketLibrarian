import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BarcodesPage from '@/app/(print)/library/locations/barcodes/page'

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/api/locations', () => ({
  getLocationBarcodes: vi.fn(),
}))

vi.mock('@/components/BarcodeLabel', () => ({
  default: ({ name, locationPath }: { name: string; locationPath: string[] }) => (
    <div data-testid="barcode-label">
      <span>{name}</span>
      {locationPath.length > 0 && <span>{locationPath.join(' › ')}</span>}
    </div>
  ),
}))

vi.mock('@/components/PrintButton', () => ({
  default: () => <button>Print</button>,
}))

import { getSession } from '@/lib/session'
import { getLocationBarcodes } from '@/lib/api/locations'
import { redirect } from 'next/navigation'

const MOCK_BARCODE = {
  id: 'a0000000-0000-4000-8000-000000000001',
  name: 'Shelf A',
  code: 'A001',
  locationPath: ['Library', 'Shelf A'],
}

const MOCK_IDS = ['a0000000-0000-4000-8000-000000000001']

function makeSearchParams(ids: string[] = MOCK_IDS) {
  return Promise.resolve({ ids })
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

describe('BarcodesPage — rendering', () => {
  it('renders the Location Barcodes heading', async () => {
    vi.mocked(getLocationBarcodes).mockResolvedValue([MOCK_BARCODE])
    const page = await BarcodesPage({ searchParams: makeSearchParams() })
    render(page)
    expect(screen.getByRole('heading', { name: /location barcodes/i })).toBeInTheDocument()
  })

  it('renders one BarcodeLabel per barcode returned', async () => {
    vi.mocked(getLocationBarcodes).mockResolvedValue([
      MOCK_BARCODE,
      { ...MOCK_BARCODE, id: 'a0000000-0000-4000-8000-000000000002', name: 'Shelf B', code: 'B001' },
    ])
    const page = await BarcodesPage({ searchParams: makeSearchParams() })
    render(page)
    expect(screen.getAllByTestId('barcode-label')).toHaveLength(2)
  })

  it('renders the barcode name inside each label', async () => {
    vi.mocked(getLocationBarcodes).mockResolvedValue([MOCK_BARCODE])
    const page = await BarcodesPage({ searchParams: makeSearchParams() })
    render(page)
    expect(screen.getByText('Shelf A')).toBeInTheDocument()
  })

  it('renders the location path inside each label', async () => {
    vi.mocked(getLocationBarcodes).mockResolvedValue([MOCK_BARCODE])
    const page = await BarcodesPage({ searchParams: makeSearchParams() })
    render(page)
    expect(screen.getByText('Library › Shelf A')).toBeInTheDocument()
  })

  it('shows "No barcodes found" message when API returns empty array', async () => {
    vi.mocked(getLocationBarcodes).mockResolvedValue([])
    const page = await BarcodesPage({ searchParams: makeSearchParams() })
    render(page)
    expect(screen.getByText(/no barcodes found/i)).toBeInTheDocument()
  })

  it('does not render any BarcodeLabel when list is empty', async () => {
    vi.mocked(getLocationBarcodes).mockResolvedValue([])
    const page = await BarcodesPage({ searchParams: makeSearchParams() })
    render(page)
    expect(screen.queryAllByTestId('barcode-label')).toHaveLength(0)
  })
})

describe('BarcodesPage — searchParams', () => {
  it('passes ids from searchParams to getLocationBarcodes', async () => {
    const ids = ['a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002']
    vi.mocked(getLocationBarcodes).mockResolvedValue([])
    await BarcodesPage({ searchParams: Promise.resolve({ ids }) })
    expect(getLocationBarcodes).toHaveBeenCalledWith('token', ids)
  })

  it('wraps a single string id into an array', async () => {
    vi.mocked(getLocationBarcodes).mockResolvedValue([])
    // URLSearchParams with a single ?ids= value comes as a plain string
    await BarcodesPage({ searchParams: Promise.resolve({ ids: 'a0000000-0000-4000-8000-000000000001' as unknown as string[] }) })
    expect(getLocationBarcodes).toHaveBeenCalledWith('token', ['a0000000-0000-4000-8000-000000000001'])
  })
})

describe('BarcodesPage — auth', () => {
  it('redirects to /auth when there is no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    await BarcodesPage({ searchParams: makeSearchParams() }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/auth')
  })

  it('redirects to /auth/refresh on UnauthorizedError', async () => {
    const { UnauthorizedError } = await import('@/lib/api/errors')
    vi.mocked(getLocationBarcodes).mockRejectedValue(new UnauthorizedError())
    await BarcodesPage({ searchParams: makeSearchParams() }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/auth/refresh?callbackUrl=/library/locations/barcodes')
  })

  it('re-throws non-auth errors', async () => {
    vi.mocked(getLocationBarcodes).mockRejectedValue(new Error('Network failure'))
    await expect(BarcodesPage({ searchParams: makeSearchParams() })).rejects.toThrow('Network failure')
  })

  it('calls getLocationBarcodes with the session access token', async () => {
    vi.mocked(getLocationBarcodes).mockResolvedValue([])
    await BarcodesPage({ searchParams: makeSearchParams() })
    expect(getLocationBarcodes).toHaveBeenCalledWith('token', expect.any(Array))
  })
})
