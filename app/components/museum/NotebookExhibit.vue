<script setup lang="ts">
import type { NotebookEngine, NotebookPhysicalProfile } from '~~/exhibits/notebook/engine/contract'
import { resolveNotebookProfile } from '~~/exhibits/notebook/engine/profiles'
import { NOTEBOOK_NATIVE_SOURCE } from '~~/exhibits/notebook/engine/source'

defineProps<{ target?: unknown }>()

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
    // The profile attribute must reach the host before the native renderer is
    // created: it controls the initial physical dimensions used for DOM→WebGL
    // texture capture as well as the resting DOM composition.
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
  const nextProfile = resolveNotebookProfile(width, height)
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
  profile.value = resolveNotebookProfile(rect.width, rect.height)
  await mountProfile(profile.value)

  if (abortController.signal.aborted || !host.value) return

  resizeObserver = new ResizeObserver(entries => {
    const entry = entries[0]
    if (!entry) return
    scheduleProfile(entry.contentRect.width, entry.contentRect.height)
  })
  resizeObserver.observe(host.value)
})

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

/*
 * In focused exhibit mode the viewport is the museum surface. This host is
 * merely the clipping/measurement window for the physical renderer; it should
 * never create a smaller visible panel inside that surface.
 */
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
}

.notebook-engine-host :deep(.nbn) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 100%;
  justify-content: center;
}

/* Standard Cuaderno: canonical two-page, duplex spread. */
.notebook-engine-host[data-notebook-profile='standard'] :deep(.nbn .stage) {
  width: min(94vw, calc(96dvh * 1.5), 1500px);
  aspect-ratio: 3 / 2;
}

/*
 * Pocket Cuaderno: same complete side-bound physical object and same turn
 * mechanics, but each authored page owns one sheet. The notebook itself is
 * taller/narrower and is statically positioned so the right working face fills
 * the constrained viewport; the left stack still exists physically offscreen.
 */
.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .stage) {
  width: min(188vw, 122.67dvh, 1100px);
  aspect-ratio: 4 / 3;
  margin-inline: 0;
  transform: translateX(-25%);
  transform-origin: 50% 50%;
}

@supports (width: 1cqw) {
  .notebook-engine-host[data-notebook-profile='standard'] :deep(.nbn .stage) {
    width: min(96cqw, calc(96cqh * 1.5), 1500px);
  }

  .notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .stage) {
    width: min(188cqw, 122.67cqh, 1100px);
  }
}

/* Pocket reverse faces are intentionally blank. Hide physical face numbers so
   the temporary native p.1/p.3 indexing does not leak into the authored model. */
.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .pagenum) {
  display: none;
}

.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .page-content h2) {
  font-size: clamp(18px, 5.2vw, 26px);
}

.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .page-content p) {
  font-size: clamp(13px, 3.6vw, 16px);
  line-height: 1.55;
}

/*
 * The native renderer already owns real pointer-drag mechanics. In Pocket the
 * far-left physical edge is intentionally outside the viewport, so relocate
 * only the previous-page hit strip to the visible gutter edge. The right strip
 * remains on the visible fore-edge and keeps the canonical forward drag.
 */
.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .grab) {
  width: 10%;
}

.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .grab.prev) {
  left: 50%;
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
   being designed. Keep them out of the notebook's sizing math. */
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

@media (max-width: 640px) {
  .notebook-controls {
    bottom: max(.55rem, env(safe-area-inset-bottom));
  }
}
</style>
