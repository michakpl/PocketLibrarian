'use server'

import { getSession } from '@/lib/session'
import { addBook, updateBook } from '@/lib/api/books'
import { createLocation, updateLocation } from '@/lib/api/locations'
import { redirect } from 'next/navigation'

export interface BookFormState {
  error?: string
}

function extractBookFields(formData: FormData) {
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
    await addBook(session.accessToken, extractBookFields(formData))
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
    await updateBook(session.accessToken, bookId, extractBookFields(formData))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update book' }
  }

  redirect('/library')
}

export interface LocationFormState {
  error?: string
}

function extractLocationFields(formData: FormData) {
  return {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) ?? '',
    parentId: (formData.get('parentId') as string) || null,
  }
}

export async function addLocationAction(
  _prev: LocationFormState,
  formData: FormData
): Promise<LocationFormState> {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  try {
    await createLocation(session.accessToken, extractLocationFields(formData))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to add location' }
  }

  redirect('/library/locations')
}

export async function updateLocationAction(
  locationId: string,
  _prev: LocationFormState,
  formData: FormData
): Promise<LocationFormState> {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  try {
    await updateLocation(session.accessToken, locationId, extractLocationFields(formData))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update location' }
  }

  redirect('/library/locations')
}
