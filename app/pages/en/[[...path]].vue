<script setup lang="ts">
import type { MuseumDestination } from '~~/core/museum'
import MuseumShell from '~/components/museum/MuseumShell.vue'

const route = useRoute()
const { syncDestination } = useMuseumNavigator()
const { rememberLocale } = useSiteLocale()

const parts = computed(() => {
  const raw = route.params.path
  return Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : []
})

const destination = computed<MuseumDestination>(() => {
  if (!parts.value.length) return { kind: 'desk' }

  const [exhibit, ...targetParts] = parts.value
  return {
    kind: 'exhibit',
    exhibit: exhibit!,
    target: targetParts.length ? targetParts.join('/') : undefined,
  }
})

const isNotebook = computed(() =>
  destination.value.kind === 'exhibit' && destination.value.exhibit === 'notebook',
)

watch(
  destination,
  (next) => {
    void syncDestination(next)
  },
  { immediate: true },
)

onMounted(() => {
  rememberLocale('en')
})

useSeoMeta({
  title: () => isNotebook.value ? 'Cuaderno | Antony Santos Museum' : 'Antony Santos Museum',
  description: () => isNotebook.value
    ? 'The interactive Cuaderno inside the Antony Santos desk museum.'
    : 'An interactive digital museum experienced through the objects on Antony Santos\' desk.',
})
</script>

<template>
  <section
    :class="isNotebook ? 'museum-page' : 'museum-home'"
    :aria-label="isNotebook ? 'Antony Santos notebook experience' : 'Antony Santos museum desk'"
  >
    <h1 class="visually-hidden">
      {{ isNotebook ? 'Antony Santos interactive notebook' : 'Antony Santos interactive museum' }}
    </h1>
    <MuseumShell />
  </section>
</template>
