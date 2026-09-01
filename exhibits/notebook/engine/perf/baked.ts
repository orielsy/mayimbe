/* ======================================================================
   BAKED TEXTURE MANIFEST LOADER  (mobile perf item #1, runtime half)
   ----------------------------------------------------------------------
   Ported from Page Turner Lab/extraction/notebook-native/src/perf/baked.ts.

   tools/bake-notebook-textures.mjs (ported later) writes a manifest whose
   entries are file NAMES relative to the manifest itself. This resolves them
   to URLs the engine can hand straight to an <img>, and degrades to
   `undefined` on any failure — a missing or broken manifest must never stop
   the notebook from mounting, it only means the device rasterises its own
   pages as before.

   DYNAMIC DIMENSIONS
   ------------------
   A baked face is pixels at one leaf size, so the bake is dimension-coupled.
   Mobile layouts are not one size, so the baker emits a small set of size
   BUCKETS (viewport sizes) and this loader:
     1. measures the real host / viewport,
     2. picks the nearest bucket by width,
     3. accepts it only inside SCALE_MIN..SCALE_MAX and a matching aspect —
        the texture is sampled by the mesh, so mild rescaling is invisible,
     4. otherwise returns `undefined`, and the engine rasterises live, which
        is slower but always correct.
   That keeps one small manifest covering every device instead of one bake
   per CSS pixel size.
   ==================================================================== */

export interface BakedTextures {
  w: number
  h: number
  coverW: number
  coverH: number
  dpr: number
  /** one per page face, indexed exactly like `pages` */
  pages: string[]
  /** [0] front outer, [1] pastedown, [2] back board outer, [3] dedication */
  covers: string[]
  /** bucket identity, present on bucketed manifests ("430x932") */
  id?: string
  /** viewport this bucket was baked at, used for runtime bucket selection */
  viewportW?: number
  viewportH?: number
  /** all baked size buckets; the top level repeats the widest one so older
   *  loaders keep working. Dynamic/mobile layouts pick the nearest bucket. */
  buckets?: BakedTextures[]
}

/** how far a baked bucket may be stretched/shrunk before it is rejected */
export const SCALE_MIN = 0.6
export const SCALE_MAX = 1.6
/** how far the live aspect ratio may drift from the baked one */
export const ASPECT_TOLERANCE = 0.12

export interface BucketQuery {
  /** live host width in CSS px; defaults to window.innerWidth */
  width?: number
  /** live host height in CSS px; defaults to window.innerHeight */
  height?: number
  /** element to measure instead of passing width/height */
  host?: Element | null
}

function measure(q?: BucketQuery): { w: number; h: number } {
  if (q?.host) {
    const r = (q.host as Element).getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return { w: r.width, h: r.height }
  }
  return {
    w: q?.width ?? (typeof window !== 'undefined' ? window.innerWidth : 1440),
    h: q?.height ?? (typeof window !== 'undefined' ? window.innerHeight : 900),
  }
}

/** All buckets in a manifest, newest shape or legacy single-bake shape. */
export function bucketsOf(m: BakedTextures): BakedTextures[] {
  return m.buckets && m.buckets.length ? m.buckets : [m]
}

/**
 * Nearest usable bucket for the current layout, or `undefined` when nothing
 * is close enough (caller then rasterises live).
 */
export function pickBucket(
  m: BakedTextures | undefined,
  q?: BucketQuery,
): BakedTextures | undefined {
  if (!m) return undefined
  const live = measure(q)
  const all = bucketsOf(m).filter(b => Array.isArray(b.pages) && b.pages.length)
  if (!all.length) return undefined

  const refW = (b: BakedTextures) => b.viewportW || b.w || 1
  const refH = (b: BakedTextures) => b.viewportH || b.h || 1

  let best: BakedTextures | undefined
  let bestErr = Infinity
  for (const b of all) {
    const err = Math.abs(Math.log(live.w / refW(b)))
    if (err < bestErr) { bestErr = err; best = b }
  }
  if (!best) return undefined

  const scale = live.w / refW(best)
  if (scale < SCALE_MIN || scale > SCALE_MAX) return undefined

  const liveAspect = live.w / Math.max(1, live.h)
  const bakedAspect = refW(best) / Math.max(1, refH(best))
  if (Math.abs(liveAspect - bakedAspect) / bakedAspect > ASPECT_TOLERANCE) return undefined

  return best
}

export async function loadBakedTextures(
  manifestUrl: string,
  init?: RequestInit & { bucket?: BucketQuery; noBucketSelect?: boolean },
): Promise<BakedTextures | undefined> {
  try {
    const res = await fetch(manifestUrl, init)
    if (!res.ok) return undefined
    const m = (await res.json()) as BakedTextures
    if (!m || !Array.isArray(m.pages)) return undefined

    const chosen = init?.noBucketSelect ? m : pickBucket(m, init?.bucket)
    if (!chosen) return undefined             // nothing close enough -> live raster

    const base = new URL(manifestUrl, location.href)
    const abs = (name: string) => new URL(name, base).href
    return {
      ...chosen,
      pages: chosen.pages.map(abs),
      covers: (chosen.covers || []).map(abs),
      buckets: undefined,
    }
  } catch {
    return undefined
  }
}

/** Warm the HTTP/decode cache for the faces the first interaction needs
 *  (front cover + first spread) without blocking anything. */
export function preloadFirstFaces(baked?: BakedTextures): void {
  if (!baked) return
  for (const src of [baked.covers?.[0], baked.covers?.[1], baked.pages[0], baked.pages[1]]) {
    if (!src) continue
    const img = new Image()
    img.decoding = 'async'
    img.src = src
  }
}
