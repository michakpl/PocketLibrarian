import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LibraryPage from '@/app/library/page'

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/api/books', () => ({
  getBooks: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor() {
      super('Unauthorized')
      this.name = 'UnauthorizedError'
    }
  },
}))

import { getSession } from '@/lib/session'
import { getBooks } from '@/lib/api/books'
import { redirect } from 'next/navigation'

const MOCK_BOOK = {
  id: 'book-1',
  ownerId: 'owner-1',
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn13: '978-0-13-235088-4',
  isbn10: null,
  location: null,
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

describe('LibraryPage — pagination', () => {
  it('renders the list of books', async () => {
    vi.mocked(getBooks).mockResolvedValue({
      items: [MOCK_BOOK],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    })

    const page = await LibraryPage({ searchParams: makeSearchParams() })
    render(page)

    expect(screen.getByText('Clean Code')).toBeInTheDocument()
    expect(screen.getByText('Robert C. Martin')).toBeInTheDocument()
  })

  it('shows total count and page info', async () => {
    vi.mocked(getBooks).mockResolvedValue({
      items: [MOCK_BOOK],
      page: 2,
      pageSize: 1,
      totalCount: 5,
      totalPages: 5,
      hasPreviousPage: true,
      hasNextPage: true,
    })

    const page = await LibraryPage({ searchParams: makeSearchParams({ page: '2', pageSize: '1' }) })
    render(page)

    expect(screen.getByText(/5 books total/i)).toBeInTheDocument()
    expect(screen.getByText(/page 2 of 5/i)).toBeInTheDocument()
  })

  it('Previous link is disabled (pointer-events-none) on first page', async () => {
    vi.mocked(getBooks).mockResolvedValue({
      items: [MOCK_BOOK],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    })

    const page = await LibraryPage({ searchParams: makeSearchParams() })
    render(page)

    const prevLink = screen.getByRole('link', { name: /previous/i })
    expect(prevLink).toHaveClass('pointer-events-none')
  })

  it('Next link is disabled (pointer-events-none) on last page', async () => {
    vi.mocked(getBooks).mockResolvedValue({
      items: [MOCK_BOOK],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    })

    const page = await LibraryPage({ searchParams: makeSearchParams() })
    render(page)

    const nextLink = screen.getByRole('link', { name: /next/i })
    expect(nextLink).toHaveClass('pointer-events-none')
  })

  it('Previous and Next links are active when in the middle of pages', async () => {
    vi.mocked(getBooks).mockResolvedValue({
      items: [MOCK_BOOK],
      page: 2,
      pageSize: 1,
      totalCount: 3,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: true,
    })

    const page = await LibraryPage({ searchParams: makeSearchParams({ page: '2', pageSize: '1' }) })
    render(page)

    const prevLink = screen.getByRole('link', { name: /previous/i })
    const nextLink = screen.getByRole('link', { name: /next/i })
    expect(prevLink).not.toHaveClass('pointer-events-none')
    expect(nextLink).not.toHaveClass('pointer-events-none')
  })

  it('Previous link href points to page - 1', async () => {
    vi.mocked(getBooks).mockResolvedValue({
      items: [MOCK_BOOK],
      page: 3,
      pageSize: 5,
      totalCount: 20,
      totalPages: 4,
      hasPreviousPage: true,
      hasNextPage: true,
    })

    const page = await LibraryPage({ searchParams: makeSearchParams({ page: '3', pageSize: '5' }) })
    render(page)

    const prevLink = screen.getByRole('link', { name: /previous/i })
    expect(prevLink).toHaveAttribute('href', '/library?page=2&pageSize=5')
  })

  it('Next link href points to page + 1', async () => {
    vi.mocked(getBooks).mockResolvedValue({
      items: [MOCK_BOOK],
      page: 3,
      pageSize: 5,
      totalCount: 20,
      totalPages: 4,
      hasPreviousPage: true,
      hasNextPage: true,
    })

    const page = await LibraryPage({ searchParams: makeSearchParams({ page: '3', pageSize: '5' }) })
    render(page)

    const nextLink = screen.getByRole('link', { name: /next/i })
    expect(nextLink).toHaveAttribute('href', '/library?page=4&pageSize=5')
  })

  it('shows empty state when no books', async () => {
    vi.mocked(getBooks).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    })

    const page = await LibraryPage({ searchParams: makeSearchParams() })
    render(page)

    expect(screen.getByText(/no books found/i)).toBeInTheDocument()
  })

  it('redirects to /auth when no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    await LibraryPage({ searchParams: makeSearchParams() }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/auth')
  })

  it('redirects to /auth/refresh on UnauthorizedError', async () => {
    const { UnauthorizedError } = await import('@/lib/api/errors')
    vi.mocked(getBooks).mockRejectedValue(new UnauthorizedError())

    await LibraryPage({ searchParams: makeSearchParams() }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/auth/refresh?callbackUrl=/library')
  })

  it('calls getBooks with correct page from searchParams', async () => {
    vi.mocked(getBooks).mockResolvedValue({
      items: [],
      page: 2,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    })

    await LibraryPage({ searchParams: makeSearchParams({ page: '2', pageSize: '10' }) }).catch(() => {})
    expect(getBooks).toHaveBeenCalledWith('token', { page: 2, pageSize: 10 })
  })
})
