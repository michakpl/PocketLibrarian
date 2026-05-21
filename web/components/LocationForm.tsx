'use client'

import { useActionState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Save } from 'lucide-react'
import Link from 'next/link'
import type { LocationDto } from '@/lib/types/location'
import {
  addLocationAction,
  updateLocationAction,
  type LocationFormState,
} from '@/components/actions'

interface FormValues {
  name: string
  description: string
  parentId: string
}

interface LocationFormProps {
  location?: LocationDto
  locations: LocationDto[]
}

const EMPTY_STATE: LocationFormState = {}

export default function LocationForm({ location, locations }: LocationFormProps) {
  const isEdit = !!location

  const boundAction = isEdit
    ? (prev: LocationFormState, formData: FormData) =>
        updateLocationAction(location.id, prev, formData)
    : addLocationAction

  const [state, dispatch] = useActionState<LocationFormState, FormData>(boundAction, EMPTY_STATE)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormValues>({
    defaultValues: {
      name: location?.name ?? '',
      description: location?.description ?? '',
      parentId: location?.parentId ?? '',
    },
  })

  // Build flat ordered location options, excluding self and descendants when editing
  const getAllDescendantIds = (id: string): string[] => {
    const children = locations.filter((l) => l.parentId === id).map((l) => l.id)
    return [...children, ...children.flatMap(getAllDescendantIds)]
  }

  const excludedIds = isEdit ? new Set([location.id, ...getAllDescendantIds(location.id)]) : new Set<string>()

  const parentOptions: { id: string; label: string }[] = []
  const traverse = (parentId: string | null) => {
    const children = locations.filter(
      (l) => l.parentId === parentId && !excludedIds.has(l.id)
    )
    for (const loc of children) {
      parentOptions.push({
        id: loc.id,
        label: loc.locationPath?.join(' › ') ?? loc.name,
      })
      traverse(loc.id)
    }
  }
  traverse(null)

  const onSubmit = (values: FormValues) => {
    const formData = new FormData()
    formData.set('name', values.name)
    formData.set('description', values.description)
    formData.set('parentId', values.parentId)
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
          Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name', { required: 'Name is required' })}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g. Living Room, Shelf A, Box 1"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-700 mb-1.5">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Brief description of this location..."
        />
      </div>

      <div>
        <label className="block text-sm text-slate-700 mb-1.5">Parent Location</label>
        <select
          {...register('parentId')}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">— No parent (top-level location) —</option>
          {parentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-slate-400 text-xs mt-1">
          Optionally nest this location inside another one (e.g. Shelf inside Room).
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <Link
          href="/library/locations"
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
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Location'}
        </button>
      </div>
    </form>
  )
}

