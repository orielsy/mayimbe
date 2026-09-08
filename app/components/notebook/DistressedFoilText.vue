<script setup lang="ts">
const props = defineProps<{ text: string }>()

const characters = [...props.text]
</script>

<template>
  <span class="pn-foil-letters" aria-hidden="true">
    <span
      v-for="(character, index) in characters"
      :key="`${character}-${index}`"
    >{{ character === ' ' ? '\u00a0' : character }}</span>
  </span>
</template>
