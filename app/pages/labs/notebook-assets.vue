<script setup lang="ts">
import manifestSource from '~~/public/notebook-assets/manifest.json'

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
  id: string
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

const manifest = manifestSource as NotebookAssetManifest

const groupOrder: NotebookAsset['group'][] = ['substrate', 'wear', 'mask', 'cover']
const groupLabels: Record<NotebookAsset['group'], string> = {
  substrate: 'Paper substrates',
  wear: 'Transparent wear',
  mask: 'Edge silhouettes',
  cover: 'Cover and board',
}

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

const assets = computed(() => manifest.assets)
const recipes = computed(() => manifest.recipes)
const assetMap = computed(() => new Map(assets.value.map(asset => [asset.id, asset])))
const selectedRecipeId = ref(recipes.value[0]?.id ?? 'carried')
const wearIntensity = ref(100)
const visibleLayers = ref<Record<string, boolean>>({})

const selectedRecipe = computed(() => (
  recipes.value.find(recipe => recipe.id === selectedRecipeId.value) ?? recipes.value[0]
))

watch(
  selectedRecipe,
  (recipe) => {
    if (!recipe) return
    visibleLayers.value = Object.fromEntries(recipe.layers.map(id => [id, true]))
  },
  { immediate: true },
)

const assetFor = (id: string): NotebookAsset | undefined => assetMap.value.get(id)

const groupedAssets = computed(() => groupOrder.map(group => ({
  group,
  label: groupLabels[group],
  assets: assets.value.filter(asset => asset.group === group),
})))

