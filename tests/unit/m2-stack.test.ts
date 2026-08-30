import { describe, expect, it } from 'vitest'
import {
  M2_SEED,
  M2_STRATA,
  createM2NotebookSpec,
  type M2StackSpec,
  type PaperStackEngine,
} from '../../exhibits/notebook/engine/native/m2-stack'

const paperStack: PaperStackEngine = {
  M2_EDGE: {
    rec: 1.16,
    corner: 1.09,
    cockle: 1.08,
    notch: 0.35,
    geo: 0.65,
    fray: 0.16,
  },
  NOTEBOOK_EDGE: {
    recession: 1.2,
    cornerWear: 0.4,
    cockle: 0.2,
    bottomSag: 1,
  },
  buildStackModel(_spec: M2StackSpec) {
    return { sheets: [] }
  },
}

describe('canonical M2 notebook stack', () => {
  it('keeps the approved physical recipe frozen and flush-bottom', () => {
    const spec = createM2NotebookSpec(paperStack)

    expect(spec.strata).toBe(M2_STRATA)
    expect(spec.strata).toBe(26)
    expect(spec.seed).toBe(M2_SEED)
    expect(spec.seed).toBe(5100)
    expect(spec.geo).toBe(0.65)
    expect(spec.limits).toEqual({
      frayChipping: 0.16,
      geometricIntensity: 0.65,
    })
    expect(spec.notchRate).toBeCloseTo(0.15)
    expect(spec.notebookEdge.recession).toBeCloseTo(1.392)
    expect(spec.notebookEdge.cornerWear).toBeCloseTo(0.436)
    expect(spec.notebookEdge.cockle).toBeCloseTo(0.216)
    expect(spec.bottomDepth).toBe(0)
    expect(spec.lift).toBe(0)
    expect(spec.notebookEdge.bottomSag).toBe(0)
  })
})
