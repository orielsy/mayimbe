/* ======================================================================
   BUILD-TIME PAPER SURFACE BAKER  (mobile perf item #5a)
   ----------------------------------------------------------------------
   Every sheet used to draw its own fibre / foxing / crease canvases and
   inline them as data URLs — ~60 unique rasterisations plus ~60 base64 blobs
   the renderer had to decode before a page could be painted.

   Those canvases differ only in a few continuous parameter steps, so this
   script runs the SAME drawing algorithms (drawFibre / drawFoxing /
   drawCrease, imported from exhibits/notebook/engine/native/paper-surface.ts)
   over the quantised step tables and writes the results out as a small
   static WebP library. At runtime preloadPaperTextures() decodes each
   file once and the surface generators point at `url("/notebook-textures/...")`
   instead of round-tripping through canvas data URLs.

   Used at runtime by:
     preloadPaperTextures() → /notebook-textures/manifest.json + .webp files

   Usage:
     node scripts/bake-surfaces.mjs --out public/notebook-textures \
          [--quality 0.9] [--ext webp] [--width 200 --height 200]

   Output:
     <out>/manifest.json  { files: [...], steps: {...} }
     <out>/fibre-0.<ext> .. foxing-3-1-m.<ext> .. crease-2-m.<ext>
   ==================================================================== */
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name)
  return i > -1 ? process.argv[i + 1] : def
}
const argMulti = (name) => {
  const out = []
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--' + name && i + 1 < process.argv.length) out.push(process.argv[i + 1])
  }
  return out
}

const OUT = path.resolve(process.cwd(), arg('out', 'public/notebook-textures'))
const QUALITY = +arg('quality', 0.9)
const TYPE = arg('ext', 'webp') === 'png' ? 'image/png' : 'image/webp'
const EXT = TYPE === 'image/png' ? 'png' : 'webp'

/* ---------- 1. bundle the drawing module into one browser-safe ES module ---- */

await mkdir(OUT, { recursive: true })
const bundle = path.join(OUT, '.bake-bundle.js')
const entry = path.join(OUT, '.bake-entry.ts')

const SURFACE = path.join(ROOT, 'exhibits/notebook/engine/native/paper-surface.ts')

const entrySource = `import {
  drawFibre, drawFoxing, drawCrease,
  FIBRE_STEPS, FOX_STEPS, FOX_SEEDS, CREASE_SEEDS,
  FIBRE_SIZE, FOX_SIZE, CREASE_SIZE,
} from ${JSON.stringify(SURFACE)}

window.__bakeSurfaces = () => {
  const TYPE = ${JSON.stringify(TYPE)}, QUALITY = ${QUALITY}
  const png = (w, h, draw) => {
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    draw(c.getContext('2d'), w, h)
    return c.toDataURL(TYPE, QUALITY)
  }
  const out = {}
  FIBRE_STEPS.forEach((s, i) => {
    out['fibre-' + i] = png(FIBRE_SIZE[0], FIBRE_SIZE[1],
      (g, w, h) => drawFibre(g, w, h, 4177, s))
  })
  FOX_STEPS.forEach((d, di) => FOX_SEEDS.forEach((seed, vi) => {
    for (const mir of [false, true]) {
      out['foxing-' + di + '-' + vi + (mir ? '-m' : '')] =
        png(FOX_SIZE[0], FOX_SIZE[1], (g, w, h) => drawFoxing(g, w, h, seed, d, mir))
    }
  }))
  CREASE_SEEDS.forEach((seed, i) => {
    for (const mir of [false, true]) {
      out['crease-' + i + (mir ? '-m' : '')] =
        png(CREASE_SIZE[0], CREASE_SIZE[1], (g, w, h) => drawCrease(g, w, h, seed, mir))
    }
  })
  return { files: out, steps: { FIBRE_STEPS, FOX_STEPS, FOX_SEEDS, CREASE_SEEDS } }
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

/* ---------- 2. serve it (module scripts need an origin) -------------------- */
const html = `<!doctype html><meta charset="utf-8"><script type="module" src="/bundle.js"></script>`
const server = createServer(async (req, res) => {
  if (req.url.startsWith('/bundle.js')) {
    res.setHeader('content-type', 'text/javascript')
    return res.end(await readFile(bundle))
  }
  res.setHeader('content-type', 'text/html')
  res.end(html)
})
await new Promise(r => server.listen(0, r))
const url = 'http://localhost:' + server.address().port + '/'

/* ---------- 3. draw once, in a real browser -------------------------------- */
const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForFunction('typeof window.__bakeSurfaces === "function"')
const { files, steps } = await page.evaluate('window.__bakeSurfaces()')
await browser.close()
server.close()

/* ---------- 4. write the library + manifest -------------------------------- */
const names = []
let bytes = 0
for (const [name, dataUrl] of Object.entries(files)) {
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
  await writeFile(path.join(OUT, `${name}.${EXT}`), buf)
  names.push(name)
  bytes += buf.length
}
await writeFile(
  path.join(OUT, 'manifest.json'),
  JSON.stringify({ version: 1, ext: EXT, files: names, steps }, null, 2),
)

await rm(entry, { force: true })
await rm(bundle, { force: true })
console.log(`baked ${names.length} surface tiles (${(bytes / 1024).toFixed(0)} KB) -> ${OUT}`)
