import { NOTEBOOK_PAGES } from './notebookPages'

export const NOTEBOOK_BOOKMARKS = [
  { target: 'early-years', label: 'Early Years', pageId: 'guira' },
  { target: 'rise', label: 'Rise', pageId: 'voypalla' },
  { target: 'classics', label: 'Classics', pageId: 'requinto' },
  { target: 'legacy', label: 'Legacy', pageId: 'cassette' },
] as const

const NOTEBOOK_TARGET_PAGE_IDS = Object.fromEntries(
  NOTEBOOK_BOOKMARKS.map(bookmark => [bookmark.target, bookmark.pageId]),
) as Record<string, string>

/**
 * Resolve semantic museum targets to Page Turner page indexes.
 *
 * The museum route stays renderer-agnostic (`early-years`); this notebook-only
 * adapter decides which authored page should present that experience.
 */
export function resolveNotebookTargetPage(target: unknown): number | null {
  if (typeof target !== 'string' || target.length === 0) return null

  const pageId = NOTEBOOK_TARGET_PAGE_IDS[target]
  if (!pageId) return null

  const pageIndex = NOTEBOOK_PAGES.findIndex(page => page.id === pageId)
  return pageIndex >= 0 ? pageIndex : null
}
