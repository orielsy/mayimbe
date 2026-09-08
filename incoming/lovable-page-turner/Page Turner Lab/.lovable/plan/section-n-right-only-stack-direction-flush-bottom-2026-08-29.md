# Section N — Right-only stack direction (flush bottom)

## Goal
In `/paper-lab` Section N only, the 26-sheet M2 block should reveal its stacking **exclusively at the right fore-edge**. The bottom edges of all sheets sit on one perfectly flush common line — zero visible horizontal stepping across the bottom of the page block.

```text
BEFORE (now)                     AFTER
║ sheet →   right reveal 100%    ║ sheet →   right reveal 100%
║  sheet →                       ║  sheet →
║   sheet →  + bottom steps ↓    ║   sheet →  bottom: one flush line
╚══════════╝                     ╚══════════╝
```

## Change
Section N builds its block from `M2_ACCUMULATED.make()` / `stackSpec(VAR[0])`, whose spec includes `bottomDepth` (sheet-to-sheet bottom-extent variation). That parameter is what paints the bottom steps.

- In the Section N builder only, override the spec so bottom-extent variation is eliminated: `bottomDepth: 0` (and any bottom-sag contribution neutralized for this instance), keeping `foreDepth`, recession, waviness, notches, clips, clustering, transforms, z-order, 26 strata and seed 5100 exactly as the promoted M2 recipe.
- Implementation detail confirmed during build: either a per-instance spec override passed into the same `stackEl`/`M2_ACCUMULATED` path, or a Section-N-local normalization that snaps every stratum's bottom extent to the common line — whichever touches less shared code. No edits to `public/shared/paper-stack.js` defaults and none to Section M's rendering.

## Frozen / untouched
- Section M (visual + recipe), seed 5100, all M2 fore-edge geometry and damage.
- `/notebook`, `/notebook-lab-native`, `/notebook-lab-g2`.
- F3-03 cover, surfaces, Page 1 stained face, surface progression.
- Geometry-vs-surface architecture from the previous pass.

## Diagnostics
- The same-scale M-vs-N comparison row stays; it now intentionally shows M with bottom steps vs N flush-bottom — a visual proof of the change.
- Bounds debug (blue/orange/green/red) still available.

## Verification
- Playwright: screenshot Section N at full size plus a bottom-edge crop — confirm no periodic bottom steps, fore-edge stepping unchanged, paper still inside the cover, 26 strata present.
- Check `/tmp/observability/build-errors.log` is clean.
