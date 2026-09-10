import { NOTEBOOK_PAGES } from './notebookPages'

const NOTEBOOK_TARGET_PAGE_IDS = {
  'early-years': 'guira',
} as const

/**
 * Resolve semantic museum targets to Page Turner page indexes.
 *
 * The museum route stays renderer-agnostic (`early-years`); this notebook-only
 * adapter decides which authored page should present that experience.
 */
export function resolveNotebookTargetPage(target: unknown): number | null {
  if (typeof target !== 'string' || target.length === 0) return null

  const pageId = NOTEBOOK_TARGET_PAGE_IDS[
    target as keyof typeof NOTEBOOK_TARGET_PAGE_IDS
  ]
  if (!pageId) return null

  const pageIndex = NOTEBOOK_PAGES.findIndex(page => page.id === pageId)
  return pageIndex >= 0 ? pageIndex : null
}
