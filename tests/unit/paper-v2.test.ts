import { describe, expect, it } from 'vitest'
import {
  PAPER_V2_AGE,
  PAPER_V2_PAGE_ONE,
  createPaperV2,
  type PaperCondition,
  type PaperStackPaperApi,
  type PaperSurfaceApi,
} from '../../exhibits/notebook/engine/native/paper-v2'

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

const geometry = { immutable: true }
let conditionInput: Record<string, any> | null = null

const paperStack: PaperStackPaperApi = {
  PRODUCTION_LIMITS: { geometricIntensity: 0.55, frayChipping: 0.12 },
  M2_EDGE: { rec: 1.16, corner: 1.09, cockle: 1.08, notch: 0.35, inset: 0.60 },
  NOTEBOOK_EDGE: { recession: 1.2, cornerWear: 0.4, cockle: 0.2 },
  clamp01,
  h2: () => 0.5,
  rnd: () => () => 0.5,
  condition(input) {
    conditionInput = input
    return {
      ...input,
      geo: geometry,
      humid: input.neighborhood.humid,
      foxing: input.neighborhood.foxing,
      grime: 0.1,
      tone: 0.1,
      edge: 0.1,
      fibre: 0.1,
      exposure: input.exposure,
      mix: input.familyMix,
      events: { ...input.events },
    } as PaperCondition
  },
}

const paperSurface: PaperSurfaceApi = {
  surface: () => 'base-surface',
  texURL: (key) => `url(${key})`,
  blot: (x, y, width, height, rgb, alpha) => `blot(${x},${y},${width},${height},${rgb},${alpha})`,
  layer: (image, size, position) => `layer(${image},${size},${position})`,
}

describe('Lab-Native PAPERV2 extraction', () => {
  it('preserves the selected M2 condition ceiling and first-sheet treatment', () => {
    conditionInput = null
    const paper = createPaperV2({ paperStack, paperSurface })
    const first = paper.sheet(0, 12)

    expect(paper.age).toBe(PAPER_V2_AGE)
    expect(first.sheetIndex).toBe(0)
    expect(conditionInput?.seed).toBe(300)
    expect(conditionInput?.notebookAge).toBe(0.88)
    expect(conditionInput?.geoIntensity).toBe(0.55)
    expect(conditionInput?.foreInset).toBe(0.60)
    expect(conditionInput?.events.notch).toBe(0.35)
    expect(conditionInput?.notebookEdge.recession).toBeCloseTo(1.392)
    expect(conditionInput?.notebookEdge.cornerWear).toBeCloseTo(0.436)
    expect(conditionInput?.notebookEdge.cockle).toBeCloseTo(0.216)
  })

  it('applies page-one history to surface fields without changing physical geometry', () => {
    const paper = createPaperV2({ paperStack, paperSurface })
    const source = paper.sheet(0, 12)
    const face = paper.faceSurfaceCondition(0, source)

    expect(face).not.toBe(source)
    expect(face.geo).toBe(source.geo)
    expect(face.geo).toBe(geometry)
    expect(face.grime).toBe(PAPER_V2_PAGE_ONE.grime)
    expect(face.tone).toBe(PAPER_V2_PAGE_ONE.tone)
    expect(face.edge).toBe(PAPER_V2_PAGE_ONE.edge)
    expect(face.fibre).toBe(PAPER_V2_PAGE_ONE.fibre)
    expect(face.events.stain).toBe(PAPER_V2_PAGE_ONE.stain)
    expect(face.events.smudge).toBe(PAPER_V2_PAGE_ONE.smudge)
  })

  it('keeps the trauma echo local to the first three page faces', () => {
    const paper = createPaperV2({ paperStack, paperSurface })

    expect(paper.skin(0, false, 24)).toContain('p1tide_v2')
    expect(paper.skin(1, true, 24)).toContain('p1tide_v2_m')
    expect(paper.skin(2, false, 24)).toContain('p1tide_v2')
    expect(paper.skin(3, true, 24)).toBe('base-surface')
  })
})
