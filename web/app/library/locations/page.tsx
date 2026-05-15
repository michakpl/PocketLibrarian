import {getSession} from "@/lib/session";
import {redirect} from "next/navigation";
import {UnauthorizedError} from "@/lib/api/errors";
import {getLocations} from "@/lib/api/locations";
import Link from "next/link";
import {Plus} from "lucide-react";
import LocationNode from "@/components/LocationNode";

interface Props {
    searchParams: Promise<{ page?: string; pageSize?: string }>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function LocationPage(_: Props) {
    const session = await getSession()
    if (!session) redirect('/auth')

    let locations
    try {
        locations = await getLocations(session.accessToken)
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            redirect('/auth/refresh?callbackUrl=/library')
        }
        throw err
    }

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-slate-900 text-2xl">Locations</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{locations.length} locations in your library</p>
                </div>
                <Link
                    href="/library/locations/add"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm transition-colors"
                >
                    <Plus className="w-4 h-4"/>
                    Add Location
                </Link>
            </div>

            {locations.map((location) => (
                <LocationNode key={location.id} location={location}/>
            ))}
        </div>
    )
}