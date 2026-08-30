import type {
  MountNotebookEngine,
  NotebookEngine,
  NotebookEngineState,
  NotebookPosition,
} from './contract'
import { mountNativeNotebook } from './native/notebook-engine'
import { NOTEBOOK_PARITY_PAGES, NOTEBOOK_PARITY_SECTIONS } from './native/fixture'
import type {
  NativeNotebookEngine,
  NativeNotebookSnapshot,
  NativeNotebookStateName,
} from './native/notebook-types'

const toPosition = (state: NativeNotebookStateName): NotebookPosition => {
  if (state === 'CLOSED_FRONT') return 'closed-front'
  if (state === 'CLOSED_BACK') return 'closed-back'
  return 'open'
}

const toNativePosition = (position: NotebookPosition): NativeNotebookStateName => {
  if (position === 'closed-front') return 'CLOSED_FRONT'
  if (position === 'closed-back') return 'CLOSED_BACK'
  return 'OPEN'
}

function adaptNativeEngine(native: NativeNotebookEngine): NotebookEngine {
  return {
    open: () => native.open(),
    close: side => native.close(side),
    // Museum-facing physical page numbers are 1-based. The native renderer
    // works with zero-based face indexes internally.
    goToPage: page => native.goToPage(Math.max(0, Math.floor(page) - 1)),
    goToSection: section => native.goToSection(section),
    next: () => native.next(),
    previous: () => native.previous(),
    suspend: () => native.suspend(),
    resume: () => native.resume(),
    getState(): NotebookEngineState {
      const state = native.getState()
      return {
        position: toPosition(state.state),
        turned: state.turned,
      }
    },
    async restore(state: NotebookEngineState) {
      const nativeState: Partial<NativeNotebookSnapshot> = {
        state: toNativePosition(state.position),
        turned: state.turned,
      }
      await native.restore(nativeState)
    },
    dispose: () => native.dispose(),
  }
}

export const mountNotebookEngine: MountNotebookEngine = async (host, options = {}) => {
  if (options.signal?.aborted) {
    throw new DOMException('Notebook mount aborted', 'AbortError')
  }

  const native = await mountNativeNotebook(host, {
    pages: NOTEBOOK_PARITY_PAGES,
    sectionToPage: NOTEBOOK_PARITY_SECTIONS,
    title: 'CUADERNO',
    signal: options.signal,
  })

  return adaptNativeEngine(native)
}
