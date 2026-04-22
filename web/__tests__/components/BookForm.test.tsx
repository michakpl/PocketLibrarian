import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BookForm from '@/components/BookForm'
import type { BookDto } from '@/lib/types/book'
import type { LocationDto } from '@/lib/types/location'

vi.mock('@/components/actions', () => ({
  addBookAction: vi.fn(async () => ({})),
  updateBookAction: vi.fn(async () => ({})),
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

const EXISTING_BOOK: BookDto = {
  id: 'book-1',
  ownerId: 'owner-1',
  title: 'Existing Book',
  author: 'Jane Doe',
  isbn13: '978-0-13-235088-4',
  isbn10: '0-13-235088-2',
  location: LOCATIONS[0],
  locationPath: ['Shelf A'],
}

describe('BookForm — add mode', () => {
  it('renders empty fields in add mode', () => {
    render(<BookForm locations={LOCATIONS} />)
    expect(screen.getByPlaceholderText(/book title/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/author name/i)).toHaveValue('')
  })

  it('shows "Add Book" submit button in add mode', () => {
    render(<BookForm locations={LOCATIONS} />)
    expect(screen.getByRole('button', { name: /add book/i })).toBeInTheDocument()
  })

  it('renders Cancel link pointing to /library', () => {
    render(<BookForm locations={LOCATIONS} />)
    const cancel = screen.getByRole('link', { name: /cancel/i })
    expect(cancel).toHaveAttribute('href', '/library')
  })

  it('renders location options from props', () => {
    render(<BookForm locations={LOCATIONS} />)
    expect(screen.getByRole('option', { name: 'Shelf A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Shelf A › Row 1' })).toBeInTheDocument()
  })

  it('shows validation error when title is empty on submit', async () => {
    render(<BookForm locations={LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when author is empty on submit', async () => {
    render(<BookForm locations={LOCATIONS} />)
    fireEvent.change(screen.getByPlaceholderText(/book title/i), { target: { value: 'A Title' } })
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    await waitFor(() => {
      expect(screen.getByText(/author is required/i)).toBeInTheDocument()
    })
  })
})

describe('BookForm — edit mode', () => {
  it('pre-fills fields from book prop', () => {
    render(<BookForm book={EXISTING_BOOK} locations={LOCATIONS} />)
    expect(screen.getByPlaceholderText(/book title/i)).toHaveValue('Existing Book')
    expect(screen.getByPlaceholderText(/author name/i)).toHaveValue('Jane Doe')
    expect(screen.getByPlaceholderText(/e.g. 978/i)).toHaveValue('978-0-13-235088-4')
    expect(screen.getByPlaceholderText(/e.g. 0-000/i)).toHaveValue('0-13-235088-2')
  })

  it('shows "Save Changes" submit button in edit mode', () => {
    render(<BookForm book={EXISTING_BOOK} locations={LOCATIONS} />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('pre-selects the book location in the dropdown', () => {
    render(<BookForm book={EXISTING_BOOK} locations={LOCATIONS} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('loc-1')
  })
})

describe('BookForm — server action error', () => {
  it('displays error message returned by server action', async () => {
    const { addBookAction } = await import('@/components/actions')
    vi.mocked(addBookAction).mockResolvedValueOnce({ error: 'Server is down' })

    render(<BookForm locations={LOCATIONS} />)
    fireEvent.change(screen.getByPlaceholderText(/book title/i), { target: { value: 'Title' } })
    fireEvent.change(screen.getByPlaceholderText(/author name/i), { target: { value: 'Author' } })
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))

    await waitFor(() => {
      expect(screen.getByText('Server is down')).toBeInTheDocument()
    })
  })
})

