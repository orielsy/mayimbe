<script setup lang="ts">
import MuseumShell from '~/components/museum/MuseumShell.vue'

const { rememberLocale } = useSiteLocale()

onMounted(() => {
  rememberLocale('en')
})

useSeoMeta({
  title: 'Antony Santos Museum',
  description: 'An interactive digital museum experienced through the objects on Antony Santos\' desk.',
})
</script>

<template>
  <section
    class="museum-home"
    aria-label="Antony Santos museum desk"
  >
    <h1 class="visually-hidden">
      Antony Santos interactive museum
    </h1>
    <MuseumShell />
  </section>
</template>
