<script setup lang="ts">
defineProps<{ target?: unknown }>()
</script>

<template>
  <article class="exhibit-placeholder">
    <p class="eyebrow">Exhibit / Albums</p>
    <h2>Album collection placeholder</h2>
    <p class="muted">Semantic target: <code>{{ String(target ?? 'overview') }}</code></p>
  </article>
</template>
