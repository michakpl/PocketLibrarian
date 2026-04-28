'use server'

import { getSession } from '@/lib/session'
import { addBook, updateBook } from '@/lib/api/books'
import { redirect } from 'next/navigation'

export interface BookFormState {
  error?: string
}

function extractFields(formData: FormData) {
  return {
    title: formData.get('title') as string,
    author: formData.get('author') as string,
    isbn13: (formData.get('isbn13') as string) || null,
    isbn10: (formData.get('isbn10') as string) || null,
    locationId: (formData.get('locationId') as string) || null,
  }
}

export async function addBookAction(
  _prev: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  try {
    await addBook(session.accessToken, extractFields(formData))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to add book' }
  }

  redirect('/library')
}

export async function updateBookAction(
  bookId: string,
  _prev: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  try {
    await updateBook(session.accessToken, bookId, extractFields(formData))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update book' }
  }

  redirect('/library')
}
