export interface LocalizedText {
  en?: string
  es?: string
}

export interface ArchiveEntityBase {
  id: string
  slug: string
}

export interface PersonEntity extends ArchiveEntityBase {
  type: 'person'
  name: string
  aliases?: string[]
  summary?: LocalizedText
}

export type ArchiveEntity = PersonEntity

export interface ArchiveIndex {
  people: PersonEntity[]
  byId: Record<string, ArchiveEntity>
}
