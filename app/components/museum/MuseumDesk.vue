<script setup lang="ts">
defineProps<{ compact?: boolean }>()

const { state } = useMuseum()
const { go } = useMuseumNavigator()

const objects = [
  { id: 'notebook', label: 'Cuaderno / Notebook', target: 'early-years', status: 'Live exhibit' },
  { id: 'listening', label: 'Listening Device', target: 'recordings', status: 'Placeholder exhibit' },
  { id: 'albums', label: 'Album Collection', target: 'collection', status: 'Placeholder exhibit' },
  { id: 'photos', label: 'Photo Album', target: 'collection', status: 'Placeholder exhibit' },
]
</script>

<template>
  <div
    class="museum-desk"
    :class="{ 'museum-desk--compact': compact }"
    aria-label="Museum objects"
  >
    <button
      v-for="object in objects"
      :key="object.id"
      class="museum-object"
      type="button"
      :aria-current="state.activeExhibit === object.id ? 'true' : undefined"
      @click="go({ kind: 'exhibit', exhibit: object.id, target: object.target })"
    >
      <strong>{{ object.label }}</strong>
      <span class="museum-object-status muted">{{ object.status }}</span>
    </button>
  </div>
</template>
