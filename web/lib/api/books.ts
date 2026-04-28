import 'server-only'
import type { BookDto, PagedResult } from '@/lib/types/book'
import {BookDtoSchema, PagedResultOfBookDtoSchema} from '@/lib/types/schemas'
import {UnauthorizedError} from "@/lib/api/errors";

export interface GetBooksParams {
  page?: number
  pageSize?: number
}

export async function getBooks(
  accessToken: string,
  { page = 1, pageSize = 20 }: GetBooksParams = {}
): Promise<PagedResult<BookDto>> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')

  const url = new URL(`${apiUrl}/api/books`)
  url.searchParams.set('page', String(page))
  url.searchParams.set('pageSize', String(pageSize))

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch books: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return PagedResultOfBookDtoSchema.parse(data)
}

export async function getBook(accessToken: string, bookId: string): Promise<BookDto> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')

  const url = new URL(`${apiUrl}/api/books/${bookId}`)

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch book with ID ${bookId}: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return BookDtoSchema.parse(data)
}

export interface AddBookRequest {
  title: string
  author: string
  isbn13: string | null
  isbn10: string | null
  locationId: string | null
}

export async function addBook(
  accessToken: string,
  body: AddBookRequest
): Promise<BookDto> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')

  const url = new URL(`${apiUrl}/api/books`)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error(`Failed to add book: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return BookDtoSchema.parse(data)
}

export interface UpdateBookRequest {
  title: string
  author: string
  isbn13: string | null
  isbn10: string | null
  locationId: string | null
}

export async function updateBook(
  accessToken: string,
  bookId: string,
  body: UpdateBookRequest
): Promise<BookDto> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')

  const url = new URL(`${apiUrl}/api/books/${bookId}`)

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error(`Failed to update book with ID ${bookId}: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return BookDtoSchema.parse(data)
}
