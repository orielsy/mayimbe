<script setup lang="ts">
import manifestSource from '~~/public/notebook-assets/manifest.json'
import {
  createPocketNotebookState,
  isPocketNotebookTransitioning,
  pocketNotebookRestingPageIndex,
  reducePocketNotebookState,
  type PocketNotebookPhase,
} from '~/runtime/pocket-notebook-state'

type NotebookRecipeId = 'carried' | 'humidity' | 'protected'
type NotebookPageVariant = 'essay' | 'date-note' | 'sketch' | 'margin-note'

interface NotebookAsset {
  id: string
  file: string
  path: string
  group: 'substrate' | 'wear' | 'mask' | 'cover'
  label: string
  opaque: boolean
  width: number
  height: number
  format: string
}

interface NotebookRecipe {
  id: NotebookRecipeId
  label: string
  description: string
  base: string
  mask: string
  layers: string[]
}

interface NotebookAssetManifest {
  version: number
  generatedFrom: string
  dimensions: { width: number; height: number; aspectRatio: string }
  runtimePolicy: { canvas: boolean; webgl: boolean }
  assets: NotebookAsset[]
  recipes: NotebookRecipe[]
}

interface PocketNotebookPage {
  id: string
  recipe: NotebookRecipeId
  variant: NotebookPageVariant
  eyebrow: string
  title: string
  paragraphs: string[]
  annotation?: string
  dateMark?: string
}

const manifest = manifestSource as NotebookAssetManifest
const assetMap = new Map(manifest.assets.map(asset => [asset.id, asset]))
const recipeMap = new Map(manifest.recipes.map(recipe => [recipe.id, recipe]))

const pages: PocketNotebookPage[] = [
  {
    id: 'primeras-notas',
    recipe: 'carried',
    variant: 'essay',
    eyebrow: 'Antes del disco',
    title: 'Primeras notas',
    paragraphs: [
      'Antes de lanzar su carrera discográfica como solista, Antony Santos tocó güira en el grupo de Luis Vargas.',
      'Mayimbe conserva ese dato como un punto de partida documentado: aprendizaje antes del salto, ritmo antes de la portada.',
    ],
    annotation: 'Página 01 · material de trabajo',
  },
  {
    id: 'aprendizaje',
    recipe: 'humidity',
    variant: 'margin-note',
    eyebrow: 'Aprendizaje',
    title: 'El oficio antes del nombre',
    paragraphs: [
      'Las fuentes coinciden en esa etapa previa dentro del grupo de Luis Vargas, aunque el archivo todavía es pequeño.',
      'Aquí la libreta funciona como una mesa de investigación: guarda lo confirmado y deja espacio para lo que falta.',
    ],
    annotation: 'No rellenar los huecos con certezas inventadas.',
  },
  {
    id: 'la-chupadera',
    recipe: 'protected',
    variant: 'date-note',
    eyebrow: 'Primeras grabaciones',
    title: 'La Chupadera',
    paragraphs: [
      'Las fuentes disponibles no colocan el debut exactamente en el mismo año.',
      'iASO Records sitúa la primera producción en 1991; AllMusic describe La Chupadera como un debut de 1992.',
    ],
    dateMark: '1991 / 1992',
    annotation: 'La discrepancia también pertenece al archivo.',
  },
  {
    id: 'fecha-abierta',
    recipe: 'carried',
    variant: 'margin-note',
    eyebrow: 'Método de archivo',
    title: 'Una fecha abierta',
    paragraphs: [
      'En vez de forzar una precisión falsa, el museo conserva el comienzo de la carrera solista dentro de los primeros años de la década de 1990.',
      'La libreta debe poder cargar ese tipo de matiz sin convertir cada página en una imagen terminada.',
    ],
    annotation: 'Texto vivo. Papel reusable. Historia revisable.',
  },
  {
    id: 'instrumento-y-memoria',
    recipe: 'humidity',
    variant: 'sketch',
    eyebrow: 'Apunte visual',
    title: 'Instrumento y memoria',
    paragraphs: [
      'Una ilustración sencilla prueba que la página puede mezclar imagen, texto y anotaciones sin abandonar el DOM.',
    ],
    annotation: 'Boceto de güira · estudio, no pieza final',
  },
  {
    id: 'archivo-abierto',
    recipe: 'protected',
    variant: 'essay',
    eyebrow: 'Continuará',
    title: 'Archivo abierto',
    paragraphs: [
      'Este cuaderno no pretende cerrar la historia. Su trabajo es sostener fragmentos, fuentes, imágenes y notas mientras la investigación crece.',
      'La arquitectura debe ser igual de flexible: una página estable primero, la interacción después.',
    ],
    annotation: 'Página 06 · fin del recorrido de prueba',
  },
]

