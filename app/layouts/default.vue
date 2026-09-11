<script setup lang="ts">
import NotebookArtifactTransitionLayer from '~/components/museum/NotebookArtifactTransitionLayer.vue'

const route = useRoute()

/*
 * The desk and focused exhibits are the primary museum UI, so they never sit
 * inside conventional site chrome. Archive/research routes and internal labs
 * remain ordinary scrollable web pages.
 */
const museumPath = computed(() => route.path.replace(/\/+$/, '') || '/')
const inMuseumExperience = computed(() => (
  museumPath.value === '/'
  || museumPath.value === '/en'
  || museumPath.value === '/notebook'
  || museumPath.value === '/en/notebook'
  || (
    museumPath.value.startsWith('/notebook/')
    && museumPath.value !== '/notebook/font-lab'
  )
  || museumPath.value.startsWith('/en/notebook/')
))
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
