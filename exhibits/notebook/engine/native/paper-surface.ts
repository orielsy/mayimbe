/* ======================================================================
   PAPER SURFACE — fibre / foxing / crease / grime / drift / edge
   ----------------------------------------------------------------------
   Production extraction of /public/shared/paper-surface.js from the
   /notebook-lab-native canonical source, with the literal bake mode the
   lab added: every quantised step (4 fibre strengths, 8 foxing variants,
   6 crease variants) is a single WebP file in public/notebook-textures/
   that the surface generators point at instead of a per-call canvas data
   URL, so first-paint pays one HTTP-cache lookup per variant instead of
   re-decoding base64.

   The drawing algorithms are unchanged from the lab. Both the bake tool
   (scripts/bake-surfaces.mjs) and the runtime read the same step tables
   below, so a freshly baked library is interchangeable with the committed
   one.

   When BAKED is null (default), every layer renders live in the same way
   it always did — no behaviour change for environments without the
   pre-baked texture manifest.
   ==================================================================== */
import { EDGE_OXIDATION, PaperStack, STOCK, type PaperCondition } from './paper-stack'

const { rnd, clamp01, lerp } = PaperStack
const EDGE_OX = EDGE_OXIDATION == null ? STOCK.oxidation : EDGE_OXIDATION
const textureCache = new Map<string, string>()

/* ---------- quantised step tables (also consumed by scripts/bake-surfaces.mjs) --- */
export const FIBRE_SIZE: [number, number] = [200, 200]
export const FOX_SIZE: [number, number] = [420, 560]
export const CREASE_SIZE: [number, number] = [320, 320]
export const FIBRE_STEPS: readonly number[] = [0.35, 0.60, 0.80, 1.00]
export const FOX_STEPS: readonly number[]   = [0.25, 0.50, 0.75, 1.00]
export const FOX_SEEDS: readonly number[]   = [1301, 2617]
export const CREASE_SEEDS: readonly number[] = [101, 257, 613]

/* stable small hash so a given sheet always picks the same baked variant */
const artifactHash = (v: unknown): number => {
  let h = 2166136261 >>> 0
  const s = String(v)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

/* snap a continuous value to its nearest quantised step */
const nearestStep = <T>(steps: readonly T[], value: T): number => {
  let bestIndex = 0
  let bestDistance = Infinity
  for (let i = 0; i < steps.length; i++) {
    const distance = Math.abs((steps[i] as unknown as number) - (value as unknown as number))
    if (distance < bestDistance) { bestDistance = distance; bestIndex = i }
  }
  return bestIndex
}

/* ---------- live-canvas path -------------------------------------------- */
export function texURL(
  key: string,
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void,
): string {
  const cached = textureCache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context unavailable for notebook paper texture')
  draw(context, width, height)
  const url = `url("${canvas.toDataURL('image/png')}")`
  textureCache.set(key, url)
  return url
}

export const layer = (url: string, size: string, position?: string): string =>
  `${url} ${position || '0 0'}/${size} no-repeat`

export const tile = (url: string, size: string): string => `${url} 0 0/${size} repeat`

/* ---------- bake mode (HTTP-cached WebP) ---------------------------------- */
interface BakedTextures {
  dir: string
  ext: string
  files: string[]
  steps: Record<string, unknown>
}
let BAKED: BakedTextures | null = null
const bakedURL = (name: string): string =>
  `url("${BAKED!.dir}${name}.${BAKED!.ext}")`

/**
 * Load the paper-texture manifest and warm the browser image cache.
 * Resolves true when the manifest is present and the files are reachable,
 * false otherwise — in which case every layer keeps drawing live, exactly
 * as before. Safe to call before `mountNotebookEngine` so the cached
 * variants are hot by the time the engine's first paint runs.
 */
export async function preloadPaperTextures(dir = '/notebook-textures/'): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return false
  try {
    const res = await fetch(`${dir}manifest.json`, { cache: 'force-cache' })
    if (!res.ok) return false
    const manifest = await res.json() as Partial<BakedTextures>
    if (!manifest || !Array.isArray(manifest.files) || !manifest.files.length) return false
    const ext = (manifest.ext as string) || 'png'

    /* Decode each file up front so the first page paint is a cache hit,
     * not a network round trip inside the compositor's critical path. */
    await Promise.all(manifest.files.map(name => new Promise<void>(resolve => {
      const img = new Image()
      img.onload = img.onerror = () => resolve()
      img.src = `${dir}${name}.${ext}`
    })))

    BAKED = {
      dir,
      ext,
      files: manifest.files,
      steps: (manifest.steps || {}) as Record<string, unknown>,
    }
    /* The live texture cache can already hold stale canvas-data-url
     * variants; nuke them so the next page mount uses the baked paths. */
    textureCache.clear()
    return true
  } catch {
    return false
  }
}

