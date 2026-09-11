import { describe, expect, it } from 'vitest'
import { destinationToPath } from '../../core/museum/destination'
import { loadContent } from '../../scripts/content-utils'

describe('archive-to-museum routing', () => {
  it('keeps the Early Years story available for the notebook route', async () => {
    const content = await loadContent()
    const story = content.stories.find((candidate) => candidate.id === 'story:early-years')

    expect(story).toBeDefined()
    expect(destinationToPath({
      kind: 'exhibit',
      exhibit: 'notebook',
      target: 'early-years',
      entity: 'story:early-years',
    })).toBe('/notebook/early-years')
  })
})
