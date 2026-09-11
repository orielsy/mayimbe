<script setup lang="ts">
import MuseumShell from '~/components/museum/MuseumShell.vue'

const { syncDestination } = useMuseumNavigator()
const { preferredLocale } = useSiteLocale()

onMounted(() => {
  if (preferredLocale.value === 'en') {
    void navigateTo('/en')
    return
  }

  void syncDestination({ kind: 'desk' })
})

useSeoMeta({
  title: 'Museo de Antony Santos',
  description: 'Un museo digital interactivo recorrido a través de los objetos sobre el escritorio de Antony Santos.',
})
</script>

<template>
  <section class="museum-home" aria-label="Escritorio del museo de Antony Santos">
    <h1 class="visually-hidden">Museo interactivo de Antony Santos</h1>
    <MuseumShell />
  </section>
</template>
