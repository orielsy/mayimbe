/* ======================================================================
   BUILD-TIME NOTEBOOK TEXTURE BAKER  (mobile perf item #1)
   ----------------------------------------------------------------------
   Ported from Page Turner Lab/extraction/notebook-native/tools/bake-textures.mjs,
   adapted from bun to node + esbuild (a transitive dependency of Vite).

   The engine's page/cover rasteriser (clone -> inline computed styles ->
   SVG foreignObject -> decode) is deterministic: for a given page and a
   given leaf size it always produces the same pixels. On a phone it is
   also the most expensive thing in the whole experience, and it happens
   before the notebook can be touched.

   This script runs that pipeline ONCE, offline, in a real browser, and
   writes the result out as images plus a manifest. At runtime
   `mountNotebookEngine(host, { baked })` uploads those images directly and
   never serialises a DOM subtree.

   It drives the engine's own bake() — it does not re-implement any drawing —
   so baked pixels are by construction identical to live ones.

   PROFILE-PER-BAKE
   ----------------
   The bake mounts via the same exhibit wrapper the live page uses: a
   `.bake-engine-host` element wrapped in `.bake-frame` inside a
   `.bake-stage`, with presentation CSS (see scripts/bake-page.css) that
   mirrors app/components/museum/NotebookExhibit.vue's scoped styles.
   Mounting through `mountNotebookEngine` (not `mountNativeNotebook`)
   applies the same `installStageLocalMeasurementSpace` patch live uses,
   keeping `leafR.getBoundingClientRect()` consistent between the two.

   Standard and pocket emit separate manifests because pocket doubles the
   physical page count (each authored page gets a blank reverse) and has a
   different canvas clamp rule; one bucket set per profile keeps the
   runtime loader's `pickBucket` simple.

   Usage:
     # Production webp bake, both profiles
     node scripts/bake-notebook-textures.mjs \
       --out public/notebook-baked \
       --buckets 430x932,834x1112,1440x900

     # Parity PNG bake covering the two Playwright projects
     node scripts/bake-notebook-textures.mjs \
       --out tests/visual/.bake-png --type image/png \
       --buckets 390x844,1440x900 --profile standard --profile pocket --dpr 1.25

   Output:
     <out>/<profile>/manifest.json   { w, h, coverW, coverH, dpr, pages[], covers[], buckets[] }
     <out>/<profile>/<bucket>-page-000.<ext> ... <bucket>-cover-0.<ext>
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

const ROOT_OUT = path.resolve(process.cwd(), arg('out', 'public/notebook-baked'))
const DPR = +arg('dpr', 1.25)
const QUALITY = +arg('quality', 0.9)
const TYPE = arg('type', 'image/webp')
const EXT = TYPE.split('/')[1].replace('jpeg', 'jpg')

/* default to baking both profiles when the caller doesn't specify one. */
const PROFILES = argMulti('profile').length
  ? argMulti('profile')
  : ['standard', 'pocket']
for (const p of PROFILES) {
  if (p !== 'standard' && p !== 'pocket') {
    throw new Error(`unknown --profile "${p}" (expected "standard" or "pocket")`)
  }
}

const BUCKETS = arg('buckets', '1440x900')
  .split(',').map(s => s.trim()).filter(Boolean)
  .map(s => { const [w, h] = s.split('x').map(Number); return { w, h } })

const ENGINE_ENTRY = path.join(ROOT, 'exhibits/notebook/engine/mount.ts')
const FIXTURE = path.join(ROOT, 'exhibits/notebook/engine/native/fixture.ts')
const ENGINE_CSS = path.join(ROOT, 'exhibits/notebook/engine/native/notebook-engine.css')
const BAKE_CSS = path.join(HERE, 'bake-page.css')

/* 1. bundle the engine + the fixture into one browser-safe ES module -------- */
await mkdir(ROOT_OUT, { recursive: true })
const bundle = path.join(ROOT_OUT, '.bake-bundle.js')
const entry = path.join(ROOT_OUT, '.bake-entry.ts')

