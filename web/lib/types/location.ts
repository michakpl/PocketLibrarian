export interface LocationDto {
  id: string
  ownerId: string
  name: string
  description: string
  code: string
  parentId: string | null
}
