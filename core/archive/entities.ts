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

export interface SourceEntity extends ArchiveEntityBase {
  type: 'source'
  sourceType: 'website' | 'article' | 'book' | 'interview' | 'liner-notes' | 'audio' | 'video' | 'other'
  title: string
  author?: string
  publication?: string
  url?: string
  accessedAt?: string
  note?: string
}

export interface StoryEntity extends ArchiveEntityBase {
  type: 'story'
  status: 'draft' | 'published'
  language: 'en' | 'es'
  title: LocalizedText
  summary?: LocalizedText
  body: string
  references?: string[]
  sources?: string[]
}

export type ArchiveEntity = PersonEntity | SourceEntity | StoryEntity

export interface ArchiveIndex {
  people: PersonEntity[]
  sources: SourceEntity[]
  stories: StoryEntity[]
  byId: Record<string, ArchiveEntity>
}
