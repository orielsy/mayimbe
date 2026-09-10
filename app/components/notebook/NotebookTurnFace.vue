<script setup lang="ts">
import { computed } from 'vue'
import NotebookCoverFront from './NotebookCoverFront.vue'
import NotebookCoverInside from './NotebookCoverInside.vue'
import NotebookPageContent from './NotebookPageContent.vue'
import NotebookSheet from './NotebookSheet.vue'
import { NOTEBOOK_PAGES } from './notebookPages'
import { notebookSheetWear } from './notebookWear'

const props = withDefaults(defineProps<{
  index: number
  back?: boolean
  padPage?: boolean
}>(), {
  back: false,
  padPage: false,
})

const total = NOTEBOOK_PAGES.length
const page = computed(() => NOTEBOOK_PAGES[props.index])
</script>

<template>
  <div
    class="pn-face"
    :style="back ? { transform: 'rotateY(180deg)' } : undefined"
  >
    <template v-if="index < 0">
      <template v-if="back">
        <div class="pn-mirror pn-absolute-fill">
          <NotebookCoverInside />
        </div>
        <span
          aria-hidden="true"
          class="pn-cover__spine-shade pn-cover__spine-shade--right pn-turn-cover-shadow-bridge"
        />
      </template>
      <NotebookCoverFront v-else />
    </template>

    <div
      v-else-if="page"
      :class="padPage ? 'pn-page-inset' : 'pn-absolute-fill'"
    >
      <template v-if="back">
        <div class="pn-mirror pn-absolute-fill">
          <NotebookSheet :wear="notebookSheetWear(page.n, total)">
            <div class="pn-mirror pn-absolute-fill">
              <NotebookPageContent :page="page" :total="total" />
            </div>
          </NotebookSheet>
        </div>
      </template>

      <NotebookSheet v-else :wear="notebookSheetWear(page.n, total)">
        <NotebookPageContent :page="page" :total="total" />
      </NotebookSheet>
    </div>
  </div>
</template>

<style scoped>
/*
 * NotebookCoverInside already carries the permanent spine shade that remains
 * after the turn settles. This second layer only bridges the perspective-heavy
 * middle of the motion, then fades back to zero so the final animated frame has
 * exactly one shade layer, just like the resting cover.
 */
.pn-turn-cover-shadow-bridge {
  opacity: 0;
}

:global(.pn-turn[data-turning='open']) .pn-turn-cover-shadow-bridge,
:global(.pn-turn[data-turning='close']) .pn-turn-cover-shadow-bridge {
  animation: pn-turn-cover-shadow-bridge 620ms linear forwards;
}

@keyframes pn-turn-cover-shadow-bridge {
  0%, 100% { opacity: 0; }
  42% { opacity: .7; }
  76% { opacity: 1; }
}
</style>