const notebookState = ref(createPocketNotebookState(pages.length))
const prefersReducedMotion = ref(false)
let settleTimer: ReturnType<typeof setTimeout> | undefined
let motionQuery: MediaQueryList | undefined

const restingPageIndex = computed(() => pocketNotebookRestingPageIndex(notebookState.value))
const currentPage = computed(() => pages[restingPageIndex.value] ?? pages[0]!)
const currentRecipe = computed(() => recipeMap.get(currentPage.value.recipe) ?? manifest.recipes[0]!)
const isClosed = computed(() => notebookState.value.phase === 'closed-front')
const isOpening = computed(() => notebookState.value.phase === 'opening')
const isClosing = computed(() => notebookState.value.phase === 'closing')
const hasTurningCover = computed(() => isOpening.value || isClosing.value)
const controlsLocked = computed(() => isPocketNotebookTransitioning(notebookState.value))
const canOpen = computed(() => notebookState.value.phase === 'closed-front' && !controlsLocked.value)
const canClose = computed(() => notebookState.value.phase === 'open' && notebookState.value.pageIndex === 0 && !controlsLocked.value)

const stackSheets = [
  { x: 0.2, y: 0.6, r: -0.08 },
  { x: 0.8, y: 1.2, r: 0.05 },
  { x: 1.3, y: 1.9, r: -0.04 },
  { x: 1.8, y: 2.5, r: 0.07 },
  { x: 2.3, y: 3.1, r: -0.03 },
  { x: 2.8, y: 3.7, r: 0.04 },
  { x: 3.2, y: 4.3, r: -0.02 },
]

const layerOpacity: Record<string, number> = {
  'wear-tonal-drift': 0.62,
  'wear-edge-oxidation': 0.94,
  'wear-handling-grime': 0.86,
  'wear-foxing-light': 0.74,
  'wear-foxing-heavy': 0.84,
  'wear-water-stain': 0.9,
  'wear-humidity-bloom': 0.78,
  'wear-smudge': 0.68,
  'wear-crease': 0.62,
}

const assetFor = (id: string) => assetMap.get(id)

const maskStyle = (recipe: NotebookRecipe) => {
  const mask = assetFor(recipe.mask)
  if (!mask) return {}
  const image = `url(${mask.path})`
  return {
    WebkitMaskImage: image,
    WebkitMaskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskImage: image,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  }
}

const wearStyle = (layerId: string) => ({
  backgroundImage: `url(${assetFor(layerId)?.path ?? ''})`,
  opacity: layerOpacity[layerId] ?? 1,
})

const wearTier = (layerId: string) => (
  layerId === 'wear-smudge' || layerId === 'wear-handling-grime' || layerId === 'wear-crease'
    ? 'paper-wear--over'
    : 'paper-wear--under'
)

const clearSettleTimer = () => {
  if (settleTimer !== undefined) {
    clearTimeout(settleTimer)
    settleTimer = undefined
  }
}

const settleTransition = (transitionId = notebookState.value.transition?.id) => {
  if (transitionId === undefined) return
  clearSettleTimer()
  notebookState.value = reducePocketNotebookState(notebookState.value, {
    type: 'settle',
    transitionId,
  })
}

const beginCoverTransition = (direction: 'forward' | 'backward') => {
  const nextState = reducePocketNotebookState(notebookState.value, { type: direction })
  if (nextState === notebookState.value) return

  notebookState.value = nextState
  const transitionId = nextState.transition?.id
  if (transitionId === undefined) return

  if (prefersReducedMotion.value) {
    settleTransition(transitionId)
    return
  }

  clearSettleTimer()
  settleTimer = setTimeout(() => settleTransition(transitionId), 900)
}

