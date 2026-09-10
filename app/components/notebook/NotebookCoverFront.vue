<script setup lang="ts">
import DistressedFoilText from './DistressedFoilText.vue'
import { notebookAsset } from './notebookAssets'

withDefaults(defineProps<{
  interactive?: boolean
  hintVisible?: boolean
  presentation?: 'full' | 'desk'
}>(), {
  interactive: false,
  hintVisible: false,
  presentation: 'full',
})
</script>

<template>
  <div
    :class="[
      'pn-cover',
      'pn-cover--front',
      { 'pn-cover--desk': presentation === 'desk' },
    ]"
  >
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
    </div>

    <span aria-hidden="true" class="pn-cover__spine-shade pn-cover__spine-shade--left" />
  </div>
</template>

<style scoped>
.pn-cover--desk .pn-cover__copy {
  padding-inline: 10%;
}

.pn-cover--desk .pn-foil {
  filter: contrast(1.18) brightness(1.08);
}

.pn-cover--desk .pn-foil-small {
  font-size: 4.5cqw;
  letter-spacing: .2em;
  padding-left: .2em;
}

.pn-cover--desk .pn-foil-title {
  margin-top: 8%;
  font-size: 10cqw;
  letter-spacing: .075em;
  padding-left: .075em;
}

.pn-cover--desk .pn-foil-artist {
  margin-top: 9%;
  font-size: 4.15cqw;
  letter-spacing: .16em;
  padding-left: .16em;
}
</style>
