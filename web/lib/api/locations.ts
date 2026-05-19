import 'server-only'
import type { LocationDto } from '@/lib/types/location'
import { LocationDtoSchema } from '@/lib/types/schemas'
import { z } from 'zod'
import { UnauthorizedError } from './errors'

export interface AddLocationRequest {
  name: string
  description: string
  parentId: string | null
}

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

export async function getLocation(accessToken: string, id: string): Promise<LocationDto> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')

  const url = new URL(`${apiUrl}/api/locations/${id}`)

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch location: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return LocationDtoSchema.parse(data)
}

export async function createLocation(
  accessToken: string,
  body: AddLocationRequest
): Promise<LocationDto> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')

  const url = new URL(`${apiUrl}/api/locations`)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error(`Failed to create location: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return LocationDtoSchema.parse(data)
}

export interface UpdateLocationRequest {
  name: string
  description: string
  parentId: string | null
}

export async function updateLocation(
  accessToken: string,
  id: string,
  body: UpdateLocationRequest
): Promise<LocationDto> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL environment variable is not set')

  const url = new URL(`${apiUrl}/api/locations/${id}`)

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error(`Failed to update location: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return LocationDtoSchema.parse(data)
}

