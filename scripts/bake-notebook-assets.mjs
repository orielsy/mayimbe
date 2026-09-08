/* ======================================================================
   STATIC NOTEBOOK ASSET BAKER
   ----------------------------------------------------------------------
   Captures the approved paper and F3 cover recipes into reusable files for
   the CSS-first notebook. Canvas is allowed here, at build time only. The
   resulting asset-lab page and future notebook runtime consume ordinary
   images and CSS layers; neither needs canvas nor WebGL.

   Usage:
     node scripts/bake-notebook-assets.mjs
   ==================================================================== */
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const OUT = path.join(ROOT, 'public/notebook-assets')
const WORK = path.join(OUT, '.bake')
const WIDTH = 840
const HEIGHT = 1120

await rm(OUT, { recursive: true, force: true })
await mkdir(WORK, { recursive: true })

const entry = path.join(WORK, 'entry.ts')
const bundle = path.join(WORK, 'bundle.js')
const paperSurfacePath = path.join(ROOT, 'exhibits/notebook/engine/native/paper-surface.ts')
const paperStackPath = path.join(ROOT, 'exhibits/notebook/engine/native/paper-stack.ts')
const coverPath = path.join(ROOT, 'exhibits/notebook/engine/native/cover-f3.ts')

const entrySource = `
import { PaperSurface } from ${JSON.stringify(paperSurfacePath)}
import { PaperStack } from ${JSON.stringify(paperStackPath)}
import { finalCoverSkin, finalBoardSkin } from ${JSON.stringify(coverPath)}

const artboard = document.querySelector('#artboard')
if (!(artboard instanceof HTMLElement)) throw new Error('Missing #artboard')

const blank = () => {
  artboard.removeAttribute('style')
  Object.assign(artboard.style, {
    width: '${WIDTH}px',
    height: '${HEIGHT}px',
    position: 'relative',
    overflow: 'hidden',
  })
}

const base = (seed, tone, fibre) => PaperSurface.surface({
  seed,
  tone,
  grime: 0,
  edge: 0,
  foxing: 0,
  humid: 0,
  fibre,
  events: {},
})

const mask = (seed, mix, exposure, notch) => {
  const condition = PaperStack.condition({
    seed,
    familyMix: mix,
    exposure,
    notebookAge: 0.88,
    familyEdgeInfluence: 0.7,
    geoIntensity: PaperStack.PRODUCTION_LIMITS.geometricIntensity,
    limits: PaperStack.PRODUCTION_LIMITS,
    neighborhood: {
      humid: mix > 0.25 && mix < 0.75 ? 0.72 : 0.12,
      foxing: mix > 0.25 && mix < 0.75 ? 0.58 : 0.08,
      bloom: mix > 0.25 && mix < 0.75 ? 0.38 : 0.04,
      compress: 0.26,
      cockle: mix > 0.25 && mix < 0.75 ? 0.42 : 0.08,
      phase: 2.01,
    },
    events: { notch },
  })
  return PaperStack.edgeProfile(condition)
}

const recipes = {
  'paper-base-carried': () => ({ background: base(577, 0.66, 1) }),
  'paper-base-humidity': () => ({ background: base(577, 0.54, 0.96) }),
  'paper-base-protected': () => ({ background: base(577, 0.34, 0.94) }),
  'wear-foxing-light': () => ({
    background: PaperSurface.tile(PaperSurface.foxingTex(1314, 0.5, false), '100% 100%'),
  }),
  'wear-foxing-heavy': () => ({
    background: PaperSurface.tile(PaperSurface.foxingTex(2630, 1, false), '100% 100%'),
  }),
  'wear-water-stain': () => ({
    background: PaperSurface.stainLayers(305, 1, false).join(', '),
  }),
  'wear-humidity-bloom': () => ({
    background: PaperSurface.humidLayers(328, 1, false).join(', '),
  }),
  'wear-handling-grime': () => ({
    background: PaperSurface.grimeLayers(317, 1, false).join(', '),
  }),
  'wear-edge-oxidation': () => ({
    background: PaperSurface.edgeLayers(1, 0.62, false).join(', '),
  }),
  'wear-tonal-drift': () => ({
    background: PaperSurface.drift(319, 0.8, false).join(', '),
  }),
  'wear-smudge': () => ({
    background: PaperSurface.smudgeLayers(341, 1, false).join(', '),
  }),
  'wear-crease': () => ({
    background: PaperSurface.layer(PaperSurface.creaseTex(618, false), '68% 51%', 'right bottom'),
  }),
  'mask-carried-0': () => ({ background: '#fff', clipPath: mask(300, 0, 1, 0.34) }),
  'mask-humidity-1': () => ({ background: '#fff', clipPath: mask(317, 0.45, 0.72, 0.52) }),
  'mask-protected-2': () => ({ background: '#fff', clipPath: mask(334, 1, 0.34, 0.18) }),
  'cover-f3-03-front': () => ({
    background: finalCoverSkin(1),
    borderRadius: '5px 20px 20px 5px',
    boxShadow: 'inset 0 0 0 2px rgba(255,225,175,.1), inset 0 -80px 120px rgba(0,0,0,.28)',
  }),
  'cover-f3-03-board': () => ({
    background: finalBoardSkin(0.35),
    borderRadius: '5px 20px 20px 5px',
    boxShadow: 'inset 0 0 0 2px rgba(255,225,175,.08), inset 0 -60px 100px rgba(0,0,0,.22)',
  }),
}

window.__notebookAssetNames = Object.keys(recipes)
window.__renderNotebookAsset = async (name) => {
  const recipe = recipes[name]
  if (!recipe) throw new Error('Unknown notebook asset: ' + name)
  blank()
  Object.assign(artboard.style, recipe())
  await document.fonts.ready
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}
`

