<script setup lang="ts">
import MuseumShell from '~/components/museum/MuseumShell.vue'

const route = useRoute()
const { syncDestination } = useMuseumNavigator()

const target = computed(() => {
  const raw = route.params.path
  const parts = Array.isArray(raw) ? raw : raw ? [String(raw)] : []
  return parts.length ? parts.join('/') : undefined
})

watch(
  target,
  (next) => {
    void syncDestination({
      kind: 'exhibit',
      exhibit: 'notebook',
      target: next,
    })
  },
  { immediate: true },
)

useSeoMeta({
  title: 'Cuaderno | Antony Santos Museum',
  description: 'The interactive Cuaderno inside the Antony Santos desk museum.',
})
</script>

<template>
  <section class="museum-page" aria-label="Antony Santos notebook experience">
    <h1 class="visually-hidden">Antony Santos interactive notebook</h1>
    <MuseumShell />
  </section>
</template>
