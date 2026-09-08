<script setup lang="ts">
import { computed } from 'vue'
import { notebookAsset } from './notebookAssets'

const props = withDefaults(defineProps<{
  count?: number
  depth?: number
}>(), {
  count: 9,
  depth: 1,
})

const MASKS = ['edge-mask-a', 'edge-mask-b', 'edge-mask-c'] as const

function h(i: number) {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453
  return x - Math.floor(x)
}

const strata = computed(() => Array.from({ length: props.count }, (_, i) => {
  const t = i / Math.max(1, props.count - 1)
  const r = h(i * 7 + 3)
  const r2 = h(i * 13 + 11)
  const x = (1 - t) * 1.9 * props.depth + r * 0.5 * props.depth
  const y = ((1 - t) * 0.35 + r2 * 0.18) * props.depth

  return {
    i,
    mask: MASKS[i % MASKS.length]!,
    substrate: i % 3 === 0 ? 'substrate-carried' : 'substrate-protected',
    x,
    y,
    shade: 0.1 + (1 - t) * 0.28,
  }
}))
</script>

<template>
  <div aria-hidden="true" class="pn-page-stack">
    <span
      v-for="stratum in strata"
      :key="stratum.i"
      class="pn-page-stack__stratum"
      :style="{
        transform: `translate(${stratum.x}%, ${stratum.y}%)`,
        WebkitMaskImage: `url(${notebookAsset(stratum.mask).path})`,
        maskImage: `url(${notebookAsset(stratum.mask).path})`,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        zIndex: stratum.i,
      }"
    >
      <span
        class="pn-page-stack__paper"
        :style="{
          backgroundImage: `url(${notebookAsset(stratum.substrate).path})`,
          filter: `brightness(${1 - stratum.shade * 0.55}) saturate(0.9)`,
        }"
      />
      <span class="pn-page-stack__seam" />
    </span>
  </div>
</template>
