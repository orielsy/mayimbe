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
/*
 * The desk and focused notebook are the same physical cover at different
 * scales. Keep all typography geometry shared so the pickup transition never
 * morphs between two cover designs.
 */
.pn-cover__copy {
  padding-inline: 10%;
}

.pn-foil {
  transition: filter 540ms cubic-bezier(.2, .72, .2, 1);
}

/*
 * Preserve the distressed per-character foil pattern, but lift its opacity
 * range so worn letters remain legible against the brick cloth. The nth-child
 * pattern and vertical wear shift stay unchanged; only the visibility floor
 * and ceiling are raised.
 */
.pn-cover--front :deep(.pn-foil-letters span) {
  opacity: .62;
}

.pn-cover--front :deep(.pn-foil-letters span:nth-child(3n + 1)) {
  opacity: .46;
}

.pn-cover--front :deep(.pn-foil-letters span:nth-child(4n + 2)) {
  opacity: .72;
}

.pn-cover--front :deep(.pn-foil-letters span:nth-child(5n)) {
  opacity: .54;
}

.pn-cover--front :deep(.pn-foil-letters span:nth-child(7n + 3)) {
  opacity: .4;
}

.pn-foil-small {
  font-size: 4.5cqw;
  letter-spacing: .2em;
  padding-left: .2em;
}

.pn-foil-title {
  margin-top: 8%;
  font-size: 10cqw;
  letter-spacing: .075em;
  padding-left: .075em;
}

.pn-foil-artist {
  margin-top: 9%;
  font-size: 4.15cqw;
  letter-spacing: .16em;
  padding-left: .16em;
}

.pn-cover--desk {
  --cover-foil: oklch(0.79 0.075 78);
  --cover-foil-highlight: oklch(0.9 0.055 83);
  --cover-foil-shadow: oklch(0.2 0.035 55);
}

.pn-cover--desk .pn-foil {
  filter: contrast(1.18) brightness(1.08);
}
</style>
