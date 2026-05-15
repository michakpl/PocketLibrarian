import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Book from '@/components/Book'
import type { BookDto } from '@/lib/types/book'

const MOCK_BOOK: BookDto = {
  id: 'book-1',
  ownerId: 'owner-1',
  title: 'The Pragmatic Programmer',
  author: 'David Thomas, Andrew Hunt',
  isbn13: '9780135957059',
  isbn10: '0135957052',
  location: null,
  locationPath: ['Living Room', 'Bookshelf A'],
}

describe('Book — rendering', () => {
  it('renders the book title', () => {
    render(<Book book={MOCK_BOOK} />)
    expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument()
  })

  it('renders the book author', () => {
    render(<Book book={MOCK_BOOK} />)
    expect(screen.getByText('David Thomas, Andrew Hunt')).toBeInTheDocument()
  })

  it('renders the ISBN', () => {
    render(<Book book={MOCK_BOOK} />)
    expect(screen.getByText('9780135957059')).toBeInTheDocument()
  })

  it('renders a dash when isbn13 is null', () => {
    render(<Book book={{ ...MOCK_BOOK, isbn13: null }} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders the location path joined by › separator', () => {
    render(<Book book={MOCK_BOOK} />)
    expect(screen.getByText('Living Room › Bookshelf A')).toBeInTheDocument()
  })

  it('renders a dash when locationPath is null', () => {
    render(<Book book={{ ...MOCK_BOOK, locationPath: null }} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders the Edit link with correct href', () => {
    render(<Book book={MOCK_BOOK} />)
    const editLink = screen.getByRole('link', { name: /edit/i })
    expect(editLink).toBeInTheDocument()
    expect(editLink).toHaveAttribute('href', '/library/books/book-1/edit')
  })

  it('renders the Delete button', () => {
    render(<Book book={MOCK_BOOK} />)
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

describe('Book — delete confirmation', () => {
  it('shows confirmation prompt when Delete is clicked', () => {
    render(<Book book={MOCK_BOOK} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText(/delete\?/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('hides the Delete button once confirmation is shown', () => {
    render(<Book book={MOCK_BOOK} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  })

  it('restores Delete button when No is clicked', () => {
    render(<Book book={MOCK_BOOK} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: /no/i }))
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /yes/i })).not.toBeInTheDocument()
  })
})

