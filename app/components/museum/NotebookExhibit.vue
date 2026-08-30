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
 *
 * Pointer input is intentionally disabled for this troubleshooting checkpoint.
 * Buttons and keyboard are the only notebook navigation paths until resting
 * DOM/WebGL handoff is proven stable on the real Android device.
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
  pointer-events: none;
}

.notebook-engine-host :deep(.nbn) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 100%;
  justify-content: center;
}

/* Resting content belongs to semantic DOM. Keep the WebGL sheet behind that DOM
 * unless the native engine explicitly activates it for a physical turn. */
.notebook-engine-host :deep(.nbn canvas.gl) {
  z-index: 0;
}

.notebook-engine-host :deep(.nbn canvas.gl.active) {
  z-index: 5;
}

/* Standard Cuaderno: canonical two-page, duplex spread. */
.notebook-engine-host[data-notebook-profile='standard'] :deep(.nbn .stage) {
  width: min(94vw, calc(96dvh * 1.5), 1500px);
  aspect-ratio: 3 / 2;
}

/*
 * Pocket Cuaderno: same complete side-bound physical object and same turn
 * mechanics, but each authored page owns one sheet. The right working face is
 * positioned into the constrained viewport using layout coordinates rather
 * than a CSS transform. Keeping the stage untransformed is intentional: Android
 * Chrome can otherwise composite the entire DOM/clip-path/WebGL subtree as one
 * transformed layer and lose resting cover/text content after an animation.
 */
.notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .stage) {
  --pocket-stage-shift: min(47vw, 30.667dvh, 275px);
  width: min(188vw, 122.67dvh, 1100px);
  aspect-ratio: 4 / 3;
  position: relative;
  left: calc(-1 * var(--pocket-stage-shift));
  margin-inline: 0;
  transform: none;
}

@supports (width: 1cqw) {
  .notebook-engine-host[data-notebook-profile='standard'] :deep(.nbn .stage) {
    width: min(96cqw, calc(96cqh * 1.5), 1500px);
  }

  .notebook-engine-host[data-notebook-profile='pocket'] :deep(.nbn .stage) {
    --pocket-stage-shift: min(47cqw, 30.667cqh, 275px);
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

/* Diagnostic controls: intentionally obvious/reliable while pointer navigation
   is disabled. They remain outside the notebook's sizing and renderer layers. */
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
