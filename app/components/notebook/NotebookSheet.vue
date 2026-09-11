<script setup lang="ts">
import { computed } from 'vue'
import {
  notebookAsset,
  type NotebookRecipe,
} from './notebookAssets'

const props = withDefaults(defineProps<{
  wear: NotebookRecipe
  masked?: boolean
  class?: string
}>(), {
  masked: true,
  class: '',
})

const recipe = computed(() => props.wear)

const maskStyle = computed(() => {
  if (!props.masked || !recipe.value) return undefined
  const path = notebookAsset(recipe.value.edgeMask).path
  return {
    WebkitMaskImage: `url(${path})`,
    maskImage: `url(${path})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  }
})
</script>

<template>
  <div
    :class="['pn-sheet', props.class]"
    :data-recipe="recipe.id"
    :style="maskStyle"
  >
    <img
      :src="notebookAsset(recipe.substrate).path"
      alt=""
      aria-hidden="true"
      class="pn-fill-image"
    >

    <span
      v-for="layer in recipe.layers"
      :key="`${layer.asset}-${layer.opacity}`"
      aria-hidden="true"
      class="pn-wear-layer"
      :style="{
        backgroundImage: `url(${notebookAsset(layer.asset).path})`,
        backgroundRepeat: layer.repeat ? 'repeat' : 'no-repeat',
        backgroundSize: layer.repeat ? '120px 120px' : '100% 100%',
        opacity: layer.opacity,
        transform: layer.mirror ? 'scaleX(-1)' : undefined,
      }"
    />

    <slot />
  </div>
</template>
