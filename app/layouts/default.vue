<script setup lang="ts">
import NotebookArtifactTransitionLayer from '~/components/museum/NotebookArtifactTransitionLayer.vue'

const route = useRoute()

/*
 * Museum pages opt into the immersive shell explicitly via page metadata.
 * Archive/research routes and internal labs remain ordinary scrollable pages.
 */
const inMuseumExperience = computed(() => route.meta.museum === true)
</script>

<template>
  <div class="site-shell" :class="{ 'site-shell--museum': inMuseumExperience }">
    <header v-if="!inMuseumExperience" class="site-header">
      <NuxtLink class="site-brand" to="/">AntonySantos.com / Mayimbe</NuxtLink>
      <nav class="site-nav" aria-label="Primary">
        <NuxtLink to="/">Desk</NuxtLink>
        <NuxtLink to="/archive">Archive</NuxtLink>
      </nav>
    </header>
    <main>
      <slot />
    </main>
    <NotebookArtifactTransitionLayer />
  </div>
</template>
