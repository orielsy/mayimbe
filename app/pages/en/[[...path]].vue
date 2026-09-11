<script setup lang="ts">
import MuseumShell from '~/components/museum/MuseumShell.vue'

const { rememberLocale } = useSiteLocale()
const { isNotebook } = useMuseumRoute()

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
