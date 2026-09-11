<script setup lang="ts">
import NotebookArtifactTransitionLayer from '~/components/museum/NotebookArtifactTransitionLayer.vue'
</script>

<template>
  <div class="site-shell site-shell--museum">
    <main>
      <slot />
    </main>
    <NotebookArtifactTransitionLayer />
  </div>
</template>
