/* ======================================================================
   BAKE-VS-LIVE VISUAL REGRESSION
   ----------------------------------------------------------------------
   Baked notebook textures are pixel-perfect by construction — the bake
   tool drives the engine's own `bake()` method through the SAME mounting
   pipeline (mountNotebookEngine with the exhibit's presentation CSS)
   the runtime uses, so any divergence means the rasteriser has drifted
   from what the device will see at mount time.

   The expected physical profile is derived from the *Playwright project*
   (`testInfo.project.name`), not from any label baked into a test name.
   Title-based filtering (e.g. `npm run test:visual -- -g mobile-...`)
   still routes the test through each matching project, picking the
   standard or pocket parity manifest accordingly.

   For each project:
     1. resolves the matching baked bucket from
        tests/visual/.bake-png/<profile>/manifest.json (produced offline
        by `npm run bake:notebook:parity`),
     2. mounts the LIVE engine in the running dev server at the same
        viewport and asks it (via window.__bakeLive) to re-bake itself
        into PNG data URLs,
     3. pixel-diffs every page face and every cover face with a 0.5%
        tolerance (well below webp encoding noise on important regions),
     4. on failure, writes a diff PNG into visual-artifacts/bake-parity/
        so the caller can see exactly which face broke.

   Skip cleanly when the parity bake is absent — `npm run
   bake:notebook:parity` then re-run.
   ==================================================================== */
import { expect, test, type Page } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const ROOT = path.resolve(import.meta.dirname, '../..')
const PARITY_BAKE_ROOT = path.join(ROOT, 'tests/visual/.bake-png')
const DIFF_OUT = path.join(ROOT, 'visual-artifacts', 'bake-parity')

/** Same tolerances the runtime loader uses (perf/baked.ts). */
const SCALE_MIN = 0.6
const SCALE_MAX = 1.6
const ASPECT_TOLERANCE = 0.12

/** Allow up to 0.5% mismatched pixels per face — webp / sub-pixel
 *  aliasing routinely produces this on flat paper regions; a real
 *  rasteriser regression reports single-digit percentages instead. */
const TOLERATED_MISMATCH_RATIO = 0.005

type Profile = 'standard' | 'pocket'

interface BakedBucket {
  id: string
  viewportW: number
  viewportH: number
  w: number
  h: number
  coverW: number
  coverH: number
  dpr: number
  pages: string[]
  covers: string[]
}

interface LiveBake {
  w: number
  h: number
  coverW: number
  coverH: number
  dpr: number
  pages: string[]
  covers: string[]
}

function profileOfProject(project: string): Profile {
  return project.startsWith('mobile-') ? 'pocket' : 'standard'
}

async function loadParityBake(profile: Profile): Promise<BakedBucket[] | null> {
  try {
    const buf = await readFile(path.join(PARITY_BAKE_ROOT, profile, 'manifest.json'))
    const m = JSON.parse(buf.toString())
    const buckets: BakedBucket[] = (m.buckets && m.buckets.length) ? m.buckets : [m]
    return buckets.filter(b => Array.isArray(b.pages) && Array.isArray(b.covers))
  } catch {
    return null
  }
}

/** Mirror of `pickBucket` in perf/baked.ts. Bucket equals `liveW === vp.w`
 *  for the project's exact viewport, which is the only way baked and
 *  live pixels are byte-exact. */
function pickBucket(buckets: BakedBucket[], liveW: number, liveH: number): BakedBucket | undefined {
  let best: BakedBucket | undefined
  let bestErr = Infinity
  for (const b of buckets) {
    const refW = b.viewportW || b.w || 1
    const err = Math.abs(Math.log(liveW / refW))
    if (err < bestErr) { bestErr = err; best = b }
  }
  if (!best) return undefined

  const scale = liveW / (best.viewportW || best.w)
  if (scale < SCALE_MIN || scale > SCALE_MAX) return undefined

  const refW = best.viewportW || best.w
  const refH = best.viewportH || best.h
  const liveAspect = liveW / Math.max(1, liveH)
  const bakedAspect = refW / Math.max(1, refH)
  if (Math.abs(liveAspect - bakedAspect) / bakedAspect > ASPECT_TOLERANCE) return undefined

  return best
}