export const usingBakedTextures = (): boolean => !!BAKED

/* ---------- drawing algorithms (shared with scripts/bake-surfaces.mjs) -- */
export function drawFibre(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  strength: number,
): void {
  const random = rnd(seed)
  g.fillStyle = 'rgba(0,0,0,0)'
  g.fillRect(0, 0, w, h)

  for (let i = 0; i < 1400; i += 1) {
    const x = random() * w
    const y = random() * h
    const length = 2 + random() * 11
    const angle = (random() - 0.5) * 0.9 + (random() < 0.5 ? 0 : Math.PI / 2)
    const alpha = (0.020 + random() * 0.045) * strength
    g.strokeStyle = random() < 0.55
      ? `rgba(120,102,72,${alpha.toFixed(3)})`
      : `rgba(255,252,240,${(alpha * 1.2).toFixed(3)})`
    g.lineWidth = random() < 0.8 ? 0.7 : 1.2
    g.beginPath()
    for (const dx of [-w, 0, w]) {
      for (const dy of [-h, 0, h]) {
        g.moveTo(x + dx, y + dy)
        g.lineTo(x + dx + Math.cos(angle) * length, y + dy + Math.sin(angle) * length)
      }
    }
    g.stroke()
  }

  for (let i = 0; i < 220; i += 1) {
    const x = random() * w
    const y = random() * h
    const radius = 0.4 + random() * 1.1
    g.fillStyle = `rgba(133,112,74,${(0.05 + random() * 0.08) * strength})`
    for (const dx of [-w, 0, w]) {
      for (const dy of [-h, 0, h]) {
        g.beginPath()
        g.arc(x + dx, y + dy, radius, 0, 7)
        g.fill()
      }
    }
  }
}

export function fibreTile(seed: number, strength: number): string {
  if (BAKED) return bakedURL(`fibre-${nearestStep(FIBRE_STEPS, strength)}`)
  return texURL(`fib${seed}_${strength.toFixed(2)}`, FIBRE_SIZE[0], FIBRE_SIZE[1],
    (g, w, h) => drawFibre(g, w, h, seed, strength))
}

/* broad, low-frequency tonal drift — the book's shared environmental history */
export function drift(seed: number, amount: number, mirror = false): string[] {
  const layers: string[] = []
  const random = rnd(seed)
  for (let i = 0; i < 4; i += 1) {
    const alpha = 0.05 * amount + random() * 0.05 * amount
    const l = blot(random() * 100, random() * 100, 45 + random() * 45, 40 + random() * 45,
      '176,150,102', alpha, mirror)
    if (alpha >= VISIBLE) layers.push(l)
  }
  return layers
}

/* foxing — discrete rust specks with darker cores, denser toward the exposed
   edge, plus a few soft damp-borne clusters. */
