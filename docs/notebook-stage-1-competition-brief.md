# Pocket Notebook Rebuild — Stage 1 Competition Brief

Use this exact brief for both competing implementations. The goal is to compare visual judgment, asset preparation, responsiveness, and implementation quality against the same scope. Do not proceed to Stage 2 in this task.

## Context

Mayimbe already contains a substantial notebook experiment: paper recipes, paper-stack logic, wear effects, cover artwork, typography, and museum/exhibit styling. The existing WebGL/canvas-based notebook has proven unreliable at narrow/mobile viewport sizes. Assets may disappear, composite incorrectly, or fail to remain visible after an animation settles.

We are not throwing away the visual research. We are establishing a mobile-first, CSS-and-static-image baseline that intelligently reuses it.

Flatten reusable visual ingredients, not complete notebook pages. For example, foxing, water stains, edge oxidation, folds, grime, and tonal variation should remain separate transparent image overlays where practical. Text and future page content must remain live DOM content. This lets later notebook pages combine the same ingredients dynamically without baking every page into a single image.

## Stage 1 Goal

Create a new static asset laboratory at:

`/labs/notebook-assets`

The page must let us inspect the flattened ingredients individually and judge how they look when layered into a notebook page and cover assembly. This is a static composition and asset-review page—not a functional page-turning notebook.

## Requirements

### 1. Reuse the strongest existing work

- Audit the notebook implementation and reuse its best available paper, aging, cover, board, edge, lighting, and typography work.
- Preserve the established Mayimbe museum/exhibit visual language.
- Prefer assets derived from existing project recipes over unrelated replacement artwork.
- If the current project structure differs from the reference implementation, adapt cleanly to that structure without changing the visible scope.

### 2. Produce reusable flattened assets

Create at least 17 production-usable static image exports covering these groups:

- Three base paper surfaces with distinct histories:
  - Carried / handled
  - Humidity affected
  - Protected interior
- Reusable transparent wear overlays, including at minimum:
  - Light foxing
  - Heavy foxing
  - Water stain
  - Humidity bloom
  - Handling grime
  - Edge oxidation
  - Tonal drift
  - Smudge
  - Crease
- Three page-edge or page-shape masks, one suited to each paper history.
- F3-03 front-cover artwork.
- F3-03 inside-board artwork.

Use transparent PNG or WebP for overlays/masks where appropriate. Keep output dimensions consistent so ingredients align without ad hoc positioning. Optimize the exports for web use while retaining enough resolution for sharp phone and desktop previews.

### 3. Add a machine-readable manifest

Create a manifest that records, for every asset:

- Stable ID
- Category
- File path
- Dimensions
- Whether transparency is expected
- Short purpose/description

The manifest must also define the three sample paper recipes and identify which layers each recipe uses. Recipe composition should be deterministic.

### 4. Build the asset laboratory page

The page should include:

- A concise introduction explaining Stage 1 and the static-image/CSS boundary.
- A composition workbench showing a believable paper stack with live, selectable DOM text.
- Recipe controls for Carried / Handled, Humidity Affected, and Protected Interior.
- Individual layer toggles so overlays can be inspected in and out of context.
- A wear-intensity control.
- Visible filenames or asset IDs for the active recipe.
- A side-by-side or otherwise immediately comparable view of the three paper histories.
- A composed F3-03 cover, inside board, and static paper block.
- A complete asset inventory showing every export on a checkerboard or suitable contrasting field, with useful metadata.

The first mobile viewport should communicate the result quickly; do not make the user scroll through a long explanation before seeing the workbench.

### 5. Mobile-first quality

Design first for `390 × 844`, then ensure the same page is polished at `1440 × 900`.

- No horizontal page overflow.
- Controls must be usable by touch.
- Labels and metadata must remain legible.
- Compositions must stay within their preview areas.
- The desktop view should use the extra width intentionally rather than simply stretching the phone layout.

### 6. Technical boundary

- Runtime composition must use normal HTML/CSS and static image files.
- Do not use WebGL, Three.js, runtime canvas rendering, shaders, or a live procedural paper renderer on the laboratory route.
- A build-time asset baking script may use browser rendering or existing procedural recipes to create image files.
- Text must remain live DOM text.
- Do not implement page turns, cover turns, drag gestures, pagination state, or notebook navigation in Stage 1.
- Do not delete or broadly rewrite the existing notebook implementation.

## Validation

Add automated coverage that checks the laboratory at both `390 × 844` and `1440 × 900` (or the project's equivalent mobile and desktop browser projects).

The checks must confirm:

- The route loads without runtime errors.
- Every manifest image loads successfully.
- All assets appear in the inventory.
- Recipe switching works.
- Layer toggles and wear intensity visibly affect the composition.
- There is no horizontal overflow.
- The route creates no canvas and no WebGL context.

Also run the project's normal build and unit-test suite, and visually inspect the mobile and desktop results.

## Deliverables

- The `/labs/notebook-assets` route.
- At least 17 optimized static assets.
- The asset manifest and three deterministic recipes.
- Any reproducible build-time baking/generation script.
- Responsive automated tests.
- A short implementation note documenting how to regenerate the assets, how the layers are intended to compose, and what remains explicitly deferred to Stage 2.

At handoff, report:

- Exact branch and commit.
- Asset count and total transfer size.
- Build/test/browser results.
- Any known limitations.
- The URL/path to review.

## Acceptance Standard

The result should feel like a credible foundation for the final Mayimbe pocket notebook: materially rich, historically varied, touch-friendly, and dependable without WebGL. The asset inventory alone is not enough—the composed examples must prove that the flattened ingredients can recreate a convincing, flexible notebook system.

