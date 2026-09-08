# notebook-native (extracted engine)

A framework-independent, host-mountable extraction of the `/notebook-lab-native`
prototype as it exists in `public/notebook-lab-native/` at the current commit.
This is a **mechanical extraction**, not a rewrite: the physical, rendering and
timing code was moved, not redesigned.

Nothing outside `extraction/notebook-native/` was created or modified.

## Usage

```ts
import { mountNotebook } from './extraction/notebook-native/src';
import { SAMPLE_PAGES } from './extraction/notebook-native/src/fixture/sample-pages';

const engine = await mountNotebook(hostEl, {
  pages: SAMPLE_PAGES,                       // 24 faces = 12 physical sheets
  sectionToPage: { discography: 9 },
  onStateChange: s => console.log(s),
});

await engine.open();
await engine.next();
await engine.goToPage(23);
await engine.close('back');
engine.suspend(); engine.resume();
engine.dispose();
```

`getState()` → `{ state: 'CLOSED_FRONT' | 'OPEN' | 'CLOSED_BACK', turned, page }`,
where `turned` is the number of sheets flipped left and `page` is the 1-based
right-hand page of the current spread (`2*turned + 1`, clamped to `pages.length`).
`restore(state)` jumps with no animation.

## Source files read (read-only)

- `public/notebook-lab-native/index.html` (markup, CSS, engine script)
- `public/notebook-lab-native/cover-f3.js` (F3-03 Brick cover)
- `public/notebook-lab-native/paper-system-v2.js` (PAPERV2 page history)
- `public/notebook-lab-native/content.js` (shape of a page object only — no copy carried)
- `public/notebook-lab-native/base.css` (page-content typography)
- `public/shared/paper-stack.js`, `public/shared/paper-surface.js`,
  `public/shared/m2-accumulated-stack.js`

## Preserved systems and constants

- **F3-03 Brick cover** (`src/cover/cover-f3.ts`) — full board/cloth/foil painter,
  including the frozen partial-distress title recipe (`TITLE_SEED = 7`).
- **PAPERV2 page history** (`src/paper/paperv2.ts`) — global `AGE = 0.88`, the
  Carried/Handled → Protected Interior progression, monotonic exposure decline,
  humidity neighbourhood, rare events and `TRAUMA_ECHO` contact transfer.
- **Canonical M2 accumulated stack** (`src/paper/m2-accumulated-stack.ts` +
  `paper-stack.ts`) — 26 strata, seed 5100, recession ×1.16, corner ×1.09,
  waviness ×1.08, notch 0.35, extent −0.60 %, `EDGE_OXIDATION = 0.62`, the
  right-only / flush-bottom direction (`bottomDepth: 0`, `lift: 0`, `bottomSag: 0`),
  hard production limits (fray ≤ 0.16, geometric intensity ≤ 0.65), the
  `.m2frame` spine-registration mapping and the `COORD` sheet region.
- **State machine** `CLOSED_FRONT / OPEN / CLOSED_BACK`, including the back-cover
  turn out of the last spread and the real back-board pastedown (no phantom leaf).
- **Rendering handoff** — DOM at rest, WebGL in motion: computed-style clone →
  SVG `foreignObject` → canvas → texture, atomic swap at the midpoint, explicit
  endpoint frames, `coverTex[3]` used only during the back-cover flight so the
  dedication portrait cannot ghost onto the front cover.
- **Page mesh deformation** — the original bend/hinge shader, two-sided lighting,
  `uThick`, camera distance (2.6× stage height), geometry caches (`geoCache`,
  `EDGE_CACHE`, `SURFACE_CACHE`, `texKey` / `stacksKey` memoisation),
  `warmGPU()` and `MAX_GL_DPR = 1.25`.
- **Shadow/reveal system** — measured `--openx` via `coverFreeEdgeScreenX()`
  with `REVEAL_LAG_PX = 1`, `@property --openx`, per-consumer writes,
  `--deskx` compositor scale, `#covercast`, `#coveredge`, `.hingeshade`,
  `.coverseam`.
- **Interaction** — pointer drag with the same thresholds/velocity handling,
  keyboard arrows, and the pagination allocation that transfers strata between
  the left and right piles top-first.
- **Inside back cover gift spread** — circular portrait (56 % width, 6.5 % from
  top, `class="backphoto orielsy"`) and the debossed inscription
  "Para Antony, con mucho cariño. De parte de Orielsy Diaz", identical in the
  resting DOM and in the snapshot source used for the texture.

## Deliberately not carried

React/TanStack route code and the iframe wrapper; the lab HUD, comparison
sections and stack tuning controls; every URL flag (`?debug`, `?perf`,
`?pmode`, `?silhouette`); `window.__protoB` / `window.__nbperf`; freeze/hold
and profiling instrumentation (the perf hooks are inert no-ops); unreachable
legacy `window.LABPAPER` material fallbacks; the historical `content.js` copy.

No state library, event bus, DI container, repository layer or renderer class
hierarchy was introduced.

## Host isolation

- Mounts directly into the supplied host element — no iframe, no nested app.
- All DOM access goes through refs built in `markup.ts`; no `getElementById`.
- CSS is namespaced under the root class `nb-root` and injected once, refcounted,
  released on the last `dispose()`. State classes live on the notebook root
  instead of `document.body`.
- `dispose()` removes window/document listeners, disconnects the `ResizeObserver`,
  disposes geometries/textures/renderer and removes the root node.
