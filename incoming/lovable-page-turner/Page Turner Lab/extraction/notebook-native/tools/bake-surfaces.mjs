/* ======================================================================
   BUILD-TIME PAPER SURFACE BAKER  (mobile perf item #5b)
   ----------------------------------------------------------------------
   Every sheet used to draw its own fibre / foxing / crease canvases and
   inline them as data URLs — ~60 unique rasterisations plus ~60 base64 blobs
   the renderer had to decode before a page could be painted.

   Those canvases differ only in a few continuous parameters, so this script
   runs the SAME drawing functions (imported from src/paper/paper-surface.ts,
   not re-implemented) over the quantised step tables and writes the results
   out as a small static PNG library. At runtime `preloadPaperTextures()`
   points the surface layers at these files instead.

   Usage:
     node extraction/notebook-native/tools/bake-surfaces.mjs --out public/notebook-textures

   Output:
     <out>/manifest.json  { files: [...], steps: {...} }
     <out>/fibre-0.webp .. foxing-3-1-m.webp .. crease-2-m.webp
   ==================================================================== */
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const OUT = path.resolve(process.cwd(), arg('out', 'public/notebook-textures'));

await mkdir(OUT, { recursive: true });

/* 1. bundle the drawing functions into one browser module ------------------ */
const entry = path.join(OUT, '.bake-entry.ts');
const bundle = path.join(OUT, '.bake-bundle.js');
await writeFile(entry, `
import {
  drawFibre, drawFoxing, drawCrease,
  FIBRE_STEPS, FOX_STEPS, FOX_SEEDS, CREASE_SEEDS,
  FIBRE_SIZE, FOX_SIZE, CREASE_SIZE,
} from ${JSON.stringify(path.join(PKG, 'src/paper/paper-surface.ts'))};

const TYPE = 'image/webp', QUALITY = 0.9;
const png = (w, h, draw) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return c.toDataURL(TYPE, QUALITY);
};

(window as any).__bakeSurfaces = () => {
  const out: Record<string, string> = {};
  FIBRE_STEPS.forEach((s, i) => {
    out['fibre-' + i] = png(FIBRE_SIZE[0], FIBRE_SIZE[1],
      (g, w, h) => drawFibre(g, w, h, 4177, s));
  });
  FOX_STEPS.forEach((d, di) => FOX_SEEDS.forEach((seed, vi) => {
    for (const mir of [false, true]) {
      out['foxing-' + di + '-' + vi + (mir ? '-m' : '')] =
        png(FOX_SIZE[0], FOX_SIZE[1], (g, w, h) => drawFoxing(g, w, h, seed, d, mir));
    }
  }));
  CREASE_SEEDS.forEach((seed, i) => {
    for (const mir of [false, true]) {
      out['crease-' + i + (mir ? '-m' : '')] =
        png(CREASE_SIZE[0], CREASE_SIZE[1], (g, w, h) => drawCrease(g, w, h, seed, mir));
    }
  });
  return { files: out, steps: { FIBRE_STEPS, FOX_STEPS, FOX_SEEDS, CREASE_SEEDS } };
};
`);
execFileSync('bun', ['build', entry, '--outfile', bundle, '--target', 'browser'], { stdio: 'inherit' });

/* 2. serve it (module scripts need an origin) ------------------------------ */
const html = `<!doctype html><meta charset="utf-8"><script type="module" src="/bundle.js"></script>`;
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

/* 3. draw once, in a real browser ----------------------------------------- */
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction('!!window.__bakeSurfaces');
const { files, steps } = await page.evaluate('window.__bakeSurfaces()');
await browser.close();
server.close();

/* 4. write the library + manifest ----------------------------------------- */
const names = [];
let bytes = 0;
for (const [name, dataUrl] of Object.entries(files)) {
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  await writeFile(path.join(OUT, name + '.webp'), buf);
  names.push(name); bytes += buf.length;
}
await writeFile(path.join(OUT, 'manifest.json'),
  JSON.stringify({ version: 1, ext: 'webp', files: names, steps }, null, 2));

await rm(entry, { force: true });
await rm(bundle, { force: true });
console.log(`baked ${names.length} surface tiles (${(bytes / 1024).toFixed(0)} KB) -> ${OUT}`);
