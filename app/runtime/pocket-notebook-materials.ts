export type PocketNotebookRecipeId = 'carried' | 'humidity' | 'protected'

export interface PocketNotebookWearLayer {
  id: string
  opacity: number
}

export interface PocketNotebookMaterialProfile {
  id: string
  recipe: PocketNotebookRecipeId
  story: string
  layers: readonly PocketNotebookWearLayer[]
}

/**
 * Static-asset translation of the selected Lab-Native PAPERV2 history.
 *
 * PAPERV2 gives page one an exceptional surface trauma, echoes that trauma on
 * the next two faces, runs a humidity episode through the early/middle block,
 * then blends the physical history from handled stock toward protected
 * interior stock. Edge oxidation remains present throughout the same notebook
 * rather than disappearing when the family changes.
 */
export const POCKET_NOTEBOOK_MATERIALS = [
  {
    id: 'page-one-trauma',
    recipe: 'carried',
    story: 'Most exposed first page: dense handling, heavy foxing, humidity bloom, repeated water staining and shared edge oxidation.',
    layers: [
      { id: 'wear-tonal-drift', opacity: 0.76 },
      { id: 'wear-edge-oxidation', opacity: 0.98 },
      { id: 'wear-handling-grime', opacity: 0.98 },
      { id: 'wear-foxing-light', opacity: 0.66 },
      { id: 'wear-foxing-heavy', opacity: 0.88 },
      { id: 'wear-humidity-bloom', opacity: 0.86 },
      { id: 'wear-water-stain', opacity: 0.96 },
      { id: 'wear-smudge', opacity: 0.30 },
      { id: 'wear-crease', opacity: 0.42 },
    ],
  },
  {
    id: 'trauma-echo-humidity-rise',
    recipe: 'humidity',
    story: 'The first-page event echoes at roughly thirty percent while the humidity episode rises through still-handled stock.',
    layers: [
      { id: 'wear-tonal-drift', opacity: 0.60 },
      { id: 'wear-edge-oxidation', opacity: 0.82 },
      { id: 'wear-handling-grime', opacity: 0.78 },
      { id: 'wear-foxing-heavy', opacity: 0.55 },
      { id: 'wear-humidity-bloom', opacity: 0.72 },
      { id: 'wear-water-stain', opacity: 0.28 },
      { id: 'wear-smudge', opacity: 0.06 },
    ],
  },
  {
    id: 'humidity-peak-trauma-echo',
    recipe: 'humidity',
    story: 'Humidity is near its peak; the exceptional page-one stain survives only as a faint fifteen-percent echo.',
    layers: [
      { id: 'wear-tonal-drift', opacity: 0.58 },
      { id: 'wear-edge-oxidation', opacity: 0.74 },
      { id: 'wear-handling-grime', opacity: 0.68 },
      { id: 'wear-foxing-heavy', opacity: 0.68 },
      { id: 'wear-humidity-bloom', opacity: 0.82 },
      { id: 'wear-water-stain', opacity: 0.14 },
      { id: 'wear-smudge', opacity: 0.03 },
    ],
  },
  {
    id: 'humidity-recedes-family-transition',
    recipe: 'humidity',
    story: 'The damp episode recedes while the block begins its handled-to-protected family transition.',
    layers: [
      { id: 'wear-tonal-drift', opacity: 0.40 },
      { id: 'wear-edge-oxidation', opacity: 0.56 },
      { id: 'wear-handling-grime', opacity: 0.45 },
      { id: 'wear-foxing-light', opacity: 0.22 },
      { id: 'wear-humidity-bloom', opacity: 0.12 },
    ],
  },
  {
    id: 'protected-interior',
    recipe: 'protected',
    story: 'Deeper protected stock: quieter tone and handling, but still visibly aged at the shared notebook edge.',
    layers: [
      { id: 'wear-tonal-drift', opacity: 0.28 },
      { id: 'wear-edge-oxidation', opacity: 0.30 },
      { id: 'wear-handling-grime', opacity: 0.14 },
      { id: 'wear-foxing-light', opacity: 0.10 },
      { id: 'wear-smudge', opacity: 0.08 },
    ],
  },
  {
    id: 'deep-protected-interior',
    recipe: 'protected',
    story: 'Deepest sample: protected age, not clean paper; the same edge history remains at its quietest level.',
    layers: [
      { id: 'wear-tonal-drift', opacity: 0.26 },
      { id: 'wear-edge-oxidation', opacity: 0.26 },
      { id: 'wear-handling-grime', opacity: 0.12 },
      { id: 'wear-foxing-light', opacity: 0.06 },
      { id: 'wear-smudge', opacity: 0.05 },
    ],
  },
] as const satisfies readonly PocketNotebookMaterialProfile[]

export const pocketNotebookMaterialAt = (pageIndex: number): PocketNotebookMaterialProfile => {
  const index = Math.max(0, Math.min(POCKET_NOTEBOOK_MATERIALS.length - 1, Math.floor(pageIndex)))
  return POCKET_NOTEBOOK_MATERIALS[index]!
}
