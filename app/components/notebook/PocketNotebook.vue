<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import NotebookBookmarkStack from './NotebookBookmarkStack.vue'
import NotebookCoverFront from './NotebookCoverFront.vue'
import NotebookCoverInside from './NotebookCoverInside.vue'
import NotebookDedication from './NotebookDedication.vue'
import NotebookPageContent from './NotebookPageContent.vue'
import NotebookPageStack from './NotebookPageStack.vue'
import NotebookSheet from './NotebookSheet.vue'
import NotebookTurningSheet from './NotebookTurningSheet.vue'
import { NOTEBOOK_PAGES, notebookPageCopy } from './notebookPages'
import { notebookSheetWear } from './notebookWear'
import { useNotebookAssetsReady } from './useNotebookAssetsReady'
import { useNotebookMachine } from './useNotebookMachine'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import '~/assets/css/notebook-page-turner.css'

interface NotebookBookmark {
  target: string
  label: string
}

type OutsideNotebookAction = 'closed' | 'putdown' | 'ignored'

const props = defineProps<{
  initialPage?: number | null
  bookmarks?: readonly NotebookBookmark[]
  activeBookmark?: string
}>()

const emit = defineEmits<{
  bookmark: [target: string]
}>()

const { locale } = useSiteLocale()
const total = NOTEBOOK_PAGES.length
const {
  state,
  open,
  close,
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

const copy = computed(() => locale.value === 'es'
  ? {
      region: 'Cuaderno interactivo. Toca los lados de la página, desliza a la izquierda o derecha, usa los marcadores de sección o las flechas del teclado para pasar páginas.',
      notebook: 'Cuaderno de bolsillo',
      sections: 'Secciones del cuaderno',
      preparing: 'Preparando el cuaderno…',
      closed: 'Cuaderno cerrado',
      dedication: 'Interior de la contraportada — una dedicatoria',
      open: 'Abrir el cuaderno',
      close: 'Cerrar el cuaderno',
      previous: 'Página anterior',
      next: 'Página siguiente',
      end: 'Fin del cuaderno',
      page: (n: number, pageTotal: number, title: string) => `Página ${n} de ${pageTotal}: ${title}`,
    }
  : {
      region: 'Interactive pocket notebook. Tap the page sides, swipe left or right, use the section bookmarks, or use the arrow keys to turn pages.',
      notebook: 'Pocket notebook',
      sections: 'Notebook sections',
      preparing: 'Preparing the notebook…',
      closed: 'Notebook closed',
      dedication: 'Inside the back cover — a dedication',
      open: 'Open the notebook',
      close: 'Close the notebook',
      previous: 'Previous page',
      next: 'Next page',
      end: 'The end of the notebook',
      page: (n: number, pageTotal: number, title: string) => `Page ${n} of ${pageTotal}: ${title}`,
    })

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

function waitForSettled() {
  if (!busy.value) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const stop = watch(
      busy,
      (nextBusy) => {
        if (nextBusy) return
        stop()
        resolve()
      },
      { flush: 'post' },
    )
  })
}

async function closeForDesk() {
  await waitForSettled()
  if (state.value.status === 'closed-front') return

  close()
  await waitForSettled()
}

async function handleOutsideClick(): Promise<OutsideNotebookAction> {
  if (!ready.value || busy.value) return 'ignored'

  if (state.value.status === 'closed-front') return 'putdown'
  if (state.value.status !== 'open') return 'ignored'

  close()
  await waitForSettled()
  return 'closed'
}

defineExpose({ closeForDesk, handleOutsideClick })

const status = computed(() => {
  if (!ready.value) return copy.value.preparing
  if (closed.value) return copy.value.closed
  if (dedicationRight.value) return copy.value.dedication
  return copy.value.page(
    page.value.n,
    total,
    notebookPageCopy(page.value, locale.value).title,
  )
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
    :aria-label="copy.region"
    @keydown="onKeyDown"
  >
    <div
      class="pn-stage"
      role="group"
      :aria-label="copy.notebook"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchCancel"
    >
      <div class="pn-spread">
        <div
          v-if="showSpread && !closing"
          :class="[
            'pn-leaf-left',
            { 'is-revealing': state.turn?.kind === 'open' },
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

        <div
          :class="['pn-book', { 'pn-book--collapsed': closed }]"
          data-testid="pn-book"
          data-notebook-transition-anchor="focused"
          data-notebook-transition-rotation="0"
        >
          <NotebookBookmarkStack
            :bookmarks="props.bookmarks"
            :active-bookmark="props.activeBookmark"
            :disabled="busy"
            :aria-label="copy.sections"
            @select="emit('bookmark', $event)"
          />

          <div
            v-if="state.status === 'closed-front'"
            class="pn-rest pn-rest--cover"
            data-rest="cover"
          >
            <NotebookCoverFront
              :interactive="ready"
              :hint-visible="ready"
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
            :aria-label="copy.open"
            @click="open"
          >
            <span class="visually-hidden">{{ copy.open }}</span>
          </button>

          <template v-if="state.status === 'open'">
            <button
              type="button"
              class="pn-side pn-side--prev"
              data-testid="pn-prev"
              :disabled="!ready || !canPrev || busy"
              :aria-label="state.page === 0 ? copy.close : copy.previous"
              @click="prev"
            >
              <span class="visually-hidden">
                {{ state.page === 0 ? copy.close : copy.previous }}
              </span>
            </button>

            <button
              type="button"
              class="pn-side pn-side--next"
              data-testid="pn-next"
              :disabled="!ready || !canNext || busy"
              :aria-label="atEnd ? copy.end : copy.next"
              @click="next"
            >
              <span class="visually-hidden">
                {{ atEnd ? copy.end : copy.next }}
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>

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

@media (max-width: 899px) {
  /* Keep page-turn/open zones above the protruding bookmark strip. */
  .pn-side,
  .pn-hit {
    bottom: 1.1rem;
  }

  .pn-side {
    top: 0;
  }
}

@media (min-width: 900px) {
  .pn-book {
    transition: left 620ms cubic-bezier(.3, .6, .3, 1);
  }

  .pn-book--collapsed {
    left: 25%;
  }

  .pn-side--prev {
    left: -100%;
  }
}
</style>
