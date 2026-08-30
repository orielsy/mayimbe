<script setup lang="ts">
import AlbumExhibit from './AlbumExhibit.vue'
import ListeningExhibit from './ListeningExhibit.vue'
import MuseumDesk from './MuseumDesk.vue'
import NotebookExhibit from './NotebookExhibit.vue'
import PhotoExhibit from './PhotoExhibit.vue'

const { state } = useMuseum()
const { go } = useMuseumNavigator()

const activeTarget = computed(() => (
  state.value.destination.kind === 'exhibit'
    ? state.value.destination.target
    : undefined
))

const isFocused = computed(() => Boolean(state.value.activeExhibit))
</script>

<template>
  <section
    class="museum-stage"
    :class="{ 'museum-stage--focused': isFocused }"
    aria-label="Mayimbe museum shell"
  >
    <MuseumDesk v-if="!isFocused" />

    <button
      v-if="isFocused"
      type="button"
      class="museum-return"
      aria-label="Return to museum desk"
      @click="go({ kind: 'desk' })"
    >
      <span aria-hidden="true">←</span>
      <span>Desk</span>
    </button>

    <NotebookExhibit
      v-if="state.activeExhibit === 'notebook'"
      :target="activeTarget"
    />
    <ListeningExhibit
      v-else-if="state.activeExhibit === 'listening'"
      :target="activeTarget"
    />
    <AlbumExhibit
      v-else-if="state.activeExhibit === 'albums'"
      :target="activeTarget"
    />
    <PhotoExhibit
      v-else-if="state.activeExhibit === 'photos'"
      :target="activeTarget"
    />
    <div v-else class="exhibit-placeholder">
      <p class="eyebrow">Desk overview</p>
      <h2>The spatial museum shell is alive.</h2>
      <p class="muted">Choose an object above. The final desk artwork comes later.</p>
    </div>
  </section>
</template>
