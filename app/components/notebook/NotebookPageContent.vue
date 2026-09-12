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

    <figure v-if="copy.mediaPlaceholder" class="pn-copy__figure pn-copy__placeholder-wrap">
      <div class="pn-copy__placeholder" aria-hidden="true">
        <span>{{ copy.mediaPlaceholder }}</span>
      </div>
      <figcaption v-if="copy.caption" class="pn-copy__caption">{{ copy.caption }}</figcaption>
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

.pn-copy__placeholder {
  min-height: 24cqw;
  display: grid;
  place-items: center;
  padding: 6%;
  border: 1px dashed rgba(80, 61, 43, 0.45);
  border-radius: 2px;
  background:
    linear-gradient(135deg, rgba(79, 58, 37, 0.035) 25%, transparent 25%) 0 0 / 10cqw 10cqw,
    linear-gradient(315deg, rgba(79, 58, 37, 0.035) 25%, transparent 25%) 0 0 / 10cqw 10cqw;
  color: rgba(61, 45, 31, 0.58);
  text-align: center;
  font-family: "Caveat", cursive;
  font-size: 3.4cqw;
  line-height: 1.25;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
</style>