const maskStyle = (recipe: NotebookRecipe | undefined) => {
  const mask = recipe ? assetFor(recipe.mask) : undefined
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

const overlayStyle = (id: string, interactive = false) => {
  const asset = assetFor(id)
  const enabled = interactive ? visibleLayers.value[id] !== false : true
  const intensity = interactive ? wearIntensity.value / 100 : 1
  return {
    backgroundImage: asset ? `url(${asset.path})` : undefined,
    opacity: enabled ? (layerOpacity[id] ?? 1) * intensity : 0,
  }
}

const overlayTier = (id: string) => (
  id === 'wear-smudge' || id === 'wear-handling-grime' || id === 'wear-crease'
    ? 'paper-layer--over'
    : 'paper-layer--under'
)

const toggleLayer = (id: string) => {
  visibleLayers.value[id] = visibleLayers.value[id] === false
}

useSeoMeta({
  title: 'Notebook Static Asset Lab',
  description: 'Stage-one inspection of Mayimbe notebook substrates, wear overlays, edge masks, and cover assets.',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <section class="asset-lab-page">
    <header class="asset-lab-hero">
      <div>
        <p class="asset-lab-kicker">Notebook rebuild · Stage 1</p>
        <h1>Static material system</h1>
        <p class="asset-lab-intro">
          The original notebook’s visual recipes, separated into durable image ingredients.
          Inspect each export alone, then combine the layers without invoking canvas or WebGL.
        </p>
      </div>

      <dl class="asset-lab-facts">
        <div>
          <dt>Exports</dt>
          <dd>{{ assets.length }}</dd>
        </div>
        <div>
          <dt>Master size</dt>
          <dd>{{ manifest.dimensions.width }} × {{ manifest.dimensions.height }}</dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>CSS + images</dd>
        </div>
        <div>
          <dt>Canvas / WebGL</dt>
          <dd>0 / 0</dd>
        </div>
      </dl>
    </header>

    <section class="asset-lab-section asset-lab-workbench" aria-labelledby="composition-title">
      <div class="section-heading">
        <p class="section-index">01</p>
        <div>
          <h2 id="composition-title">Composition workbench</h2>
          <p>Toggle the physical evidence on and off. Text remains live DOM content.</p>
        </div>
      </div>

      <div class="workbench-grid">
        <div class="workbench-stage">
          <div class="paper-stack-demo" aria-label="Layered paper composition preview">
            <div
              v-for="sheet in 7"
              :key="`stack-${sheet}`"
              class="paper-stack-demo__sheet"
              :style="{
                ...maskStyle(selectedRecipe),
                backgroundImage: `url(${assetFor(selectedRecipe?.base ?? '')?.path})`,
                transform: `translate(${(8 - sheet) * 1.15}px, ${(8 - sheet) * 1.55}px)`,
              }"
            />

            <article
              v-if="selectedRecipe"
              class="paper-composition paper-composition--primary"
              :style="maskStyle(selectedRecipe)"
            >
              <img
                class="paper-base"
                :src="assetFor(selectedRecipe.base)?.path"
                :alt="`${selectedRecipe.label} paper substrate`"
              >

              <span
                v-for="layerId in selectedRecipe.layers"
                :key="layerId"
                class="paper-layer"
                :class="overlayTier(layerId)"
                :style="overlayStyle(layerId, true)"
                aria-hidden="true"
              />

              <div class="paper-content">
                <p class="paper-date">Villa Vásquez · 1979</p>
                <h3>Un cuaderno para las canciones</h3>
                <div class="paper-rule" />
                <p>
                  Before the stages and recordings, there were fragments: names, verses,
                  rhythms, and the beginnings of stories written down so they would not disappear.
                </p>
                <p class="paper-note">The content is selectable. The wear is not.</p>
                <span class="paper-number">03</span>
              </div>
            </article>
          </div>
        </div>

        <aside class="layer-inspector" aria-label="Composition controls">
          <div class="recipe-tabs" role="tablist" aria-label="Paper history">
            <button
              v-for="recipe in recipes"
              :key="recipe.id"
              type="button"
              role="tab"
              :aria-selected="selectedRecipeId === recipe.id"
              :class="{ active: selectedRecipeId === recipe.id }"
              @click="selectedRecipeId = recipe.id"
            >
              {{ recipe.label }}
            </button>
          </div>

          <p class="recipe-description">{{ selectedRecipe?.description }}</p>

          <label class="intensity-control">
            <span>Wear intensity</span>
            <output>{{ wearIntensity }}%</output>
            <input v-model="wearIntensity" type="range" min="0" max="125" step="5">
          </label>

          <div class="layer-list">
            <p class="layer-list__label">Visible layers</p>
            <button
              v-for="layerId in selectedRecipe?.layers"
              :key="layerId"
              type="button"
              class="layer-row"
              :class="{ disabled: visibleLayers[layerId] === false }"
              :aria-pressed="visibleLayers[layerId] !== false"
              @click="toggleLayer(layerId)"
            >
              <span class="layer-thumb checkerboard">
                <img :src="assetFor(layerId)?.path" alt="">
              </span>
              <span class="layer-copy">
                <strong>{{ assetFor(layerId)?.label }}</strong>
                <small>{{ assetFor(layerId)?.file }}</small>
              </span>
              <span class="layer-state">{{ visibleLayers[layerId] === false ? 'Off' : 'On' }}</span>
            </button>
          </div>
        </aside>
      </div>
    </section>

    <section class="asset-lab-section" aria-labelledby="recipes-title">
      <div class="section-heading">
        <p class="section-index">02</p>
        <div>
          <h2 id="recipes-title">Three histories, one stock</h2>
          <p>The paper family is a deterministic recipe, not a pre-painted finished page.</p>
        </div>
      </div>

      <div class="recipe-gallery">
        <article v-for="recipe in recipes" :key="recipe.id" class="recipe-card">
          <div class="recipe-card__paper" :style="maskStyle(recipe)">
            <img class="paper-base" :src="assetFor(recipe.base)?.path" alt="">
            <span
              v-for="layerId in recipe.layers"
              :key="layerId"
              class="paper-layer"
              :class="overlayTier(layerId)"
              :style="overlayStyle(layerId)"
              aria-hidden="true"
            />
            <div class="recipe-card__mark">
              <span>{{ recipe.id === 'carried' ? 'I' : recipe.id === 'humidity' ? 'II' : 'III' }}</span>
            </div>
          </div>
          <div class="recipe-card__copy">
            <h3>{{ recipe.label }}</h3>
            <p>{{ recipe.description }}</p>
            <small>{{ recipe.layers.length }} interchangeable wear layers</small>
          </div>
        </article>
      </div>
    </section>

    <section class="asset-lab-section" aria-labelledby="cover-title">
      <div class="section-heading">
        <p class="section-index">03</p>
        <div>
          <h2 id="cover-title">F3-03 physical assembly</h2>
          <p>The approved brick cover and its quieter inner board are now ordinary static images.</p>
        </div>
      </div>

      <div class="cover-lab">
        <div class="closed-book" aria-label="Static cover, board, and paper stack assembly">
          <img class="closed-book__board" :src="assetFor('cover-f3-03-board')?.path" alt="">
          <div class="closed-book__block">
            <span v-for="sheet in 10" :key="sheet" :style="{ right: `${sheet * 0.8}px`, bottom: `${sheet * 0.42}px` }" />
          </div>
          <img class="closed-book__cover" :src="assetFor('cover-f3-03-front')?.path" alt="F3-03 brick notebook cover">
          <div class="closed-book__title">
            <span>CUADERNO</span>
            <small>Antony Santos</small>
          </div>
        </div>

        <div class="cover-specimens">
          <figure>
            <img :src="assetFor('cover-f3-03-front')?.path" alt="F3-03 front cover texture">
            <figcaption><strong>Front cover</strong><span>Full-strength carried wear</span></figcaption>
          </figure>
          <figure>
            <img :src="assetFor('cover-f3-03-board')?.path" alt="F3-03 inside board texture">
            <figcaption><strong>Inside board</strong><span>Restrained wear at 35%</span></figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section class="asset-lab-section" aria-labelledby="inventory-title">
      <div class="section-heading">
        <p class="section-index">04</p>
        <div>
          <h2 id="inventory-title">Asset inventory</h2>
          <p>Transparent exports sit on a checkerboard. Edge masks are displayed against charcoal.</p>
        </div>
      </div>

      <div v-for="collection in groupedAssets" :key="collection.group" class="asset-collection">
        <h3>{{ collection.label }} <span>{{ collection.assets.length }}</span></h3>
        <div class="asset-grid">
          <figure v-for="asset in collection.assets" :key="asset.id" class="asset-card">
            <div
              class="asset-card__image"
              :class="{ checkerboard: !asset.opaque, 'asset-card__image--mask': asset.group === 'mask' }"
            >
              <img :src="asset.path" :alt="asset.label">
            </div>
            <figcaption>
              <strong>{{ asset.label }}</strong>
              <span>{{ asset.file }}</span>
              <small>{{ asset.width }} × {{ asset.height }} · {{ asset.format.toUpperCase() }}</small>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <footer class="asset-lab-footer">
      <p>
        Generated from <code>{{ manifest.generatedFrom }}</code>. These are visual ingredients;
        page content and future interaction remain separate concerns.
      </p>
      <NuxtLink to="/museum/notebook">Return to the current notebook</NuxtLink>
    </footer>
  </section>
</template>

<style scoped>
.asset-lab-page {
  --lab-cream: #e4d5b9;
  --lab-paper: #e8ddc5;
  --lab-rust: #9d6344;
  width: min(1420px, calc(100% - 2rem));
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 7rem) 0 6rem;
  color: #e9dfcf;
}

.asset-lab-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
  gap: clamp(2rem, 7vw, 8rem);
  align-items: end;
  padding-bottom: clamp(3rem, 7vw, 6rem);
  border-bottom: 1px solid rgba(224, 205, 174, .16);
}

