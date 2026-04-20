import 'server-only'
import type { BookDto } from '@/lib/types/book'
import { BookDtoListSchema } from '@/lib/types/schemas'

export class UnauthorizedError extends Error {
  constructor() {
    super('Access token rejected by API (401)')
    this.name = 'UnauthorizedError'
  }
}

export async function getBooks(accessToken: string): Promise<BookDto[]> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')

  const response = await fetch(`${apiUrl}/api/books`, {
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
  return BookDtoListSchema.parse(data)
}
