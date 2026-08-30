/*
 * Production extraction of /public/shared/paper-stack.js from the canonical
 * /notebook-lab-native source.
 *
 * This is the physical paper/stack model, not UI. The deterministic geometry,
 * production limits, condition model, caches, M2 values, recession solve and
 * cut-edge treatment are preserved. The lab-only ?debug timing logger and
 * window.PaperStack export are intentionally removed.
 */

export const M2_EDGE = {
  geo: 0.65,
  fray: 0.16,
  rec: 1.16,
  corner: 1.09,
  cockle: 1.08,
  notch: 0.35,
  inset: 0.60,
} as const

export const PRODUCTION_LIMITS = {
  frayChipping: M2_EDGE.fray,
  geometricIntensity: M2_EDGE.geo,
} as const

export const EDGE_OXIDATION = 0.62
const GEO_VAR_LO = 0.72
const GEO_VAR_HI = 1.0

export function rnd(seed: number): () => number {
  let state = (Math.abs(Math.floor(seed * 1000)) * 2654435761 % 2147483647) || 7
  return () => (state = (state * 48271) % 2147483647) / 2147483647
}

export const hash1 = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export const h2 = (n: number, k: number): number => hash1(n * 13.37 + k * 7.77 + 5.5)
export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const STOCK = {
  seed: 577,
  base: [232, 222, 201],
  warm: [214, 193, 157],
  fibre: 0.85,
  oxidation: 0.62,
} as const

export const NOTEBOOK_EDGE = {
  recession: 0.60,
  fray: 0.50,
  cockle: 0.40,
  cornerWear: 0.55,
  cornerSpine: 0.18,
  compression: 0.40,
  bottomSag: 0.35,
} as const

export const FAMILIES = {
  handled: {
    id: 'handled',
    name: 'Carried / Handled',
    cause: 'repeatedly opened, carried, thumbed at the outer edge',
    surface: { tone: 0.55, grime: 1.00, edge: 1.00, fibre: 1.00 },
    edgeMod: { recession: 1.06, fray: 1.06, cockle: 1.00, cornerWear: 1.08, cornerSpine: 1.05 },
  },
  protected: {
    id: 'protected',
    name: 'Protected Interior',
    cause: 'deep in the block, shielded from air, light and hands — protected age, not clean paper',
    surface: { tone: 0.34, grime: 0.20, edge: 0.42, fibre: 0.94 },
    edgeMod: { recession: 0.95, fray: 0.95, cockle: 0.95, cornerWear: 0.94, cornerSpine: 0.96 },
  },
} as const

export type PaperFamily = typeof FAMILIES[keyof typeof FAMILIES]

export interface PaperGeometry {
  seed: number
  recession: number
  cockle: number
  cornerOuter: number
  cornerSpine: number
  fray: number
  bottomSag: number
  foreInset: number
  bottomInset: number
  notch: number
  neighborPhase: number
}

export interface PaperCondition {
  seed: number
  age: number
  mix: number
  exposure: number
  familyLabel: string
  family: PaperFamily
  tone: number
  grime: number
  edge: number
  foxing: number
  humid: number
  fibre: number
  events: Record<string, number>
  nb: Record<string, number>
  geo: PaperGeometry
  sheetIndex?: number
  [key: string]: unknown
}

export interface PaperConditionInput {
  family?: 'handled' | 'protected'
  familyMix?: number
  familyBlend?: { t: number }
  exposure?: number
  familyEdgeInfluence?: number
  notebookAge?: number
  neighborhood?: Record<string, number>
  events?: Record<string, number>
  seed?: number
  limits?: { frayChipping?: number; geometricIntensity?: number } | null
  geoIntensity?: number
  notebookEdge?: Partial<typeof NOTEBOOK_EDGE> & Record<string, number>
  frayScale?: number
  foreInset?: number
  bottomInset?: number
}

export interface StackStepSpec {
  min: number
  max: number
}

export interface StackSeamSpec {
  gain?: number
  widthLo?: number
  widthHi?: number
  cutGain?: number
  cutLo?: number
  cutHi?: number
  bottom?: number
  alt?: number
}

