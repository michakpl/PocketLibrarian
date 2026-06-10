'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface Props {
  name: string
  locationPath: string[]
  code: string
}

export default function BarcodeLabel({ name, locationPath, code }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, code, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 11,
        height: 50,
        width: 1.5,
        margin: 6,
        background: '#ffffff',
        lineColor: '#000000',
      })
    }
  }, [code])

  return (
    <div className="border border-gray-300 p-3 flex flex-col gap-1 break-inside-avoid bg-white">
      <p className="font-semibold text-sm leading-tight text-gray-900">{name}</p>
      {locationPath.length > 0 && (
        <p className="text-xs text-gray-500 leading-tight">{locationPath.join(' › ')}</p>
      )}
      <svg ref={svgRef} className="w-full mt-1" />
    </div>
  )
}
