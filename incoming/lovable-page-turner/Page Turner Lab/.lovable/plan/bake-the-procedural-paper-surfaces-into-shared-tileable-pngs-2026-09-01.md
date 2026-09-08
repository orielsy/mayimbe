# Bake the procedural paper surfaces into shared tileable PNGs

Today every sheet paints itself from scratch: canvas-generated fibre, foxing and crease textures encoded as data URLs, plus ~20 stacked gradient layers. That is the last real cost in a page turn. This replaces the per-sheet canvas work with a tiny set of static PNGs shipped in `public/`, tinted and offset per sheet with cheap CSS.

## What changes visually

Nothing, ideally. The bake is generated from the exact same drawing code that runs today, so the fibre grain, foxing specks and crease valleys are the same artwork — just decoded once from a file instead of drawn in JavaScript on every mount.

## The asset set

A small fixed library, baked once at build time into `public/notebook-textures/`:

- `fibre.png` — the 200x200 seamless stock grain (one tile, reused by every sheet)
- `foxing-0.png` .. `foxing-3.png` — four density steps of the rust-speck field, seamless
- `crease-0.png` .. `crease-2.png` — three crease events
- `manifest.json` — dimensions, tile sizes, and which density step maps to which range

Mirroring for left-hand pages uses `transform: scaleX(-1)` on the layer wrapper (or a mirrored variant if that proves awkward), not a second baked set.

## Runtime behaviour

`paper-surface.ts` keeps its exact public API (`surface(c, opts)`), but internally:

- fibre / foxing / crease layers resolve to `url(/notebook-textures/...)` instead of a canvas data URL
- per-sheet variation that used to come from a unique canvas now comes from CSS: background-position offset, background-size, opacity and a tint gradient layered over the tile
- the continuous `foxing` density picks the nearest baked step, with opacity interpolating between steps so the progression across the book stays smooth
- if the manifest is missing, the current canvas path still runs — nothing breaks in the labs

## Gradient-layer reduction

Separately from the PNGs, the per-sheet gradient stack collapses where it is safe: the edge-oxidation set, the drift set and the humidity set each become one baked-in-place composite where the sheet's parameters allow, cutting the layer count roughly in half.

## Scope

- Production engine only: `extraction/notebook-native/src/paper/paper-surface.ts`, a new baker under `extraction/notebook-native/tools/`, and the generated assets in `public/notebook-textures/`
- `/notebook-css` and the WebGL engine both benefit automatically since they share the module
- The frozen labs (`/notebook-lab-native`, `/notebook-lab-g2`, `/paper-lab`, `/material-lab`, production `public/notebook/`) are untouched — they keep using `public/shared/paper-surface.js`

## Verification

Mount `/notebook-css`, measure page-build time before and after, and compare a screenshot of the first three sheets against the current output to confirm the surfaces read the same.
