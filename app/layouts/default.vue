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

<style>
/* Android can retain the cover-flight visibility result for the resting DOM
   after WebGL relinquishes the closing animation. Make the canonical closed
   state explicit so the physical cover is guaranteed to own the resting view. */
.site-shell--museum .nbn .book.closed:not(.coverflight) .cover {
  display: flex;
  visibility: visible;
  opacity: 1;
}
</style>
