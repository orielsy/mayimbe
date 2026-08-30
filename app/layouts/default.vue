<script setup lang="ts">
const route = useRoute()
const inMuseum = computed(() => route.path === '/museum' || route.path.startsWith('/museum/'))
</script>

<template>
  <div class="site-shell" :class="{ 'site-shell--museum': inMuseum }">
    <header v-if="!inMuseum" class="site-header">
      <NuxtLink class="site-brand" to="/">AntonySantos.com / Mayimbe</NuxtLink>
      <nav class="site-nav" aria-label="Primary">
        <NuxtLink to="/museum">Museum</NuxtLink>
        <NuxtLink to="/archive">Archive</NuxtLink>
      </nav>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
