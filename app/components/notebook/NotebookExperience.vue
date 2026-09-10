<script setup lang="ts">
import { computed } from 'vue'
import PocketNotebook from './PocketNotebook.vue'
import { resolveNotebookTargetPage } from './notebookTargets'

const props = defineProps<{ target?: unknown }>()

const initialPage = computed(() => resolveNotebookTargetPage(props.target))
const notebookKey = computed(() =>
  typeof props.target === 'string' && props.target.length
    ? `target:${props.target}`
    : 'cover',
)
</script>

<template>
  <article
    class="notebook-experience"
    data-testid="notebook-integration-root"
    aria-label="Notebook experience"
  >
    <PocketNotebook
      :key="notebookKey"
      :initial-page="initialPage"
    />
  </article>
</template>

<style scoped>
.notebook-experience {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: auto;
  padding:
    max(1rem, env(safe-area-inset-top))
    max(.75rem, env(safe-area-inset-right))
    max(1.25rem, env(safe-area-inset-bottom))
    max(.75rem, env(safe-area-inset-left));
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(56, 45, 36, .26) 0%, transparent 58%);
}
</style>
