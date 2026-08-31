import type {
  MountNotebookEngine,
  NotebookEngine,
  NotebookEngineState,
  NotebookPhysicalProfile,
  NotebookPosition,
} from './contract'
import { NOTEBOOK_PROFILE_DEFINITIONS } from './profiles'
import { mountNativeNotebook } from './native/notebook-engine'
import { NOTEBOOK_PARITY_PAGES, NOTEBOOK_PARITY_SECTIONS } from './native/fixture'
import type {
  NativeNotebookEngine,
  NativeNotebookPage,
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

const clampAuthoredPage = (page: number, pageCount: number) =>
  Math.max(1, Math.min(pageCount, Math.floor(page)))

function turnedForAuthoredPage(profile: NotebookPhysicalProfile, page: number) {
  if (profile === 'pocket') return Math.max(0, page - 1)
  if (page <= 1) return 0
  return Math.ceil((page - 1) / 2)
}

function authoredPageFromTurned(
  profile: NotebookPhysicalProfile,
  turned: number,
  pageCount: number,
  direction: 'forward' | 'backward' | 'rest' = 'rest',
) {
  if (profile === 'pocket') {
    return clampAuthoredPage(turned + 1, pageCount)
  }

  if (turned <= 0) return 1

  // A standard spread reached going forward begins on its left page. Going
  // backward, the visitor arrives at the right page of the preceding spread.
  const page = direction === 'backward' ? turned * 2 + 1 : turned * 2
  return clampAuthoredPage(page, pageCount)
}

function buildPhysicalPages(profile: NotebookPhysicalProfile): NativeNotebookPage[] {
  if (NOTEBOOK_PROFILE_DEFINITIONS[profile].sheetMode === 'duplex') {
    return NOTEBOOK_PARITY_PAGES
  }

  // Pocket Cuaderno: every authored page lives on the front of its own sheet.
  // The reverse is intentionally blank, allowing the canonical right-to-left
  // page-turn animation to remain unchanged.
  return NOTEBOOK_PARITY_PAGES.flatMap(page => [
    page,
    { title: '', body: '', kind: 'text' as const },
  ])
}

/**
 * The native renderer historically reads getBoundingClientRect() as though it
 * were its physical coordinate system. That couples its page/hinge/WebGL math to
 * any responsive transform applied by the exhibit.
 *
 * Keep the frozen renderer intact, but virtualize geometry reads for the native
 * stage subtree so they are expressed in stage-local CSS pixels. Uniform outer
 * translate/scale presentation then disappears from the engine's measurements,
 * while transforms that belong to the notebook itself remain represented.
 */
function installStageLocalMeasurementSpace(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('.stage')
  if (!stage) return () => undefined

  const nativeGetBoundingClientRect = Element.prototype.getBoundingClientRect
  const patched = new Set<Element>()

  const localRect = (element: Element) => {
    const stageVisual = nativeGetBoundingClientRect.call(stage)
    const elementVisual = nativeGetBoundingClientRect.call(element)

    const stageWidth = stage.offsetWidth || stageVisual.width || 1
    const stageHeight = stage.offsetHeight || stageVisual.height || 1
    const scaleX = stageVisual.width > 0 ? stageVisual.width / stageWidth : 1
    const scaleY = stageVisual.height > 0 ? stageVisual.height / stageHeight : 1

    return new DOMRect(
      (elementVisual.left - stageVisual.left) / scaleX,
      (elementVisual.top - stageVisual.top) / scaleY,
      elementVisual.width / scaleX,
      elementVisual.height / scaleY,
    )
  }

  const patch = (element: Element) => {
    if (patched.has(element)) return
    patched.add(element)
    Object.defineProperty(element, 'getBoundingClientRect', {
      configurable: true,
      value: () => localRect(element),
    })
  }

  patch(stage)
  for (const element of stage.querySelectorAll('*')) patch(element)

  return () => {
    for (const element of patched) {
      delete (element as Element & { getBoundingClientRect?: () => DOMRect }).getBoundingClientRect
    }
    patched.clear()
  }
}

function adaptNativeEngine(
  native: NativeNotebookEngine,
  profile: NotebookPhysicalProfile,
  releaseMeasurementSpace: () => void,
  host: HTMLElement,
): NotebookEngine {
  const pageCount = NOTEBOOK_PARITY_PAGES.length
  let authoredPage = 1

  const goToAuthoredPage = async (page: number) => {
    authoredPage = clampAuthoredPage(page, pageCount)
    await native.restore({
      state: 'OPEN',
      turned: turnedForAuthoredPage(profile, authoredPage),
    })
  }

  return {
    async open() {
      await native.open()
      authoredPage = 1
    },
    async close(side = 'front') {
      await native.close(side)
      authoredPage = side === 'back' ? pageCount : 1
    },
    goToPage: goToAuthoredPage,
    async goToSection(section) {
      const index = NOTEBOOK_PARITY_SECTIONS[section]
      if (index == null) throw new Error(`goToSection: unknown section "${section}"`)
      await goToAuthoredPage(index + 1)
    },
    async next() {
      const before = native.getState()
      await native.next()
      const after = native.getState()

      if (after.state === 'CLOSED_BACK') {
        authoredPage = pageCount
      } else if (after.turned !== before.turned) {
        authoredPage = authoredPageFromTurned(profile, after.turned, pageCount, 'forward')
      }
    },
    async previous() {
      const before = native.getState()
      await native.previous()
      const after = native.getState()

      if (after.state === 'CLOSED_FRONT') {
        authoredPage = 1
      } else if (after.turned !== before.turned) {
        authoredPage = authoredPageFromTurned(profile, after.turned, pageCount, 'backward')
      }
    },
    suspend: () => native.suspend(),
    resume: () => native.resume(),
    getState(): NotebookEngineState {
      const state = native.getState()
      return {
        position: toPosition(state.state),
        turned: state.turned,
        page: authoredPage,
      }
    },
    async restore(state: NotebookEngineState) {
      authoredPage = state.page == null
        ? authoredPageFromTurned(profile, state.turned, pageCount)
        : clampAuthoredPage(state.page, pageCount)

      const nativeState: Partial<NativeNotebookSnapshot> = {
        state: toNativePosition(state.position),
        turned: state.page == null
          ? state.turned
          : turnedForAuthoredPage(profile, authoredPage),
      }
      await native.restore(nativeState)
    },
    dispose() {
      native.dispose()
      releaseMeasurementSpace()
      delete host.dataset.notebookMeasurementSpace
    },
  }
}

export const mountNotebookEngine: MountNotebookEngine = async (host, options = {}) => {
  if (options.signal?.aborted) {
    throw new DOMException('Notebook mount aborted', 'AbortError')
  }

  const profile = options.profile || 'standard'
  const native = await mountNativeNotebook(host, {
    pages: buildPhysicalPages(profile),
    sectionToPage: NOTEBOOK_PARITY_SECTIONS,
    title: 'CUADERNO',
    signal: options.signal,
  })

  const releaseMeasurementSpace = installStageLocalMeasurementSpace(native.root)
  host.dataset.notebookMeasurementSpace = 'stage-local'

  // Re-solve native geometry immediately in its new local coordinate space
  // before the exhibit is allowed to activate responsive framing.
  window.dispatchEvent(new Event('resize'))

  return adaptNativeEngine(native, profile, releaseMeasurementSpace, host)
}
