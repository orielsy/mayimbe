<script setup lang="ts">
import { ref } from 'vue'
import NotebookCoverFront from '~/components/notebook/NotebookCoverFront.vue'
import '~/assets/css/notebook-page-turner.css'

const notebookRef = ref<HTMLButtonElement | null>(null)
const { pickup, deskHidden } = useNotebookArtifactTransition()

function openNotebook() {
  if (!notebookRef.value) return
  void pickup(notebookRef.value)
}
</script>

<template>
  <div class="museum-desk" aria-label="Museum desk">
    <button
      ref="notebookRef"
      :class="[
        'museum-artifact',
        'museum-artifact--notebook',
        { 'museum-artifact--transition-hidden': deskHidden },
      ]"
      type="button"
      data-testid="museum-notebook-artifact"
      data-notebook-transition-anchor="desk"
      data-notebook-transition-rotation="-3"
      aria-label="Open the El Mayimbe notebook"
      @click="openNotebook"
    >
      <span class="museum-notebook-shell" aria-hidden="true">
        <NotebookCoverFront presentation="desk" />
      </span>
      <span class="visually-hidden">Open notebook exhibit</span>
    </button>
  </div>
</template>

<style scoped>
.museum-artifact--transition-hidden {
  visibility: hidden;
}
</style>
