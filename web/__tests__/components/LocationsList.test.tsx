import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LocationsList from '@/components/LocationsList'
import type { LocationDto } from '@/lib/types/location'

const MOCK_LOCATIONS: LocationDto[] = [
  {
    id: 'loc-1',
    ownerId: 'owner-1',
    name: 'Bookshelf A',
    description: 'Main shelf',
    code: 'BSA',
    parentId: null,
    locationPath: null,
  },
  {
    id: 'loc-2',
    ownerId: 'owner-1',
    name: 'Cabinet B',
    description: 'Side cabinet',
    code: 'CAB',
    parentId: null,
    locationPath: null,
  },
]

beforeEach(() => {
  vi.spyOn(window, 'open').mockImplementation(() => null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LocationsList — rendering', () => {
  it('renders all locations', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    expect(screen.getByText('Bookshelf A')).toBeInTheDocument()
    expect(screen.getByText('Cabinet B')).toBeInTheDocument()
  })

  it('renders Print Barcodes button', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    expect(screen.getByRole('button', { name: /print barcodes/i })).toBeInTheDocument()
  })

  it('renders without errors when locations list is empty', () => {
    render(<LocationsList locations={[]} />)
    expect(screen.getByRole('button', { name: /print barcodes/i })).toBeInTheDocument()
  })

  it('does not show count in button label when nothing is selected', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    const button = screen.getByRole('button', { name: /print barcodes/i })
    expect(button.textContent).not.toMatch(/\(\d+\)/)
  })
})

describe('LocationsList — checkbox selection', () => {
  it('shows selected count in button label after one checkbox is ticked', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /select bookshelf a/i }))
    expect(screen.getByRole('button', { name: /print barcodes \(1\)/i })).toBeInTheDocument()
  })

  it('increments count when multiple checkboxes are ticked', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /select bookshelf a/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /select cabinet b/i }))
    expect(screen.getByRole('button', { name: /print barcodes \(2\)/i })).toBeInTheDocument()
  })

  it('decrements count when a checkbox is unticked', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /select bookshelf a/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /select cabinet b/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /select bookshelf a/i }))
    expect(screen.getByRole('button', { name: /print barcodes \(1\)/i })).toBeInTheDocument()
  })

  it('removes count from label when all checkboxes are unticked', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /select bookshelf a/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /select bookshelf a/i }))
    const button = screen.getByRole('button', { name: /print barcodes/i })
    expect(button.textContent).not.toMatch(/\(\d+\)/)
  })
})

describe('LocationsList — print action', () => {
  it('opens /library/locations/barcodes in a new tab when nothing is selected', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /print barcodes/i }))
    expect(window.open).toHaveBeenCalledWith('/library/locations/barcodes', '_blank', 'noopener,noreferrer')
  })

  it('opens URL with ids query param for the selected location', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /select bookshelf a/i }))
    fireEvent.click(screen.getByRole('button', { name: /print barcodes \(1\)/i }))

    const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/library/locations/barcodes')
    expect(url).toContain('ids=loc-1')
  })

  it('includes all selected ids in the query string', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /select bookshelf a/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /select cabinet b/i }))
    fireEvent.click(screen.getByRole('button', { name: /print barcodes \(2\)/i }))

    const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('ids=loc-1')
    expect(url).toContain('ids=loc-2')
  })

  it('does not include ids of unselected locations in the query string', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /select bookshelf a/i }))
    fireEvent.click(screen.getByRole('button', { name: /print barcodes \(1\)/i }))

    const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).not.toContain('loc-2')
  })

  it('opens in a new tab (_blank)', () => {
    render(<LocationsList locations={MOCK_LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /print barcodes/i }))

    const [, target] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(target).toBe('_blank')
  })
})
