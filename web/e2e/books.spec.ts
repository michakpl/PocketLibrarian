import { test, expect } from '@playwright/test'
import { injectSession, DEFAULT_USER } from './helpers/session'
import { registerHandler, resetHandlers } from './helpers/mock-client'
import {randomUUID} from "crypto";

// The mock server is started by playwright.config.ts as a webServer entry
// (e2e/helpers/mock-server.mjs) before Next.js boots — so API_URL already
// points to it when any server-side fetch runs.

test.afterEach(async () => {
  await resetHandlers()
})

// ─── Data fixtures ────────────────────────────────────────────────────────────

const BOOK_1 = {
  id: randomUUID(),
  ownerId: DEFAULT_USER.userId,
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn13: '978-0-13-235088-4',
  isbn10: null,
  location: null,
  locationPath: null,
}

const BOOK_2 = {
  id: randomUUID(),
  ownerId: DEFAULT_USER.userId,
  title: 'The Pragmatic Programmer',
  author: 'David Thomas',
  isbn13: '978-0-13-595705-9',
  isbn10: null,
  location: null,
  locationPath: null,
}

const LOCATION_1 = {
  id: randomUUID(),
  ownerId: DEFAULT_USER.userId,
  name: 'Shelf A',
  description: '',
  code: 'A',
  parentId: null,
  locationPath: ['Shelf A'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface PagedBooksOptions {
  items?: object[]
  totalCount?: number
  totalPages?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
  currentPage?: number
  pageSize?: number
}

async function registerBooks(opts: PagedBooksOptions = {}) {
  const {
    items = [],
    totalCount = 0,
    totalPages = 1,
    hasPreviousPage = false,
    hasNextPage = false,
    currentPage = 1,
    pageSize = 20,
  } = opts

  await registerHandler({
    method: 'GET',
    path: '/api/books',
    body: { items, page: currentPage, pageSize, totalCount, totalPages, hasPreviousPage, hasNextPage },
  })
}

async function registerLocations(locations: object[] = []) {
  await registerHandler({ method: 'GET', path: '/api/locations', body: locations })
}

async function registerBook(book: object) {
  const id = (book as { id: string }).id
  await registerHandler({ method: 'GET', path: `/api/books/${id}`, body: book })
}

// ─── Pagination tests ─────────────────────────────────────────────────────────

test.describe('library pagination', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  test('shows books on the first page', async ({ page }) => {
    await registerBooks({ items: [BOOK_1, BOOK_2], totalCount: 2, totalPages: 1 })
    await page.goto('/library')
    await expect(page.getByText('Clean Code')).toBeVisible()
    await expect(page.getByText('The Pragmatic Programmer')).toBeVisible()
  })

  test('shows total book count', async ({ page }) => {
    await registerBooks({ items: [BOOK_1], totalCount: 42, totalPages: 3, currentPage: 1, hasNextPage: true })
    await page.goto('/library')
    await expect(page.getByText(/42 books total/i)).toBeVisible()
  })

  test('Previous button is disabled on the first page', async ({ page }) => {
    await registerBooks({ items: [BOOK_1], totalCount: 1, totalPages: 1 })
    await page.goto('/library')
    await expect(page.getByRole('link', { name: /previous/i })).toHaveClass(/pointer-events-none/)
  })

  test('Next button is disabled on the last page', async ({ page }) => {
    await registerBooks({ items: [BOOK_1], totalCount: 1, totalPages: 1 })
    await page.goto('/library')
    await expect(page.getByRole('link', { name: /next/i })).toHaveClass(/pointer-events-none/)
  })

  test('clicking Next navigates to page 2', async ({ page }) => {
    await registerBooks({ items: [BOOK_1], totalCount: 2, totalPages: 2, currentPage: 1, pageSize: 1, hasNextPage: true })
    await page.goto('/library?page=1&pageSize=1')

    const nextLink = page.getByRole('link', { name: /next/i })
    await expect(nextLink).not.toHaveClass(/pointer-events-none/)

    // Override for page 2 before clicking
    await registerBooks({ items: [BOOK_2], totalCount: 2, totalPages: 2, currentPage: 2, pageSize: 1, hasPreviousPage: true })

    await nextLink.click()
    await page.waitForURL('**/library?page=2&pageSize=1')
    expect(new URL(page.url()).searchParams.get('page')).toBe('2')
  })

  test('shows empty state when there are no books', async ({ page }) => {
    await registerBooks({ items: [], totalCount: 0 })
    await page.goto('/library')
    await expect(page.getByText(/no books found/i)).toBeVisible()
  })
})

// ─── Add Book form ────────────────────────────────────────────────────────────

test.describe('add book form', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  test('navigates to /library/books/add when clicking Add Book', async ({ page }) => {
    await registerBooks({ items: [], totalCount: 0 })
    await page.goto('/library')
    await page.getByRole('link', { name: /add book/i }).click()
    await page.waitForURL('**/library/books/add')
    expect(new URL(page.url()).pathname).toBe('/library/books/add')
  })

  test('add book page renders the form fields', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await page.goto('/library/books/add')
    await expect(page.getByPlaceholder(/book title/i)).toBeVisible()
    await expect(page.getByPlaceholder(/author name/i)).toBeVisible()
    await expect(page.getByPlaceholder(/e.g. 978/i)).toBeVisible()
    await expect(page.getByPlaceholder(/e.g. 0-000/i)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('add book page shows location options', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await page.goto('/library/books/add')
    await expect(page.getByRole('combobox')).toContainText('Shelf A')
  })

  test('shows validation error when submitting empty title', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/books/add')
    await page.getByRole('button', { name: /add book/i }).click()
    await expect(page.getByText(/title is required/i)).toBeVisible()
  })

  test('shows validation error when submitting empty author', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/books/add')
    await page.getByPlaceholder(/book title/i).fill('My Book')
    await page.getByRole('button', { name: /add book/i }).click()
    await expect(page.getByText(/author is required/i)).toBeVisible()
  })

  test('submits form and redirects to /library on success', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await registerHandler({ method: 'POST', path: '/api/books', status: 201, body: BOOK_1 })
    await registerBooks({ items: [BOOK_1], totalCount: 1, totalPages: 1 })
    await page.goto('/library/books/add')
    await page.getByPlaceholder(/book title/i).fill('Clean Code')
    await page.getByPlaceholder(/author name/i).fill('Robert C. Martin')
    await page.getByRole('button', { name: /add book/i }).click()
    await page.waitForURL('**/library')
    expect(new URL(page.url()).pathname).toBe('/library')
  })
})

