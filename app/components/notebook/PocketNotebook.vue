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

interface NotebookBookmark {
  target: string
  label: string
}

const props = defineProps<{
  initialPage?: number | null
  bookmarks?: readonly NotebookBookmark[]
  activeBookmark?: string
}>()

const emit = defineEmits<{
  bookmark: [target: string]
}>()

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
} = useNotebookMachine(total, props.initialPage ?? null)

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

function onTouchCancel() {
  touch.value = null
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
    aria-label="Interactive pocket notebook. Tap the page sides, swipe left or right, use the section bookmarks, or use the arrow keys to turn pages."
    @keydown="onKeyDown"
  >
    <div
      class="pn-stage"
      role="group"
      aria-label="Pocket notebook"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchCancel"
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
          <nav
            v-if="props.bookmarks?.length"
            class="pn-bookmarks"
            aria-label="Notebook sections"
          >
            <button
              v-for="bookmark in props.bookmarks"
              :key="bookmark.target"
              type="button"
              :class="[
                'pn-bookmark',
                { 'is-active': props.activeBookmark === bookmark.target },
              ]"
              :aria-current="props.activeBookmark === bookmark.target ? 'page' : undefined"
              :disabled="busy"
              @click.stop="emit('bookmark', bookmark.target)"
            >
              <span>{{ bookmark.label }}</span>
            </button>
          </nav>

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
            data-testid="pn-next"
            aria-label="Open the notebook"
            @click="open"
          >
            <span class="visually-hidden">Open the notebook</span>
          </button>

          <template v-if="state.status === 'open'">
            <button
              type="button"
              class="pn-side pn-side--prev"
              data-testid="pn-prev"
              :disabled="!ready || !canPrev || busy"
              :aria-label="state.page === 0 ? 'Close the notebook' : 'Previous page'"
              @click="prev"
            >
              <span class="visually-hidden">
                {{ state.page === 0 ? 'Close the notebook' : 'Previous page' }}
              </span>
            </button>

            <button
              type="button"
              class="pn-side pn-side--next"
              data-testid="pn-next"
              :disabled="!ready || !canNext || busy"
              :aria-label="atEnd ? 'The end of the notebook' : 'Next page'"
              @click="next"
            >
              <span class="visually-hidden">
                {{ atEnd ? 'The end of the notebook' : 'Next page' }}
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <p class="pn-status pn-instructions">
      Swipe left and right or use the left and right sides to flip through pages
    </p>

    <p aria-live="polite" class="visually-hidden" data-testid="pn-status">
      {{ status }}
    </p>
  </div>
</template>

<style scoped>
.pn-side {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 55;
  width: 28%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
}

.pn-side--prev {
  left: 0;
}

.pn-side--next {
  right: 0;
}

.pn-side:disabled {
  cursor: default;
  pointer-events: none;
}

.pn-side:focus-visible {
  outline: 2px solid #d8c39a;
  outline-offset: -4px;
}

.pn-bookmarks {
  position: absolute;
  top: 10%;
  right: -.35rem;
  z-index: 75;
  display: flex;
  flex-direction: column;
  gap: .3rem;
  align-items: flex-end;
}

.pn-bookmark {
  width: 2.15rem;
  min-height: 4.35rem;
  padding: .45rem .3rem;
  border: 1px solid rgba(75, 52, 30, .48);
  border-right: 0;
  border-radius: .3rem 0 0 .3rem;
  background:
    linear-gradient(90deg, rgba(255, 250, 226, .22), transparent 38%),
    #b99a67;
  box-shadow:
    -2px 2px 5px rgba(42, 28, 15, .2),
    inset 0 0 0 1px rgba(255, 245, 211, .14);
  color: #493722;
  font-family: Georgia, "Times New Roman", serif;
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .06em;
  line-height: 1;
  text-transform: uppercase;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  cursor: pointer;
}

.pn-bookmark:nth-child(2) { background-color: #aa895d; }
.pn-bookmark:nth-child(3) { background-color: #c2a878; }
.pn-bookmark:nth-child(4) { background-color: #9d8059; }

.pn-bookmark.is-active {
  box-shadow:
    -3px 2px 6px rgba(42, 28, 15, .26),
    inset 3px 0 0 rgba(88, 58, 27, .38),
    inset 0 0 0 1px rgba(255, 245, 211, .18);
}

.pn-bookmark:disabled {
  cursor: default;
}

.pn-bookmark:focus-visible {
  outline: 2px solid #d8c39a;
  outline-offset: 2px;
}

.pn-instructions {
  max-width: 34rem;
  line-height: 1.45;
  text-transform: none;
}

@media (min-width: 900px) {
  .pn-side--prev {
    left: -100%;
  }

  .pn-bookmarks {
    top: 12%;
    right: 0;
    gap: .5rem;
    align-items: flex-start;
  }

  .pn-bookmark {
    width: auto;
    min-width: 5.8rem;
    min-height: 1.9rem;
    padding: .4rem .75rem .4rem 1rem;
    border-right: 1px solid rgba(75, 52, 30, .48);
    border-left: 0;
    border-radius: 0 .3rem .3rem 0;
    font-size: .68rem;
    letter-spacing: .08em;
    writing-mode: horizontal-tb;
    text-orientation: mixed;
    text-align: left;
    transform: translateX(calc(100% - .9rem));
    transition: transform 160ms ease, filter 160ms ease;
  }

  .pn-bookmark:hover:not(:disabled),
  .pn-bookmark:focus-visible,
  .pn-bookmark.is-active {
    transform: translateX(calc(100% - 1.35rem));
  }
}
</style>
