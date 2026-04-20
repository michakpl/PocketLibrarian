import { z } from 'zod'

export const LocationDtoSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  name: z.string(),
  description: z.string(),
  code: z.string(),
  parentId: z.uuid().nullable(),
})

export const BookDtoSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  title: z.string(),
  author: z.string(),
  isbn13: z.string().nullable(),
  isbn10: z.string().nullable(),
  location: LocationDtoSchema.nullable(),
})

export const BookDtoListSchema = z.array(BookDtoSchema)

