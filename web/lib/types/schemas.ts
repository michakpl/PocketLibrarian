import { z } from 'zod'

export const LocationDtoSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  name: z.string(),
  description: z.string(),
  code: z.string(),
  parentId: z.uuid().nullable(),
  locationPath: z.array(z.string()).nullable(),
})

export const BookDtoSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  title: z.string(),
  author: z.string(),
  isbn13: z.string().nullable(),
  isbn10: z.string().nullable(),
  location: LocationDtoSchema.nullable(),
  locationPath: z.array(z.string()).nullable(),
})

export const PagedResultOfBookDtoSchema = z.object({
  items: z.array(BookDtoSchema),
  page: z.coerce.number().int(),
  pageSize: z.coerce.number().int(),
  totalCount: z.coerce.number().int(),
  totalPages: z.coerce.number().int().optional(),
  hasPreviousPage: z.boolean().optional(),
  hasNextPage: z.boolean().optional(),
})
