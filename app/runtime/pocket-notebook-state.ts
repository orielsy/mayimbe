export type PocketNotebookPhase =
  | 'closed-front'
  | 'opening'
  | 'open'
  | 'turning-forward'
  | 'turning-backward'
  | 'closing'

export type PocketNotebookTransitionKind = 'open' | 'forward' | 'backward' | 'close'

export interface PocketNotebookTransition {
  id: number
  kind: PocketNotebookTransitionKind
  fromPage: number | null
  toPage: number | null
}

export interface PocketNotebookState {
  phase: PocketNotebookPhase
  pageIndex: number
  pageCount: number
  sequence: number
  transition: PocketNotebookTransition | null
}

export type PocketNotebookAction =
  | { type: 'forward' }
  | { type: 'backward' }
  | { type: 'settle'; transitionId: number }

const transitionPhases = new Set<PocketNotebookPhase>([
  'opening',
  'turning-forward',
  'turning-backward',
  'closing',
])

export const isPocketNotebookTransitioning = (state: PocketNotebookState) => (
  transitionPhases.has(state.phase)
)

export const createPocketNotebookState = (pageCount: number): PocketNotebookState => {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new Error('Pocket notebook requires at least one logical page')
  }

  return {
    phase: 'closed-front',
    pageIndex: 0,
    pageCount,
    sequence: 0,
    transition: null,
  }
}

const beginTransition = (
  state: PocketNotebookState,
  phase: PocketNotebookPhase,
  kind: PocketNotebookTransitionKind,
  fromPage: number | null,
  toPage: number | null,
): PocketNotebookState => {
  const id = state.sequence + 1
  return {
    ...state,
    phase,
    sequence: id,
    transition: { id, kind, fromPage, toPage },
  }
}

const requestForward = (state: PocketNotebookState): PocketNotebookState => {
  if (isPocketNotebookTransitioning(state)) return state

  if (state.phase === 'closed-front') {
    return beginTransition(state, 'opening', 'open', null, 0)
  }

  if (state.phase !== 'open' || state.pageIndex >= state.pageCount - 1) return state

  return beginTransition(
    state,
    'turning-forward',
    'forward',
    state.pageIndex,
    state.pageIndex + 1,
  )
}

const requestBackward = (state: PocketNotebookState): PocketNotebookState => {
  if (isPocketNotebookTransitioning(state) || state.phase !== 'open') return state

  if (state.pageIndex === 0) {
    return beginTransition(state, 'closing', 'close', 0, null)
  }

  return beginTransition(
    state,
    'turning-backward',
    'backward',
    state.pageIndex,
    state.pageIndex - 1,
  )
}

const settleTransition = (
  state: PocketNotebookState,
  transitionId: number,
): PocketNotebookState => {
  const transition = state.transition
  if (!transition || transition.id !== transitionId) return state

  if (transition.kind === 'close') {
    return {
      ...state,
      phase: 'closed-front',
      pageIndex: 0,
      transition: null,
    }
  }

  return {
    ...state,
    phase: 'open',
    pageIndex: transition.toPage ?? state.pageIndex,
    transition: null,
  }
}

export const reducePocketNotebookState = (
  state: PocketNotebookState,
  action: PocketNotebookAction,
): PocketNotebookState => {
  if (action.type === 'forward') return requestForward(state)
  if (action.type === 'backward') return requestBackward(state)
  return settleTransition(state, action.transitionId)
}

export const pocketNotebookCanForward = (state: PocketNotebookState) => {
  if (isPocketNotebookTransitioning(state)) return false
  if (state.phase === 'closed-front') return true
  return state.phase === 'open' && state.pageIndex < state.pageCount - 1
}

export const pocketNotebookCanBackward = (state: PocketNotebookState) => (
  !isPocketNotebookTransitioning(state) && state.phase === 'open'
)

/**
 * The resting page is ordinary DOM. During a future transition the destination
 * page is prepared underneath the temporary turning sheet before animation.
 */
export const pocketNotebookRestingPageIndex = (state: PocketNotebookState) => (
  state.transition?.toPage ?? state.pageIndex
)