/* The bundle asks mountNotebookEngine for the adapter (so the exhibit's
 * presentation layout and stage-local measurement space are active), then
 * delegates bake() back through a delegate the adapter binds under
 * `__bakeNative`. We rely on mount.ts installing such a hook when called
 * from the bake context — see the matching edit in mount.ts. When that hook
 * is absent (older mount.ts without the bridge), fall back to mounting a
 * parallel native engine so the bake still works. */
const entrySource = `import { mountNotebookEngine } from ${JSON.stringify(ENGINE_ENTRY)}
import { NOTEBOOK_PARITY_PAGES, NOTEBOOK_PARITY_SECTIONS } from ${JSON.stringify(FIXTURE)}

window.__bakeLayout = (profile) => {
  const host = document.querySelector('.bake-engine-host')
  const frame = document.querySelector('.bake-frame')
  const stage = document.querySelector('.nbn .stage')
  const leafR = document.querySelector('.nbn .leafR')
  const halfR = leafR ? leafR.parentElement : null
  const book = document.querySelector('.nbn .book')
  return {
    profile,
    viewport: [window.innerWidth, window.innerHeight],
    host: host ? { w: host.offsetWidth, h: host.offsetHeight, rect: host.getBoundingClientRect().toJSON() } : null,
    frame: frame ? { w: frame.offsetWidth, h: frame.offsetHeight, rect: frame.getBoundingClientRect().toJSON(), dataset: { ...frame.dataset } } : null,
    stage: stage ? {
      w: stage.offsetWidth,
      h: stage.offsetHeight,
      rect: stage.getBoundingClientRect().toJSON(),
      csWidth: getComputedStyle(stage).width,
      container: getComputedStyle(stage.parentElement).containerType,
    } : null,
    halfR: halfR ? { rect: halfR.getBoundingClientRect().toJSON() } : null,
    leafR: leafR ? {
      w: leafR.offsetWidth,
      h: leafR.offsetHeight,
      rect: leafR.getBoundingClientRect().toJSON(),
    } : null,
    papershrinkx: book ? getComputedStyle(book).getPropertyValue('--papershrinkx') : null,
    papershrinky: book ? getComputedStyle(book).getPropertyValue('--papershrinky') : null,
  }
}

const start = performance.now()

window.__bake = async (profile) => {
  const start = performance.now()
  const host = document.querySelector('.bake-engine-host')
  if (!(host instanceof HTMLElement)) throw new Error('bake: .bake-engine-host not present')
  host.dataset.notebookProfile = profile
  const frame = document.querySelector('.bake-frame')
  if (frame instanceof HTMLElement) {
    frame.dataset.notebookProfile = profile
    frame.dataset.frameReady = 'true'
  }
  const adapter = await mountNotebookEngine(host, {
    profile,
    pages: NOTEBOOK_PARITY_PAGES,
    sectionToPage: NOTEBOOK_PARITY_SECTIONS,
    title: 'CUADERNO',
    perf: 'desktop',
  })
  /* Recompute the engine layout once, so --papershrinkx is set against the
   * CURRENT presentation CSS (which is the post-frameReady state, since
   * .bake-frame[data-frame-ready='true'] was set above). The live exhibit
   * reaches the same recomputed state through __completeLayout() on the
   * window before reading __bakeLive. Without this, baked pixels diverge
   * from live pixels because half.right.width differs by exactly the
   * --papershrinkx value the engine computes at mount-time. */
  if (typeof adapter.__completeLayout !== 'function') {
    throw new Error('bake: adapter is missing __completeLayout — update exhibits/notebook/engine/mount.ts')
  }
  await adapter.__completeLayout()
  if (typeof adapter.__bakeNative !== 'function') {
    throw new Error('bake: adapter is missing the __bakeNative hook — update exhibits/notebook/engine/mount.ts')
  }
  /* Capture layout BEFORE baking, since the bake ends by disposing
   * the engine and the subtree is gone afterwards. */
  const layout = window.__bakeLayout(profile)
  const manifest = await adapter.__bakeNative({ type: ${JSON.stringify(TYPE)}, quality: ${QUALITY}, dpr: ${DPR} })
  adapter.dispose()
  return { manifest, layout }
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

/* 2. serve it, because module scripts need an origin ---------------------- */
/* globalThis.__MAYIMBE_BAKE__ is the bake-vs-prod signal read by mount.ts to
 * decide whether to install the bake bridge on the public adapter. Setting
 * it in a tiny inline script BEFORE the module bundle means the flag is in
 * place when the module's top-level code runs. */
const html = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:#2b2723}</style>
<link rel="stylesheet" href="/notebook-engine.css">
<link rel="stylesheet" href="/bake-page.css">
<div class="bake-stage"><div class="bake-frame"><div class="bake-engine-host"></div></div></div>
<script>globalThis.__MAYIMBE_BAKE__='1'</script>
<script type="module" src="/bundle.js"></script>`

