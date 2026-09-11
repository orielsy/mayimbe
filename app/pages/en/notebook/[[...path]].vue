<script setup lang="ts">
import MuseumShell from '~/components/museum/MuseumShell.vue'

definePageMeta({ layout: 'museum' })

const { rememberLocale } = useSiteLocale()

onMounted(() => {
  rememberLocale('en')
})

useSeoMeta({
  title: 'Cuaderno | Antony Santos Museum',
  description: 'The interactive Cuaderno inside the Antony Santos desk museum.',
})
</script>

<template>
  <section
    class="museum-page"
    aria-label="Antony Santos notebook experience"
  >
    <h1 class="visually-hidden">
      Antony Santos interactive notebook
    </h1>
    <MuseumShell />
  </section>
</template>
