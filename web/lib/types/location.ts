export interface LocationDto {
  id: string
  ownerId: string
  name: string
  description: string
  code: string
  parentId: string | null
  locationPath: string[] | null
}

export interface LocationBarcodeDto {
  id: string
  name: string
  code: string
  locationPath: string[]
}