export function drawFoxing(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  density: number,
  mirror: boolean,
): void {
  const random = rnd(seed)
  const X = (x: number): number => mirror ? w - x : x
  const specks = Math.round(10 + density * 90)

  for (let i = 0; i < specks; i += 1) {
    const bias = random()
    const x = X(w * (bias < 0.45 ? 0.55 + 0.45 * random() : random()))
    const y = random() * h
    const radius = 0.6 + random() * 1.9
    const core = (0.20 + random() * 0.30) * Math.min(1, 0.35 + density * 0.75)
    const gradient = g.createRadialGradient(x, y, 0, x, y, radius * 3.1)
    gradient.addColorStop(0, `rgba(150,100,50,${(core * 0.55).toFixed(3)})`)
    gradient.addColorStop(1, 'rgba(150,100,50,0)')
    g.fillStyle = gradient
    g.beginPath()
    g.arc(x, y, radius * 3.1, 0, 7)
    g.fill()
    g.fillStyle = `rgba(122,74,32,${core.toFixed(3)})`
    g.beginPath()
    g.arc(x, y, radius, 0, 7)
    g.fill()
  }

  const clusters = Math.round(1 + density * 4)
  for (let c = 0; c < clusters; c += 1) {
    const cx = X(random() * w)
    const cy = random() * h
    const spread = 26 + random() * 80
    const count = Math.round(4 + random() * 9 * density)
    for (let i = 0; i < count; i += 1) {
      const x = cx + (random() - 0.5) * spread
      const y = cy + (random() - 0.5) * spread
      const radius = 0.9 + random() * 3.4
      const gradient = g.createRadialGradient(x, y, 0, x, y, radius * 2.4)
      gradient.addColorStop(0, `rgba(146,96,48,${(0.14 + random() * 0.18).toFixed(3)})`)
      gradient.addColorStop(0.5, `rgba(158,112,62,${(0.06 + random() * 0.08).toFixed(3)})`)
      gradient.addColorStop(1, 'rgba(158,112,62,0)')
      g.fillStyle = gradient
      g.beginPath()
      g.arc(x, y, radius * 2.4, 0, 7)
      g.fill()
    }
  }
}

export function foxingTex(seed: number, density: number, mirror: boolean): string {
  if (BAKED) {
    const d = nearestStep(FOX_STEPS, clamp01(density))
    const v = artifactHash(seed) % FOX_SEEDS.length
    return bakedURL(`foxing-${d}-${v}${mirror ? '-m' : ''}`)
  }
  return texURL(`fox${seed}_${density.toFixed(2)}${mirror ? '_m' : ''}`,
    FOX_SIZE[0], FOX_SIZE[1],
    (g, w, h) => drawFoxing(g, w, h, seed, density, mirror))
}

export function drawCrease(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  mirror: boolean,
): void {
  const random = rnd(seed)
  if (mirror) {
    g.translate(w, 0)
    g.scale(-1, 1)
  }
  const ay = h * (0.25 + random() * 0.5)
  const bx = w * (0.42 + random() * 0.45)
  const by = ay + (random() - 0.5) * h * 0.3
  const N = 70
  const point = (i: number): [number, number] => {
    const t = i / N
    const x = bx * t
    const y = ay + (by - ay) * t
    const dx = bx
    const dy = by - ay
    const length = Math.hypot(dx, dy) || 1
    return [
      x - (dy / length) * Math.sin(t * 2.3) * 6,
      y + (dx / length) * Math.sin(t * 2.3) * 6,
    ]
  }
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < N; i += 1) {
      const [x1, y1] = point(i)
      const [x2, y2] = point(i + 1)
      const alpha = Math.max(0, 1 - i / N) ** 0.8 * (pass ? 0.26 : 0.44)
      g.strokeStyle = pass
        ? `rgba(96,76,42,${alpha.toFixed(3)})`
        : `rgba(255,254,247,${alpha.toFixed(3)})`
      g.lineWidth = pass ? 2 : 1.3
      g.beginPath()
      g.moveTo(x1, y1 + (pass ? 1.2 : -1))
      g.lineTo(x2, y2 + (pass ? 1.2 : -1))
      g.stroke()
    }
  }
}

