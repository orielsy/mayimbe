<script setup lang="ts">
import type { NotebookEngine, NotebookEngineState } from '~~/exhibits/notebook/engine/contract'
import { NOTEBOOK_NATIVE_SOURCE } from '~~/exhibits/notebook/engine/source'

defineProps<{ target?: unknown }>()

type MobileFocus = 'left' | 'right'
type MobileInspect = 'overview' | 'left' | 'right'
type MobilePresentation = 'focus' | 'inspect'

const route = useRoute()
const host = useTemplateRef<HTMLElement>('host')
const notebook = useNotebookRuntime()
const engine = shallowRef<NotebookEngine | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const mobilePortrait = ref(false)
const mobileFocus = ref<MobileFocus>('right')
const mobileInspect = ref<MobileInspect>('overview')
const abortController = new AbortController()
let mobileMedia: MediaQueryList | null = null

/*
 * Temporary comparison switch, deliberately outside the notebook contract.
 *
 *   /museum/notebook                 -> Experiment A: persistent face focus
 *   /museum/notebook?mobile=inspect  -> Experiment B: full object + inspect
 *
 * Neither behavior is canonical yet.
 */
const mobilePresentation = computed<MobilePresentation>(() =>
  route.query.mobile === 'inspect' ? 'inspect' : 'focus',
)

function focusForRestingState(state: NotebookEngineState, direction: 'initial' | 'forward' | 'backward' = 'initial') {
  if (!mobilePortrait.value || mobilePresentation.value !== 'focus') return

  if (state.position === 'closed-front') {
    mobileFocus.value = 'right'
    return
  }

  if (state.position === 'closed-back') {
    mobileFocus.value = 'left'
    return
  }

  if (state.turned === 0) {
    mobileFocus.value = 'right'
    return
  }

  // Experiment A: a forward physical turn lands on the new left-hand page.
  // A backward physical turn lands on the facing right-hand page.
  mobileFocus.value = direction === 'backward' ? 'right' : 'left'
}

function resetMobilePresentation() {
  mobileInspect.value = 'overview'
  if (!mobilePortrait.value) {
    mobileFocus.value = 'right'
    return
  }
  if (engine.value) focusForRestingState(engine.value.getState())
}

function syncMobileMode(event?: MediaQueryListEvent) {
  mobilePortrait.value = event ? event.matches : Boolean(mobileMedia?.matches)
  resetMobilePresentation()
}

watch(mobilePresentation, () => resetMobilePresentation())

onMounted(async () => {
  mobileMedia = window.matchMedia('(max-width: 640px) and (orientation: portrait)')
  syncMobileMode()
  mobileMedia.addEventListener('change', syncMobileMode)

  if (!host.value) return

  try {
    const { mountNotebookEngine } = await import('~~/exhibits/notebook/engine/mount')
    if (abortController.signal.aborted || !host.value) return

    const mounted = await mountNotebookEngine(host.value, {
      signal: abortController.signal,
    })

    if (abortController.signal.aborted) {
      mounted.dispose()
      return
    }

    engine.value = mounted
    await notebook.attachEngine(mounted)
    resetMobilePresentation()
  } catch (cause) {
    if (!abortController.signal.aborted) {
      error.value = cause instanceof Error ? cause.message : String(cause)
    }
  } finally {
    if (!abortController.signal.aborted) loading.value = false
  }
})

onBeforeUnmount(() => {
  abortController.abort()
  mobileMedia?.removeEventListener('change', syncMobileMode)
  mobileMedia = null
  if (engine.value) {
    notebook.detachEngine(engine.value)
    engine.value.dispose()
    engine.value = null
  }
})

function inspectPage(event: MouseEvent) {
  if (
    !mobilePortrait.value
    || mobilePresentation.value !== 'inspect'
    || engine.value?.getState().position !== 'open'
  ) return

  const target = event.target as Element | null
  const half = target?.closest('.half') as HTMLElement | null
  if (!half || !host.value?.contains(half)) return

  // Do not zoom an intentionally absent face (first/last asymmetric spread).
  if (!half.querySelector('.leaf:not(.absent)')) return

  const side: Exclude<MobileInspect, 'overview'> = half.classList.contains('left') ? 'left' : 'right'
  mobileInspect.value = mobileInspect.value === side ? 'overview' : side
}