export interface StackSpec {
  strata?: number
  seed: number
  family?: 'handled' | 'protected'
  familyMix?: number
  exposure?: number
  fei?: number
  notebookEdge?: Partial<typeof NOTEBOOK_EDGE> & Record<string, number>
  age?: number
  geo: number
  humid: number
  foxing: number
  bloom: number
  compress: number
  notchRate: number
  correlated: boolean
  phase: number
  phaseVar?: number
  foreDepth?: number
  bottomDepth?: number
  lift?: number
  registration?: number
  clusterAmp?: number
  indivAmp?: number
  limits?: { frayChipping?: number; geometricIntensity?: number }
  boxScale?: number
  frayScale?: number
  seam?: StackSeamSpec
  foreStep?: StackStepSpec
  bottomStep?: StackStepSpec
  placementMode?: 'recession' | 'cascade'
  [key: string]: unknown
}

export interface StackSheetModel {
  i: number
  z: number
  cond: PaperCondition
  seam: string
  cheapBody: string
  box: number
  foreInset: number
  bottomInset: number
  dx: number
  dy: number
  t: number
  transform: string
  width: string
  height: string
  mx: number
  my: number
  clip: string
}

export interface StackModel {
  n: number
  sheets: StackSheetModel[]
}

const famLabel = (mix: number): string => mix <= 0.02
  ? FAMILIES.handled.name
  : mix >= 0.98
    ? FAMILIES.protected.name
    : `Handled → Protected (${Math.round(mix * 100)}% protected)`

export function condition(input: PaperConditionInput): PaperCondition {
  const A = FAMILIES.handled
  const B = FAMILIES.protected
  const mix = input.familyMix != null
    ? clamp01(input.familyMix)
    : input.familyBlend
      ? clamp01(input.familyBlend.t)
      : input.family === 'protected' ? 1 : 0
  const exposure = input.exposure == null ? 0.55 : Math.max(0, input.exposure)
  const fei = input.familyEdgeInfluence == null ? 1 : clamp01(input.familyEdgeInfluence)
  const age = input.notebookAge == null ? 1 : input.notebookAge
  const nb = input.neighborhood || {}
  const events = input.events || {}
  const seed = input.seed == null ? 101 : input.seed
  const limits = input.limits || null
  let geoIntensity = input.geoIntensity == null ? 1 : input.geoIntensity
  if (limits?.geometricIntensity != null) {
    geoIntensity = Math.min(geoIntensity, limits.geometricIntensity)
  }
  const edge = { ...NOTEBOOK_EDGE, ...(input.notebookEdge || {}) }

  const surface = (key: keyof typeof A.surface): number => lerp(A.surface[key], B.surface[key], mix)
  const edgeMod = (key: keyof typeof A.edgeMod): number => lerp(1, lerp(A.edgeMod[key], B.edgeMod[key], mix), fei)

  const xS = 0.55 + 0.85 * exposure
  const xE = 0.60 + 0.80 * exposure
  const xT = 0.80 + 0.40 * exposure
  const xG = 0.94 + 0.14 * exposure

  const humid = clamp01((nb.humid || 0) + (nb.bloom || 0) * 0.45) * age
  const foxing = clamp01(nb.foxing == null ? (nb.humid || 0) * 0.85 : nb.foxing) * age
  const compression = nb.compress || 0
  const neighborhoodCockle = nb.cockle || 0

  const rawFray = Math.max(
    0,
    edge.fray * edgeMod('fray') * xG * geoIntensity * (input.frayScale == null ? 1 : input.frayScale),
  )

  return {
    seed,
    age,
    mix,
    exposure,
    familyLabel: famLabel(mix),
    family: mix < 0.5 ? A : B,
    tone: (surface('tone') * xT + humid * 0.18) * age,
    grime: surface('grime') * xS * age,
    edge: surface('edge') * xE * age,
    foxing,
    humid,
    fibre: surface('fibre'),
    events,
    nb,
    geo: {
      seed,
      recession: clamp01((edge.recession * edgeMod('recession') * xG + compression * edge.compression * 0.35) * geoIntensity),
      cockle: (edge.cockle * edgeMod('cockle') + humid * 0.55 + neighborhoodCockle * 0.45) * geoIntensity,
      cornerOuter: clamp01((edge.cornerWear * edgeMod('cornerWear') * xG + compression * 0.18) * geoIntensity),
      cornerSpine: edge.cornerSpine * edgeMod('cornerSpine') * geoIntensity,
      fray: limits?.frayChipping != null ? Math.min(rawFray, limits.frayChipping) : rawFray,
      bottomSag: edge.bottomSag,
      foreInset: input.foreInset || 0,
      bottomInset: input.bottomInset || 0,
      notch: (events.notch || 0) * geoIntensity,
      neighborPhase: nb.phase == null ? h2(seed, 17) * 6.28 : nb.phase,
    },
  }
}