function decodeDataUrl(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(',')
  if (dataUrl.startsWith('data:') && comma > 0) {
    return Buffer.from(dataUrl.slice(comma + 1), 'base64')
  }
  throw new Error('Expected a data: URL from engine.bake()')
}

function decodePng(buf: Buffer): PNG {
  return PNG.sync.read(buf)
}

interface DiffResult {
  name: string
  width: number
  height: number
  mismatched: number
  total: number
  ratio: number
  diffBuf: Buffer
}

function diffFace(
  label: string,
  bakedBytes: Buffer,
  liveBytes: Buffer,
): DiffResult {
  const a = decodePng(bakedBytes)
  const b = decodePng(liveBytes)
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(
      `${label}: dimensions differ — baked ${a.width}x${a.height} vs live ${b.width}x${b.height}. `
      + `Bucket viewport and project viewport must match exactly.`,
    )
  }
  const { width, height } = a
  const total = width * height
  const diff = new PNG({ width, height })
  const mismatched = pixelmatch(
    a.data, b.data, diff.data, width, height,
    { threshold: 0.08 /* webp-style lossy noise */
      , includeAA: false, alpha: 0, antialiasing: 0 },
  )
  const ratio = total ? mismatched / total : 0
  return { name: label, width, height, mismatched, total, ratio, diffBuf: PNG.sync.write(diff) }
}

async function captureLive(page: Page): Promise<LiveBake> {
  await page.waitForFunction('typeof window.__bakeLive === "function"', null, { timeout: 30_000 })
  // The bake rake rasterises every page + every cover. Give the engine a
  // moment after mount so the resident window is filled.
  await page.waitForTimeout(800)
  const live = await page.evaluate('window.__bakeLive()') as LiveBake
  const diag = await page.evaluate(`(() => {
    const host = document.querySelector('.notebook-engine-host')
    const frame = document.querySelector('.notebook-presentation-frame')
    const stage = document.querySelector('.nbn .stage')
    const leafR = document.querySelector('.nbn .leafR')
    const halfR = leafR ? leafR.parentElement : null
    const book = document.querySelector('.nbn .book')
    return {
      viewport: [window.innerWidth, window.innerHeight],
      host: host ? { w: host.offsetWidth, h: host.offsetHeight } : null,
      frame: frame ? {
        w: frame.offsetWidth, h: frame.offsetHeight,
        dataset: { ...frame.dataset },
      } : null,
      stage: stage ? {
        csWidth: getComputedStyle(stage).width,
        rect: stage.getBoundingClientRect().toJSON(),
      } : null,
      halfR: halfR ? { rect: halfR.getBoundingClientRect().toJSON() } : null,
      leafR: leafR ? { rect: leafR.getBoundingClientRect().toJSON() } : null,
      papershrinkx: book ? getComputedStyle(book).getPropertyValue('--papershrinkx') : null,
      papershrinky: book ? getComputedStyle(book).getPropertyValue('--papershrinky') : null,
    }
  })()`)
  console.log('LIVE diag:', JSON.stringify(diag))
  return live
}

