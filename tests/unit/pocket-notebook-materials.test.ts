import { describe, expect, it } from 'vitest'
import {
  POCKET_NOTEBOOK_MATERIALS,
  pocketNotebookMaterialAt,
} from '../../app/runtime/pocket-notebook-materials'

describe('pocket notebook material history', () => {
  it('preserves the PaperV2 progression from first-page trauma into protected interior', () => {
    expect(POCKET_NOTEBOOK_MATERIALS.map(profile => profile.recipe)).toEqual([
      'carried',
      'humidity',
      'humidity',
      'humidity',
      'protected',
      'protected',
    ])

    expect(POCKET_NOTEBOOK_MATERIALS.map(profile => profile.id)).toEqual([
      'page-one-trauma',
      'trauma-echo-humidity-rise',
      'humidity-peak-trauma-echo',
      'humidity-recedes-family-transition',
      'protected-interior',
      'deep-protected-interior',
    ])
  })

  it('keeps page one as the densest damage event and fades its trauma echo', () => {
    const opacity = (page: number, id: string) => (
      POCKET_NOTEBOOK_MATERIALS[page]?.layers.find(layer => layer.id === id)?.opacity ?? 0
    )

    expect(POCKET_NOTEBOOK_MATERIALS[0]?.layers).toHaveLength(9)
    expect(opacity(0, 'wear-water-stain')).toBe(0.96)
    expect(opacity(0, 'wear-humidity-bloom')).toBe(0.86)
    expect(opacity(0, 'wear-foxing-heavy')).toBe(0.88)
    expect(opacity(0, 'wear-foxing-light')).toBe(0.66)
    expect(opacity(0, 'wear-crease')).toBe(0.42)

    expect(opacity(1, 'wear-water-stain')).toBeCloseTo(0.28)
    expect(opacity(2, 'wear-water-stain')).toBeCloseTo(0.14)
    expect(opacity(3, 'wear-water-stain')).toBe(0)

    expect(opacity(0, 'wear-handling-grime')).toBeGreaterThan(opacity(1, 'wear-handling-grime'))
    expect(opacity(1, 'wear-handling-grime')).toBeGreaterThan(opacity(2, 'wear-handling-grime'))
  })

  it('keeps shared edge age across every family while reducing it deeper in the block', () => {
    const edges = POCKET_NOTEBOOK_MATERIALS.map(profile => (
      profile.layers.find(layer => layer.id === 'wear-edge-oxidation')?.opacity ?? 0
    ))

    expect(edges.every(value => value > 0)).toBe(true)
    expect(edges).toEqual([...edges].sort((a, b) => b - a))
  })

  it('clamps material lookup to the available notebook history', () => {
    expect(pocketNotebookMaterialAt(-10)).toBe(POCKET_NOTEBOOK_MATERIALS[0])
    expect(pocketNotebookMaterialAt(99)).toBe(POCKET_NOTEBOOK_MATERIALS.at(-1))
  })
})
