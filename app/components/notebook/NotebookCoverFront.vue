<script setup lang="ts">
import DistressedFoilText from './DistressedFoilText.vue'
import { notebookAsset } from './notebookAssets'

withDefaults(defineProps<{
  interactive?: boolean
  hintVisible?: boolean
}>(), {
  interactive: false,
  hintVisible: false,
})
</script>

<template>
  <div class="pn-cover pn-cover--front">
    <img
      :src="notebookAsset('cover-brick-front').path"
      alt=""
      aria-hidden="true"
      fetchpriority="high"
      decoding="sync"
      class="pn-fill-image"
    >

    <div class="pn-cover__copy">
      <p class="pn-foil pn-foil-small" aria-label="Cuaderno">
        <DistressedFoilText text="CUADERNO" />
      </p>
      <h1 class="pn-foil pn-foil-title" aria-label="El Mayimbe">
        <DistressedFoilText text="EL MAYIMBE" />
      </h1>
      <p class="pn-foil pn-foil-small pn-foil-artist" aria-label="Antony Santos">
        <DistressedFoilText text="ANTONY SANTOS" />
      </p>
      <p
        :class="['pn-cover-hint', 'pn-foil', { 'is-on': hintVisible }]"
        :aria-hidden="!interactive"
      >tap to open</p>
    </div>

    <span aria-hidden="true" class="pn-cover__spine-shade pn-cover__spine-shade--left" />
  </div>
</template>
