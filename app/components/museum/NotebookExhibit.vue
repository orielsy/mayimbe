<script setup lang="ts">
import type { NotebookEngine, NotebookPhysicalProfile } from '~~/exhibits/notebook/engine/contract'
import { resolveNotebookProfile } from '~~/exhibits/notebook/engine/profiles'
import { NOTEBOOK_NATIVE_SOURCE } from '~~/exhibits/notebook/engine/source'

defineProps<{ target?: unknown }>()

const route = useRoute()
const host = useTemplateRef<HTMLElement>('host')
const notebook = useNotebookRuntime()
const engine = shallowRef<NotebookEngine | null>(null)
const profile = ref<NotebookPhysicalProfile>('standard')
const loading = ref(true)
const error = ref<string | null>(null)
const abortController = new AbortController()

let resizeObserver: ResizeObserver | null = null
let resizeTimer: number | undefined
let mounting = false
let queuedProfile: NotebookPhysicalProfile | null = null

function resolveRequestedProfile(width: number, height: number): NotebookPhysicalProfile {
  const requested = route.query.notebookProfile
  if (requested === 'standard' || requested === 'pocket') return requested
  return resolveNotebookProfile(width, height)
}

/* Keep the diagnostic geometry override while Pocket settles. It lets us pair
 * Pocket's simplex sheet semantics with Standard geometry without changing the
 * engine or content model. */
const geometryProfile = computed<NotebookPhysicalProfile>(() => {
  const requested = route.query.notebookGeometry
  if (requested === 'standard' || requested === 'pocket') return requested
  return profile.value
})

async function mountProfile(nextProfile: NotebookPhysicalProfile) {
  const container = host.value
  if (!container || abortController.signal.aborted) return

  if (mounting) {
    queuedProfile = nextProfile
    return
  }

  if (engine.value && profile.value === nextProfile) return

  mounting = true
  loading.value = true
  error.value = null

  const previous = engine.value
  if (previous) {
    notebook.detachEngine(previous)
    previous.dispose()
    engine.value = null
  }

  profile.value = nextProfile

  try {
    await nextTick()

    const { mountNotebookEngine } = await import('~~/exhibits/notebook/engine/mount')
    if (abortController.signal.aborted || !host.value) return

    const mounted = await mountNotebookEngine(host.value, {
      signal: abortController.signal,
      profile: nextProfile,
    })

    if (abortController.signal.aborted) {
      mounted.dispose()
      return
    }

    engine.value = mounted
    await notebook.attachEngine(mounted)
  } catch (cause) {
    if (!abortController.signal.aborted) {
      error.value = cause instanceof Error ? cause.message : String(cause)
    }
  } finally {
    mounting = false
    if (!abortController.signal.aborted) loading.value = false

    const queued = queuedProfile
    queuedProfile = null
    if (queued && queued !== profile.value && !abortController.signal.aborted) {
      void mountProfile(queued)
    }
  }
}

function scheduleProfile(width: number, height: number) {
  const nextProfile = resolveRequestedProfile(width, height)
  if (nextProfile === profile.value && engine.value) return

  if (resizeTimer !== undefined) window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    resizeTimer = undefined
    void mountProfile(nextProfile)
  }, 140)
}

const previous = async () => {
  await engine.value?.previous()
}

const next = async () => {
  await engine.value?.next()
}

function isEditableTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null
  return Boolean(
    element?.isContentEditable
    || element?.closest('input, textarea, select, [contenteditable="true"]'),
  )
}

function onNotebookKeydown(event: KeyboardEvent) {
  if (
    !engine.value
    || event.defaultPrevented
    || event.repeat
    || event.altKey
    || event.ctrlKey
    || event.metaKey
    || event.shiftKey
    || isEditableTarget(event.target)
  ) return

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    void previous()
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    void next()
  }
}

onMounted(async () => {
  if (!host.value) return

  window.addEventListener('keydown', onNotebookKeydown)

  const rect = host.value.getBoundingClientRect()
  profile.value = resolveRequestedProfile(rect.width, rect.height)
  await mountProfile(profile.value)

  if (abortController.signal.aborted || !host.value) return

  resizeObserver = new ResizeObserver(entries => {
    const entry = entries[0]
    if (!entry) return
    scheduleProfile(entry.contentRect.width, entry.contentRect.height)
  })
  resizeObserver.observe(host.value)
})

watch(
  () => route.query.notebookProfile,
  () => {
    if (!host.value || abortController.signal.aborted) return
    const rect = host.value.getBoundingClientRect()
    scheduleProfile(rect.width, rect.height)
  },
)

onBeforeUnmount(() => {
  abortController.abort()
  window.removeEventListener('keydown', onNotebookKeydown)
  resizeObserver?.disconnect()
  resizeObserver = null
  if (resizeTimer !== undefined) window.clearTimeout(resizeTimer)

  if (engine.value) {
    notebook.detachEngine(engine.value)
    engine.value.dispose()
    engine.value = null
  }
})
</script>

