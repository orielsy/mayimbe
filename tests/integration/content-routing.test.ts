import { describe, expect, it } from 'vitest'
import { resolvePreferredExperience } from '../../core/museum/experience'
import { loadContent } from '../../scripts/content-utils'

function buildExperienceIndex(experiences: Awaited<ReturnType<typeof loadContent>>['experiences']) {
  const bySubject: Record<string, typeof experiences> = {}

  for (const mapping of experiences) {
    bySubject[mapping.subject] ??= []
    bySubject[mapping.subject].push(mapping)
  }

  return { mappings: experiences, bySubject }
}

describe('archive-to-museum routing', () => {
  it('routes the Early Years story to the notebook semantic target', async () => {
    const content = await loadContent()
    const story = content.stories.find((candidate) => candidate.id === 'story:early-years')

    expect(story).toBeDefined()

    const mapping = resolvePreferredExperience(buildExperienceIndex(content.experiences), 'story:early-years')

    expect(mapping?.destination).toEqual({
      kind: 'exhibit',
      exhibit: 'notebook',
      target: 'early-years',
      entity: 'story:early-years',
    })
  })
})
