import { describe, expect, it } from 'vitest'
import {
  createPocketNotebookState,
  pocketNotebookCanBackward,
  pocketNotebookCanForward,
  pocketNotebookRestingPageIndex,
  reducePocketNotebookState,
} from '../../app/runtime/pocket-notebook-state'

describe('pocket notebook state model', () => {
  it('opens, advances, moves backward, and closes deterministically', () => {
    let state = createPocketNotebookState(6)

    expect(state.phase).toBe('closed-front')
    expect(pocketNotebookCanForward(state)).toBe(true)
    expect(pocketNotebookCanBackward(state)).toBe(false)

    state = reducePocketNotebookState(state, { type: 'forward' })
    expect(state.phase).toBe('opening')
    expect(state.transition?.kind).toBe('open')
    expect(pocketNotebookRestingPageIndex(state)).toBe(0)

    state = reducePocketNotebookState(state, {
      type: 'settle',
      transitionId: state.transition!.id,
    })
    expect(state.phase).toBe('open')
    expect(state.pageIndex).toBe(0)

    state = reducePocketNotebookState(state, { type: 'forward' })
    expect(state.phase).toBe('turning-forward')
    expect(pocketNotebookRestingPageIndex(state)).toBe(1)

    state = reducePocketNotebookState(state, {
      type: 'settle',
      transitionId: state.transition!.id,
    })
    expect(state.phase).toBe('open')
    expect(state.pageIndex).toBe(1)

    state = reducePocketNotebookState(state, { type: 'backward' })
    expect(state.phase).toBe('turning-backward')
    expect(pocketNotebookRestingPageIndex(state)).toBe(1)

    state = reducePocketNotebookState(state, {
      type: 'settle',
      transitionId: state.transition!.id,
    })
    expect(state.pageIndex).toBe(0)
    expect(pocketNotebookRestingPageIndex(state)).toBe(0)

    state = reducePocketNotebookState(state, { type: 'backward' })
    expect(state.phase).toBe('closing')
    expect(pocketNotebookRestingPageIndex(state)).toBe(0)

    state = reducePocketNotebookState(state, {
      type: 'settle',
      transitionId: state.transition!.id,
    })
    expect(state.phase).toBe('closed-front')
    expect(state.pageIndex).toBe(0)
  })

  it('keeps the current resting page during backward animation until settle', () => {
    let state = createPocketNotebookState(3)
    state = reducePocketNotebookState(state, { type: 'forward' })
    state = reducePocketNotebookState(state, { type: 'settle', transitionId: state.transition!.id })
    state = reducePocketNotebookState(state, { type: 'forward' })
    state = reducePocketNotebookState(state, { type: 'settle', transitionId: state.transition!.id })
    state = reducePocketNotebookState(state, { type: 'forward' })
    state = reducePocketNotebookState(state, { type: 'settle', transitionId: state.transition!.id })

    expect(state.pageIndex).toBe(2)

    state = reducePocketNotebookState(state, { type: 'backward' })
    expect(state.transition).toMatchObject({ kind: 'backward', fromPage: 2, toPage: 1 })
    expect(pocketNotebookRestingPageIndex(state)).toBe(2)

    state = reducePocketNotebookState(state, { type: 'settle', transitionId: state.transition!.id })
    expect(state.pageIndex).toBe(1)
    expect(pocketNotebookRestingPageIndex(state)).toBe(1)
  })

  it('ignores rapid input while a transition is active', () => {
    const closed = createPocketNotebookState(6)
    const opening = reducePocketNotebookState(closed, { type: 'forward' })
    const repeatedForward = reducePocketNotebookState(opening, { type: 'forward' })
    const repeatedBackward = reducePocketNotebookState(opening, { type: 'backward' })

    expect(repeatedForward).toBe(opening)
    expect(repeatedBackward).toBe(opening)
    expect(opening.sequence).toBe(1)
  })

  it('ignores stale transition completion and disables forward on the final page', () => {
    let state = createPocketNotebookState(2)
    state = reducePocketNotebookState(state, { type: 'forward' })

    const openingId = state.transition!.id
    const stale = reducePocketNotebookState(state, { type: 'settle', transitionId: openingId + 99 })
    expect(stale).toBe(state)

    state = reducePocketNotebookState(state, { type: 'settle', transitionId: openingId })
    state = reducePocketNotebookState(state, { type: 'forward' })
    state = reducePocketNotebookState(state, {
      type: 'settle',
      transitionId: state.transition!.id,
    })

    expect(state.pageIndex).toBe(1)
    expect(pocketNotebookCanForward(state)).toBe(false)
    expect(reducePocketNotebookState(state, { type: 'forward' })).toBe(state)
  })

  it('rejects an empty notebook', () => {
    expect(() => createPocketNotebookState(0)).toThrow('at least one logical page')
  })
})