.asset-lab-kicker,
.section-index {
  margin: 0 0 .8rem;
  color: #bd8a69;
  font-size: .72rem;
  font-weight: 750;
  letter-spacing: .19em;
  text-transform: uppercase;
}

.asset-lab-hero h1 {
  max-width: none;
  margin: 0;
  color: #f2e8d8;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(3rem, 8vw, 7.2rem);
  font-weight: 400;
  letter-spacing: -.055em;
  line-height: .86;
}

.asset-lab-intro {
  max-width: 65ch;
  margin: 1.8rem 0 0;
  color: #bfb09d;
  font-size: clamp(1rem, 1.5vw, 1.18rem);
  line-height: 1.7;
}

.asset-lab-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 0;
  border-top: 1px solid rgba(224, 205, 174, .15);
  border-left: 1px solid rgba(224, 205, 174, .15);
}

.asset-lab-facts div {
  min-height: 6rem;
  padding: 1rem;
  border-right: 1px solid rgba(224, 205, 174, .15);
  border-bottom: 1px solid rgba(224, 205, 174, .15);
}

.asset-lab-facts dt {
  color: #857665;
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.asset-lab-facts dd {
  margin: .65rem 0 0;
  color: #ded0ba;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.25rem;
}

.asset-lab-section {
  padding: clamp(3.5rem, 8vw, 7rem) 0;
  border-bottom: 1px solid rgba(224, 205, 174, .12);
}

.section-heading {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr);
  margin-bottom: clamp(2rem, 5vw, 4rem);
}

