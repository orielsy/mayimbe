import type { NativeNotebookPage } from './notebook-types'

const authoredOpeningPages: NativeNotebookPage[] = [
  {
    title: 'Early Years',
    body: "Before launching his solo recording career, Antony Santos played güira in Luis Vargas's group. This is where the archive currently begins: before the records, inside another bachata band.",
    kind: 'sketch',
  },
  {
    title: 'From Güira to Frontman',
    body: 'That apprenticeship places Santos inside the music before his own name was on the cover. This page is intentionally text-heavy enough to help us judge reading size, wrapping, and texture capture on both notebook profiles.',
    kind: 'text',
  },
  {
    title: 'La Chupadera',
    body: 'The available sources identify La Chupadera as his first production, but they do not agree on the year. That disagreement belongs in the record rather than being silently smoothed over.',
    kind: 'photo',
  },
  {
    title: '1991 / 1992',
    body: 'iASO Records places the first production in 1991. AllMusic describes La Chupadera as his 1992 debut. Until stronger primary evidence resolves it, Mayimbe keeps both dates visible.',
    kind: 'clipping',
  },
  {
    title: 'What We Know',
    body: "The safest statement today is simple: Santos's solo recording career begins in the early 1990s. The notebook can interpret that history while the archive underneath keeps track of why we believe it.",
    kind: 'text',
  },
  {
    title: 'A Working Cuaderno',
    body: 'These opening pages are also a renderer fixture. They give us headings, short and long text, visual placeholders, several page turns, and enough content to judge the pocket notebook on a real device.',
    kind: 'sketch',
  },
]

const kinds: NativeNotebookPage['kind'][] = [
  'sketch', 'text', 'photo', 'text', 'clipping', 'text',
  'sketch', 'text', 'photo', 'text', 'clipping', 'text',
]

/**
 * Temporary authored fixture for the physical notebook.
 *
 * The opening historical statements are drawn from the existing sourced
 * early-years story. The rest remains neutral renderer content until the
 * archive/story layer supplies the final Cuaderno pages.
 */
export const NOTEBOOK_PARITY_PAGES: NativeNotebookPage[] = Array.from({ length: 24 }, (_, index) => {
  const authored = authoredOpeningPages[index]
  if (authored) return authored

  return {
    title: `Cuaderno · ${index + 1}`,
    body: 'Working page content used to verify paper aging, page geometry, stack movement, and the shared notebook turn renderer across physical profiles.',
    kind: kinds[index % kinds.length],
  }
})

export const NOTEBOOK_PARITY_SECTIONS: Record<string, number> = {
  'early-years': 0,
  middle: 10,
  final: 23,
}
