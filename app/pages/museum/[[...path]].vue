<script setup lang="ts">
import MuseumShell from '~/components/museum/MuseumShell.vue'
import type { MuseumDestination } from '~~/core/museum'

const route = useRoute()
const { syncDestination } = useMuseumNavigator()

const destination = computed<MuseumDestination>(() => {
  const raw = route.params.path
  const parts = Array.isArray(raw) ? raw : raw ? [String(raw)] : []

  if (parts.length === 0) {
    return { kind: 'desk' }
  }

  const [exhibit, ...targetParts] = parts

  return {
    kind: 'exhibit',
    exhibit,
    target: targetParts.length ? targetParts.join('/') : undefined,
  }
})

const isFocusedExhibit = computed(() => destination.value.kind === 'exhibit')

watch(
  destination,
  (next) => {
    void syncDestination(next)
  },
  { immediate: true },
)

useSeoMeta({
  title: 'Museum',
  description: 'The persistent museum shell for AntonySantos.com.',
})
</script>

<template>
  <section
    class="page museum-page"
    :class="{ 'museum-page--focused': isFocusedExhibit }"
  >
    <header v-if="!isFocusedExhibit" class="museum-intro">
      <p class="eyebrow">Museum runtime</p>
      <h1>You discover Antony Santos through his things.</h1>
      <p class="lede">
        The Cuaderno is the first real museum exhibit running inside the persistent shell. The listening device, albums, and photo objects remain placeholders while their own exhibit engines are developed.
      </p>
    </header>
    <h1 v-else class="visually-hidden">Antony Santos museum exhibit</h1>

    <MuseumShell />
  </section>
</template>