.section-heading h2 {
  margin: 0;
  color: #eadfcd;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 4vw, 3.6rem);
  font-weight: 400;
  letter-spacing: -.035em;
}

.section-heading p:last-child {
  max-width: 68ch;
  margin: .75rem 0 0;
  color: #958675;
  line-height: 1.6;
}

.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, .88fr);
  gap: clamp(1.25rem, 4vw, 4rem);
}

.workbench-stage {
  min-height: 720px;
  display: grid;
  place-items: center;
  padding: clamp(2rem, 7vw, 6rem);
  border: 1px solid rgba(224, 205, 174, .12);
  background:
    radial-gradient(circle at 50% 42%, rgba(112, 76, 48, .17), transparent 42%),
    linear-gradient(145deg, rgba(255, 255, 255, .025), transparent 42%),
    #100d0a;
  overflow: hidden;
}

.paper-stack-demo {
  position: relative;
  width: min(100%, 410px);
  aspect-ratio: 3 / 4;
  filter: drop-shadow(0 40px 35px rgba(0, 0, 0, .55));
}

.paper-stack-demo__sheet,
.paper-composition {
  position: absolute;
  inset: 0;
}

.paper-stack-demo__sheet {
  background-position: center;
  background-size: 100% 100%;
  box-shadow: 1px 1px 0 rgba(118, 85, 46, .42);
}

.paper-composition {
  overflow: hidden;
  background: var(--lab-paper);
}

.paper-composition--primary {
  z-index: 10;
}

