export type NotebookStatus =
  | 'closed-front'
  | 'opening'
  | 'open'
  | 'turning-forward'
  | 'turning-backward'
  | 'closing'

export type TurnKind = 'open' | 'close' | 'forward' | 'backward'

export interface NotebookTurn {
  key: number
  kind: TurnKind
  /** page index shown on the leaving face (-1 = front cover) */
  from: number
  /** page index shown on the arriving face (-1 = front cover) */
  to: number
}

export interface NotebookMachineState {
  status: NotebookStatus
  /** Resting right-side page. `total` is the dedication pastedown. */
  page: number
  turn: NotebookTurn | null
  seq: number
}

export type NotebookAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SETTLE'; key: number }

export const INITIAL_NOTEBOOK_STATE: NotebookMachineState = {
  status: 'closed-front',
  page: 0,
  turn: null,
  seq: 0,
}

export const isNotebookSettled = (status: NotebookStatus) =>
  status === 'closed-front' || status === 'open'

/**
 * Framework-independent Page Turner state machine.
 *
 * Lovable originally wrapped this reducer in React's useReducer. Mayimbe keeps
 * the reducer pure so Vue, tests, and future renderers can all share the same
 * transition contract.
 *
 * `total` is the number of authored paper pages. The dedication pastedown is
 * represented by page index `total` and is the terminal forward state.
 */
export function reduceNotebookState(
  state: NotebookMachineState,
  action: NotebookAction,
  total: number,
): NotebookMachineState {
  const settled = isNotebookSettled(state.status)

  switch (action.type) {
    case 'OPEN': {
      if (!settled || state.status !== 'closed-front') return state
      const seq = state.seq + 1
      return {
        status: 'opening',
        page: 0,
        seq,
        turn: { key: seq, kind: 'open', from: -1, to: 0 },
      }
    }

    case 'CLOSE': {
      if (!settled || state.status !== 'open') return state
      const seq = state.seq + 1
      return {
        status: 'closing',
        page: state.page,
        seq,
        turn: { key: seq, kind: 'close', from: state.page, to: -1 },
      }
    }

    case 'NEXT': {
      if (state.status === 'closed-front') {
        return reduceNotebookState(state, { type: 'OPEN' }, total)
      }
      if (state.status !== 'open' || state.page >= total) return state

      const seq = state.seq + 1
      return {
        status: 'turning-forward',
        page: state.page + 1,
        seq,
        turn: { key: seq, kind: 'forward', from: state.page, to: state.page + 1 },
      }
    }

    case 'PREV': {
      if (state.status !== 'open') return state
      if (state.page === 0) {
        return reduceNotebookState(state, { type: 'CLOSE' }, total)
      }

      const seq = state.seq + 1
      return {
        status: 'turning-backward',
        page: state.page - 1,
        seq,
        turn: { key: seq, kind: 'backward', from: state.page, to: state.page - 1 },
      }
    }

    case 'SETTLE': {
      if (!state.turn || state.turn.key !== action.key) return state
      return {
        ...state,
        status: state.turn.kind === 'close' ? 'closed-front' : 'open',
        turn: null,
      }
    }

    default:
      return state
  }
}
