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
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  justify-items: center;
  padding: .25rem 0 0;
  overflow: hidden;
}

.notebook-engine-host {
  width: 100%;
  height: 100%;
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
  width: min(100%, calc((100dvh - 12rem) * 1.5), 1500px);
}

/* The notebook is 3:2. Size it from BOTH dimensions of the actual exhibit
   slot so the complete physical object stays inside the remaining viewport. */
@supports (width: 1cqw) {
  .notebook-engine-host :deep(.nbn .stage) {
    width: min(100cqw, calc(100cqh * 1.5), 1500px);
  }
}

/* Native Lab parity: while the front board is closed, the page-edge drag
   zones must not sit above the cover. The cover itself owns the opening drag. */
.notebook-engine-host :deep(.nbn .book.closed ~ .grab) {
  display: none;
}

.notebook-status {
  margin: .5rem 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: .8rem;
  opacity: .7;
}

.notebook-error {
  color: #b45442;
  opacity: 1;
}

.notebook-controls {
  display: flex;
  gap: .5rem;
  margin-top: .35rem;
  flex: none;
}

.notebook-controls button {
  border: 1px solid rgba(224, 203, 166, .2);
  border-radius: 5px;
  padding: .45rem .7rem;
  background: rgba(66, 48, 30, .72);
  color: #e8e0d2;
  font: 13px/1.2 Georgia, serif;
  cursor: pointer;
}

.notebook-controls button:hover {
  background: rgba(83, 60, 37, .84);
}
</style>