const EDGE_CACHE = new Map<string, string>()

export function edgeProfile(cond: PaperCondition): string {
  const g = cond.geo
  const key = `${g.seed}|${[
    g.recession,
    g.cockle,
    g.cornerOuter,
    g.cornerSpine,
    g.notch,
    g.neighborPhase,
    g.fray || 0,
    g.foreInset || 0,
    g.bottomInset || 0,
  ].map(value => (+value || 0).toFixed(5)).join(',')}`
  let value = EDGE_CACHE.get(key)
  if (value === undefined) {
    value = edgeProfileRaw(cond)
    EDGE_CACHE.set(key, value)
  }
  return value
}

function edgeProfileRaw(cond: PaperCondition): string {
  const { seed, recession, cockle, cornerOuter, cornerSpine, notch, neighborPhase } = cond.geo
  const fray = Math.max(0, cond.geo.fray || 0)
  const foreInset = Math.max(0, cond.geo.foreInset || 0)
  const bottomInset = Math.max(0, cond.geo.bottomInset || 0)
  const points: Array<[number, number]> = []
  const maxRecession = 2.6 * recession
  const wavePhase = neighborPhase
  const N = 40
  const NR = fray > 0 ? 150 : N
  const phase = (k: number): number => h2(seed, k) * 6.28
  const wobble = (t: number, k: number): number => (
    0.55 * Math.sin(t * 2.1 + phase(k))
    + 0.30 * Math.sin(t * 4.3 + phase(k + 1))
    + 0.15 * Math.sin(t * 7.7 + phase(k + 2))
  )
  const rough = (t: number, k: number): number => {
    const sample = Math.floor(t * 110)
    const a = h2(seed, k + sample * 2) - 0.5
    const b = h2(seed, k + sample * 2 + 1) - 0.5
    return (a * 0.7 + b * 0.3) * 2
  }

  const chips: Array<[number, number, number]> = []
  if (fray > 0) {
    const count = Math.round(2 + 7 * Math.min(1.5, fray))
    for (let k = 0; k < count; k += 1) {
      chips.push([
        0.04 + 0.92 * h2(seed, 200 + k * 3),
        0.010 + 0.048 * h2(seed, 201 + k * 3),
        (0.45 + 1.9 * h2(seed, 202 + k * 3)) * fray * 2.2,
      ])
    }
  }

  const chipAt = (t: number): number => {
    let depth = 0
    for (const [at, width, chipDepth] of chips) {
      const delta = t - at
      if (delta > -width * 0.3 && delta < width) {
        const u = delta < 0 ? (delta + width * 0.3) / (width * 0.3) : 1 - delta / width
        depth = Math.max(depth, chipDepth * Math.max(0, u))
      }
    }
    return depth
  }

  const smoothstep = (u: number): number => {
    const x = clamp01(u)
    return x * x * (3 - 2 * x)
  }
  const cornerEnvelope = (t: number): number => smoothstep(t / 0.09) * smoothstep((1 - t) / 0.09)
  const notchAt = 0.35 + 0.42 * h2(seed, 3)

  const foreX = (t: number): number => {
    const envelope = cornerEnvelope(t)
    let x = 100 - foreInset - maxRecession * (0.55 + 0.45 * wobble(t, 40)) * (0.35 + 0.65 * envelope)
    x -= (Math.sin(t * 3.6 + wavePhase) * 0.5 + 0.5) * 1.1 * cockle * (0.4 + 0.6 * envelope)
    const top = Math.max(0, 1 - t / 0.13) ** 1.6
    const bottom = Math.max(0, 1 - (1 - t) / 0.15) ** 1.6
    x -= cornerOuter * 2.6 * top
    x -= cornerOuter * 3.1 * bottom
    if (fray > 0) {
      x -= Math.max(0, fray * 0.85 * rough(t, 400)) * envelope
      x -= chipAt(t) * envelope
      x -= cornerOuter * fray * 1.8 * (top + bottom) * Math.abs(rough(t, 500))
    }
    if (notch > 0) {
      const distance = Math.abs(t - notchAt)
      if (distance < 0.045) {
        x -= notch * 2.6 * Math.cos(distance / 0.045 * Math.PI / 2) ** 1.4
      }
    }
    return x
  }

  const xTop = foreX(0)
  const xBottom = foreX(1)

  for (let i = 0; i <= N; i += 1) {
    const t = i / N
    let y = (0.55 * recession * (0.55 + 0.45 * wobble(t, 20)) * t)
      + (Math.sin(t * 3.1 + wavePhase) * 0.45 + 0.45) * 0.5 * cockle
    if (fray > 0) y += Math.max(0, fray * 0.55 * rough(t, 300)) * t * t
    const nominal = t * 100
    const convergence = smoothstep((t - 0.55) / 0.4)
    const x = Math.min(nominal, lerp(nominal, xTop, convergence))
    points.push([x, Math.max(0, y)])
  }

  for (let i = 0; i <= NR; i += 1) {
    const t = i / NR
    points.push([foreX(t), lerp(0, 100, t)])
  }

  for (let i = 0; i <= N; i += 1) {
    const t = i / N
    let y = 100
      - bottomInset * (0.25 + 0.75 * (1 - t))
      - 0.55 * recession * (0.55 + 0.45 * wobble(1 - t, 60)) * (1 - t)
      - (Math.sin((1 - t) * 2.6 + wavePhase) * 0.45 + 0.45) * 0.5 * cockle
    if (fray > 0) y -= Math.max(0, fray * 0.55 * rough(1 - t, 600)) * (1 - t) * (1 - t)
    const nominal = (1 - t) * 100
    const convergence = smoothstep(((1 - t) - 0.55) / 0.4)
    const x = Math.min(nominal, lerp(nominal, xBottom, convergence))
    points.push([x, Math.min(100, y)])
  }

  points.push([cornerSpine * 1.1, 100 - cornerSpine * 1.4])
  points.push([0, 100 - cornerSpine * 2.2])
  points.push([0, cornerSpine * 2.0])
  points.push([cornerSpine * 0.9, cornerSpine * 1.1])

  return `polygon(${points.map(point => `${point[0].toFixed(2)}% ${point[1].toFixed(2)}%`).join(',')})`
}

