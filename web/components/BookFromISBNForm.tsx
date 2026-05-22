'use client'

import { useState, useActionState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Save, Camera, X } from 'lucide-react'
import Link from 'next/link'
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner'
import type { LocationDto } from '@/lib/types/location'
import { addBookFromISBNAction, type BookFormState } from '@/components/actions'

interface FormValues {
  isbn: string
  locationId: string
}

interface BookFromISBNFormProps {
  locations: LocationDto[]
}

const EMPTY_STATE: BookFormState = {}

// EAN-13 is the standard ISBN barcode; EAN-8 covers shortened variants
const ISBN_FORMATS: BarcodeFormat[] = ['ean_13', 'ean_8']

export default function BookFromISBNForm({ locations }: BookFromISBNFormProps) {
  const [state, dispatch] = useActionState<BookFormState, FormData>(addBookFromISBNAction, EMPTY_STATE)
  const [isPending, startTransition] = useTransition()
  const [scannerOpen, setScannerOpen] = useState(false)

  const {
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<FormValues>({
    defaultValues: {
      isbn: '',
      locationId: '',
    },
  })

  const onSubmit = (values: FormValues) => {
    const formData = new FormData()
    formData.set('isbn', values.isbn)
    formData.set('locationId', values.locationId)
    startTransition(() => dispatch(formData))
  }

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    const code = detectedCodes[0]
    if (!code) return
    setValue('isbn', code.rawValue, { shouldValidate: true })
    setScannerOpen(false)
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
          ISBN <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            {...register('isbn', { required: 'ISBN is required' })}
            className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            placeholder="e.g. 978-0-000-00000-0 or 0-000-00000-0"
          />
          <button
            type="button"
            onClick={() => setScannerOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            title={scannerOpen ? 'Close scanner' : 'Scan barcode'}
          >
            {scannerOpen ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          </button>
        </div>
        {errors.isbn && (
          <p className="text-red-500 text-xs mt-1">{errors.isbn.message}</p>
        )}
        {scannerOpen && (
          <div className="mt-3 rounded-lg overflow-hidden border border-slate-200">
            <Scanner
              onScan={handleScan}
              formats={ISBN_FORMATS}
              styles={{ container: { borderRadius: '0.5rem' } }}
            />
          </div>
        )}
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
          {isPending ? 'Saving…' : 'Add Book'}
        </button>
      </div>
    </form>
  )
}