.paper-base,
.paper-layer {
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

.paper-layer {
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  pointer-events: none;
  transition: opacity 180ms ease;
}

.paper-layer--under { z-index: 2; }
.paper-layer--over { z-index: 22; }

.paper-content {
  position: absolute;
  inset: 0;
  z-index: 12;
  padding: 12% 11% 10%;
  color: rgba(56, 44, 31, .88);
  font-family: Georgia, 'Times New Roman', serif;
  text-shadow: 0 1px rgba(255, 255, 255, .25);
}

.paper-date {
  margin: 0 0 14%;
  color: rgba(80, 59, 37, .56);
  font-size: clamp(.55rem, 1.4vw, .7rem);
  font-style: italic;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.paper-content h3 {
  max-width: 12ch;
  margin: 0;
  font-size: clamp(1.35rem, 4vw, 2.3rem);
  font-weight: 400;
  line-height: 1.08;
}

.paper-rule {
  width: 2.8rem;
  height: 1px;
  margin: 1.25rem 0;
  background: rgba(71, 52, 32, .32);
}

.paper-content > p:not(.paper-date, .paper-note) {
  max-width: 30ch;
  font-size: clamp(.72rem, 1.8vw, .94rem);
  line-height: 1.65;
}

.paper-note {
  position: absolute;
  right: 10%;
  bottom: 13%;
  max-width: 14ch;
  color: rgba(70, 52, 34, .5);
  font-size: clamp(.58rem, 1.5vw, .74rem);
  font-style: italic;
  line-height: 1.35;
  transform: rotate(-3deg);
}

.paper-number {
  position: absolute;
  right: 10%;
  bottom: 5%;
  font-size: .7rem;
  opacity: .45;
}

.layer-inspector {
  align-self: start;
  padding: clamp(1.25rem, 3vw, 2rem);
  border: 1px solid rgba(224, 205, 174, .13);
  background: rgba(255, 255, 255, .018);
}

.recipe-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .4rem;
}

.recipe-tabs button {
  min-height: 3.7rem;
  padding: .65rem .5rem;
  border: 1px solid rgba(224, 205, 174, .13);
  background: transparent;
  color: #8e7d6a;
  cursor: pointer;
  font-size: .72rem;
  line-height: 1.25;
}

.recipe-tabs button.active {
  border-color: rgba(193, 137, 100, .65);
  background: rgba(157, 99, 68, .12);
  color: #eadbc4;
}

.recipe-description {
  min-height: 4.5rem;
  margin: 1.5rem 0;
  color: #a99a87;
  line-height: 1.55;
}

.intensity-control {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: .65rem 1rem;
  padding: 1rem 0 1.5rem;
  border-top: 1px solid rgba(224, 205, 174, .1);
  border-bottom: 1px solid rgba(224, 205, 174, .1);
  color: #cabba6;
  font-size: .78rem;
}

.intensity-control output {
  color: #bd8a69;
  font-variant-numeric: tabular-nums;
}

.intensity-control input {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: #a36a4a;
}

.layer-list__label {
  margin: 1.5rem 0 .7rem;
  color: #776a5c;
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
}

.layer-row {
  width: 100%;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: .8rem;
  align-items: center;
  padding: .65rem 0;
  border: 0;
  border-bottom: 1px solid rgba(224, 205, 174, .08);
  background: transparent;
  color: #cfc1ad;
  cursor: pointer;
  text-align: left;
}

.layer-row.disabled { opacity: .42; }

.layer-thumb {
  width: 42px;
  aspect-ratio: 3 / 4;
  display: block;
  overflow: hidden;
  border: 1px solid rgba(224, 205, 174, .13);
}

.layer-thumb img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.layer-copy {
  min-width: 0;
  display: grid;
  gap: .16rem;
}

.layer-copy strong { font-size: .8rem; font-weight: 600; }
.layer-copy small {
  overflow: hidden;
  color: #73675a;
  font-size: .62rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.layer-state { color: #9c6b4e; font-size: .65rem; text-transform: uppercase; }

.checkerboard {
  background-color: #b9ad9b;
  background-image:
    linear-gradient(45deg, #d4c9b8 25%, transparent 25%),
    linear-gradient(-45deg, #d4c9b8 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #d4c9b8 75%),
    linear-gradient(-45deg, transparent 75%, #d4c9b8 75%);
  background-position: 0 0, 0 7px, 7px -7px, -7px 0;
  background-size: 14px 14px;
}

.recipe-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 3vw, 2.25rem);
}

.recipe-card {
  margin: 0;
  padding: clamp(1rem, 2vw, 1.4rem);
  border: 1px solid rgba(224, 205, 174, .12);
  background: rgba(255, 255, 255, .018);
}

.recipe-card__paper {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  filter: drop-shadow(0 18px 16px rgba(0, 0, 0, .34));
}

.recipe-card__mark {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: grid;
  place-items: center;
  color: rgba(58, 43, 28, .26);
  font: italic clamp(3rem, 7vw, 6rem)/1 Georgia, serif;
}

.recipe-card__copy { padding: 1.5rem .25rem .25rem; }
.recipe-card__copy h3 {
  margin: 0;
  color: #dfd1bc;
  font: 400 1.2rem/1.2 Georgia, serif;
}
.recipe-card__copy p { min-height: 4.6rem; margin: .65rem 0; color: #8f806f; font-size: .82rem; line-height: 1.55; }
.recipe-card__copy small { color: #a56f50; font-size: .68rem; }

.cover-lab {
  display: grid;
  grid-template-columns: minmax(300px, .9fr) minmax(0, 1.1fr);
  gap: clamp(2rem, 6vw, 6rem);
  align-items: center;
}

.closed-book {
  position: relative;
  width: min(88%, 430px);
  aspect-ratio: 3 / 4;
  margin: 2rem auto;
  filter: drop-shadow(0 38px 32px rgba(0, 0, 0, .58));
  transform: rotate(-2.2deg);
}

.closed-book__board,
.closed-book__cover,
.closed-book__block {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.closed-book__board { z-index: 0; object-fit: cover; border-radius: 3px 10px 10px 3px; transform: translate(7px, 10px); }
.closed-book__block { z-index: 2; }
.closed-book__block span {
  position: absolute;
  inset: 9px 3px 3px 7px;
  border-radius: 2px 6px 6px 2px;
  background: linear-gradient(90deg, #c9b895, #eadfc6 35%, #b69968 100%);
  box-shadow: 1px 1px rgba(91, 62, 32, .46);
}
.closed-book__cover { z-index: 4; object-fit: cover; border-radius: 3px 10px 10px 3px; }
.closed-book__title {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-content: center;
  gap: .75rem;
  color: #d1ad78;
  font-family: Georgia, 'Times New Roman', serif;
  text-align: center;
  text-shadow: 0 1px 1px rgba(0, 0, 0, .45);
}
.closed-book__title span { padding-left: .28em; font-size: clamp(1.1rem, 3vw, 1.8rem); letter-spacing: .28em; }
.closed-book__title small { color: rgba(224, 193, 147, .48); font-style: italic; letter-spacing: .08em; }

.cover-specimens {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(1rem, 3vw, 2rem);
}

.cover-specimens figure { margin: 0; }
.cover-specimens img { width: 100%; display: block; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 2px 8px 8px 2px; }
.cover-specimens figcaption { display: grid; gap: .3rem; padding: 1rem 0; }
.cover-specimens strong { color: #d8c9b4; font: 400 1rem/1.2 Georgia, serif; }
.cover-specimens span { color: #7f7162; font-size: .7rem; }

.asset-collection + .asset-collection { margin-top: 3.5rem; }
.asset-collection > h3 {
  display: flex;
  align-items: center;
  gap: .7rem;
  margin: 0 0 1rem;
  color: #cdbda7;
  font-size: .82rem;
  letter-spacing: .09em;
  text-transform: uppercase;
}
.asset-collection > h3 span { color: #8a6047; font-size: .68rem; }

.asset-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.asset-card {
  min-width: 0;
  margin: 0;
  border: 1px solid rgba(224, 205, 174, .11);
  background: rgba(255, 255, 255, .015);
}

.asset-card__image {
  height: 270px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.asset-card__image--mask { background: #24201b; }

.asset-card__image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.asset-card figcaption { display: grid; gap: .25rem; padding: 1rem; border-top: 1px solid rgba(224, 205, 174, .09); }
.asset-card strong { color: #d2c3ad; font-size: .82rem; font-weight: 600; }
.asset-card span { overflow: hidden; color: #7e7163; font: .64rem/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; text-overflow: ellipsis; white-space: nowrap; }
.asset-card small { color: #645a50; font-size: .62rem; }

.asset-lab-footer {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  align-items: center;
  padding: 2rem 0 0;
  color: #766a5d;
  font-size: .75rem;
}

.asset-lab-footer p { margin: 0; }
.asset-lab-footer code { color: #9f806a; }
.asset-lab-footer a { flex: none; color: #ba8665; text-decoration: none; }

@media (max-width: 980px) {
  .asset-lab-hero,
  .workbench-grid,
  .cover-lab { grid-template-columns: 1fr; }
  .asset-lab-facts { max-width: 620px; }
  .workbench-stage { min-height: 640px; }
  .layer-inspector { width: 100%; }
  .recipe-gallery { grid-template-columns: repeat(3, minmax(240px, 1fr)); overflow-x: auto; padding-bottom: .6rem; }
  .asset-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 680px) {
  .asset-lab-page { width: min(100% - 1.1rem, 1420px); padding-top: 2.5rem; }
  .asset-lab-hero { gap: 2.5rem; }
  .asset-lab-hero h1 { font-size: clamp(3rem, 18vw, 5rem); }
  .asset-lab-facts div { min-height: 5rem; padding: .8rem; }
  .asset-lab-facts dd { font-size: 1rem; }
  .section-heading { grid-template-columns: 2.5rem minmax(0, 1fr); }
  .workbench-stage { min-height: auto; padding: 3.5rem 1.4rem 4.5rem; }
  .paper-stack-demo { width: min(83vw, 360px); }
  .recipe-tabs { grid-template-columns: 1fr; }
  .recipe-tabs button { min-height: 2.8rem; }
  .asset-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; }
  .asset-card__image { height: 220px; }
  .asset-card figcaption { padding: .75rem; }
  .cover-specimens { gap: .7rem; }
  .asset-lab-footer { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 420px) {
  .asset-grid { grid-template-columns: 1fr; }
  .asset-card__image { height: min(105vw, 460px); }
  .paper-content { padding: 11% 10%; }
  .paper-content h3 { font-size: 1.35rem; }
  .paper-content > p:not(.paper-date, .paper-note) { font-size: .72rem; }
}
</style>