const MODEL_CACHE = new Map<string, StackModel>()
const MODEL_KEYS = [
  'strata', 'seed', 'family', 'familyMix', 'exposure', 'fei', 'notebookEdge',
  'age', 'geo', 'humid', 'foxing', 'bloom', 'compress', 'notchRate',
  'correlated', 'phase', 'phaseVar', 'foreDepth', 'bottomDepth', 'lift', 'registration',
  'clusterAmp', 'indivAmp', 'limits', 'boxScale', 'frayScale', 'seam', 'foreStep', 'bottomStep',
  'placementMode',
] as const

export function buildStackModel(spec: StackSpec): StackModel {
  const key = MODEL_KEYS.map(name => JSON.stringify(spec[name] == null ? null : spec[name])).join('|')
  const cached = MODEL_CACHE.get(key)
  if (cached) return cached

  const n = spec.strata || 24
  const seed = spec.seed
  const foreDepth = spec.foreDepth == null ? 3.2 : spec.foreDepth
  const bottomDepth = spec.bottomDepth == null ? 1.6 : spec.bottomDepth
  const lift = spec.lift == null ? 2.2 : spec.lift
  const registration = spec.registration == null ? 0.25 : spec.registration
  const clusterAmp = spec.clusterAmp == null ? 0.34 : spec.clusterAmp
  const indivAmp = spec.indivAmp == null ? 0.19 : spec.indivAmp

  const clusters: number[] = []
  {
    let id = 0
    let left = 0
    for (let i = 0; i < n; i += 1) {
      if (left <= 0) {
        left = 3 + Math.floor(h2(seed, 900 + id) * 4)
        id += 1
      }
      clusters.push(id - 1)
      left -= 1
    }
  }

  const stepArray = (settings: StackStepSpec | undefined, keyOffset: number): number[] | null => {
    if (!settings) return null
    const values: number[] = []
    let accumulator = 0
    for (let i = 0; i < n; i += 1) {
      values.push(accumulator)
      const u = h2(seed, i * 11 + keyOffset)
      const v = h2(seed, i * 19 + keyOffset + 1)
      let step = lerp(settings.min, settings.max, u * u * (3 - 2 * u))
      if (v < 0.12) step *= 0.55
      else if (v > 0.93) step *= 1.35
      accumulator += step
    }
    return values
  }

  const foreSteps = stepArray(spec.foreStep, 120)
  const bottomSteps = stepArray(spec.bottomStep, 320)
  const sheets: StackSheetModel[] = []

  for (let i = 0; i < n; i += 1) {
    const t = n > 1 ? i / (n - 1) : 0
    const clusterId = clusters[i]!
    const clusterPhase = h2(seed, 940 + clusterId) * 6.28
    const phase = spec.correlated
      ? spec.phase + clusterPhase * 0.15 * (spec.phaseVar || 0) + Math.sin(i * 0.55) * (spec.phaseVar || 0)
      : h2(seed, i) * 6.28

    const envelope = 0.74 * t
      + 0.26 * (0.5 + 0.5 * Math.sin(t * 4.2 + h2(seed, 7) * 6.28))
      + 0.09 * Math.sin(t * 9.1 + h2(seed, 8) * 6.28)
    const clusterOffset = (h2(seed, 960 + clusterId) - 0.5) * 2 * clusterAmp
    const individualOffset = (h2(seed, i * 31 + 3) - 0.5) * 2 * indivAmp
    const kX = clamp01(envelope + clusterOffset + individualOffset)
    const kY = clamp01(
      0.35 + 0.55 * envelope
      + (h2(seed, 980 + clusterId) - 0.5) * clusterAmp
      + (h2(seed, i * 17 + 5) - 0.5) * indivAmp * 1.4,
    )

    let foreInset = foreSteps ? foreSteps[i]! : Math.max(0, foreDepth * kX)
    let bottomInset = bottomSteps ? bottomSteps[i]! : Math.max(0, bottomDepth * kY)

    const cond = condition({
      family: spec.family,
      familyMix: spec.familyMix,
      exposure: spec.exposure,
      familyEdgeInfluence: spec.fei,
      notebookEdge: spec.notebookEdge,
      seed: seed + i * 17,
      notebookAge: spec.age,
      limits: spec.limits,
      frayScale: spec.frayScale,
      geoIntensity: spec.geo * (GEO_VAR_LO + (GEO_VAR_HI - GEO_VAR_LO) * h2(seed, i * 5.7)),
      neighborhood: {
        humid: spec.humid * (spec.correlated ? 0.6 + 0.4 * Math.sin(i * 0.7 + spec.phase) : h2(seed, i * 2.2)),
        foxing: spec.foxing,
        bloom: spec.bloom,
        compress: spec.compress * (0.35 + 0.65 * kX),
        phase,
      },
      events: {
        notch: h2(seed, i * 9.3) < spec.notchRate ? 0.6 + 0.5 * h2(seed, i) : 0,
      },
    })

    const dx = (h2(seed, i * 3.1) - 0.5) * 2 * registration
    const dy = -t * lift + (h2(seed, i * 7.3) - 0.5) * 2 * registration * 0.5

    const spacing = Math.max(0.06, foreDepth / n)
    const U = (k: number): string => `calc(var(--u)*${(spacing * k).toFixed(4)})`
    const r1 = h2(seed, i * 23 + 9)
    const r2 = h2(seed, i * 29 + 4)
    const r3 = h2(seed, i * 37 + 11)
    const r4 = h2(seed, i * 41 + 2)
    const dirty = clamp01(0.35 + 0.5 * cond.edge + (r1 - 0.5) * 0.8)
    const seamWidth = 0.34 + 0.30 * r3
    const cutWidth = seamWidth + 0.55 + 0.45 * r4
    const cutWarmth = clamp01(0.35 + 0.55 * dirty + (r3 - 0.5) * 0.3)
    const cut = [
      Math.round(lerp(233, 201, cutWarmth)),
      Math.round(lerp(216, 172, cutWarmth)),
      Math.round(lerp(180, 127, cutWarmth)),
    ]
    const cutAlpha = 0.55 + 0.30 * r2
    const grimeAlpha = 0.08 + 0.20 * dirty
    const angle = 270 + (r2 - 0.5) * 2.4

    const clip = edgeProfile(cond)
    let mx = 0
    let my = 0
    {
      const pattern = /(-?[\d.]+)%\s+(-?[\d.]+)%/g
      let match: RegExpExecArray | null
      while ((match = pattern.exec(clip))) {
        if (+match[1]! > mx) mx = +match[1]!
        if (+match[2]! > my) my = +match[2]!
      }
    }
    mx ||= 100
    my ||= 100

    let seam: string
    if (spec.seam) {
      const seamOptions = spec.seam
      const gain = seamOptions.gain == null ? 1 : seamOptions.gain
      const widthLow = seamOptions.widthLo == null ? 0.55 : seamOptions.widthLo
      const widthHigh = seamOptions.widthHi == null ? 0.80 : seamOptions.widthHi
      const cutGain = seamOptions.cutGain == null ? 1 : seamOptions.cutGain
      const cutLow = seamOptions.cutLo == null ? 1.5 : seamOptions.cutLo
      const cutHigh = seamOptions.cutHi == null ? 3.0 : seamOptions.cutHi
      const w1 = h2(seed, i * 53 + 7)
      const w2 = h2(seed, i * 59 + 13)
      const w3 = h2(seed, i * 61 + 19)
      const smooth = (x: number): number => x * x * (3 - 2 * x)
      const seamPx = lerp(widthLow, widthHigh, smooth(w1))
      const faint = w3 < 0.13 ? 0.55 + 0.25 * w3 : 1
      // Preserved although the quiet-edge v3 treatment no longer paints a
      // separate contact line: this still controls the historic cut geometry.
      void gain
      void faint
      const cutPixels = lerp(cutLow, cutHigh, smooth(w2))
      const amp = seamOptions.alt == null ? 0.22 : seamOptions.alt
      const drift = Math.sin(i * 1.17 + seed * 0.013) * 0.55 + Math.sin(i * 2.63 + 1.9) * 0.28
      const organic = (drift * 0.6 + (w3 - 0.5) * 1.5 + (r4 - 0.5) * 0.9) * amp
      const adjustedWarmth = clamp01(cutWarmth * 0.80 + 0.12 * cutGain + organic)
      const cutColor = [
        Math.round(lerp(236, 188, adjustedWarmth)),
        Math.round(lerp(219, 160, adjustedWarmth)),
        Math.round(lerp(184, 114, adjustedWarmth)),
      ]
      const px = (value: number): string => `max(${value.toFixed(2)}px, ${U(value / 2.6)})`
      const dxPercent = `${(100 - mx).toFixed(3)}%`
      const at = (distance: string, value: string): string => `calc(${distance} + ${value})`
      const C = px(seamPx + cutPixels)
      const cutSoft = clamp01((0.10 + 0.06 * r2) * cutGain).toFixed(3)
      seam = [
        `linear-gradient(${angle.toFixed(2)}deg, rgba(0,0,0,0) 0 ${dxPercent}, rgba(${cutColor.join(',')},${cutSoft}) ${dxPercent} ${at(dxPercent, C)}, rgba(0,0,0,0) ${at(dxPercent, px(seamPx + cutPixels * 3.2))})`,
        `linear-gradient(270deg, rgba(118,90,50,${(grimeAlpha * 0.6).toFixed(3)}) ${dxPercent} ${at(dxPercent, U(1.9 + 1.4 * r1))}, rgba(136,107,64,${(grimeAlpha * 0.28).toFixed(3)}) ${at(dxPercent, U(1.9 + 1.4 * r1))} ${at(dxPercent, U(4.6 + 2 * r3))}, rgba(0,0,0,0) ${at(dxPercent, U(8.5))})`,
        `radial-gradient(120% 90% at 100% 100%, rgba(104,78,42,${(grimeAlpha * 0.7).toFixed(3)}) 0, rgba(0,0,0,0) ${U(14)})`,
      ].join(', ')
    } else {
      const cutSoft = clamp01(cutAlpha * 0.22).toFixed(3)
      seam = [
        `linear-gradient(${angle.toFixed(2)}deg, rgba(${cut.join(',')},${cutSoft}) 0 ${U(cutWidth)}, rgba(0,0,0,0) ${U(cutWidth * 3)})`,
        `linear-gradient(270deg, rgba(118,90,50,${(grimeAlpha * 0.6).toFixed(3)}) 0 ${U(1.9 + 1.4 * r1)}, rgba(136,107,64,${(grimeAlpha * 0.28).toFixed(3)}) ${U(1.9 + 1.4 * r1)} ${U(4.6 + 2 * r3)}, rgba(0,0,0,0) ${U(8.5)})`,
        `radial-gradient(120% 90% at 100% 100%, rgba(104,78,42,${(grimeAlpha * 0.9).toFixed(3)}) 0, rgba(0,0,0,0) ${U(14)})`,
      ].join(', ')
    }

    const toneWeight = clamp01(STOCK.oxidation * 0.5 + cond.tone * 0.35)
    const base = STOCK.base.map((value, index) => Math.round(lerp(value, STOCK.warm[index]!, toneWeight)))
    const cheapBody = `linear-gradient(272deg, rgba(124,96,54,${(0.10 + 0.22 * cond.edge).toFixed(3)}) 0 ${U(6)}, rgba(0,0,0,0) ${U(16)}),linear-gradient(168deg, rgb(${base.join(',')}), rgb(${base.map(value => value - 6).join(',')}))`

    const box = spec.boxScale == null ? 86 : spec.boxScale
    sheets.push({
      i,
      z: i + 1,
      cond,
      seam,
      cheapBody,
      box,
      foreInset,
      bottomInset,
      dx,
      dy,
      t,
      transform: `translate(${dx.toFixed(3)}%, ${dy.toFixed(3)}%)`,
      width: `${(box * (100 - foreInset) / 100).toFixed(3)}%`,
      height: `${(box * (100 - bottomInset) / 100).toFixed(3)}%`,
      mx,
      my,
      clip,
    })
  }

  if (foreSteps && sheets.length > 1 && (spec.placementMode || 'recession') !== 'cascade') {
    const order = [...sheets].sort((a, b) => b.mx - a.mx)
    const maxInset = 32
    let previousX = order[0]!.mx
    let previousY = order[0]!.my || 100

    order.forEach((sheet, rank) => {
      const targetX = rank === 0
        ? Math.min(sheet.mx, previousX)
        : Math.min(previousX - (foreSteps[rank]! - foreSteps[rank - 1]!), sheet.mx)
      const targetY = rank === 0
        ? Math.min(sheet.my || 100, previousY)
        : Math.min(
          previousY - (bottomSteps ? bottomSteps[rank]! - bottomSteps[rank - 1]! : 0),
          sheet.my || 100,
        )
      const solvedForeInset = Math.min(maxInset, Math.max(0, 100 - targetX * 100 / (sheet.mx || 100)))
      const solvedBottomInset = Math.min(maxInset, Math.max(0, 100 - targetY * 100 / (sheet.my || 100)))
      sheet.foreInset = solvedForeInset
      sheet.bottomInset = solvedBottomInset
      sheet.width = `${(sheet.box * (100 - solvedForeInset) / 100).toFixed(3)}%`
      sheet.height = `${(sheet.box * (100 - solvedBottomInset) / 100).toFixed(3)}%`
      sheet.z = rank + 1
      previousX = (sheet.mx || 100) * (100 - solvedForeInset) / 100
      previousY = (sheet.my || 100) * (100 - solvedBottomInset) / 100
    })
  }

  const model = { n, sheets }
  MODEL_CACHE.set(key, model)
  return model
}

export const PaperStack = {
  rnd,
  hash1,
  h2,
  clamp01,
  lerp,
  STOCK,
  edgeProfile,
  NOTEBOOK_EDGE,
  FAMILIES,
  condition,
  buildStackModel,
  PRODUCTION_LIMITS,
  M2_EDGE,
  EDGE_OXIDATION,
} as const