export function creaseTex(seed: number, mirror: boolean): string {
  if (BAKED) {
    const variant = artifactHash(seed) % CREASE_SEEDS.length
    return bakedURL(`crease-${variant}${mirror ? '-m' : ''}`)
  }
  return texURL(`cr${seed}${mirror ? '_m' : ''}`, CREASE_SIZE[0], CREASE_SIZE[1],
    (g, w, h) => drawCrease(g, w, h, seed, mirror))
}

/* handling grime — where thumbs actually land: outer edge, mid height */
export function grimeLayers(seed: number, amount: number, mirror = false): string[] {
  if (amount <= 0) return []
  const random = rnd(seed + 3)
  return [
    blot(96, 48 + (random() - 0.5) * 22, 16, 26, '106,88,58', 0.16 * amount, mirror),
    blot(92, 86, 20, 16, '98,80,52', 0.10 * amount, mirror),
    blot(88, 12, 16, 12, '98,80,52', 0.07 * amount, mirror),
    `linear-gradient(${mirrorDegrees(270)}deg, rgba(120,98,62,${(0.10 * amount).toFixed(3)}), rgba(120,98,62,0) 26%)`,
  ]
}

/* edge oxidation — exposure darkening, strongest on the fore edge */
export function edgeLayers(amount: number, oxidation: number, mirror = false): string[] {
  const alpha = amount * oxidation
  return [
    `linear-gradient(${mirrorDegrees(270)}deg, rgba(120,88,44,${(0.42 * alpha).toFixed(3)}) 0%, rgba(150,116,66,${(0.26 * alpha).toFixed(3)}) 3%, rgba(168,136,84,${(0.10 * alpha).toFixed(3)}) 7%, rgba(168,136,84,0) 15%)`,
    `linear-gradient(0deg, rgba(126,94,48,${(0.30 * alpha).toFixed(3)}) 0%, rgba(158,124,72,${(0.12 * alpha).toFixed(3)}) 4%, rgba(168,136,84,0) 11%)`,
    `linear-gradient(180deg, rgba(140,108,58,${(0.24 * alpha).toFixed(3)}) 0%, rgba(168,136,84,0) 9%)`,
    blot(97, 3, 16, 13, '118,86,42', 0.30 * alpha, mirror),
    blot(96, 97, 18, 14, '112,80,40', 0.34 * alpha, mirror),
  ]
}

export function humidLayers(seed: number, amount: number, mirror = false): string[] {
  if (amount <= 0) return []
  const random = rnd(seed + 11)
  const layers: string[] = [
    `linear-gradient(0deg, rgba(150,116,66,${(0.16 * amount).toFixed(3)}) 0%, rgba(160,128,78,${(0.09 * amount).toFixed(3)}) 9%, rgba(160,128,78,0) 30%)`,
  ]
  for (let i = 0; i < 3; i += 1) {
    layers.push(blot(
      12 + random() * 76,
      78 + random() * 22,
      34 + random() * 30,
      22 + random() * 18,
      '150,114,62',
      0.10 * amount,
      mirror,
    ))
  }
  return layers
}

export function stainLayers(seed: number, strength: number, mirror = false): string[] {
  const random = rnd(seed + 29)
  const x = 18 + random() * 62
  const y = 18 + random() * 58
  const width = 8 + random() * 11
  const height = 7 + random() * 10
  return [
    blot(x, y, width * 1.35, height * 1.35, '138,104,54', 0.10 * strength, mirror),
    blot(x, y, width, height, '126,92,46', 0.16 * strength, mirror),
    blot(x + width * 0.25, y + height * 0.2, width * 0.45, height * 0.45, '112,80,38', 0.12 * strength, mirror),
  ]
}

