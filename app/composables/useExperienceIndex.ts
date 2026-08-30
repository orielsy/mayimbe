import experienceData from '~~/generated/experience-index.json'
import type { ExperienceIndex } from '~~/core/museum'

export function useExperienceIndex(): ExperienceIndex {
  return experienceData as ExperienceIndex
}
