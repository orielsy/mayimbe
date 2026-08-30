<script setup lang="ts">
const { state } = useMuseum()
const { go } = useMuseumNavigator()

const objects = [
  { id: 'notebook', label: 'Cuaderno / Notebook', target: 'early-years' },
  { id: 'listening', label: 'Listening Device', target: 'recordings' },
  { id: 'albums', label: 'Album Collection', target: 'collection' },
  { id: 'photos', label: 'Photo Album', target: 'collection' },
]
</script>

<template>
  <div class="museum-desk" aria-label="Museum objects">
    <button
      v-for="object in objects"
      :key="object.id"
      class="museum-object"
      type="button"
      :aria-current="state.activeExhibit === object.id ? 'true' : undefined"
      @click="go({ kind: 'exhibit', exhibit: object.id, target: object.target })"
    >
      <strong>{{ object.label }}</strong>
      <span class="muted" style="display: block; margin-top: 0.5rem">Placeholder exhibit</span>
    </button>
  </div>
</template>
