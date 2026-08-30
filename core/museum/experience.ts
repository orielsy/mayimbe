import type { LocalizedText } from '../archive'
import type { MuseumDestination } from './destination'

export interface ExperienceMapping {
  id: string
  subject: string
  role: 'primary' | 'alternate'
  destination: MuseumDestination
  label?: LocalizedText
}

export interface ExperienceIndex {
  mappings: ExperienceMapping[]
  bySubject: Record<string, ExperienceMapping[]>
}

export function resolvePreferredExperience(
  index: ExperienceIndex,
  subject: string,
): ExperienceMapping | null {
  const mappings = index.bySubject[subject] ?? []

  return mappings.find((mapping) => mapping.role === 'primary')
    ?? mappings[0]
    ?? null
}
