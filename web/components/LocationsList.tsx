'use client'

import {LocationDto} from "@/lib/types/location";
import LocationNode from "@/components/LocationNode";
import {useState} from "react";
import {Printer} from "lucide-react";

export default function LocationsList({
                                        locations,
                                      }: { locations: LocationDto[] }) {
  const [selectedLocationsIds, setSelectedLocationsIds] = useState<string[]>([])

  function toggleLocation(id: string) {
    setSelectedLocationsIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function openBarcodes() {
    let url = '/library/locations/barcodes'
    if (selectedLocationsIds.length > 0) {
      const params = new URLSearchParams()
      selectedLocationsIds.forEach(id => params.append('ids', id))
      url += `?${params.toString()}`
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={openBarcodes}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50"
        >
          <Printer className="w-4 h-4" />
          Print Barcodes{selectedLocationsIds.length > 0 ? ` (${selectedLocationsIds.length})` : ''}
        </button>
      </div>
      {locations.map((location) => (
        <LocationNode
          key={location.id}
          location={location}
          isSelected={selectedLocationsIds.includes(location.id)}
          onToggleAction={toggleLocation}
        />
      ))}
    </>
  )
}