const openNotebook = () => {
  if (canOpen.value) beginCoverTransition('forward')
}

const closeNotebook = () => {
  if (canClose.value) beginCoverTransition('backward')
}

const onCoverAnimationEnd = (event: AnimationEvent) => {
  if (event.target !== event.currentTarget) return
  settleTransition()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key === 'ArrowRight' && canOpen.value) {
    event.preventDefault()
    openNotebook()
  }
  if (event.key === 'ArrowLeft' && canClose.value) {
    event.preventDefault()
    closeNotebook()
  }
}

const updateMotionPreference = (event?: MediaQueryListEvent) => {
  prefersReducedMotion.value = event?.matches ?? motionQuery?.matches ?? false
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotionPreference()
  motionQuery.addEventListener('change', updateMotionPreference)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearSettleTimer()
  motionQuery?.removeEventListener('change', updateMotionPreference)
  window.removeEventListener('keydown', onKeydown)
})

const stateLabel = (phase: PocketNotebookPhase) => {
  const labels: Record<PocketNotebookPhase, string> = {
    'closed-front': 'Closed front cover',
    opening: 'Opening cover',
    open: 'Open',
    'turning-forward': 'Turning forward',
    'turning-backward': 'Turning backward',
    closing: 'Closing cover',
  }
  return labels[phase]
}

const statusText = computed(() => {
  if (notebookState.value.phase === 'closed-front') {
    return 'Closed front cover · page 1 is prepared beneath the cover'
  }
  return `${stateLabel(notebookState.value.phase)} · page ${restingPageIndex.value + 1} of ${pages.length}`
})

