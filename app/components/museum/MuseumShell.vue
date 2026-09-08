<script setup lang="ts">
import MuseumDesk from './MuseumDesk.vue'
import NotebookExhibit from './NotebookExhibit.vue'

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

    <div v-else-if="isFocused" class="exhibit-placeholder">
      <p class="eyebrow">Unavailable exhibit</p>
      <h2>This object is not part of the active museum build yet.</h2>
    </div>
  </section>
</template>
