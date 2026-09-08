<script setup lang="ts">
import { computed, ref } from 'vue'
import NotebookCoverFront from './NotebookCoverFront.vue'
import NotebookCoverInside from './NotebookCoverInside.vue'
import NotebookDedication from './NotebookDedication.vue'
import NotebookPageContent from './NotebookPageContent.vue'
import NotebookPageStack from './NotebookPageStack.vue'
import NotebookSheet from './NotebookSheet.vue'
import NotebookTurningSheet from './NotebookTurningSheet.vue'
import { NOTEBOOK_PAGES } from './notebookPages'
import { notebookSheetWear } from './notebookWear'
import { useNotebookAssetsReady } from './useNotebookAssetsReady'
import { useNotebookMachine } from './useNotebookMachine'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import '~/assets/css/notebook-page-turner.css'

const total = NOTEBOOK_PAGES.length
const {
  state,
  open,
  next,
  prev,
  settle,
  busy,
  canNext,
  canPrev,
  atEnd,
} = useNotebookMachine(total)

const reduced = usePrefersReducedMotion()
const ready = useNotebookAssetsReady()

const closing = computed(() => state.value.turn?.kind === 'close')
const closed = computed(() =>
  state.value.status === 'closed-front' || state.value.status === 'closing',
)
const showSpread = computed(() => state.value.status !== 'closed-front')

const restIndex = computed(() =>
  state.value.turn?.kind === 'backward'
    ? state.value.turn.from
    : state.value.page,
)

const dedicationRight = computed(() => restIndex.value >= total)
const page = computed(() => NOTEBOOK_PAGES[Math.min(state.value.page, total - 1)]!)
const restPage = computed(() => NOTEBOOK_PAGES[Math.min(restIndex.value, total - 1)]!)
const turningPage = computed(() =>
  state.value.turn?.kind === 'forward' || state.value.turn?.kind === 'backward',
)
const leftIndex = computed(() => restIndex.value - (turningPage.value ? 2 : 1))
const leftPage = computed(() => leftIndex.value >= 0 ? NOTEBOOK_PAGES[leftIndex.value] ?? null : null)

const touch = ref<{ x: number; y: number } | null>(null)

function onKeyDown(event: KeyboardEvent) {
  if (!ready.value) return

  if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault()
    next()
  } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault()
    prev()
  }
}

function onTouchStart(event: TouchEvent) {
  const point = event.touches[0]
  if (point) touch.value = { x: point.clientX, y: point.clientY }
}

function onTouchEnd(event: TouchEvent) {
  const start = touch.value
  const point = event.changedTouches[0]
  touch.value = null

  if (!start || !point || !ready.value) return

  const dx = point.clientX - start.x
  const dy = point.clientY - start.y
  if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy)) return

  if (dx < 0) next()
  else prev()
}

const status = computed(() => {
  if (!ready.value) return 'Preparing the notebook…'
  if (closed.value) return 'Notebook closed'
  if (dedicationRight.value) return 'Inside the back cover — a dedication'
  return `Page ${page.value.n} of ${total}: ${page.value.title}`
})

const rootPage = computed(() =>
  closed.value
    ? 'cover'
    : dedicationRight.value
      ? 'dedication'
      : String(page.value.n),
)
</script>