const previous = async () => {
  const current = engine.value
  if (!current) return

  const before = current.getState()

  // Experiment A only: when both faces are physically open, right -> left is
  // a viewpoint move rather than another physical sheet turn.
  if (
    mobilePortrait.value
    && mobilePresentation.value === 'focus'
    && before.position === 'open'
    && before.turned > 0
    && mobileFocus.value === 'right'
  ) {
    mobileFocus.value = 'left'
    return
  }

  await current.previous()
  const after = current.getState()

  if (mobilePresentation.value === 'inspect') {
    mobileInspect.value = 'overview'
    return
  }

  // Reopening the back cover exposes the final left-hand page; otherwise a
  // backward physical turn lands on the right-hand face of the prior spread.
  focusForRestingState(after, before.position === 'closed-back' ? 'forward' : 'backward')
}

const next = async () => {
  const current = engine.value
  if (!current) return

  const before = current.getState()

  // Experiment A only: traverse the visible spread one face at a time. Left ->
  // right changes framing without turning another physical sheet.
  if (
    mobilePortrait.value
    && mobilePresentation.value === 'focus'
    && before.position === 'open'
    && before.turned > 0
    && mobileFocus.value === 'left'
  ) {
    mobileFocus.value = 'right'
    return
  }

  await current.next()

  if (mobilePresentation.value === 'inspect') {
    mobileInspect.value = 'overview'
    return
  }

  focusForRestingState(current.getState(), 'forward')
}
</script>

<template>
  <article class="notebook-exhibit">
    <div
      ref="host"
      class="notebook-engine-host"
      :data-native-source="NOTEBOOK_NATIVE_SOURCE.route"
      :data-mobile-portrait="mobilePortrait ? 'true' : undefined"
      :data-mobile-presentation="mobilePortrait ? mobilePresentation : undefined"
      :data-mobile-focus="mobilePortrait && mobilePresentation === 'focus' ? mobileFocus : undefined"
      :data-mobile-inspect="mobilePortrait && mobilePresentation === 'inspect' ? mobileInspect : undefined"
      aria-label="Cuaderno exhibit"
      @click="inspectPage"
    />

    <p v-if="loading" class="notebook-status">Preparing the Cuaderno…</p>
    <p v-else-if="error" class="notebook-status notebook-error">{{ error }}</p>

    <nav v-if="engine && !error" class="notebook-controls" aria-label="Notebook controls">
      <button type="button" @click="previous">◀ Back</button>
      <button type="button" @click="next">Forward ▶</button>
    </nav>
  </article>
</template>

<style scoped>
.notebook-exhibit {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
}

/*
 * The object does not consume the entire museum viewport. The shell provides
 * a default focus envelope (currently ~80dvh), leaving the exhibit itself
 * independent from the museum's eventual desktop/mobile spatial composition.
 */
.notebook-engine-host {
  width: 100%;
  height: min(var(--museum-focus-block, 80dvh), 100%);
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
  container-type: size;
}

.notebook-engine-host :deep(.nbn) {
  width: 100%;
  height: 100%;
  justify-content: center;
}

/* Fallback for browsers without container query units. */
.notebook-engine-host :deep(.nbn .stage) {
  width: min(94vw, calc(80dvh * 1.5), 1500px);
}

/* The native notebook is 3:2. Size from BOTH dimensions of the focus envelope
   so the complete physical object remains visible in every resting state. */
@supports (width: 1cqw) {
  .notebook-engine-host :deep(.nbn .stage) {
    width: min(96cqw, calc(96cqh * 1.5), 1500px);
  }
}

/* Native Lab parity: while the front board is closed, the page-edge drag
   zones must not sit above the cover. The cover itself owns the opening drag. */
.notebook-engine-host :deep(.nbn .book.closed ~ .grab) {
  display: none;
}

.notebook-status {
  position: absolute;
  left: 50%;
  bottom: 4dvh;
  translate: -50% 0;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: .8rem;
  opacity: .7;
}

