<script setup lang="ts">
import type { NotebookEngine } from '~~/exhibits/notebook/engine/contract'
import { NOTEBOOK_NATIVE_SOURCE } from '~~/exhibits/notebook/engine/source'

defineProps<{ target?: unknown }>()

const host = useTemplateRef<HTMLElement>('host')
const notebook = useNotebookRuntime()
const engine = shallowRef<NotebookEngine | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const abortController = new AbortController()

onMounted(async () => {
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
  if (engine.value) {
    notebook.detachEngine(engine.value)
    engine.value.dispose()
    engine.value = null
  }
})

const previous = () => engine.value?.previous()
const next = () => engine.value?.next()
</script>

<template>
  <article class="notebook-exhibit">
    <div
      ref="host"
      class="notebook-engine-host"
      :data-native-source="NOTEBOOK_NATIVE_SOURCE.route"
      aria-label="Cuaderno exhibit"
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

@media (max-width: 640px) {
  .notebook-engine-host :deep(.nbn .stage) {
    width: min(98cqw, calc(96cqh * 1.5));
  }

  .notebook-controls {
    bottom: max(.55rem, env(safe-area-inset-bottom));
  }
}
</style>
