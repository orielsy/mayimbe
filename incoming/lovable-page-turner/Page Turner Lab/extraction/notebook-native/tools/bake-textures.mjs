/* ======================================================================
   BUILD-TIME TEXTURE BAKER  (mobile perf item #1)
   ----------------------------------------------------------------------
   The engine's page/cover rasteriser (clone -> inline computed styles ->
   SVG foreignObject -> decode) is deterministic: for a given page and a given
   leaf size it always produces the same pixels. On a phone it is also the most
   expensive thing in the whole experience, and it happens before the notebook
   can be touched.

   This script runs that pipeline ONCE, offline, in a real browser, and writes
   the result out as images plus a manifest. At runtime `mountNotebook({ baked })`
   uploads those images directly and never serialises a DOM subtree.

   It drives the engine's own bake() — it does not re-implement any drawing —
   so baked pixels are by construction identical to live ones.

   Usage:
     node extraction/notebook-native/tools/bake-textures.mjs \
       --out public/notebook-baked \
       --width 1440 --height 900 --dpr 2 --quality 0.9

   Output:
     <out>/manifest.json   { w, h, coverW, coverH, dpr, pages[], covers[] }
     <out>/page-000.webp ... <out>/cover-0.webp

   Then:
     const baked = await fetch('/notebook-baked/manifest.json').then(r => r.json());
     await mountNotebook(host, { pages, baked });
   ==================================================================== */
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, '..');

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i > -1 ? process.argv[i + 1] : def;
};
const OUT = path.resolve(process.cwd(), arg('out', 'notebook-baked'));
const W = +arg('width', 1440), H = +arg('height', 900);
const DPR = +arg('dpr', 2), QUALITY = +arg('quality', 0.9);
const TYPE = arg('type', 'image/webp');
const EXT = TYPE.split('/')[1].replace('jpeg', 'jpg');
/* the page set to bake; defaults to the bundled fixture */
const PAGES_MODULE = arg('pages', path.join(PKG, 'src/fixture/sample-pages.ts'));

/* 1. bundle the engine + the page set into one classic-safe ES module ------ */
const bundle = path.join(OUT, '.bake-bundle.js');
await mkdir(OUT, { recursive: true });
const entry = path.join(OUT, '.bake-entry.ts');
await writeFile(entry, `
import { mountNotebook } from ${JSON.stringify(path.join(PKG, 'src/index.ts'))};
import * as pageMod from ${JSON.stringify(PAGES_MODULE)};
const pages = pageMod.SAMPLE_PAGES || pageMod.PAGES || pageMod.default;
(window as any).__bake = async () => {
  const host = document.getElementById('host')!;
  const engine = await mountNotebook(host, { pages, perf: 'desktop' });
  await new Promise(r => setTimeout(r, 400));
  return (engine as any).bake({ type: ${JSON.stringify(TYPE)}, quality: ${QUALITY}, dpr: ${DPR} });
};
`);
execFileSync('bun', ['build', entry, '--outfile', bundle, '--target', 'browser'], { stdio: 'inherit' });

/* 2. serve it, because module scripts need an origin ---------------------- */
const html = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:#2b2723}#host{width:100%;height:100%}</style>
<div id="host"></div><script type="module" src="/bundle.js"></script>`;
const server = createServer(async (req, res) => {
  if (req.url.startsWith('/bundle.js')) {
    const { readFile } = await import('node:fs/promises');
    res.setHeader('content-type', 'text/javascript');
    return res.end(await readFile(bundle));
  }
  res.setHeader('content-type', 'text/html');
  res.end(html);
});
await new Promise(r => server.listen(0, r));
const url = 'http://localhost:' + server.address().port + '/';

/* 3. bake, once per SIZE BUCKET -------------------------------------------
   The rasteriser is dimension-coupled: a baked face is pixels at one leaf
   size. Rather than bake per device (a manifest explosion), bake a handful of
   viewport buckets. At runtime baked.ts measures the host and picks the
   nearest bucket; the mesh samples the texture, so a bucket within roughly
   0.6x-1.6x of the live size is visually indistinguishable, and anything
   outside that falls back to live rasterisation. Buckets are given as
   viewport sizes: --buckets 430x932,834x1112,1440x900 */
const BUCKETS = arg('buckets', `${W}x${H}`)
  .split(',').map(s => s.trim()).filter(Boolean)
  .map(s => { const [w, h] = s.split('x').map(Number); return { w, h }; });

const browser = await chromium.launch();
const write = async (dataUrl, name) => {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  await writeFile(path.join(OUT, name), Buffer.from(b64, 'base64'));
  return name;
};

const buckets = [];
for (const vp of BUCKETS) {
  const id = `${vp.w}x${vp.h}`;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') console.error(`[page ${id}]`, m.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('!!window.__bake');
  const manifest = await page.evaluate('window.__bake()');
  await ctx.close();

  const out = { ...manifest, id, viewportW: vp.w, viewportH: vp.h, pages: [], covers: [] };
  for (let i = 0; i < manifest.pages.length; i++)
    out.pages.push(await write(manifest.pages[i], `${id}-page-${String(i).padStart(3, '0')}.${EXT}`));
  for (let i = 0; i < manifest.covers.length; i++)
    out.covers.push(await write(manifest.covers[i], `${id}-cover-${i}.${EXT}`));
  buckets.push(out);
  console.log(`  bucket ${id}: leaf ${Math.round(out.w)}x${Math.round(out.h)}, ` +
              `${out.pages.length} pages + ${out.covers.length} cover faces`);
}

/* 4. manifest --------------------------------------------------------------
   Shape stays backwards compatible: the widest bucket is spread at the top
   level so an older loader that reads `pages`/`covers` still works, while
   `buckets[]` carries the full set for bucket selection. */
const widest = buckets.reduce((a, b) => (b.w > a.w ? b : a), buckets[0]);
await writeFile(
  path.join(OUT, 'manifest.json'),
  JSON.stringify({ ...widest, buckets }, null, 2),
);

await browser.close();
server.close();
await rm(entry, { force: true });
await rm(bundle, { force: true });
console.log(`baked ${buckets.length} bucket(s) -> ${OUT}`);
