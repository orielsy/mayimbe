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

watch(
  destination,
  (next) => {
    void syncDestination(next)
  },
  { immediate: true },
)

useSeoMeta({
  title: 'Museum',
  description: 'The persistent desk and object experience for AntonySantos.com.',
})
</script>

<template>
  <section class="museum-page" aria-label="Antony Santos museum experience">
    <h1 class="visually-hidden">Antony Santos interactive museum</h1>
    <MuseumShell />
  </section>
</template>
