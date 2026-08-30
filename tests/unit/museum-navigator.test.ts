import { describe, expect, it } from 'vitest'
import { ExhibitRegistry, MuseumNavigator, type MuseumDestination } from '../../core/museum'
import { NotebookAdapter } from '../../exhibits/notebook/adapter'

describe('MuseumNavigator', () => {
  it('settles a semantic notebook destination through the exhibit contract', async () => {
    const registry = new ExhibitRegistry()
    registry.register(new NotebookAdapter())

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

  it('rejects an unregistered exhibit', async () => {
    const navigator = new MuseumNavigator(new ExhibitRegistry(), () => {})

    await expect(
      navigator.navigate({ kind: 'exhibit', exhibit: 'missing' }),
    ).rejects.toThrow('No exhibit registered')
  })
})
