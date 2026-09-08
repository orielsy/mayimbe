import { computed, ref } from 'vue'
import {
  INITIAL_NOTEBOOK_STATE,
  isNotebookSettled,
  reduceNotebookState,
  type NotebookMachineState,
} from './notebookMachine'

export function useNotebookMachine(total: number) {
  const state = ref<NotebookMachineState>({ ...INITIAL_NOTEBOOK_STATE })

  const dispatch = (action: Parameters<typeof reduceNotebookState>[1]) => {
    state.value = reduceNotebookState(state.value, action, total)
  }

  const open = () => dispatch({ type: 'OPEN' })
  const close = () => dispatch({ type: 'CLOSE' })
  const next = () => dispatch({ type: 'NEXT' })
  const prev = () => dispatch({ type: 'PREV' })
  const settle = (key: number) => dispatch({ type: 'SETTLE', key })

  const busy = computed(() => !isNotebookSettled(state.value.status))
  const canNext = computed(() =>
    state.value.status === 'closed-front'
      || (state.value.status === 'open' && state.value.page < total),
  )
  const canPrev = computed(() => state.value.status === 'open')
  const atEnd = computed(() => state.value.status === 'open' && state.value.page >= total)

  return {
    state,
    open,
    close,
    next,
    prev,
    settle,
    busy,
    canNext,
    canPrev,
    atEnd,
  }
}
