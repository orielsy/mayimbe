import { describe, expect, it } from 'vitest'
import {
  INITIAL_NOTEBOOK_STATE,
  reduceNotebookState,
  type NotebookMachineState,
} from '../../app/components/notebook/notebookMachine'

const TOTAL = 8

function settle(state: NotebookMachineState) {
  expect(state.turn).not.toBeNull()
  return reduceNotebookState(state, { type: 'SETTLE', key: state.turn!.key }, TOTAL)
}

describe('notebook Page Turner state machine', () => {
  it('opens, traverses to the dedication, and cannot advance past it', () => {
    let state = reduceNotebookState(INITIAL_NOTEBOOK_STATE, { type: 'NEXT' }, TOTAL)
    expect(state.status).toBe('opening')
    state = settle(state)

    for (let page = 1; page <= TOTAL; page += 1) {
      state = reduceNotebookState(state, { type: 'NEXT' }, TOTAL)
      expect(state.status).toBe('turning-forward')
      expect(state.page).toBe(page)
      state = settle(state)
    }

    expect(state.status).toBe('open')
    expect(state.page).toBe(TOTAL)
    expect(reduceNotebookState(state, { type: 'NEXT' }, TOTAL)).toBe(state)
  })

  it('walks backward from the dedication and closes from page one', () => {
    let state: NotebookMachineState = {
      status: 'open',
      page: TOTAL,
      turn: null,
      seq: TOTAL + 1,
    }

    for (let page = TOTAL - 1; page >= 0; page -= 1) {
      state = reduceNotebookState(state, { type: 'PREV' }, TOTAL)
      expect(state.status).toBe('turning-backward')
      expect(state.page).toBe(page)
      state = settle(state)
    }

    state = reduceNotebookState(state, { type: 'PREV' }, TOTAL)
    expect(state.status).toBe('closing')
    state = settle(state)
    expect(state.status).toBe('closed-front')
    expect(state.page).toBe(0)
  })

  it('ignores navigation while a transition is active', () => {
    const opening = reduceNotebookState(INITIAL_NOTEBOOK_STATE, { type: 'OPEN' }, TOTAL)
    expect(reduceNotebookState(opening, { type: 'NEXT' }, TOTAL)).toBe(opening)
    expect(reduceNotebookState(opening, { type: 'PREV' }, TOTAL)).toBe(opening)
  })

  it('ignores stale settle events', () => {
    const opening = reduceNotebookState(INITIAL_NOTEBOOK_STATE, { type: 'OPEN' }, TOTAL)
    expect(reduceNotebookState(opening, { type: 'SETTLE', key: 999 }, TOTAL)).toBe(opening)
  })
})
