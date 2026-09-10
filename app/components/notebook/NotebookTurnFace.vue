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
      </template>
      <NotebookCoverFront v-else />
    </template>

    <div
      v-else-if="page"
      :class="padPage ? 'pn-block pn-page-inset' : 'pn-absolute-fill'"
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
