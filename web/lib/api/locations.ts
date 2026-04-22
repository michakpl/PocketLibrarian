import 'server-only'
import type { LocationDto } from '@/lib/types/location'
import { LocationDtoSchema } from '@/lib/types/schemas'
import { z } from 'zod'
import { UnauthorizedError } from './books'

export async function getLocations(accessToken: string): Promise<LocationDto[]> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')

  const url = new URL(`${apiUrl}/api/locations`)

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return z.array(LocationDtoSchema).parse(data)
}