<template>
  <article class="notebook-exhibit">
    <div
      ref="host"
      class="notebook-engine-host"
      :data-native-source="NOTEBOOK_NATIVE_SOURCE.route"
      :data-notebook-profile="profile"
      :data-notebook-geometry="geometryProfile"
      aria-label="Cuaderno exhibit"
    />

    <p v-if="loading" class="notebook-status">Preparing the Cuaderno…</p>
    <p v-else-if="error" class="notebook-status notebook-error">{{ error }}</p>

    <nav v-if="engine && !error" class="notebook-controls" aria-label="Notebook controls">
      <button type="button" aria-keyshortcuts="ArrowLeft" @click="previous">◀ Back</button>
      <button type="button" aria-keyshortcuts="ArrowRight" @click="next">Forward ▶</button>
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

/* The viewport owns the focused exhibit. Pointer input stays disabled while we
 * finish Pocket's physical composition; buttons and keyboard remain the stable
 * troubleshooting/navigation path. */
.notebook-engine-host {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  place-items: center;
  overflow: hidden;
  container-type: size;
  pointer-events: none;
}

.notebook-engine-host :deep(.nbn) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 100%;
  justify-content: center;
}

/* Resting content belongs to semantic DOM. WebGL only rises above it while an
 * actual physical turn is active. */
.notebook-engine-host :deep(.nbn canvas.gl) {
  z-index: 0;
}

.notebook-engine-host :deep(.nbn canvas.gl.active) {
  z-index: 5;
}

/* Standard: canonical two-page spread. */
.notebook-engine-host[data-notebook-geometry='standard'] :deep(.nbn .stage) {
  width: min(94vw, calc(96dvh * 1.5), 1500px);
  aspect-ratio: 3 / 2;
  position: relative;
  left: 0;
  margin-inline: auto;
  transform: none;
}

/* Pocket is a genuinely different physical notebook, not an oversized Standard
 * spread. The complete stage stays inside the exhibit host and represents one
 * tall page footprint. The native renderer still measures the active leaf and
 * hinge from the DOM, so the same Three page mesh can turn around the left edge. */
.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .stage) {
  width: min(92vw, calc(82dvh * .666667), 520px);
  aspect-ratio: 2 / 3;
  position: relative;
  left: 0;
  margin-inline: auto;
  transform: none;
}

@supports (width: 1cqw) {
  .notebook-engine-host[data-notebook-geometry='standard'] :deep(.nbn .stage) {
    width: min(96cqw, calc(96cqh * 1.5), 1500px);
  }

  .notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .stage) {
    width: min(92cqw, calc(82cqh * .666667), 520px);
  }
}

/* One-page Pocket mechanics. The authored sheet is the full visible footprint;
 * turned sheets leave through the binding at the left rather than requiring a
 * second resting page to remain laid out offscreen. */
.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .spread) {
  grid-template-columns: 0 minmax(0, 1fr);
  gap: 0;
  padding: 8px;
  clip-path: inset(-40px -40px -40px calc((1 - var(--openx)) * 100%));
}

/* Keep a zero-width left half in layout because the native engine measures its
 * right edge to resolve the physical hinge. It is invisible, not display:none. */
.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .half.left) {
  width: 0;
  min-width: 0;
  overflow: hidden;
  visibility: hidden;
}

.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .half.left::before) {
  display: none;
}

.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .half.right) {
  min-width: 0;
}

/* In Pocket the front/back boards occupy the same single-page footprint. */
.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .backcover),
.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .frontboard) {
  left: calc(-1 * var(--boardout));
  right: calc(-1 * var(--boardout));
  border-radius: 9px;
}

/* The old desk-shadow scaling assumes a two-page spread. Pocket's shadow stays
 * attached to its one-page footprint instead. */
.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .deskshadow) {
  transform: none;
  transform-origin: 50% 50%;
}

/* Binding cues move from the center gutter to the Pocket notebook's left edge. */
.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .hingeshade) {
  left: 8px;
  right: auto;
  width: clamp(20px, 10%, 46px);
  background: linear-gradient(90deg, rgba(20,12,5,.46), rgba(20,12,5,.20) 22%, rgba(20,12,5,.06) 58%, rgba(20,12,5,0) 100%);
}

.notebook-engine-host[data-notebook-geometry='pocket'] :deep(.nbn .crease) {
  left: 8px;
}

/* Pocket reverse faces are intentionally blank. */
.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .pagenum) {
  display: none;
}

.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .page-content h2) {
  font-size: clamp(19px, 5.4vw, 28px);
}

.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .page-content p) {
  font-size: clamp(13px, 3.7vw, 16px);
  line-height: 1.55;
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

/* Temporary deterministic controls while pointer navigation is disabled. */
.notebook-controls {
  position: absolute;
  left: 50%;
  bottom: clamp(.8rem, 2.4dvh, 1.6rem);
  translate: -50% 0;
  display: flex;
  gap: .6rem;
  margin: 0;
  z-index: 20;
  opacity: .92;
}

.notebook-controls button {
  min-height: 2.5rem;
  border: 1px solid rgba(224, 203, 166, .24);
  border-radius: 999px;
  padding: .5rem .8rem;
  background: rgba(31, 22, 15, .72);
  color: rgba(242, 234, 220, .94);
  backdrop-filter: blur(7px);
  font: 13px/1.2 Georgia, serif;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
}

.notebook-controls button:hover,
.notebook-controls button:focus-visible {
  background: rgba(62, 44, 28, .88);
  color: #f0e7d8;
}

@media (max-width: 640px) {
  .notebook-controls {
    bottom: max(.7rem, env(safe-area-inset-bottom));
  }
}
</style>
