export type NotebookPhysicalProfile = 'standard' | 'pocket'
export type NotebookSheetMode = 'duplex' | 'simplex'

export interface NotebookPhysicalProfileDefinition {
  id: NotebookPhysicalProfile
  sheetMode: NotebookSheetMode
}

export const NOTEBOOK_PROFILE_DEFINITIONS: Record<NotebookPhysicalProfile, NotebookPhysicalProfileDefinition> = {
  standard: {
    id: 'standard',
    sheetMode: 'duplex',
  },
  pocket: {
    id: 'pocket',
    sheetMode: 'simplex',
  },
}

/**
 * The native notebook engine currently owns one canonical physical geometry.
 * Profiles change pagination semantics and exhibit presentation, not the engine's
 * internal stage shape. Keeping this constant here prevents responsive framing
 * from leaking back into the physical renderer.
 */
export const CANONICAL_NOTEBOOK_STAGE_ASPECT = 3 / 2

const STANDARD_STAGE_WIDTH_RATIO = 0.96
const STANDARD_STAGE_HEIGHT_RATIO = 0.96
const STANDARD_STAGE_MAX_WIDTH = 1500
const STANDARD_SPREAD_CHROME = 24

/**
 * A standard spread is only useful when each authored face remains comfortably
 * readable. Resolve from the exhibit's actual available space rather than from
 * a device name or user-agent breakpoint.
 */
export const STANDARD_MIN_READABLE_PAGE_WIDTH = 270

export function estimateStandardPageWidth(width: number, height: number) {
  if (!(width > 0) || !(height > 0)) return 0

  const stageWidth = Math.min(
    width * STANDARD_STAGE_WIDTH_RATIO,
    height * STANDARD_STAGE_HEIGHT_RATIO * CANONICAL_NOTEBOOK_STAGE_ASPECT,
    STANDARD_STAGE_MAX_WIDTH,
  )

  return Math.max(0, (stageWidth - STANDARD_SPREAD_CHROME) / 2)
}

export function resolveNotebookProfile(width: number, height: number): NotebookPhysicalProfile {
  if (!(width > 0) || !(height > 0)) return 'standard'
  return estimateStandardPageWidth(width, height) >= STANDARD_MIN_READABLE_PAGE_WIDTH
    ? 'standard'
    : 'pocket'
}
