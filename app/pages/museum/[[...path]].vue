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
  description: 'The persistent museum shell for AntonySantos.com.',
})
</script>

<template>
  <section class="page">
    <p class="eyebrow">Museum runtime</p>
    <h1>You discover Antony Santos through his things.</h1>
    <p class="lede">
      These objects are placeholders. The purpose of this slice is to prove that semantic destinations can activate exhibits without coupling the Navigator to their physical implementation.
    </p>
    <MuseumShell />
  </section>
</template>
