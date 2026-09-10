<script setup lang="ts">
import { ref } from 'vue'
import MuseumDesk from './MuseumDesk.vue'
import NotebookExhibit from './NotebookExhibit.vue'

interface NotebookExhibitHandle {
  closeForDesk: () => Promise<void>
}

const { state } = useMuseum()
const { go } = useMuseumNavigator()
const { putDown } = useNotebookArtifactTransition()

const notebookExhibit = ref<NotebookExhibitHandle | null>(null)
const returningToDesk = ref(false)

const activeTarget = computed(() => (
  state.value.destination.kind === 'exhibit'
    ? state.value.destination.target
    : undefined
))

const isFocused = computed(() => Boolean(state.value.activeExhibit))

async function returnToDesk() {
  if (returningToDesk.value) return
  returningToDesk.value = true

  try {
    if (state.value.activeExhibit === 'notebook') {
      await notebookExhibit.value?.closeForDesk()
      await putDown()
      return
    }

    await go({ kind: 'desk' })
  } finally {
    returningToDesk.value = false
  }
}
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
      :disabled="returningToDesk"
      @click="returnToDesk"
    >
      <span aria-hidden="true">←</span>
      <span>Desk</span>
    </button>

    <NotebookExhibit
      v-if="state.activeExhibit === 'notebook'"
      ref="notebookExhibit"
      :target="activeTarget"
    />

    <div v-else-if="isFocused" class="exhibit-placeholder">
      <p class="eyebrow">Unavailable exhibit</p>
      <h2>This object is not part of the active museum build yet.</h2>
    </div>
  </section>
</template>
