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
const frameReady = ref(false)
const webglDebug = computed(() => route.query.notebookDebug === 'webgl')
const webglDiagnostics = ref<Record<string, unknown>[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const abortController = new AbortController()

let resizeObserver: ResizeObserver | null = null
let resizeTimer: number | undefined
let mounting = false
let queuedProfile: NotebookPhysicalProfile | null = null
let framingRaf = 0

function onWebGLDiagnostic(event: Event) {
  if (!webglDebug.value) return
  const detail = (event as CustomEvent<Record<string, unknown>>).detail
  webglDiagnostics.value = [...webglDiagnostics.value.slice(-3), detail]
}

async function copyWebGLDiagnostics() {
  await navigator.clipboard.writeText(JSON.stringify(webglDiagnostics.value, null, 2))
}

function resolveRequestedProfile(width: number, height: number): NotebookPhysicalProfile {
  const requested = route.query.notebookProfile
  if (requested === 'standard' || requested === 'pocket') return requested
  return resolveNotebookProfile(width, height)
}

function refreshNativeGeometryAfterFraming() {
  if (framingRaf) window.cancelAnimationFrame(framingRaf)
  framingRaf = window.requestAnimationFrame(() => {
    framingRaf = window.requestAnimationFrame(() => {
      framingRaf = 0
      if (!abortController.signal.aborted) window.dispatchEvent(new Event('resize'))
    })
  })
}

async function mountProfile(nextProfile: NotebookPhysicalProfile) {
  const container = host.value
  if (!container || abortController.signal.aborted) return

  if (mounting) {
    queuedProfile = nextProfile
    return
  }

  if (engine.value && profile.value === nextProfile) return

  mounting = true
  frameReady.value = false
  loading.value = true
  error.value = null

  const previousEngine = engine.value
  if (previousEngine) {
    notebook.detachEngine(previousEngine)
    previousEngine.dispose()
    engine.value = null
  }

  profile.value = nextProfile

  try {
    // The native renderer always mounts unframed. mountNotebookEngine installs
    // its stage-local measurement boundary before returning to the exhibit.
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

    // Responsive framing belongs to the exhibit, not the physical renderer.
    // Activate it only after the native engine is fully mounted and measuring
    // itself in canonical stage-local coordinates.
    frameReady.value = true
    await nextTick()
    refreshNativeGeometryAfterFraming()
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
  window.addEventListener('mayimbe:notebook-webgl', onWebGLDiagnostic)

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
  window.removeEventListener('mayimbe:notebook-webgl', onWebGLDiagnostic)
  resizeObserver?.disconnect()
  resizeObserver = null
  if (resizeTimer !== undefined) window.clearTimeout(resizeTimer)
  if (framingRaf) window.cancelAnimationFrame(framingRaf)
  framingRaf = 0

  if (engine.value) {
    notebook.detachEngine(engine.value)
    engine.value.dispose()
    engine.value = null
  }
})
</script>

<template>
  <article class="notebook-exhibit">
    <div class="notebook-presentation-viewport">
      <div
        class="notebook-presentation-frame"
        :data-notebook-profile="profile"
        :data-frame-ready="frameReady ? 'true' : 'false'"
      >
        <div
          ref="host"
          class="notebook-engine-host"
          :data-native-source="NOTEBOOK_NATIVE_SOURCE.route"
          :data-notebook-profile="profile"
          aria-label="Cuaderno exhibit"
        />
      </div>
    </div>

    <p v-if="loading" class="notebook-status">Preparing the Cuaderno…</p>
    <p v-else-if="error" class="notebook-status notebook-error">{{ error }}</p>

    <nav v-if="engine && !error" class="notebook-controls" aria-label="Notebook controls">
      <button type="button" aria-keyshortcuts="ArrowLeft" @click="previous">◀ Back</button>
      <button type="button" aria-keyshortcuts="ArrowRight" @click="next">Forward ▶</button>
    </nav>

    <aside v-if="webglDebug" class="notebook-debug">
      <button type="button" @click="copyWebGLDiagnostics">Copy diagnostics</button>
      <pre>{{ JSON.stringify(webglDiagnostics, null, 2) }}</pre>
    </aside>
  </article>
</template>

<style scoped>
.notebook-exhibit {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/*
 * Presentation/camera boundary. The viewport clips museum presentation; the
 * frame may move the completed canonical notebook without changing its native
 * coordinate system.
 */
.notebook-presentation-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.notebook-presentation-frame {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

/* Pocket focuses the right working face of the same canonical 3:2 notebook.
 * Use layout width/position rather than a transform: Android Chrome can corrupt
 * the mixed DOM/WebGL layers when their shared ancestor is scaled. A frame that
 * is twice the viewport width and right-aligned produces the same 2x camera
 * composition without placing the notebook inside a transformed compositor
 * layer. Activate it only after mountNotebookEngine has virtualized native
 * geometry into stage-local pixels. */
.notebook-presentation-frame[data-notebook-profile='pocket'][data-frame-ready='true'] {
  width: 200%;
  right: 0;
  left: auto;
}

/* In a forced Pocket test on a landscape/desktop-shaped Android viewport, keep
 * the camera useful without enlarging the layout by a full 2x. */
@media (orientation: landscape) {
  .notebook-presentation-frame[data-notebook-profile='pocket'][data-frame-ready='true'] {
    width: 125%;
  }
}

/* Pointer input is intentionally disabled for this troubleshooting phase.
 * Buttons and keyboard are the only navigation paths until framing stability is
 * proven on the real Android device. */
.notebook-engine-host {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  place-items: center;
  overflow: visible;
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

/* The native engine owns exactly one physical stage geometry. Standard and
 * Pocket both mount this same 3:2 coordinate system. */
.notebook-engine-host :deep(.nbn .stage) {
  width: min(94vw, calc(96dvh * 1.5), 1500px);
  aspect-ratio: 3 / 2;
  position: relative;
  left: 0;
  margin-inline: auto;
  transform: none;
}

@supports (width: 1cqw) {
  .notebook-engine-host :deep(.nbn .stage) {
    width: min(96cqw, calc(96cqh * 1.5), 1500px);
  }
}

/* Resting content belongs to semantic DOM. WebGL only rises above it while an
 * actual physical turn is active. */
.notebook-engine-host :deep(.nbn canvas.gl) {
  z-index: 0;
}

.notebook-engine-host :deep(.nbn canvas.gl.active) {
  z-index: 5;
}

/* Pocket changes pagination semantics, not native geometry. Reverse faces are
 * intentionally blank; suppress temporary physical face numbering. */
.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .pagenum) {
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

.notebook-debug {
  position: absolute;
  inset: .5rem .5rem auto;
  z-index: 100;
  max-height: 42dvh;
  overflow: auto;
  padding: .5rem;
  border: 1px solid rgba(255, 210, 140, .45);
  background: rgba(10, 8, 7, .92);
  color: #f2d5a4;
  font: 10px/1.3 ui-monospace, monospace;
}

.notebook-debug button {
  position: sticky;
  top: 0;
  min-height: 2.5rem;
}

.notebook-debug pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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