const server = createServer(async (req, res) => {
  if (req.url === '/bundle.js') {
    res.setHeader('content-type', 'text/javascript')
    return res.end(await readFile(bundle))
  }
  if (req.url === '/notebook-engine.css') {
    res.setHeader('content-type', 'text/css')
    return res.end(await readFile(ENGINE_CSS))
  }
  if (req.url === '/bake-page.css') {
    res.setHeader('content-type', 'text/css')
    return res.end(await readFile(BAKE_CSS))
  }
  res.setHeader('content-type', 'text/html')
  res.end(html)
})
await new Promise(r => server.listen(0, r))
const url = 'http://localhost:' + server.address().port + '/'

/* 3. bake, once per (profile x SIZE BUCKET) ------------------------------ */
const browser = await chromium.launch()
const write = async (dataUrl, dir, name) => {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  await writeFile(path.join(dir, name), Buffer.from(b64, 'base64'))
  return name
}

for (const profile of PROFILES) {
  const profileDir = path.join(ROOT_OUT, profile)
  await mkdir(profileDir, { recursive: true })
  const buckets = []
  for (const vp of BUCKETS) {
    const id = `${vp.w}x${vp.h}`
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
    })
    const page = await ctx.newPage()
    page.on('console', m => { if (m.type() === 'error') console.error(`[page ${profile}/${id}]`, m.text()) })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction('typeof window.__bake === "function"')
    const result = await page.evaluate(`window.__bake(${JSON.stringify(profile)})`)
    await ctx.close()
    const manifest = result.manifest
    const layout = result.layout

    const out = { ...manifest, id, viewportW: vp.w, viewportH: vp.h, pages: [], covers: [] }
    for (let i = 0; i < manifest.pages.length; i++)
      out.pages.push(await write(manifest.pages[i], profileDir, `${id}-page-${String(i).padStart(3, '0')}.${EXT}`))
    for (let i = 0; i < manifest.covers.length; i++)
      out.covers.push(await write(manifest.covers[i], profileDir, `${id}-cover-${i}.${EXT}`))
    buckets.push(out)
    const diag = layout.frame
      ? `frame w=${layout.frame.w}, host w=${layout.host?.w}, stage csWidth=${layout.stage?.csWidth}, `
        + `stage.rect ${layout.stage ? `${layout.stage.rect.width.toFixed(1)}x${layout.stage.rect.height.toFixed(1)}` : '?'}, `
        + `halfR.rect ${layout.halfR ? `${layout.halfR.rect.width.toFixed(1)}x${layout.halfR.rect.height.toFixed(1)}` : '?'}, `
        + `leafR.rect ${layout.leafR ? `${layout.leafR.rect.width.toFixed(1)}x${layout.leafR.rect.height.toFixed(1)}` : '?'}, `
        + `papershrinkx=${layout.papershrinkx || '(unset)'}, papershrinky=${layout.papershrinky || '(unset)'}`
      : 'frame missing'
    console.log(`  bucket ${profile}/${id}: leaf ${Math.round(out.w)}x${Math.round(out.h)}, ` +
                `${out.pages.length} pages + ${out.covers.length} cover faces`)
    console.log(`     diag: ${diag}`)
  }

  /* 4. per-profile manifest -------------------------------------------- */
  const widest = buckets.reduce((a, b) => (b.w > a.w ? b : a), buckets[0])
  await writeFile(
    path.join(profileDir, 'manifest.json'),
    JSON.stringify({ ...widest, buckets }, null, 2),
  )
  console.log(`baked ${profile}: ${buckets.length} bucket(s) -> ${path.relative(ROOT, profileDir)}`)
}

await browser.close()
server.close()
await rm(entry, { force: true })
await rm(bundle, { force: true })