await writeFile(entry, entrySource)
await build({
  entryPoints: [entry],
  bundle: true,
  outfile: bundle,
  platform: 'browser',
  format: 'esm',
  loader: { '.css': 'empty' },
  logLevel: 'warning',
})

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  html, body { margin: 0; background: transparent; }
  #artboard { width: ${WIDTH}px; height: ${HEIGHT}px; }
</style>
<div id="artboard"></div>
<script type="module" src="/bundle.js"></script>`

const server = createServer(async (request, response) => {
  if (request.url === '/bundle.js') {
    response.setHeader('content-type', 'text/javascript')
    response.end(await readFile(bundle))
    return
  }
  response.setHeader('content-type', 'text/html')
  response.end(html)
})

await new Promise(resolve => server.listen(0, resolve))
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Could not start asset baker')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'domcontentloaded' })
await page.waitForFunction('Array.isArray(window.__notebookAssetNames)')
const names = await page.evaluate('window.__notebookAssetNames')
const cdp = await page.context().newCDPSession(page)
await cdp.send('Emulation.setDefaultBackgroundColorOverride', {
  color: { r: 0, g: 0, b: 0, a: 0 },
})

const assetDefinitions = [
  { id: 'paper-base-carried', file: 'paper/base-carried.webp', group: 'substrate', label: 'Carried paper base', opaque: true },
  { id: 'paper-base-humidity', file: 'paper/base-humidity.webp', group: 'substrate', label: 'Humidity paper base', opaque: true },
  { id: 'paper-base-protected', file: 'paper/base-protected.webp', group: 'substrate', label: 'Protected paper base', opaque: true },
  { id: 'wear-foxing-light', file: 'wear/foxing-light.webp', group: 'wear', label: 'Light foxing', opaque: false },
  { id: 'wear-foxing-heavy', file: 'wear/foxing-heavy.webp', group: 'wear', label: 'Heavy foxing', opaque: false },
  { id: 'wear-water-stain', file: 'wear/water-stain.webp', group: 'wear', label: 'Water stain', opaque: false },
  { id: 'wear-humidity-bloom', file: 'wear/humidity-bloom.webp', group: 'wear', label: 'Humidity bloom', opaque: false },
  { id: 'wear-handling-grime', file: 'wear/handling-grime.webp', group: 'wear', label: 'Handling grime', opaque: false },
  { id: 'wear-edge-oxidation', file: 'wear/edge-oxidation.webp', group: 'wear', label: 'Edge oxidation', opaque: false },
  { id: 'wear-tonal-drift', file: 'wear/tonal-drift.webp', group: 'wear', label: 'Tonal drift', opaque: false },
  { id: 'wear-smudge', file: 'wear/smudge.webp', group: 'wear', label: 'Graphite smudge', opaque: false },
  { id: 'wear-crease', file: 'wear/crease.webp', group: 'wear', label: 'Soft crease', opaque: false },
  { id: 'mask-carried-0', file: 'masks/page-carried-0.webp', group: 'mask', label: 'Carried edge mask', opaque: false },
  { id: 'mask-humidity-1', file: 'masks/page-humidity-1.webp', group: 'mask', label: 'Humidity edge mask', opaque: false },
  { id: 'mask-protected-2', file: 'masks/page-protected-2.webp', group: 'mask', label: 'Protected edge mask', opaque: false },
  { id: 'cover-f3-03-front', file: 'cover/f3-03-front.webp', group: 'cover', label: 'F3-03 front cover', opaque: true },
  { id: 'cover-f3-03-board', file: 'cover/f3-03-board.webp', group: 'cover', label: 'F3-03 inside board', opaque: true },
]

for (const asset of assetDefinitions) {
  if (!names.includes(asset.id)) throw new Error(`Asset recipe missing: ${asset.id}`)
  const destination = path.join(OUT, asset.file)
  await mkdir(path.dirname(destination), { recursive: true })
  await page.evaluate(name => window.__renderNotebookAsset(name), asset.id)
  const capture = await cdp.send('Page.captureScreenshot', {
    format: 'webp',
    quality: 92,
    fromSurface: true,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 },
  })
  await writeFile(destination, Buffer.from(capture.data, 'base64'))
}

await browser.close()
server.close()

const manifest = {
  version: 1,
  generatedFrom: 'exhibit/notebook@F3-03+PaperV2',
  dimensions: { width: WIDTH, height: HEIGHT, aspectRatio: '3:4' },
  runtimePolicy: { canvas: false, webgl: false },
  assets: assetDefinitions.map(asset => ({
    ...asset,
    path: `/notebook-assets/${asset.file}`,
    width: WIDTH,
    height: HEIGHT,
    format: 'webp',
  })),
  recipes: [
    {
      id: 'carried',
      label: 'Carried / Handled',
      description: 'Warm stock with outer-edge oxidation, thumb grime, scattered foxing and a crease.',
      base: 'paper-base-carried',
      mask: 'mask-carried-0',
      layers: ['wear-tonal-drift', 'wear-edge-oxidation', 'wear-handling-grime', 'wear-foxing-light', 'wear-crease'],
    },
    {
      id: 'humidity',
      label: 'Humidity Affected',
      description: 'A quieter stock carrying a damp bloom, water stain, heavier foxing and edge oxidation.',
      base: 'paper-base-humidity',
      mask: 'mask-humidity-1',
      layers: ['wear-tonal-drift', 'wear-humidity-bloom', 'wear-water-stain', 'wear-foxing-heavy', 'wear-edge-oxidation'],
    },
    {
      id: 'protected',
      label: 'Protected Interior',
      description: 'Paler interior stock with restrained drift, faint handling and sparse foxing.',
      base: 'paper-base-protected',
      mask: 'mask-protected-2',
      layers: ['wear-tonal-drift', 'wear-foxing-light', 'wear-smudge'],
    },
  ],
}

await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
await rm(WORK, { recursive: true, force: true })
console.log(`Baked ${assetDefinitions.length} static notebook assets -> ${OUT}`)
