import type { SiteLocale } from '~/composables/useSiteLocale'
import { NOTEBOOK_PAGES } from './notebookPages'

const NOTEBOOK_BOOKMARK_DEFINITIONS = [
  {
    target: 'early-years',
    labels: { es: 'Orígenes', en: 'Origins' },
    pageId: 'guira',
  },
  {
    target: 'rise',
    labels: { es: 'Ascenso', en: 'Rise' },
    pageId: 'voypalla',
  },
  {
    target: 'classics',
    labels: { es: 'Clásicos', en: 'Classics' },
    pageId: 'requinto',
  },
  {
    target: 'legacy',
    labels: { es: 'Legado', en: 'Legacy' },
    pageId: 'cassette',
  },
] as const

export const NOTEBOOK_BOOKMARKS = NOTEBOOK_BOOKMARK_DEFINITIONS.map(bookmark => ({
  target: bookmark.target,
  label: bookmark.labels.es,
  pageId: bookmark.pageId,
}))

export function notebookBookmarksForLocale(locale: SiteLocale) {
  return NOTEBOOK_BOOKMARK_DEFINITIONS.map(bookmark => ({
    target: bookmark.target,
    label: bookmark.labels[locale],
    pageId: bookmark.pageId,
  }))
}

const NOTEBOOK_TARGET_PAGE_IDS = Object.fromEntries(
  NOTEBOOK_BOOKMARK_DEFINITIONS.map(bookmark => [bookmark.target, bookmark.pageId]),
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
