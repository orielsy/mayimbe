# Handoff: `extraction/notebook-native`

Use this document to hand the current notebook engine work to another AI. It is a self-contained snapshot of where the extracted production engine stands, how to run it, and what to do next.

---

## 1. What this is

A framework-independent, host-mountable extraction of the `/notebook-lab-native` WebGL page-turning notebook. It lives **only** under `extraction/notebook-native/`. The original `public/notebook-lab-native/` and `public/shared/` files are the immutable source of truth — do not edit them.

The engine renders a physical notebook with:
- F3-03 brick cloth cover
- 26-stratum canonical M2 paper stack
- WebGL page-mesh page turns with DOM/WebGL handoff
- Back-cover dedication spread (photo + debossed text)
- State machine: `CLOSED_FRONT` → `OPEN` → `CLOSED_BACK`

---

## 2. Quick start for the next AI

### Install the missing runtime dependency

```bash
bun add three@0.169.0
```

`three` is imported as a bare specifier inside the engine but is **not** in `package.json`.

### Mount and smoke-test

```ts
import { mountNotebook } from './extraction/notebook-native/src';
import { SAMPLE_PAGES } from './extraction/notebook-native/src/fixture/sample-pages';

const host = document.getElementById('notebook-host');
const engine = await mountNotebook(host, {
  pages: SAMPLE_PAGES,                 // 24 faces = 12 physical sheets
  sectionToPage: { discography: 9 },
  perf: 'desktop',                     // or 'mobile' / 'low'
  onStateChange: s => console.log(s),
});

await engine.open();
await engine.next();
await engine.goToPage(23);
await engine.close('back');
engine.dispose();
```

A headless smoke test already exists and should still pass after your changes. Run it from the repo root:

```bash
bun build --external three extraction/notebook-native/src/index.ts --outdir /tmp/nb-build
# then exercise it in a browser / Playwright script
```

See `README.md` §"Verified" for the checklist the previous AI used.

---

## 3. Architecture at a glance

| File / module | Responsibility |
|---------------|----------------|
| `src/index.ts` | Public entry: `mountNotebook()` factory. |
| `src/engine.ts` | Core engine: WebGL renderer, animation loop, state machine, texture windowing, shadow/chromium system. **This is where the mobile perf work is happening.** |
| `src/types.ts` | `MountOptions`, `EngineApi`, `NotebookState`, `PerfProfileInput`. |
| `src/markup.ts` | Builds the namespaced DOM tree under `.nb-root`. No `document.getElementById`. |
| `src/cover/cover-f3.ts` | F3-03 brick cover procedural painter. |
| `src/paper/paperv2.ts` | PAPERV2 surface aging history (AGE 0.88, exposure, humidity, trauma echo). |
| `src/paper/m2-accumulated-stack.ts` | Canonical 26-stratum stack factory (seed 5100). |
| `src/paper/paper-stack.ts` | Shared lower-level stack geometry helpers. |
| `src/perf/profile.ts` | Device profiles: `desktop`, `mobile`, `low`. Defines DPR caps, mesh density, resident texture window, idle timeout. |
| `src/fixture/sample-pages.ts` | 24 synthetic page faces for headless testing. |

Key invariants:
- Resting DOM, WebGL in motion. At animation endpoints the DOM is shown and the WebGL mesh is hidden.
- `turned` = sheets flipped to the left pile. `page` = 1-based right-hand page of the current spread.
- Textures are built on demand inside a resident window on mobile; desktop keeps everything resident (`residentSheets: Infinity`).

---

## 4. What is already done

From the 9-point mobile performance plan:

- [x] **#3 Fragment cost** — `src/perf/profile.ts`; DPR caps, antialias toggles, motion-time resolution scaling.
- [x] **#6 Mesh reduction** — `PlaneGeometry` segments pulled from the profile (96×6 desktop → 24×3 or 16×2 mobile).
- [x] **#7 Frame pacing** — rAF idles out at rest; auto-suspend on hidden tab / offscreen host.
- [x] **#2 Texture budget (runtime half)** — resident sheet window, on-demand rasterisation, prefetch ahead of turns, eviction behind.
- [x] **#1 Build-time texture baking** — `tools/bake-textures.mjs` drives the engine's own `bake()` in Playwright and writes images + `manifest.json`; `src/perf/baked.ts` loads it at runtime and the engine uploads the images instead of rasterising.
- [x] **#1b Dimension buckets** — the baker takes `--buckets 430x932,834x1112,1440x900` and bakes each viewport into one manifest (`buckets[]`, widest bucket also spread at top level for backwards compatibility). `loadBakedTextures(url, { bucket: { host } })` measures the live host, picks the nearest bucket, and only accepts it inside 0.6x-1.6x scale and 0.12 aspect tolerance; otherwise it returns `undefined` and the engine rasterises live. This is what makes the bake safe for dynamic/responsive mobile layouts — never bake per exact CSS pixel size.
- [x] **#9 CSS-only fallback** — WebGL-free spread flip via `fallback: 'css'` or when no WebGL context can be created.

