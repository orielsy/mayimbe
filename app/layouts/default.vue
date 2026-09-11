<script setup lang="ts">
import NotebookArtifactTransitionLayer from '~/components/museum/NotebookArtifactTransitionLayer.vue'

const route = useRoute()

/*
 * The desk and focused exhibits are the primary museum UI, so they never sit
 * inside conventional site chrome. Archive/research routes and internal labs
 * remain ordinary scrollable web pages.
 */
const inMuseumExperience = computed(() => (
  route.path === '/'
  || route.path === '/en'
  || route.path === '/notebook'
  || route.path === '/en/notebook'
  || (
    route.path.startsWith('/notebook/')
    && route.path !== '/notebook/font-lab'
  )
  || route.path.startsWith('/en/notebook/')
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
