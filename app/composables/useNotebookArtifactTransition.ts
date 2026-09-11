import { computed, nextTick } from 'vue'

type NotebookTransitionDirection = 'pickup' | 'putdown'
type NotebookTransitionPhase = 'idle' | 'start' | 'lift' | 'travel' | 'settle'

export interface NotebookTransitionRect {
  left: number
  top: number
  width: number
  height: number
  rotation: number
}

export interface NotebookArtifactTransitionState {
  direction: NotebookTransitionDirection | null
  phase: NotebookTransitionPhase
  from: NotebookTransitionRect | null
  to: NotebookTransitionRect | null
}

const PICKUP_LIFT_MS = 180
const TRAVEL_MS = 540
const SETTLE_MS = 140
const ANCHOR_TIMEOUT_MS = 1400

const idleState = (): NotebookArtifactTransitionState => ({
  direction: null,
  phase: 'idle',
  from: null,
  to: null,
})

function wait(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms))
}

async function nextPaint() {
  await nextTick()
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

function snapshot(element: HTMLElement): NotebookTransitionRect {
  const rect = element.getBoundingClientRect()
  const width = element.offsetWidth || rect.width
  const height = element.offsetHeight || rect.height
  const rotation = Number.parseFloat(element.dataset.notebookTransitionRotation ?? '0') || 0

  return {
    left: rect.left + ((rect.width - width) / 2),
    top: rect.top + ((rect.height - height) / 2),
    width,
    height,
    rotation,
  }
}

async function waitForAnchor(kind: 'desk' | 'focused') {
  const selector = `[data-notebook-transition-anchor="${kind}"]`
  const startedAt = performance.now()

  while (performance.now() - startedAt < ANCHOR_TIMEOUT_MS) {
    const element = document.querySelector<HTMLElement>(selector)
    if (element) return element
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }

  return null
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useNotebookArtifactTransition() {
  const { pathFor } = useSiteLocale()
  const state = useState<NotebookArtifactTransitionState>(
    'museum:notebook-artifact-transition',
    idleState,
  )

  const active = computed(() => state.value.phase !== 'idle')
  const deskHidden = computed(() => active.value)
  const focusedHidden = computed(() => active.value)

  function reset() {
    state.value = idleState()
  }

  async function pickup(source: HTMLElement) {
    if (import.meta.server || active.value) return

    if (prefersReducedMotion()) {
      await navigateTo(pathFor('/notebook'))
      return
    }

    state.value = {
      direction: 'pickup',
      phase: 'start',
      from: snapshot(source),
      to: null,
    }

    try {
      await nextPaint()
      state.value = { ...state.value, phase: 'lift' }
      await wait(PICKUP_LIFT_MS)

      await navigateTo(pathFor('/notebook'))
      const target = await waitForAnchor('focused')
      if (!target) {
        reset()
        return
      }

      state.value = {
        ...state.value,
        phase: 'travel',
        to: snapshot(target),
      }
      await wait(TRAVEL_MS)

      state.value = { ...state.value, phase: 'settle' }
      await wait(SETTLE_MS)
      reset()
    } catch (error) {
      reset()
      throw error
    }
  }

  async function putDown(source?: HTMLElement | null) {
    if (import.meta.server || active.value) return

    if (prefersReducedMotion()) {
      await navigateTo(pathFor('/'))
      return
    }

    const origin = source
      ?? document.querySelector<HTMLElement>('[data-notebook-transition-anchor="focused"]')

    if (!origin) {
      await navigateTo(pathFor('/'))
      return
    }

    state.value = {
      direction: 'putdown',
      phase: 'start',
      from: snapshot(origin),
      to: null,
    }

    try {
      await nextPaint()
      state.value = { ...state.value, phase: 'lift' }
      await wait(PICKUP_LIFT_MS)

      await navigateTo(pathFor('/'))
      const target = await waitForAnchor('desk')
      if (!target) {
        reset()
        return
      }

      state.value = {
        ...state.value,
        phase: 'travel',
        to: snapshot(target),
      }
      await wait(TRAVEL_MS)

      state.value = { ...state.value, phase: 'settle' }
      await wait(SETTLE_MS)
      reset()
    } catch (error) {
      reset()
      throw error
    }
  }

  return {
    state,
    active,
    deskHidden,
    focusedHidden,
    pickup,
    putDown,
  }
}
