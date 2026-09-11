<script setup lang="ts">
import MuseumShell from '~/components/museum/MuseumShell.vue'

useSeoMeta({
  title: 'Cuaderno | Museo de Antony Santos',
  description: 'El Cuaderno interactivo dentro del museo de escritorio de Antony Santos.',
})
</script>

<template>
  <section class="museum-page" aria-label="Experiencia del cuaderno de Antony Santos">
    <h1 class="visually-hidden">Cuaderno interactivo de Antony Santos</h1>
    <MuseumShell />
  </section>
</template>