// ─── Edit Book form ───────────────────────────────────────────────────────────

test.describe('edit book form', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  test('edit book page is reachable from book card', async ({ page }) => {
    await registerBooks({ items: [BOOK_1], totalCount: 1, totalPages: 1 })
    await registerBook(BOOK_1)
    await registerLocations([LOCATION_1])
    await page.goto('/library')
    await page.getByRole('link', { name: /edit/i }).first().click()
    await page.waitForURL(`**/library/books/${BOOK_1.id}/edit`)
    expect(new URL(page.url()).pathname).toBe(`/library/books/${BOOK_1.id}/edit`)
  })

  test('edit page pre-fills the book data', async ({ page }) => {
    await registerBook(BOOK_1)
    await registerLocations([LOCATION_1])
    await page.goto(`/library/books/${BOOK_1.id}/edit`)
    await expect(page.getByPlaceholder(/book title/i)).toHaveValue('Clean Code')
    await expect(page.getByPlaceholder(/author name/i)).toHaveValue('Robert C. Martin')
  })

  test('edit page shows "Save Changes" button', async ({ page }) => {
    await registerBook(BOOK_1)
    await registerLocations([LOCATION_1])
    await page.goto(`/library/books/${BOOK_1.id}/edit`)
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible()
  })

  test('edit page shows the book title in the heading', async ({ page }) => {
    await registerBook(BOOK_1)
    await registerLocations([LOCATION_1])
    await page.goto(`/library/books/${BOOK_1.id}/edit`)
    await expect(page.getByRole('heading', { name: /clean code/i })).toBeVisible()
  })

  test('saving edited book redirects to /library', async ({ page }) => {
    await registerBook(BOOK_1)
    await registerLocations([LOCATION_1])
    await registerHandler({ method: 'PUT', path: `/api/books/${BOOK_1.id}`, body: { ...BOOK_1, title: 'Clean Code Updated' } })
    await registerBooks({ items: [{ ...BOOK_1, title: 'Clean Code Updated' }], totalCount: 1, totalPages: 1 })
    await page.goto(`/library/books/${BOOK_1.id}/edit`)
    await page.getByPlaceholder(/book title/i).fill('Clean Code Updated')
    await page.getByRole('button', { name: /save changes/i }).click()

    await page.waitForURL('**/library')
    expect(new URL(page.url()).pathname).toBe('/library')
  })
})

