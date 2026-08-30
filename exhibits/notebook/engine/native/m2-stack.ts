export interface M2EdgePreset {
  rec: number
  corner: number
  cockle: number
  notch: number
  geo: number
  fray: number
}

export interface NotebookEdgePreset {
  recession: number
  cornerWear: number
  cockle: number
  bottomSag?: number
  [key: string]: unknown
}

export interface StackSheetModel {
  i: number
  transform: string
  width: string
  height: string
  clip: string
  cheapBody: string
  seam: string
  cond: unknown
  foreInset: number
  bottomInset: number
  mx?: number
  my?: number
}

export interface StackModel {
  sheets: StackSheetModel[]
}

export interface PaperStackEngine {
  M2_EDGE: M2EdgePreset
  NOTEBOOK_EDGE: NotebookEdgePreset
  buildStackModel(spec: M2StackSpec): StackModel
}

export interface M2StackSpec {
  strata: number
  seed: number
  familyMix: number
  exposure: number
  fei: number
  notebookEdge: NotebookEdgePreset
  age: number
  geo: number
  humid: number
  foxing: number
  bloom: number
  compress: number
  notchRate: number
  correlated: boolean
  phase: number
  phaseVar: number
  limits: {
    frayChipping: number
    geometricIntensity: number
  }
  bottomDepth?: number
  lift?: number
  flat?: boolean
  cheap?: boolean
  [key: string]: unknown
}

export interface M2RenderOptions {
  paperStack: PaperStackEngine
  surface?: (condition: unknown) => string
  age?: number
}

export const M2_COORD = {
  sx: 0.06,
  sy: 0.07,
  sw: 0.86,
  sh: 0.86,
} as const

export const M2_STRATA = 26
export const M2_SEED = 5100

/**
 * Frozen canonical M2 recipe from /paper-lab Section N.
 *
 * This function deliberately has no URL/query/control inputs. Production
 * callers may provide only explicit overrides from code, primarily for tests.
 */
export function createM2Spec(
  paperStack: PaperStackEngine,
  overrides: Partial<M2StackSpec> = {},
  age = 0.88,
): M2StackSpec {
  const candidate = paperStack.M2_EDGE
  const edge = paperStack.NOTEBOOK_EDGE

  return {
    strata: M2_STRATA,
    seed: M2_SEED,
    familyMix: 0,
    exposure: 1,
    fei: 0.7,
    notebookEdge: {
      ...edge,
      recession: edge.recession * candidate.rec,
      cornerWear: edge.cornerWear * candidate.corner,
      cockle: edge.cockle * candidate.cockle,
    },
    age,
    geo: candidate.geo,
    humid: 0.10,
    foxing: 0.08,
    bloom: 0.05,
    compress: 0.28,
    notchRate: candidate.notch ? 0.08 + candidate.notch * 0.20 : 0,
    correlated: true,
    phase: 0.32 * 6.28,
    phaseVar: 0.5,
    limits: {
      frayChipping: candidate.fray,
      geometricIntensity: candidate.geo,
    },
    ...overrides,
  }
}

/** Approved Section N direction: one flush bottom line, fore-edge untouched. */
export function createM2FlushBottom(paperStack: PaperStackEngine): Pick<M2StackSpec, 'bottomDepth' | 'lift' | 'notebookEdge'> {
  const base = createM2Spec(paperStack)
  return {
    bottomDepth: 0,
    lift: 0,
    notebookEdge: {
      ...base.notebookEdge,
      bottomSag: 0,
    },
  }
}

export function createM2NotebookSpec(
  paperStack: PaperStackEngine,
  overrides: Partial<M2StackSpec> = {},
  age = 0.88,
): M2StackSpec {
  return createM2Spec(
    paperStack,
    {
      ...createM2FlushBottom(paperStack),
      ...overrides,
    },
    age,
  )
}

/**
 * Render the canonical stack without touching document.head or :root.
 * Host coordinates are scoped to the returned stack element.
 */
export function renderM2Stack(
  spec: M2StackSpec,
  { paperStack, surface }: M2RenderOptions,
): HTMLDivElement {
  const model = paperStack.buildStackModel(spec)
  const wrap = document.createElement('div')
  wrap.className = 'm2stack'
  wrap.style.setProperty('--sx', String(M2_COORD.sx))
  wrap.style.setProperty('--sy', String(M2_COORD.sy))
  wrap.style.setProperty('--sw', String(M2_COORD.sw))
  wrap.style.setProperty('--sh', String(M2_COORD.sh))

  const shadow = document.createElement('div')
  shadow.className = 'm2sheet m2sheet-shadow'
  shadow.style.cssText = 'z-index:0;background:rgba(30,20,8,.45);filter:blur(calc(var(--u)*2));transform:translate(calc(var(--u)*0.6),calc(var(--u)*1.2)) scale(1.004,.992)'
  wrap.appendChild(shadow)

  for (const sheet of model.sheets) {
    const element = document.createElement('div')
    element.className = 'm2sheet'
    element.style.transform = sheet.transform
    element.style.width = sheet.width
    element.style.height = sheet.height
    element.style.clipPath = sheet.clip

    let body: string
    if (spec.flat) {
      const value = sheet.i % 2 ? '236,226,203' : '229,217,192'
      body = `linear-gradient(168deg, rgb(${value}), rgb(${value}))`
    } else if (spec.cheap || !surface) {
      body = sheet.cheapBody
    } else {
      body = surface(sheet.cond)
    }

    element.style.background = `${sheet.seam}, ${body}`
    element.style.zIndex = String(sheet.i + 1)
    element.dataset.stratum = String(sheet.i)
    element.dataset.seam = sheet.seam
    element.dataset.reachX = (((100 - sheet.foreInset) / 100) * ((sheet.mx ?? 100) / 100)).toFixed(6)
    element.dataset.reachY = (((100 - sheet.bottomInset) / 100) * ((sheet.my ?? 100) / 100)).toFixed(6)
    element.dataset.mx = String(sheet.mx ?? 100)
    element.dataset.my = String(sheet.my ?? 100)
    wrap.appendChild(element)
  }

  return wrap
}

export function renderM2NotebookStack(
  options: M2RenderOptions,
  overrides: Partial<M2StackSpec> = {},
): HTMLDivElement {
  return renderM2Stack(
    createM2NotebookSpec(options.paperStack, overrides, options.age),
    options,
  )
}