useSeoMeta({
  title: 'Pocket Notebook · Stage 2',
  description: 'Mobile-first CSS pocket notebook experiment using the Stage 1 static material system.',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <main class="pocket-lab">
    <header class="pocket-lab__header">
      <div>
        <p class="pocket-lab__kicker">Notebook rebuild · Stage 2</p>
        <h1>Pocket notebook</h1>
      </div>
      <p class="pocket-lab__intro">
        A native-size single-page notebook built from the Stage 1 paper, wear, mask, cover, and board assets.
        The cover animation is temporary; every settled state is ordinary DOM.
      </p>
    </header>

    <section class="pocket-exhibit" aria-labelledby="pocket-shell-title">
      <aside class="exhibit-note exhibit-note--context">
        <p class="exhibit-note__index">01</p>
        <h2 id="pocket-shell-title">Open and settle</h2>
        <p>
          Checkpoint 2 makes the front cover reviewable. Page 1 is prepared underneath before the disposable cover layer moves.
        </p>
        <dl>
          <div><dt>Logical pages</dt><dd>{{ pages.length }}</dd></div>
          <div><dt>Runtime</dt><dd>DOM + CSS</dd></div>
          <div><dt>Canvas / WebGL</dt><dd>0 / 0</dd></div>
        </dl>
      </aside>

      <div class="notebook-column">
        <div class="notebook-stage">
          <div
            class="pocket-notebook"
            data-testid="pocket-notebook"
            :data-notebook-state="notebookState.phase"
            :data-page-index="notebookState.pageIndex"
            :data-resting-page-index="restingPageIndex"
            :data-current-page="currentPage.id"
          >
            <img class="notebook-board" :src="assetFor('cover-f3-03-board')?.path" alt="" aria-hidden="true">

            <div class="paper-stack" aria-hidden="true">
              <span
                v-for="(sheet, index) in stackSheets"
                :key="index"
                class="paper-stack__sheet"
                :style="{
                  ...maskStyle(currentRecipe),
                  backgroundImage: `url(${assetFor(currentRecipe.base)?.path})`,
                  transform: `translate(${sheet.x}px, ${sheet.y}px) rotate(${sheet.r}deg)`,
                }"
              />
            </div>

            <article
              class="resting-page"
              :class="`resting-page--${currentPage.variant}`"
              :style="maskStyle(currentRecipe)"
              :aria-hidden="isClosed ? 'true' : undefined"
              data-testid="resting-page"
            >
              <img class="paper-base" :src="assetFor(currentRecipe.base)?.path" alt="" aria-hidden="true">
              <span
                v-for="layerId in currentRecipe.layers"
                :key="layerId"
                class="paper-wear"
                :class="wearTier(layerId)"
                :style="wearStyle(layerId)"
                aria-hidden="true"
              />

              <div class="page-content">
                <p class="page-eyebrow">{{ currentPage.eyebrow }}</p>
                <h2>{{ currentPage.title }}</h2>
                <p v-if="currentPage.dateMark" class="page-date-mark">{{ currentPage.dateMark }}</p>

                <figure
                  v-if="currentPage.variant === 'sketch'"
                  class="guira-sketch"
                  role="img"
                  aria-label="Stylized line illustration of a güira"
                >
                  <svg viewBox="0 0 180 150" aria-hidden="true">
                    <path d="M74 18c19-6 37 3 43 20 5 15 4 65-4 86-6 16-18 24-32 21-18-4-27-19-28-42-2-27 2-61 7-72 3-7 8-11 14-13Z" />
                    <path d="M94 15c7 16 10 99 0 130M69 39l32-8M66 55l38-9M64 72l42-10M63 90l44-10M65 108l40-9M70 125l31-7" />
                    <path d="M126 34l30-19M127 43l33-20" />
                  </svg>
                </figure>

                <div class="page-copy">
                  <p v-for="paragraph in currentPage.paragraphs" :key="paragraph">{{ paragraph }}</p>
                </div>

                <p v-if="currentPage.annotation" class="page-annotation">{{ currentPage.annotation }}</p>
                <span class="page-number">{{ String(restingPageIndex + 1).padStart(2, '0') }}</span>
              </div>
            </article>

            <div
              v-if="isClosed"
              class="notebook-cover"
              data-testid="settled-cover"
              aria-label="Closed F3-03 front cover, Antony Santos notebook"
            >
              <img :src="assetFor('cover-f3-03-front')?.path" alt="" aria-hidden="true">
              <div class="notebook-cover__title" aria-hidden="true">
                <span>CUADERNO</span>
                <strong>Antony Santos</strong>
                <small>archivo de bolsillo</small>
              </div>
            </div>

            <div
              v-if="hasTurningCover"
              class="turning-cover"
              :class="{
                'turning-cover--opening': isOpening,
                'turning-cover--closing': isClosing,
              }"
              data-testid="turning-cover"
              aria-hidden="true"
              @animationend="onCoverAnimationEnd"
            >
              <div class="turning-cover__face turning-cover__face--front">
                <img :src="assetFor('cover-f3-03-front')?.path" alt="">
                <div class="notebook-cover__title">
                  <span>CUADERNO</span>
                  <strong>Antony Santos</strong>
                  <small>archivo de bolsillo</small>
                </div>
              </div>
              <div class="turning-cover__face turning-cover__face--back">
                <img :src="assetFor('cover-f3-03-board')?.path" alt="">
              </div>
            </div>
          </div>
        </div>

        <nav class="notebook-controls" aria-label="Pocket notebook controls">
          <button
            type="button"
            class="notebook-control"
            aria-label="Previous"
            :disabled="!canClose"
            @click="closeNotebook"
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </button>

          <button
            type="button"
            class="notebook-control notebook-control--primary"
            :aria-label="isClosed ? 'Open notebook' : 'Next page'"
            :disabled="!canOpen"
            @click="openNotebook"
          >
            <span>{{ isClosed ? 'Open' : 'Next' }}</span>
            <span aria-hidden="true">→</span>
          </button>
        </nav>

        <p class="notebook-status" aria-live="polite" data-testid="notebook-status">{{ statusText }}</p>
      </div>

      <aside class="exhibit-note exhibit-note--contract">
        <p class="exhibit-note__index">02</p>
        <h2>Transient cover</h2>
        <p>
          The resting cover is never the animated element. Opening and closing create a temporary two-faced cover that is removed after settling.
        </p>
        <ul>
          <li>Front face · F3-03 cover</li>
          <li>Back face · F3-03 inside board</li>
          <li>Page 1 · ordinary DOM underneath</li>
        </ul>
        <p class="exhibit-note__small">Arrow Right opens the notebook. Arrow Left closes it from page 1.</p>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.pocket-lab {
  min-height: 100dvh;
  width: 100%;
  overflow-x: clip;
  padding:
    max(1.1rem, env(safe-area-inset-top))
    max(1rem, env(safe-area-inset-right))
    max(2rem, env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
  background:
    radial-gradient(circle at 50% 38%, rgba(108, 71, 45, .17), transparent 30rem),
    linear-gradient(145deg, rgba(255, 255, 255, .02), transparent 40%),
    #0d0b09;
  color: #e5d8c4;
}

.pocket-lab__header {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  gap: .8rem;
  padding: .4rem 0 1.4rem;
  border-bottom: 1px solid rgba(225, 204, 173, .1);
}

.pocket-lab__kicker,
.exhibit-note__index {
  margin: 0 0 .45rem;
  color: #b67c5c;
  font-size: .67rem;
  font-weight: 750;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.pocket-lab__header h1 {
  margin: 0;
  color: #f0e5d4;
  font: 400 clamp(2.2rem, 11vw, 4.7rem)/.94 Georgia, 'Times New Roman', serif;
  letter-spacing: -.045em;
}

.pocket-lab__intro {
  max-width: 62ch;
  margin: 0;
  color: #9f907e;
  font-size: .88rem;
  line-height: 1.55;
}

.pocket-exhibit {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.6rem;
  padding: 1.6rem 0 0;
}

.notebook-column {
  order: -1;
  display: grid;
  justify-items: center;
  gap: .75rem;
}

.notebook-stage {
  width: 100%;
  min-height: min(62dvh, 560px);
  display: grid;
  place-items: center;
  padding: clamp(1.2rem, 5vw, 2.4rem);
  border: 1px solid rgba(225, 204, 173, .1);
  background:
    radial-gradient(circle at 50% 45%, rgba(158, 105, 66, .11), transparent 52%),
    #100d0a;
  box-shadow: inset 0 1px rgba(255, 255, 255, .015);
}

.pocket-notebook {
  position: relative;
  width: min(84vw, 346px, calc((100dvh - 230px) * .75));
  aspect-ratio: 3 / 4;
  isolation: isolate;
  perspective: 1050px;
  filter: drop-shadow(0 28px 24px rgba(0, 0, 0, .5));
}

.notebook-board,
.notebook-cover,
.turning-cover {
  position: absolute;
  inset: 0;
}

.notebook-board {
  z-index: 1;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  margin: 1px;
  display: block;
  object-fit: cover;
  border-radius: 3px 11px 11px 3px;
}

.paper-stack {
  position: absolute;
  z-index: 4;
  inset: 7px 8px 8px 9px;
}

.paper-stack__sheet {
  position: absolute;
  inset: 0;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  box-shadow:
    1px 1px 0 rgba(115, 79, 43, .36),
    0 0 0 1px rgba(84, 56, 31, .1);
  transform-origin: left center;
}

.resting-page {
  position: absolute;
  z-index: 8;
  inset: 6px 9px 9px 9px;
  overflow: hidden;
  background: #e7dcc4;
  box-shadow:
    0 9px 14px rgba(45, 29, 15, .26),
    0 0 0 1px rgba(100, 68, 37, .18);
}

.paper-base,
.paper-wear {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.paper-base {
  z-index: 0;
  display: block;
  object-fit: cover;
}

.paper-wear {
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  pointer-events: none;
}

.paper-wear--under { z-index: 2; }
.paper-wear--over { z-index: 8; }

.page-content {
  position: absolute;
  z-index: 6;
  inset: 0;
  padding: 11% 10% 9%;
  color: rgba(53, 41, 29, .88);
  font-family: Georgia, 'Times New Roman', serif;
  text-shadow: 0 1px rgba(255, 255, 255, .24);
  user-select: text;
}

.page-eyebrow {
  margin: 0 0 12%;
  color: rgba(86, 60, 35, .55);
  font-size: clamp(.52rem, 1.9vw, .66rem);
  font-style: italic;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.page-content h2 {
  max-width: 12ch;
  margin: 0;
  font-size: clamp(1.28rem, 5.4vw, 2rem);
  font-weight: 400;
  line-height: 1.04;
  letter-spacing: -.025em;
}

.page-copy {
  display: grid;
  gap: .75rem;
  margin-top: 1.15rem;
}

.page-copy p {
  max-width: 31ch;
  margin: 0;
  font-size: clamp(.66rem, 2.5vw, .84rem);
  line-height: 1.55;
}

.page-annotation {
  position: absolute;
  right: 9%;
  bottom: 11%;
  max-width: 17ch;
  margin: 0;
  color: rgba(74, 54, 33, .5);
  font-size: clamp(.55rem, 2vw, .68rem);
  font-style: italic;
  line-height: 1.35;
  text-align: right;
  transform: rotate(-2deg);
}

.page-number {
  position: absolute;
  right: 9%;
  bottom: 4.5%;
  color: rgba(66, 47, 28, .42);
  font-size: .62rem;
  letter-spacing: .12em;
}

.page-date-mark {
  margin: 1.2rem 0 0;
  color: rgba(94, 59, 33, .7);
  font-size: clamp(1.35rem, 7vw, 2.2rem);
  font-style: italic;
  letter-spacing: -.03em;
}

.guira-sketch {
  width: 58%;
  margin: .8rem auto .4rem;
  color: rgba(61, 45, 29, .55);
}

.guira-sketch svg {
  width: 100%;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.resting-page--sketch .page-eyebrow { margin-bottom: 6%; }
.resting-page--sketch .page-copy { margin-top: .45rem; }
.resting-page--margin-note .page-content h2 { transform: rotate(-1deg); }

.notebook-cover {
  z-index: 20;
  overflow: hidden;
  border-radius: 3px 11px 11px 3px;
  background: #743e31;
  box-shadow:
    0 11px 18px rgba(0, 0, 0, .4),
    inset 0 0 0 1px rgba(255, 226, 182, .1);
}

.notebook-cover > img,
.turning-cover__face > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.notebook-cover__title {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: .65rem;
  padding-left: 3%;
  color: #d5ae76;
  font-family: Georgia, 'Times New Roman', serif;
  text-align: center;
  text-shadow: 0 1px 1px rgba(0, 0, 0, .48);
}

.notebook-cover__title span {
  padding-left: .28em;
  font-size: clamp(1rem, 5vw, 1.55rem);
  letter-spacing: .28em;
}

.notebook-cover__title strong {
  color: rgba(225, 194, 148, .72);
  font-size: clamp(.8rem, 3.8vw, 1.08rem);
  font-style: italic;
  font-weight: 400;
  letter-spacing: .06em;
}

.notebook-cover__title small {
  color: rgba(225, 194, 148, .34);
  font-size: .58rem;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.turning-cover {
  z-index: 30;
  transform-style: preserve-3d;
  transform-origin: left center;
  will-change: transform;
}

.turning-cover--opening {
  animation: pocket-cover-open 720ms cubic-bezier(.22, .72, .2, 1) forwards;
}

.turning-cover--closing {
  animation: pocket-cover-close 720ms cubic-bezier(.3, .02, .35, 1) forwards;
}

.turning-cover__face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 3px 11px 11px 3px;
  backface-visibility: hidden;
  box-shadow: 0 9px 18px rgba(0, 0, 0, .34);
}

.turning-cover__face--front {
  background: #743e31;
}

.turning-cover__face--back {
  transform: rotateY(180deg);
  background: #5d4435;
}

@keyframes pocket-cover-open {
  0% { transform: rotateY(0deg); }
  35% { transform: rotateY(-72deg) translateZ(1px); }
  100% { transform: rotateY(-178deg); }
}

@keyframes pocket-cover-close {
  0% { transform: rotateY(-178deg); }
  65% { transform: rotateY(-68deg) translateZ(1px); }
  100% { transform: rotateY(0deg); }
}

.notebook-controls {
  width: min(100%, 346px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .65rem;
}

.notebook-control {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  padding: .75rem 1rem;
  border: 1px solid rgba(224, 205, 174, .18);
  border-radius: 2px;
  background: rgba(255, 255, 255, .025);
  color: #cdbcaa;
  cursor: pointer;
  font: 600 .75rem/1 system-ui, sans-serif;
  letter-spacing: .04em;
}

.notebook-control--primary {
  border-color: rgba(185, 119, 82, .45);
  background: rgba(151, 86, 58, .12);
  color: #ead9c5;
}

.notebook-control:disabled {
  cursor: default;
  opacity: .32;
}

.notebook-control:focus-visible {
  outline: 2px solid #d59a75;
  outline-offset: 3px;
}

.notebook-status {
  margin: 0;
  color: #7f7163;
  font-size: .7rem;
  line-height: 1.4;
  text-align: center;
}

.exhibit-note {
  padding: 1.15rem 0;
  border-top: 1px solid rgba(225, 204, 173, .1);
}

.exhibit-note h2 {
  margin: 0 0 .65rem;
  color: #dfd1bc;
  font: 400 1.2rem/1.1 Georgia, 'Times New Roman', serif;
}

.exhibit-note > p:not(.exhibit-note__index) {
  max-width: 46ch;
  margin: 0;
  color: #8f806f;
  font-size: .78rem;
  line-height: 1.55;
}

.exhibit-note dl {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 1rem 0 0;
  border-top: 1px solid rgba(225, 204, 173, .08);
  border-left: 1px solid rgba(225, 204, 173, .08);
}

.exhibit-note dl div {
  min-width: 0;
  padding: .7rem;
  border-right: 1px solid rgba(225, 204, 173, .08);
  border-bottom: 1px solid rgba(225, 204, 173, .08);
}

.exhibit-note dt {
  color: #655b51;
  font-size: .52rem;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.exhibit-note dd {
  margin: .35rem 0 0;
  color: #bba890;
  font-size: .68rem;
}

.exhibit-note ul {
  display: grid;
  gap: .45rem;
  margin: 1rem 0;
  padding: 0;
  list-style: none;
  color: #b29077;
  font-size: .72rem;
}

.exhibit-note li::before {
  content: '—';
  margin-right: .5rem;
  color: #7d4e38;
}

.exhibit-note .exhibit-note__small {
  color: #6f6357;
  font-size: .68rem;
}

@media (min-width: 900px) {
  .pocket-lab { padding-top: max(2rem, env(safe-area-inset-top)); }

  .pocket-lab__header {
    grid-template-columns: minmax(0, 1fr) minmax(300px, .7fr);
    align-items: end;
    gap: 3rem;
    padding-bottom: 1.7rem;
  }

  .pocket-exhibit {
    grid-template-columns: minmax(210px, .8fr) minmax(360px, 430px) minmax(210px, .8fr);
    gap: clamp(2rem, 4vw, 4.5rem);
    align-items: center;
    padding-top: 2.2rem;
  }

  .notebook-column { order: 0; }
  .notebook-stage { min-height: 660px; padding: 3.2rem; }
  .exhibit-note { border-top: 0; padding: 0; }
  .exhibit-note--context { align-self: start; padding-top: 3rem; }
  .exhibit-note--contract { align-self: end; padding-bottom: 3rem; }
  .exhibit-note dl { grid-template-columns: 1fr; }
}

@media (max-width: 390px) {
  .pocket-lab {
    padding-right: max(.7rem, env(safe-area-inset-right));
    padding-left: max(.7rem, env(safe-area-inset-left));
  }

  .pocket-lab__header h1 { font-size: 2.45rem; }
  .pocket-lab__intro { font-size: .8rem; }
  .notebook-stage { padding-right: .85rem; padding-left: .85rem; }
  .page-content { padding-right: 9%; padding-left: 9%; }
}

@media (prefers-reduced-motion: reduce) {
  .turning-cover {
    animation-duration: 1ms !important;
  }
}
</style>
