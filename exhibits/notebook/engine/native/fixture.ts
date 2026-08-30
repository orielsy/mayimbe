import type { NativeNotebookPage } from './notebook-types'

const kinds: NativeNotebookPage['kind'][] = [
  'sketch', 'text', 'photo', 'text', 'clipping', 'text',
  'sketch', 'text', 'photo', 'text', 'clipping', 'text',
]

/**
 * Temporary content fixture for renderer parity only.
 * Historical Mayimbe content will be supplied by the archive/story layer.
 */
export const NOTEBOOK_PARITY_PAGES: NativeNotebookPage[] = Array.from({ length: 24 }, (_, index) => ({
  title: index === 0 ? 'Early Years' : `Cuaderno · ${index + 1}`,
  body: index === 0
    ? 'Mayimbe renderer integration preview. Archive-driven story content will replace this fixture.'
    : 'Temporary page content used to verify the physical notebook, page stack, and two-sided turn renderer.',
  kind: kinds[index % kinds.length],
}))

export const NOTEBOOK_PARITY_SECTIONS: Record<string, number> = {
  'early-years': 0,
  middle: 10,
  final: 23,
}
