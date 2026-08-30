<script setup lang="ts">
defineProps<{ target?: unknown }>()
</script>

<template>
  <article class="exhibit-placeholder">
    <p class="eyebrow">Exhibit / Listening</p>
    <h2>Listening placeholder</h2>
    <p class="muted">Semantic target: <code>{{ String(target ?? 'overview') }}</code></p>
  </article>
</template>
