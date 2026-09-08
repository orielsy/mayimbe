<script setup lang="ts">
defineProps<{ target?: unknown }>()
</script>

<template>
  <article
    class="notebook-experience"
    data-testid="notebook-integration-root"
    aria-label="Notebook experience integration root"
  >
    <div class="notebook-experience__placeholder">
      <p class="eyebrow">Notebook integration</p>
      <h2>Page Turner foundation ready.</h2>
      <p class="muted">
        The previous renderer has been retired from this development line. The approved Lovable Page Turner Lab will be extracted into this component boundary next.
      </p>
    </div>
  </article>
</template>

<style scoped>
.notebook-experience {
  width: 100%;
  min-height: min(80dvh, 760px);
  display: grid;
  place-items: center;
}

.notebook-experience__placeholder {
  width: min(34rem, calc(100% - 2rem));
  padding: 1.5rem;
  border: 1px solid rgba(225, 204, 173, .12);
  background: rgba(20, 15, 11, .72);
}

.notebook-experience__placeholder h2 {
  margin: 0 0 .75rem;
  font: 400 clamp(1.6rem, 6vw, 2.5rem)/1 Georgia, 'Times New Roman', serif;
}

.notebook-experience__placeholder p:last-child {
  margin-bottom: 0;
}
</style>
