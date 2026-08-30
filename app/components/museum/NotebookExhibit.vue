<script setup lang="ts">
defineProps<{ target?: unknown }>()
</script>

<template>
  <article class="exhibit-placeholder">
    <p class="eyebrow">Exhibit / Notebook</p>
    <h2>Notebook adapter is connected.</h2>
    <p class="muted">Semantic target: <code>{{ String(target ?? 'overview') }}</code></p>
    <p>The real notebook engine has intentionally not been migrated yet.</p>
  </article>
</template>
