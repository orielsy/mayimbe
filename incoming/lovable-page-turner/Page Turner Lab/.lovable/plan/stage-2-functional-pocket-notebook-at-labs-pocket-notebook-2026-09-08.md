# Stage 2 — Functional pocket notebook at /labs/pocket-notebook

## What Stage 1 already gives us

Inspected `public/notebook-assets/` and its manifest (also mirrored at `src/assets/notebook-assets.manifest.json` for import):

- Manifest: `version`, `master` 840x1120, `assets[]` (id, label, group, path, w, h, format, transparent, bytes), and `recipes` for `carried`, `humidity`, `protected` (each: substrate, edgeMask, ordered layers with opacity/mirror/repeat).
- 3 opaque substrates: carried, humidity, protected.
- 10 transparent wear overlays: fibre-stock (tile), foxing-light, foxing-heavy, water-stain, humidity-bloom, grime-handling, edge-oxidation, tonal-drift, smudge-abrasion, crease.
- 3 irregular page-edge masks: edge-mask-a/b/c.
- Cover artwork: `cover-brick-front` (F3-03) and `cover-brick-inside` (pastedown).
- Total 18 files, ~458 KB. Nothing required is missing, so the library is reused as-is — no re-bake.

Content: `public/notebook/content.js` holds the real Mayimbe/Antony Santos copy (24 pages: El Mayimbe, Cabrera, Güira first, Voy Pa'llá, La Chupadera, Corazón Culpable, ...) with `kind` values text/sketch/photo/clipping. The dedication portrait already exists in `extraction/notebook-native/src/assets/portrait.ts`.

## What I build first

Checkpoint 1: the new route, the responsive single-page notebook shell, static-asset page composition from the manifest recipes, and the explicit state machine — closed cover rendering correctly, no turns yet.

## Route and files

- `src/routes/labs.pocket-notebook.tsx` — route + head metadata, exhibit framing.
- `src/components/pocket/PocketNotebook.tsx` — shell, state machine host, controls, swipe/keyboard.
- `src/components/pocket/useNotebookMachine.ts` — deterministic state model.
- `src/components/pocket/PageSurface.tsx` — recipe-driven layered paper (substrate + mask + wear overlays), decorative layers `aria-hidden`.
- `src/components/pocket/PageStack.tsx` — deterministic edge stack inside the cover footprint.
- `src/components/pocket/pages.ts` — 8 logical pages ported from the existing Mayimbe copy, each with a wear recipe, plus one photo page and captioned annotations.
- `src/components/pocket/TurnLayer.tsx` — transient two-faced turning sheet.
- Existing routes, `public/notebook*`, `public/shared/*` untouched.

## State model

States: `closed-front`, `opening`, `open`, `turning-forward`, `turning-backward`, `closing`. A reducer holds `{ state, page, pending }`. Transitions are only accepted from a settled state (`closed-front` / `open`); input during a transition is ignored (single-slot ignore, not a queue). Each transition:

1. Commit the destination page into normal resting DOM underneath.
2. Mount the transient turning sheet with correct front/back faces.
3. On animationend (or immediately under reduced motion / on a safety timeout), unmount the turning layer and unlock controls.

The settled render never depends on the animation's final frame — resting DOM is already correct before the animation ends. Previous from page 1 closes the cover; Next is disabled on the last page. `will-change` only on the transient layer.

## Composition rules

Each page: substrate `<img>`, edge mask via `mask-image`, wear overlays as separate positioned layers with per-recipe opacity/mirror/repeat straight from the manifest. Nothing flattened. Stack: deterministic hashed offsets per stratum, contained inside the cover footprint, visible sheet separation, edge shadow, no corner spikes.

## Responsive

Notebook sized natively in `min()`/`dvh`/safe-area units — one layout at every width, no profile switching, no remount on resize. Desktop 1440x900 frames the same pocket notebook inside a composed exhibit ground. Verified at 360, 390, 430, and 1440 px.

## Accessibility

Semantic buttons with labels and disabled states, visible focus rings, `aria-live` page announcement, ArrowLeft/ArrowRight keyboard turns, `prefers-reduced-motion` settles instantly, wear layers hidden from assistive tech, 44px touch targets.

## Validation (Playwright, run by me)

Closed cover renders and survives idle; open, then page 1 survives idle; forward 3+ pages; backward through them; close. After each settled state: exactly one visible content page, zero `[data-turning]` elements, correct control lock state. Plus rapid-tap integrity, resize while settled, all images `complete && naturalWidth>0`, no horizontal overflow at all four widths, `document.querySelectorAll('canvas').length === 0`, no WebGL context, reduced-motion run, and a clean console. Screenshots at closed / open / mid-turn / settled, mobile and desktop. A Vitest unit test covers the reducer's transition table; `data-nb-state` and `data-nb-page` attributes make failures self-identifying.

## Checkpoints

1. Route, shell, composition, state model.
2. Cover open/close + validation.
3. Page turns, controls, swipe + validation.
4. Polish, accessibility, reduced motion, final validation.

I pause after each for your inspection before any major visual or architectural change.
