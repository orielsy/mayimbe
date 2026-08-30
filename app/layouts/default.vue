<script setup lang="ts">
import { MAYIMBE_WORK_VERSION } from '~/work-version'

const route = useRoute()

/*
 * /museum is still part of the Mayimbe interface and keeps normal site chrome.
 * Only a focused physical exhibit (/museum/<exhibit>/...) becomes immersive.
 * Archive, search, research and other conventional UI routes always keep it.
 */
const inFocusedExhibit = computed(() => route.path.startsWith('/museum/'))
</script>

<template>
  <div class="site-shell" :class="{ 'site-shell--museum': inFocusedExhibit }">
    <header v-if="!inFocusedExhibit" class="site-header">
      <NuxtLink class="site-brand" to="/">AntonySantos.com / Mayimbe</NuxtLink>
      <nav class="site-nav" aria-label="Primary">
        <NuxtLink to="/museum">Museum</NuxtLink>
        <NuxtLink to="/archive">Archive</NuxtLink>
      </nav>
    </header>
    <main>
      <slot />
    </main>

    <div class="work-version" aria-label="Development version">
      v{{ MAYIMBE_WORK_VERSION }}
    </div>
  </div>
</template>
