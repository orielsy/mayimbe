import { describe, expect, it } from 'vitest'
import {
  ExhibitRegistry,
  MuseumNavigator,
  PlaceholderExhibit,
  destinationToPath,
  type MuseumDestination,
} from '../../core/museum'

describe('MuseumNavigator', () => {
  it('settles a semantic notebook destination without depending on a renderer', async () => {
    const registry = new ExhibitRegistry()
    registry.register(new PlaceholderExhibit('notebook'))

    let settled: MuseumDestination | null = null
    const navigator = new MuseumNavigator(registry, (destination) => {
      settled = destination
    })

    await navigator.navigate({
      kind: 'exhibit',
      exhibit: 'notebook',
      target: 'early-years',
    })

    expect(settled).toEqual({
      kind: 'exhibit',
      exhibit: 'notebook',
      target: 'early-years',
    })
  })

  it('uses the desk as the canonical root route', () => {
    expect(destinationToPath({ kind: 'desk' })).toBe('/')
    expect(destinationToPath({
      kind: 'exhibit',
      exhibit: 'notebook',
      target: 'early-years',
    })).toBe('/museum/notebook/early-years')
  })

  it('rejects an unregistered exhibit', async () => {
    const navigator = new MuseumNavigator(new ExhibitRegistry(), () => {})

    await expect(
      navigator.navigate({ kind: 'exhibit', exhibit: 'missing' }),
    ).rejects.toThrow('No exhibit registered')
  })
})
