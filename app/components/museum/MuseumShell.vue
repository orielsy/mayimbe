<script setup lang="ts">
const { state } = useMuseum()
</script>

<template>
  <section class="museum-stage" aria-label="Mayimbe museum shell">
    <MuseumDesk />

    <NotebookExhibit
      v-if="state.activeExhibit === 'notebook'"
      :target="state.destination.target"
    />
    <ListeningExhibit
      v-else-if="state.activeExhibit === 'listening'"
      :target="state.destination.target"
    />
    <AlbumExhibit
      v-else-if="state.activeExhibit === 'albums'"
      :target="state.destination.target"
    />
    <PhotoExhibit
      v-else-if="state.activeExhibit === 'photos'"
      :target="state.destination.target"
    />
    <div v-else class="exhibit-placeholder">
      <p class="eyebrow">Desk overview</p>
      <h2>The spatial museum shell is alive.</h2>
      <p class="muted">Choose a placeholder object above. The final desk artwork comes later.</p>
    </div>
  </section>
</template>
