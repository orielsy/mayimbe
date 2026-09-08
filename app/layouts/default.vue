<script setup lang="ts">
const route = useRoute()

/*
 * The desk and focused exhibits are the primary museum UI, so they never sit
 * inside conventional site chrome. Archive/research routes remain ordinary web
 * pages and keep the traditional header/navigation.
 */
const inMuseumExperience = computed(() => (
  route.path === '/'
  || route.path === '/museum'
  || route.path.startsWith('/museum/')
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
  </div>
</template>