<template>
  <div
    class="pn-root"
    :data-nb-state="state.status"
    :data-nb-page="rootPage"
    :data-nb-busy="busy ? 'true' : 'false'"
    :data-nb-ready="ready ? 'true' : 'false'"
    tabindex="0"
    role="region"
    aria-label="Interactive pocket notebook. Use left and right arrow keys to turn pages."
    @keydown="onKeyDown"
  >
    <div
      class="pn-stage"
      role="group"
      aria-label="Pocket notebook"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <div class="pn-spread">
        <div
          v-if="showSpread"
          :class="[
            'pn-leaf-left',
            { 'is-revealing': state.turn?.kind === 'open' },
            { 'pn-close-hold': closing },
          ]"
          aria-hidden="true"
        >
          <div class="pn-rest pn-absolute-fill">
            <div class="pn-mirror pn-absolute-fill">
              <NotebookCoverInside />
            </div>

            <div v-if="leftPage" class="pn-block pn-page-inset">
              <div class="pn-mirror pn-absolute-fill">
                <NotebookPageStack
                  :count="Math.max(2, Math.round((9 * (leftIndex + 1)) / total))"
                  :depth="(leftIndex + 1) / total"
                />
              </div>

              <div class="pn-sheet-layer">
                <div class="pn-mirror pn-absolute-fill">
                  <NotebookSheet :wear="notebookSheetWear(leftPage.n, total)">
                    <div class="pn-mirror pn-absolute-fill">
                      <NotebookPageContent :page="leftPage" :total="total" />
                    </div>
                  </NotebookSheet>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pn-book" data-testid="pn-book">
          <div
            v-if="closed"
            :class="['pn-rest', 'pn-rest--cover', { 'pn-cover-reveal': closing }]"
            data-rest="cover"
          >
            <NotebookCoverFront
              :interactive="ready && state.status === 'closed-front'"
              :hint-visible="ready && closed"
            />
          </div>

          <div
            v-if="showSpread"
            :class="['pn-rest', 'pn-rest--page', { 'pn-close-hold': closing }]"
            :data-rest="dedicationRight ? 'dedication' : `page-${restPage.n}`"
          >
            <NotebookDedication v-if="dedicationRight" />

            <template v-else>
              <div aria-hidden="true" class="pn-absolute-fill">
                <NotebookCoverInside />
              </div>

              <div class="pn-block pn-page-inset">
                <NotebookPageStack
                  :count="Math.max(2, Math.round((9 * (total - restIndex)) / total))"
                  :depth="(total - restIndex) / total"
                />

                <div class="pn-sheet-layer">
                  <NotebookSheet :wear="notebookSheetWear(restPage.n, total)">
                    <NotebookPageContent :page="restPage" :total="total" />
                  </NotebookSheet>
                </div>
              </div>
            </template>

            <button
              v-if="ready && !busy && canNext && state.status === 'open'"
              type="button"
              tabindex="-1"
              class="pn-grab"
              aria-hidden="true"
              @click="next"
            />
          </div>

          <div
            v-if="state.turn?.kind === 'open'"
            class="pn-rest pn-rest--cover pn-cover-hold"
            aria-hidden="true"
          >
            <NotebookCoverFront :hint-visible="false" />
          </div>

          <NotebookTurningSheet
            v-if="state.turn"
            :key="state.turn.key"
            :turn="state.turn"
            :reduced="reduced"
            @done="settle"
          />

          <button
            v-if="ready && state.status === 'closed-front'"
            type="button"
            class="pn-hit"
            aria-label="Open the notebook"
            @click="open"
          >
            <span class="visually-hidden">Open the notebook</span>
          </button>
        </div>
      </div>
    </div>

    <p aria-live="polite" class="pn-status" data-testid="pn-status">
      {{ status }}
    </p>

    <div class="pn-controls">
      <button
        type="button"
        :disabled="!ready || !canPrev || busy"
        data-testid="pn-prev"
        class="pn-btn"
        :aria-label="state.status === 'open' && state.page === 0 ? 'Close the notebook' : 'Previous page'"
        @click="prev"
      >
        {{ state.status === 'open' && state.page === 0 ? 'Close' : 'Previous' }}
      </button>

      <button
        type="button"
        :disabled="!ready || !canNext || busy"
        data-testid="pn-next"
        class="pn-btn pn-btn-primary"
        :aria-label="closed ? 'Open the notebook' : atEnd ? 'The end of the notebook' : 'Next page'"
        @click="next"
      >
        {{ closed ? 'Open' : atEnd ? 'The end' : 'Next' }}
      </button>
    </div>
  </div>
</template>
