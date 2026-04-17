import 'server-only'
import type { BookDto } from '@/lib/types/book'

export async function getBooks(accessToken: string): Promise<BookDto[]> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')
  console.log(apiUrl);

  const response = await fetch(`${apiUrl}/api/books`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch books: ${response.status} ${response.statusText}`)
  }

  return await response.json() as Promise<BookDto[]>
}
