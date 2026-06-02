import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getLocationBarcodes } from '@/lib/api/locations'
import { UnauthorizedError } from '@/lib/api/errors'
import BarcodeLabel from '@/components/BarcodeLabel'
import PrintButton from '@/components/PrintButton'

export default async function LocationBarcodesPage({
  searchParams
}: {
  searchParams: Promise<{ ids: string[] }>
}) {
  const session = await getSession()
  if (!session) redirect('/auth')

  const { ids } = await searchParams
  let parsedIds: string[] = ids
  if (typeof ids === 'string') {
    parsedIds = [ids]
  }

  let barcodes
  try {
    barcodes = await getLocationBarcodes(session.accessToken, parsedIds)
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect('/auth/refresh?callbackUrl=/library/locations/barcodes')
    }
    throw err
  }

  return (
    <div className="p-6 print:p-2">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-xl font-semibold text-gray-900">Location Barcodes</h1>
        <PrintButton />
      </div>

      {barcodes.length === 0 ? (
        <p className="text-gray-500 text-sm">No barcodes found for the selected locations.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 print:gap-3 print:grid-cols-2">
          {barcodes.map((barcode) => (
            <BarcodeLabel
              key={barcode.id}
              name={barcode.name}
              locationPath={barcode.locationPath}
              code={barcode.code}
            />
          ))}
        </div>
      )}
    </div>
  )
}