All of the above preserve `perf: 'desktop'` as the exact frozen lab behaviour.

---

## 5. What remains (do these next)

Edit only inside `extraction/notebook-native/` unless explicitly told otherwise.

1. **#5 Paper-stack sprite**  
   On mobile, bake the 26-stratum M2 block to a single sprite image. Render the pile as one quad instead of 26 strata during motion. Keep the full strata for the resting DOM spread.

2. **Bucket tuning**  
   Decide the shipping bucket list for the real site and re-run the baker; verify on a narrow phone, a tablet, and desktop that `pickBucket` selects (and does not reject) the intended bucket.

See `roadmap.md` at the repo root for the canonical task list.

---

## 6. Critical safety rules

1. **Scope rule:** Only add new files under `extraction/notebook-native/`. Do not edit, delete, format, rename, or otherwise change files outside this directory, especially anything under `public/notebook-lab-native/` or `public/shared/`.
2. **Source-of-truth rule:** `public/notebook-lab-native/index.html` and `public/shared/*.js` are immutable references. If the engine diverges, document why in a `CHANGES.md` note inside `extraction/notebook-native/`.
3. **Desktop parity rule:** `perf: 'desktop'` must reproduce the frozen lab behaviour. If a mobile optimisation changes desktop visuals or timing, gate it behind the profile.
4. **Dispose rule:** Any resource you add (textures, geometries, observers, listeners, workers) must be released in `engine.dispose()`.
5. **No new abstractions unless necessary:** Prefer keeping the mechanical extraction flat. Do not introduce a state library, DI container, or renderer class hierarchy without explicit user approval.

---

## 7. How to verify your work

Minimum bar before claiming a change is complete:

1. `bun build --external three extraction/notebook-native/src/index.ts` succeeds.
2. Headless smoke test passes: mount → `open()` → `next()` → `goToPage(9)` → `goToPage(23)` → `close('back')` → `dispose()`, zero console errors.
3. `dispose()` leaves the host element empty.
4. With `perf: 'desktop'`, visual behaviour matches the frozen `/notebook-lab-native` lab page (verify by eye in the live preview).

---

## 8. Useful context for the next AI

- The M2 stack is **right-only / flush-bottom**: all strata step inward at the fore-edge; the bottom edge is perfectly flush. Do not reintroduce bottom stepping.
- Hard production limits on edge wear: `fray ≤ 0.16`, geometric intensity `≤ 0.65`. Lab variants may exceed these; the production engine must not.
- The cover mesh uses two-sided shader lighting. The back-cover turn reuses `coverTex[3]` so the dedication portrait never ghosts onto the front cover.
- The notebook size was previously enlarged, which hurt performance until the drawing-buffer DPR was capped. Keep `MAX_GL_DPR` or the profile DPR cap in place when scaling up.

---

## 9. Contact / handoff artifact

This file was generated as a handoff aid. If you make major architectural decisions while continuing the work, update this document and the `README.md` so the next handoff is clean.

## Baked paper surfaces

`src/paper/paper-surface.ts` no longer draws a canvas per sheet by default.
`preloadPaperTextures()` (awaited inside `mountNotebook`) points the fibre,
foxing and crease layers at 26 shared WebP tiles in `public/notebook-textures`,
produced by `tools/bake-surfaces.mjs` from the very same drawing functions.
Missing manifest => automatic fall back to live canvas drawing. Zero-alpha
gradient layers are also culled now, which thins interior sheets considerably.
Re-run the baker after touching `drawFibre` / `drawFoxing` / `drawCrease` or
the `FIBRE_STEPS` / `FOX_STEPS` / `CREASE_SEEDS` tables. See README for detail.
