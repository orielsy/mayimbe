<script setup lang="ts">
const { state } = useMuseum()
const { go } = useMuseumNavigator()

const notebook = {
  id: 'notebook',
  label: 'Cuaderno',
  target: 'early-years',
}
</script>

<template>
  <div class="museum-desk" aria-label="Museum objects">
    <button
      class="museum-object"
      type="button"
      :aria-current="state.activeExhibit === notebook.id ? 'true' : undefined"
      @click="go({ kind: 'exhibit', exhibit: notebook.id, target: notebook.target })"
    >
      <strong>{{ notebook.label }}</strong>
      <span class="visually-hidden">Open notebook exhibit</span>
    </button>
  </div>
</template>
