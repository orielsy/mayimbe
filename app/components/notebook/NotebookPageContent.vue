<script setup lang="ts">
import type { NotebookPage } from './notebookPages'

defineProps<{
  page: NotebookPage
  total: number
}>()
</script>

<template>
  <article
    class="pn-copy"
    :aria-label="`Page ${page.n} of ${total}: ${page.title}`"
  >
    <p class="pn-copy__eyebrow">{{ page.eyebrow }}</p>
    <h2 class="pn-copy__title">{{ page.title }}</h2>
    <div aria-hidden="true" class="pn-copy__rule" />

    <figure v-if="page.kind === 'photo'" class="pn-copy__figure">
      <img
        src="/notebook-assets/photo-band.jpg"
        width="768"
        height="576"
        loading="lazy"
        alt="Two guitarists and a güira player on a small outdoor patio stage at night, faded 1990s film print."
        class="pn-copy__photo"
      >
      <figcaption class="pn-copy__caption">{{ page.caption }}</figcaption>
    </figure>

    <p class="pn-copy__body">{{ page.body }}</p>

    <p v-if="page.note" class="pn-hand pn-copy__note">{{ page.note }}</p>

    <span aria-hidden="true" class="pn-copy__number">{{ page.n }}</span>
  </article>
</template>
