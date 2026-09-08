# Remove the repeating bottom-edge seam dashes from all notebook stacks

## What the lines are

Every stacked sheet is drawn as two nested layers: a dark outer rim (the "contour contact seam") and a paper face inset slightly from **both the right and the bottom**. The sliver of dark rim that shows at each sheet's bottom edge paints one short horizontal dash per sheet — repeated ~26 times down the stack, it reads as the dashed "barcode" line in the screenshot. The shared renderer (`paper-stack.js`) additionally paints explicit bottom-edge gradient bands with the same effect.

## Changes

### 1. `public/notebook-lab-native/index.html`
- `.stratumface` CSS (line ~298): change `bottom: 0.42px` → `bottom: 0`.
- In `buildStacks()` (line ~1461): remove the `hPx` computation and the `face.style.bottom = hPx + 'px'` assignment. The right-edge inset (`wPx`) stays, so silhouette separation at the fore-edge is unchanged.

### 2. `public/notebook-lab-g2/index.html`
- Identical edits at the same locations (the file is a fork; the `stratumface` CSS and the face bottom inset are at lines ~298 and ~1475 respectively — exact lines confirmed during implementation).

### 3. `public/shared/paper-stack.js`
- Modern path (spec.seam, lines ~450–452): delete the bottom-edge falloff gradient (`aB`-axis band with `DY`/`Cb`).
- Historical path (lines ~467–468): delete the bottom-edge falloff gradient (`aB`-axis band with `cutW*0.9`).
- Delete the now-unused `aB`, `DY`, `Sb`, `Cb` locals where they become dead.
- Keep the fore-edge falloff, outer-grime gradient, and bottom-corner radial — those don't produce periodic marks.

## What does NOT change
- Real fore-edge geometry: M2 clip profiles, recession, chips, notches, shared edge history.
- Right-edge contour rim (fore-edge separation), tonal/value drift between sheets.
- Stack spacing, containment, page-turn animation, G2's per-sheet unique profiles.

## Verification
- Open `/notebook-lab-native` and `/notebook-lab-g2` in Playwright, open the notebook, and capture high-zoom crops of the fore-edge and bottom-edge regions; confirm no periodic horizontal dashes remain and sheet separation still reads at normal viewing size.
- Check `/tmp/observability/build-errors.log` shows a clean build.
