import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getLocation, getLocations } from '@/lib/api/locations'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { UnauthorizedError } from '@/lib/api/errors'
import LocationForm from '@/components/LocationForm'

export default async function EditLocation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/auth')

  let location, locations
  try {
    [location, locations] = await Promise.all([
      getLocation(session.accessToken, id),
      getLocations(session.accessToken),
    ])
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect('/auth/refresh?callbackUrl=/library/locations')
    }
    throw err
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/library/locations"
          className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-blue-500" />
          </div>
          <h1 className="text-slate-900 text-xl">{location.name} — Edit Location</h1>
        </div>
      </div>

      <LocationForm location={location} locations={locations} />
    </div>
  )
}


