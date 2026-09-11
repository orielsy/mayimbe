<script setup lang="ts">
import { computed } from 'vue'
import { notebookPageCopy, type NotebookPage } from './notebookPages'

const props = defineProps<{
  page: NotebookPage
  total: number
}>()

const { locale } = useSiteLocale()
const copy = computed(() => notebookPageCopy(props.page, locale.value))
const pageLabel = computed(() => (
  locale.value === 'es'
    ? `Página ${props.page.n} de ${props.total}: ${copy.value.title}`
    : `Page ${props.page.n} of ${props.total}: ${copy.value.title}`
))
</script>

<template>
  <article
    class="pn-copy"
    :aria-label="pageLabel"
  >
    <p class="pn-copy__eyebrow">{{ copy.eyebrow }}</p>
    <h2 class="pn-copy__title">{{ copy.title }}</h2>
    <div aria-hidden="true" class="pn-copy__rule" />

    <figure v-if="page.kind === 'photo'" class="pn-copy__figure">
      <img
        src="/notebook-assets/photo-band.jpg"
        width="768"
        height="576"
        loading="lazy"
        :alt="copy.imageAlt ?? ''"
        class="pn-copy__photo"
      >
      <figcaption class="pn-copy__caption">{{ copy.caption }}</figcaption>
    </figure>

    <p class="pn-copy__body">{{ copy.body }}</p>

    <p v-if="copy.note" class="pn-hand pn-copy__note">{{ copy.note }}</p>

    <span aria-hidden="true" class="pn-copy__number">{{ page.n }}</span>
  </article>
</template>

<style scoped>
.pn-copy {
  font-family: "Caveat", cursive;
  font-weight: 450;
}

.pn-copy__title {
  font-family: "Caveat", cursive;
  font-weight: 600;
}

.pn-hand {
  font-family: "Dancing Script", cursive;
  font-weight: 500;
}
</style>
