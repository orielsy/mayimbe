<script setup lang="ts">
import { NOTEBOOK_NATIVE_SOURCE } from '~~/exhibits/notebook/engine/source'

defineProps<{ target?: unknown }>()

const host = useTemplateRef<HTMLElement>('host')
const notebook = useNotebookRuntime()

// The host is now the real integration boundary. The native renderer is being
// extracted behind the NotebookEngine contract; it will mount directly here.
// No iframe or framework-inside-framework boundary is permitted.
void notebook
</script>

<template>
  <article class="notebook-exhibit">
    <div
      ref="host"
      class="notebook-engine-host"
      :data-native-source="NOTEBOOK_NATIVE_SOURCE.route"
      aria-label="Cuaderno exhibit"
    >
      <div class="exhibit-placeholder">
        <p class="eyebrow">Exhibit / Notebook</p>
        <h2>Native notebook host is ready.</h2>
        <p class="muted">Semantic target: <code>{{ String(target ?? 'overview') }}</code></p>
        <p>
          The production boundary now mounts the approved
          <code>/notebook-lab-native</code> engine directly into this host. The renderer itself is the next extraction step.
        </p>
      </div>
    </div>
  </article>
</template>