test.describe('notebook bake vs live visual regression', () => {
  test.beforeAll(async () => {
    await mkdir(DIFF_OUT, { recursive: true })
  })

  test('every face is within 0.5% of the offline bake', async ({ page }, testInfo) => {
    test.setTimeout(120_000)

    const project = testInfo.project.name
    const profile = profileOfProject(project)

    const buckets = await loadParityBake(profile)
    test.skip(
      !buckets || buckets.length === 0,
      `No parity bake at ${path.join(PARITY_BAKE_ROOT, profile, 'manifest.json')} — `
      + 'run `npm run bake:notebook:parity` first.',
    )

    const vp = testInfo.project.use.viewport as { width: number; height: number }
    const bucket = pickBucket(buckets!, vp.width, vp.height)
    test.skip(
      !bucket,
      `No baked bucket matches project viewport ${vp.width}x${vp.height} (profile ${profile}). `
      + `Re-run \`npm run bake:notebook:parity -- --buckets ${vp.width}x${vp.height},<other>\`.`,
    )

    await page.goto('/museum/notebook')
    const host = page.locator('.notebook-engine-host')
    await expect(host).toBeVisible({ timeout: 20_000 })

    const live = await captureLive(page)

    // The faces are 1:1 by index. Bail loudly if the basket shape drifts
    // (page count or cover count) — that's a fixture or profile change,
    // not a paint regression.
    expect(live.pages.length, `live pages mismatch (got ${live.pages.length}, bucket has ${bucket!.pages.length})`)
      .toBe(bucket!.pages.length)
    expect(live.covers.length, `live covers mismatch (got ${live.covers.length}, bucket has ${bucket!.covers.length})`)
      .toBe(bucket!.covers.length)

    const dims = (b: BakedBucket | LiveBake) =>
      `leaf ${b.w.toFixed(1)}x${b.h.toFixed(1)} (dpr ${b.dpr}) cover ${b.coverW.toFixed(1)}x${b.coverH.toFixed(1)}`
    expect.soft(
      Math.abs(live.w - bucket!.w),
      `leaf width diverged — ${dims(live)} vs bucket ${dims(bucket!)}`,
    ).toBeLessThanOrEqual(0.5)
    expect.soft(
      Math.abs(live.h - bucket!.h),
      `leaf height diverged — ${dims(live)} vs bucket ${dims(bucket!)}`,
    ).toBeLessThanOrEqual(0.5)
    expect.soft(
      Math.abs(live.dpr - bucket!.dpr),
      `dpr diverged — ${dims(live)} vs bucket ${dims(bucket!)}`,
    ).toBeLessThan(0.001)

    // Compare every page face.
    const worstPages: DiffResult[] = []
    for (let i = 0; i < live.pages.length; i++) {
      const liveBytes = decodeDataUrl(live.pages[i]!)
      const bakedPath = path.join(PARITY_BAKE_ROOT, profile, bucket!.pages[i]!)
      const bakedBytes = await readFile(bakedPath)
      const r = diffFace(`page-${String(i).padStart(3, '0')}`, bakedBytes, liveBytes)
      worstPages.push(r)
      if (r.ratio > TOLERATED_MISMATCH_RATIO) {
        await writeFile(path.join(DIFF_OUT, `${project}-page-${String(i).padStart(3, '0')}.baked.png`), bakedBytes)
        await writeFile(path.join(DIFF_OUT, `${project}-page-${String(i).padStart(3, '0')}.live.png`), liveBytes)
        await writeFile(path.join(DIFF_OUT, `${project}-page-${String(i).padStart(3, '0')}.diff.png`), r.diffBuf)
      }
    }
    // Compare every cover face (same index order).
    const worstCovers: DiffResult[] = []
    for (let i = 0; i < live.covers.length; i++) {
      const liveBytes = decodeDataUrl(live.covers[i]!)
      const bakedPath = path.join(PARITY_BAKE_ROOT, profile, bucket!.covers[i]!)
      const bakedBytes = await readFile(bakedPath)
      const r = diffFace(`cover-${i}`, bakedBytes, liveBytes)
      worstCovers.push(r)
      if (r.ratio > TOLERATED_MISMATCH_RATIO) {
        await writeFile(path.join(DIFF_OUT, `${project}-cover-${i}.baked.png`), bakedBytes)
        await writeFile(path.join(DIFF_OUT, `${project}-cover-${i}.live.png`), liveBytes)
        await writeFile(path.join(DIFF_OUT, `${project}-cover-${i}.diff.png`), r.diffBuf)
      }
    }

    const fails = [...worstPages, ...worstCovers].filter(r => r.ratio > TOLERATED_MISMATCH_RATIO)
    const report = fails.map(f =>
      `  ${f.name}: ${f.mismatched}/${f.total} = ${(f.ratio * 100).toFixed(2)}%`).join('\n')

    expect(
      fails.length,
      `${fails.length} face(s) diverge beyond ${TOLERATED_MISMATCH_RATIO * 100}% mismatch.\n`
      + `Diff PNGs written to ${path.relative(ROOT, DIFF_OUT)}.\n${report}`,
    ).toBe(0)
  })
})
