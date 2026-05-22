import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BookFromISBNForm from '@/components/BookFromISBNForm'
import type { LocationDto } from '@/lib/types/location'

vi.mock('@/components/actions', () => ({
  addBookFromISBNAction: vi.fn(async () => ({})),
}))

vi.mock('@yudiel/react-qr-scanner', () => ({
  Scanner: ({ onScan }: { onScan: (codes: { rawValue: string }[]) => void }) => (
    <button
      data-testid="mock-scanner"
      onClick={() => onScan([{ rawValue: '9780135957059' }])}
    >
      Mock Scanner
    </button>
  ),
}))

const LOCATIONS: LocationDto[] = [
  {
    id: 'loc-1',
    ownerId: 'owner-1',
    name: 'Shelf A',
    description: '',
    code: 'A',
    parentId: null,
    locationPath: ['Shelf A'],
  },
  {
    id: 'loc-2',
    ownerId: 'owner-1',
    name: 'Row 1',
    description: '',
    code: 'A1',
    parentId: 'loc-1',
    locationPath: ['Shelf A', 'Row 1'],
  },
]

describe('BookFromISBNForm — rendering', () => {
  it('renders the ISBN input field', () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    expect(screen.getByPlaceholderText(/978-0-000-00000-0/i)).toBeInTheDocument()
  })

  it('renders the scan barcode button', () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    expect(screen.getByRole('button', { name: /scan barcode/i })).toBeInTheDocument()
  })

  it('renders the Add Book submit button', () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    expect(screen.getByRole('button', { name: /add book/i })).toBeInTheDocument()
  })

  it('renders location options from props', () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    expect(screen.getByRole('option', { name: 'Shelf A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Shelf A › Row 1' })).toBeInTheDocument()
  })

  it('renders Cancel link pointing to /library', () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    const cancel = screen.getByRole('link', { name: /cancel/i })
    expect(cancel).toHaveAttribute('href', '/library')
  })

  it('renders empty ISBN input by default', () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    expect(screen.getByPlaceholderText(/978-0-000-00000-0/i)).toHaveValue('')
  })
})

describe('BookFromISBNForm — validation', () => {
  it('shows validation error when ISBN is empty on submit', async () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    await waitFor(() => {
      expect(screen.getByText(/isbn is required/i)).toBeInTheDocument()
    })
  })
})

describe('BookFromISBNForm — barcode scanner', () => {
  it('shows the scanner when scan button is clicked', async () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }))
    await waitFor(() => {
      expect(screen.getByTestId('mock-scanner')).toBeInTheDocument()
    })
  })

  it('hides the scanner after a barcode is detected', async () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }))
    fireEvent.click(screen.getByTestId('mock-scanner'))
    await waitFor(() => {
      expect(screen.queryByTestId('mock-scanner')).not.toBeInTheDocument()
    })
  })

  it('fills the ISBN field with the scanned barcode value', async () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }))
    fireEvent.click(screen.getByTestId('mock-scanner'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/978-0-000-00000-0/i)).toHaveValue('9780135957059')
    })
  })

  it('toggles scanner closed when clicking the close button', async () => {
    render(<BookFromISBNForm locations={LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }))
    await waitFor(() => {
      expect(screen.getByTestId('mock-scanner')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /close scanner/i }))
    await waitFor(() => {
      expect(screen.queryByTestId('mock-scanner')).not.toBeInTheDocument()
    })
  })
})

describe('BookFromISBNForm — server action error', () => {
  it('displays error message returned by server action', async () => {
    const { addBookFromISBNAction } = await import('@/components/actions')
    vi.mocked(addBookFromISBNAction).mockResolvedValueOnce({ error: 'ISBN not found' })

    render(<BookFromISBNForm locations={LOCATIONS} />)
    fireEvent.change(screen.getByPlaceholderText(/978-0-000-00000-0/i), {
      target: { value: '9780135957059' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))

    await waitFor(() => {
      expect(screen.getByText('ISBN not found')).toBeInTheDocument()
    })
  })
})