.notebook-error {
  color: #b45442;
  opacity: 1;
}

/* Temporary direct controls while the spatial/miniature navigator is still
   being designed. Keep them out of the notebook's sizing math so they do not
   turn the exhibit back into a card-with-buttons layout. */
.notebook-controls {
  position: absolute;
  left: 50%;
  bottom: clamp(.7rem, 2.2dvh, 1.5rem);
  translate: -50% 0;
  display: flex;
  gap: .5rem;
  margin: 0;
  z-index: 20;
  opacity: .58;
  transition: opacity 140ms ease;
}

.notebook-controls:hover,
.notebook-controls:focus-within {
  opacity: 1;
}

.notebook-controls button {
  border: 1px solid rgba(224, 203, 166, .16);
  border-radius: 999px;
  padding: .4rem .65rem;
  background: rgba(31, 22, 15, .48);
  color: rgba(232, 224, 210, .8);
  backdrop-filter: blur(7px);
  font: 12px/1.2 Georgia, serif;
  cursor: pointer;
}

.notebook-controls button:hover,
.notebook-controls button:focus-visible {
  background: rgba(62, 44, 28, .78);
  color: #f0e7d8;
}

@media (max-width: 640px) and (orientation: portrait) {
  /* Oversized block-level stages stop honoring auto centering once wider than
     their container. Establish an explicit 50% origin so both experiments can
     move relative to the actual center of the physical spread. */
  .notebook-engine-host[data-mobile-portrait='true'] :deep(.nbn .stage) {
    left: 50%;
    margin-inline: 0;
    transform-origin: 50% 50%;
  }

  /*
   * EXPERIMENT A — persistent single-face focus.
   * Keep the native two-page notebook intact, enlarge it until one face is
   * approximately phone-width, then move the physical spread underneath the
   * portrait viewport as reading progresses.
   */
  .notebook-engine-host[data-mobile-presentation='focus'] :deep(.nbn .stage) {
    width: min(184cqw, calc(96cqh * 1.5));
    transition: transform 360ms cubic-bezier(.22, .74, .22, 1);
  }

  .notebook-engine-host[data-mobile-presentation='focus'][data-mobile-focus='left'] :deep(.nbn .stage) {
    transform: translateX(-25%);
  }

  .notebook-engine-host[data-mobile-presentation='focus'][data-mobile-focus='right'] :deep(.nbn .stage) {
    transform: translateX(-75%);
  }

  /*
   * EXPERIMENT B — object overview + temporary inspection.
   * The complete open notebook remains the resting composition. Tapping an
   * existing face enlarges it for reading; tapping that same face again returns
   * to the physical overview. Sheet navigation always occurs from the engine
   * and returns to overview when it settles.
   */
  .notebook-engine-host[data-mobile-presentation='inspect'] :deep(.nbn .stage) {
    width: min(98cqw, calc(96cqh * 1.5));
    transform: translateX(-50%);
    transition:
      width 360ms cubic-bezier(.22, .74, .22, 1),
      transform 360ms cubic-bezier(.22, .74, .22, 1);
  }

  .notebook-engine-host[data-mobile-presentation='inspect'][data-mobile-inspect='left'] :deep(.nbn .stage) {
    width: min(184cqw, calc(96cqh * 1.5));
    transform: translateX(-25%);
  }

  .notebook-engine-host[data-mobile-presentation='inspect'][data-mobile-inspect='right'] :deep(.nbn .stage) {
    width: min(184cqw, calc(96cqh * 1.5));
    transform: translateX(-75%);
  }

  /* The production edge strips still mean "turn a sheet" while Experiment A
     sometimes means "move viewpoint", and Experiment B adds page inspection.
     Disable direct strips for both prototypes rather than mix gesture models
     before either concept has earned a real touch interaction design. */
  .notebook-engine-host[data-mobile-portrait='true'] :deep(.nbn .grab) {
    pointer-events: none;
  }

  .notebook-controls {
    bottom: max(.55rem, env(safe-area-inset-bottom));
  }
}
</style>
