'use client'

import { useActionState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Save } from 'lucide-react'
import Link from 'next/link'
import type { BookDto } from '@/lib/types/book'
import type { LocationDto } from '@/lib/types/location'
import { addBookAction, updateBookAction, type BookFormState } from '@/components/actions'

interface FormValues {
  title: string
  author: string
  isbn13: string
  isbn10: string
  locationId: string
}

interface BookFormProps {
  book?: BookDto
  locations: LocationDto[]
}

const EMPTY_STATE: BookFormState = {}

export default function BookForm({ book, locations }: BookFormProps) {
  const isEdit = !!book

  const boundAction = isEdit
    ? (prev: BookFormState, formData: FormData) => updateBookAction(book.id, prev, formData)
    : addBookAction

  const [state, dispatch] = useActionState<BookFormState, FormData>(boundAction, EMPTY_STATE)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormValues>({
    defaultValues: {
      title: book?.title ?? '',
      author: book?.author ?? '',
      isbn13: book?.isbn13 ?? '',
      isbn10: book?.isbn10 ?? '',
      locationId: book?.location?.id ?? '',
    },
  })

  const onSubmit = (values: FormValues) => {
    const formData = new FormData()
    formData.set('title', values.title)
    formData.set('author', values.author)
    formData.set('isbn13', values.isbn13)
    formData.set('isbn10', values.isbn10)
    formData.set('locationId', values.locationId)
    startTransition(() => dispatch(formData))
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl border border-slate-200 p-6 space-y-5"
    >
      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-700 mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title', { required: 'Title is required' })}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Book title"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-700 mb-1.5">
          Author <span className="text-red-500">*</span>
        </label>
        <input
          {...register('author', { required: 'Author is required' })}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Author name(s)"
        />
        {errors.author && (
          <p className="text-red-500 text-xs mt-1">{errors.author.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-700 mb-1.5">ISBN-13</label>
        <input
          {...register('isbn13')}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          placeholder="e.g. 978-0-000-00000-0"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-700 mb-1.5">ISBN-10</label>
        <input
          {...register('isbn10')}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          placeholder="e.g. 0-000-00000-0"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-700 mb-1.5">Location</label>
        <select
          {...register('locationId')}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Select a location...</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.locationPath?.join(' › ') ?? l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <Link
          href="/library"
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Book'}
        </button>
      </div>
    </form>
  )
}
