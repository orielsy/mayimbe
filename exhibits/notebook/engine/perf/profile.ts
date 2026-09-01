/* ======================================================================
   DEVICE PERFORMANCE PROFILE
   ----------------------------------------------------------------------
   Ported from Page Turner Lab/extraction/notebook-native/src/perf/profile.ts.

   The physical implementation is unchanged by this module: it only chooses
   BUDGETS (buffer density, mesh tessellation, how many page rasters may stay
   resident, whether the render loop is allowed to idle). Desktop keeps the
   exact values the lab was tuned with; phones get the reduced set.

   This is a NEW axis, orthogonal to NotebookPhysicalProfile (standard/pocket),
   which owns pagination and stage framing. A pocket notebook on a phone composes
   as `pocket` (physical) + `mobile` (perf); the same pocket notebook on a
   desktop is `pocket` + `desktop`. Nothing here is a visual redesign — every
   knob is a resolution/scheduling decision that is invisible at rest, because
   the DOM (not WebGL) owns every resting frame.
   ==================================================================== */

export interface PerfProfile {
  /** name for diagnostics */
  tier: 'desktop' | 'mobile' | 'low'
  /** drawing-buffer density cap while the notebook is at rest / settling */
  glDpr: number
  /** drawing-buffer density cap WHILE A TURN IS IN FLIGHT (resolution
   *  scaling: nobody resolves detail on a moving, bending, shaded page) */
  motionDpr: number
  /** page-mesh tessellation (desktop lab value: 96 x 6) */
  segX: number
  segY: number
  /** how many SHEETS worth of page rasters may stay uploaded at once.
   *  Infinity == the lab behaviour (every page rasterised up front). */
  residentSheets: number
  /** rasterisation density for page/cover textures */
  texDpr: number
  /** stop the rAF loop this many ms after the last activity (0 = never) */
  idleStopMs: number
  /** suspend rendering when the notebook scrolls out of view */
  pauseOffscreen: boolean
  /** suspend rendering when the tab is hidden */
  pauseHidden: boolean
  /** antialias the drawing buffer (phones are fill-rate bound) */
  antialias: boolean
  /** during a COVER turn, run the DOM chrome/shadow update only every Nth
   *  frame (endpoints always run). 1 = the frozen lab behaviour. */
  chromeStride: number
  /** skip the projected-edge measurement for --openx and use the analytic
   *  cosine curve instead (one less per-frame math+style path on phones) */
  analyticOpenX: boolean
  /** allow the engine to downgrade its own budget when frames run long */
  adaptive: boolean
}

export type PerfProfileInput = 'auto' | 'desktop' | 'mobile' | 'low' | Partial<PerfProfile>

const DESKTOP: PerfProfile = {
  tier: 'desktop',
  glDpr: 1.25,          // the frozen lab MAX_GL_DPR
  motionDpr: 1.25,
  segX: 96, segY: 6,
  residentSheets: Infinity,
  texDpr: 2,
  idleStopMs: 600,
  pauseOffscreen: true,
  pauseHidden: true,
  antialias: true,
  chromeStride: 1,
  analyticOpenX: false,
  adaptive: false,
}

const MOBILE: PerfProfile = {
  tier: 'mobile',
  glDpr: 1.0,
  motionDpr: 0.75,      // resolution scaling during flight only
  segX: 24, segY: 3,    // the bend is low-frequency; 24 columns is invisible
  residentSheets: 3,    // current spread + one ahead + one behind
  texDpr: 1.25,
  idleStopMs: 250,
  pauseOffscreen: true,
  pauseHidden: true,
  antialias: false,
  chromeStride: 2,
  analyticOpenX: false,
  adaptive: true,
}

const LOW: PerfProfile = {
  ...MOBILE,
  tier: 'low',
  glDpr: 0.85,
  motionDpr: 0.6,
  segX: 16, segY: 2,
  residentSheets: 2,
  texDpr: 1,
  idleStopMs: 150,
  chromeStride: 3,
  analyticOpenX: true,
}

const PRESETS = { desktop: DESKTOP, mobile: MOBILE, low: LOW }

/** Cheap, synchronous capability read. No UA sniffing beyond the coarse
 *  pointer test, which is the one signal that actually correlates with the
 *  fill-rate budget we care about. */
export function detectTier(): 'desktop' | 'mobile' | 'low' {
  if (typeof window === 'undefined') return 'desktop'
  const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  const narrow = window.innerWidth < 900
  const mem = (navigator as any).deviceMemory
  const cores = navigator.hardwareConcurrency || 4
  const saveData = (navigator as any).connection?.saveData === true
  if (!coarse && !narrow) return 'desktop'
  if (saveData || (mem && mem <= 3) || cores <= 4) return 'low'
  return 'mobile'
}

export function resolveProfile(input: PerfProfileInput = 'auto'): PerfProfile {
  if (typeof input === 'string') {
    return { ...(input === 'auto' ? PRESETS[detectTier()] : PRESETS[input]) }
  }
  const base = PRESETS[detectTier()]
  return { ...base, ...input }
}