export function smudgeLayers(seed: number, strength: number, mirror = false): string[] {
  const random = rnd(seed + 41)
  const x = 22 + random() * 54
  const y = 24 + random() * 52
  return [
    blot(x, y, 14 + random() * 9, 5 + random() * 4, '72,66,58', 0.14 * strength, mirror),
    blot(x + 4, y + 2, 8, 3, '62,56,50', 0.10 * strength, mirror),
  ]
}

/* a layer whose peak alpha rounds away contributes nothing but a composite
   pass; dropping it is free and thins the stack a lot on interior sheets */
const VISIBLE = 0.0005

/* mirror state for the duration of one surfaceRaw() call */
let mirrorState = false
const mirrorX = (x: number): number => mirrorState ? 100 - x : x
const mirrorDegrees = (degrees: number): number => mirrorState ? (360 - degrees) % 360 : degrees

const blot = (
  x: number,
  y: number,
  width: number,
  height: number,
  rgb: string,
  alpha: number,
  _mirror = false,
): string =>
  `radial-gradient(${width}% ${height}% at ${mirrorX(x)}% ${y}%, rgba(${rgb},${alpha.toFixed(3)}), rgba(${rgb},0) 70%)`

const surfaceCache = new Map<string, string>()

export function surface(condition: PaperCondition, options?: { mirror?: boolean }): string {
  const mirror = !!options?.mirror
  const events = condition.events || {}
  const key = [
    condition.seed,
    condition.tone,
    condition.grime,
    condition.edge,
    condition.foxing,
    condition.humid,
    condition.fibre,
    events.crease || 0,
    events.smudge || 0,
    events.stain || 0,
  ].map(value => (+value || 0).toFixed(5)).join('|') + (mirror ? '|m' : '')

  let cached = surfaceCache.get(key)
  if (cached === undefined) {
    cached = surfaceRaw(condition, mirror)
    surfaceCache.set(key, cached)
  }
  return cached
}

export function surfaceRaw(condition: PaperCondition, mirror = false): string {
  const events = condition.events || {}
  const layers: string[] = []
  mirrorState = mirror

  if (events.crease) {
    layers.push(layer(creaseTex(condition.seed + 5, mirror), '46% 40%', `${mirror ? '0%' : '100%'} 100%`))
  }
  if (events.smudge) layers.push(...smudgeLayers(condition.seed, events.smudge, mirror))
  if (events.stain) layers.push(...stainLayers(condition.seed, events.stain, mirror))
  layers.push(...grimeLayers(condition.seed, condition.grime, mirror))
  if (condition.foxing > 0.05) {
    layers.push(tile(foxingTex(condition.seed + 13, clamp01(condition.foxing), mirror), '100% 100%'))
  }
  layers.push(...humidLayers(condition.seed, condition.humid, mirror))
  layers.push(...edgeLayers(condition.edge, EDGE_OX, mirror))
  layers.push(...drift(condition.seed + 2, condition.tone, mirror))
  layers.push(tile(fibreTile(STOCK.seed, STOCK.fibre * condition.fibre), '150px 150px'))

  const tone = clamp01(STOCK.oxidation * 0.5 + condition.tone * 0.35)
  const base = STOCK.base.map((value, index) => Math.round(lerp(value, STOCK.warm[index]!, tone)))
  layers.push(`linear-gradient(168deg, rgb(${base.join(',')}), rgb(${base.map(value => value - 6).join(',')}))`)
  mirrorState = false
  return layers.join(', ')
}

export const PaperSurface = {
  texURL,
  layer,
  tile,
  blot: (x: number, y: number, width: number, height: number, rgb: string, alpha: number) =>
    blot(x, y, width, height, rgb, alpha, false),
  fibreTile,
  drift,
  foxingTex,
  grimeLayers,
  edgeLayers,
  humidLayers,
  stainLayers,
  smudgeLayers,
  creaseTex,
  surface,
  surfaceRaw,
} as const
