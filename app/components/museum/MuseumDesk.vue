<script setup lang="ts">
import NotebookCoverFront from '~/components/notebook/NotebookCoverFront.vue'
import '~/assets/css/notebook-page-turner.css'

const { go } = useMuseumNavigator()

const notebook = {
  id: 'notebook',
  target: 'early-years',
}
</script>

<template>
  <div class="museum-desk" aria-label="Museum desk">
    <button
      class="museum-artifact museum-artifact--notebook"
      type="button"
      data-testid="museum-notebook-artifact"
      aria-label="Open the El Mayimbe notebook"
      @click="go({ kind: 'exhibit', exhibit: notebook.id, target: notebook.target })"
    >
      <span class="museum-notebook-shell" aria-hidden="true">
        <NotebookCoverFront />
      </span>
      <span class="visually-hidden">Open notebook exhibit</span>
    </button>
  </div>
</template>
