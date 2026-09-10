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

/*
 * The lab notebook capped the mobile page at 22rem. In the production museum
 * the notebook is the focused object, so mobile spends nearly the full safe-area
 * width on the page. Portrait mobile also bends the physical page proportion
 * from 3:4 to 2:3 so the notebook makes better use of the taller viewport.
 * Desktop keeps the original two-page spread proportions.
 */
@media (max-width: 899px) {
  .notebook-experience {
    padding:
      max(.5rem, env(safe-area-inset-top))
      max(.25rem, env(safe-area-inset-right))
      max(.75rem, env(safe-area-inset-bottom))
      max(.25rem, env(safe-area-inset-left));
  }

  .notebook-experience :deep(.pn-root) {
    gap: clamp(.5rem, 1.5dvh, .9rem);
  }

  .notebook-experience :deep(.pn-stage) {
    width: min(100%, 34rem);
  }

  .notebook-experience :deep(.pn-status) {
    min-height: .875rem;
    padding-inline: .25rem;
  }
}

@media (max-width: 899px) and (orientation: portrait) {
  .notebook-experience :deep(.pn-spread) {
    aspect-ratio: 4 / 3;
  }
}
</style>
