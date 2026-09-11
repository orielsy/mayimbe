<script setup lang="ts">
import { computed, ref } from 'vue'
import NotebookCoverFront from '~/components/notebook/NotebookCoverFront.vue'
import '~/assets/css/notebook-page-turner.css'

const notebookRef = ref<HTMLButtonElement | null>(null)
const { locale } = useSiteLocale()
const { pickup, deskHidden } = useNotebookArtifactTransition()

const copy = computed(() => locale.value === 'es'
  ? {
      desk: 'Escritorio del museo',
      openNotebook: 'Abrir el cuaderno El Mayimbe',
      openExhibit: 'Abrir la exhibición del cuaderno',
    }
  : {
      desk: 'Museum desk',
      openNotebook: 'Open the El Mayimbe notebook',
      openExhibit: 'Open notebook exhibit',
    })

function openNotebook() {
  if (!notebookRef.value) return
  void pickup(notebookRef.value)
}
</script>

<template>
  <div class="museum-desk" :aria-label="copy.desk">
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
      :aria-label="copy.openNotebook"
      @click="openNotebook"
    >
      <span class="museum-notebook-shell" aria-hidden="true">
        <NotebookCoverFront presentation="desk" />
      </span>
      <span class="visually-hidden">{{ copy.openExhibit }}</span>
    </button>
  </div>
</template>

<style scoped>
.museum-artifact--transition-hidden {
  visibility: hidden;
}
</style>
