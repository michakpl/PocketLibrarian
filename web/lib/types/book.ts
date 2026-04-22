import type { LocationDto } from './location'

export interface BookDto {
  id: string
  ownerId: string
  title: string
  author: string
  isbn13: string | null
  isbn10: string | null
  location: LocationDto | null
  locationPath: string[] | null
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}