- `suspend()` cancels the rAF loop; `resume()` re-measures and restarts it.

## Verified

Bundled with `bun build --external three` and exercised in headless Chromium
(software GL) against a static page mounting the 24-page fixture:

- mounts, rasterises and paints the closed F3-03 cover;
- 54 stack strata present (26 per pile plus block shadows);
- `open()`, `next()`, `goToPage(23)`, `close('back')`, `restore()`,
  `suspend()/resume()` and `dispose()` all resolve with no console or page errors;
- `dispose()` leaves the host empty.

Not verified: pixel-level parity against the live `/notebook-lab-native` page,
and frame-time parity (the smoke test ran on software GL). Treat visual parity
as expected-by-construction but unconfirmed.

## Remaining integration steps (require editing files outside this directory)

1. `three@0.169.0` is imported as a bare `three` specifier but is **not** in
   `package.json`; add the dependency in the consuming project.
2. No route mounts the engine — the consumer must create one and call
   `mountNotebook()`.
3. `m2-accumulated-stack.ts` still injects one small document-level stylesheet
   (`#m2stack-css`) carrying the M2 sheet coordinate system, exactly as the
   source did; everything else is scoped under `nb-root`.
4. Files are `@ts-nocheck`ed where the original JS relied on loose typing;
   tightening those types is future work and would change extracted code.

## Baked textures (build-time rasterisation)

The page/cover rasteriser is the single most expensive thing on a phone, and it
runs before the notebook can be touched. It is deterministic, so it can be run
once offline instead:

```bash
node extraction/notebook-native/tools/bake-textures.mjs \
  --out public/notebook-baked --dpr 2 \
  --buckets 430x932,834x1112,1440x900
```

The script drives the engine's own `bake()` in a real browser (Playwright), so
baked pixels are identical to live ones by construction. At runtime:

```ts
import { mountNotebook, loadBakedTextures, preloadFirstFaces } from '.../notebook-native/src';

const baked = await loadBakedTextures('/notebook-baked/manifest.json', { bucket: { host } });
preloadFirstFaces(baked);
await mountNotebook(host, { pages, perf: 'mobile', baked });
```

A missing or malformed manifest is not an error — the engine silently
rasterises on device as before.

### Dynamic dimensions (mobile)

A baked face is pixels at one leaf size, so the bake is dimension-coupled and a
phone layout is not one size. The baker therefore emits **size buckets** —
one full bake per viewport listed in `--buckets` — into a single
`manifest.json` (`{ ...widestBucket, buckets: [...] }`; the widest bucket is
spread at the top level so older loaders keep working).

`loadBakedTextures()` then:

1. measures the host element (`bucket: { host }`) or the viewport,
2. picks the nearest bucket by width,
3. accepts it only when `SCALE_MIN (0.6) <= live/baked <= SCALE_MAX (1.6)` and
   the aspect ratio is within `ASPECT_TOLERANCE (0.12)` — the mesh samples the
   texture, so mild rescaling is not visible,
4. returns `undefined` otherwise, which means live rasterisation: slower, but
   always correct.

`pickBucket(manifest, query)` and `bucketsOf(manifest)` are exported if you
need to make that choice yourself (for example, re-picking on orientation
change and remounting). Do **not** bake per exact CSS pixel size — three or
four buckets cover every real device.

## CSS-only fallback

`mountNotebook(host, { fallback: 'css' })`, or any device where a WebGL context
cannot be created, runs the notebook without Three.js drawing anything: the
resting DOM halves are rotated about the spine in two 90-degree phases with the
state committed at the vertical. No page is ever rasterised in this mode, so it
is also the cheapest path in the project. Materials, the 26-stratum stack,
chrome and semantics are unchanged, because they were always DOM.

## Baked paper surfaces (`/notebook-textures`)

Sheet surfaces used to draw three canvases each — stock fibre, foxing, crease
— and inline them as PNG data URLs. That was ~60 unique rasterisations plus
~60 base64 blobs for the renderer to decode before a page could paint, and it
was the dominant cost in a page turn.

Those canvases differ only in a few continuous parameters, so they are now
quantised and baked into a small static library:

```bash
# needs playwright (npm i -D playwright) — draws with the real functions
node extraction/notebook-native/tools/bake-surfaces.mjs --out public/notebook-textures
```

26 WebP tiles, ~435 KB total, shared by every sheet:

| layer  | variants                                   |
| ------ | ------------------------------------------ |
| fibre  | 4 strength steps (`FIBRE_STEPS`)           |
| foxing | 4 densities x 2 fields x mirror            |
| crease | 3 events x mirror                          |

The baker imports `drawFibre` / `drawFoxing` / `drawCrease` from
`src/paper/paper-surface.ts` — the same functions the live path calls — so a
baked tile and the canvas it replaces are pixel-identical by construction.
The step tables live in that module too, and both sides read them.

At runtime `mountNotebook()` awaits `preloadPaperTextures()` (1.5 s budget)
before building any sheet. It fetches `manifest.json`, decodes the tiles, and
switches the layer builders to `url(/notebook-textures/...)`. If the manifest
is missing — an embedder that did not copy the directory, or a lab page that
never calls it — the function returns `false` and every layer is drawn live,
exactly as before. Nothing else in the engine changes.

Re-bake whenever a drawing function or a step table changes; the manifest
carries `version`, `ext` and the tables it was produced from.
