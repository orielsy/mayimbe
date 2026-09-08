# Paper Lab — Foxing scope + jagged, misshapen edge damage

Two related corrections from your reference photo, both isolated to `/paper-lab` (`public/paper-lab/index.html`). The production notebook, F3-03, and the Material Lab are untouched.

---

## Part 1 — Scope foxing to the Humid family only

The reference image pushed foxing onto every family. Pull it back.

Set the `foxing` factor to `0` on three of the four `FAMILIES` entries; leave Humid unchanged:

```js
handled:   foxing: 0.0   // was 0.5
protected: foxing: 0.0   // was 0.25
first:     foxing: 0.0   // was 0.85  — explicitly no foxing on the first page for now
humid:     foxing: 1.0   // unchanged
```

`condition()` computes `foxing: (familyFoxing + nb.foxing) * age`, so sheets that blend toward Humid or sit in a damp neighbourhood still pick up foxing through `nb.foxing`. The `foxingTex()` renderer, the neighbourhood control, and the sandbox `foxingNb` slider are all unchanged.

Also update the cull/verdict copy so it no longer lists "Heavy foxing as a page identity" as a keep item refined from the reference — foxing is now reserved for Humid and damp neighbourhoods.

---

## Part 2 — Misshapen, jagged edge damage

### The problem
`edgeProfile()` currently builds the silhouette from three smooth sine terms (`wob()`), which by design produces "broad shallow bays, not per-vertex spikes". That reads as a *gently eroded* edge. Your reference shows something different: the outer edge is genuinely damaged — torn, chipped, unevenly bitten, with abrupt steps rather than smooth curves. Right now the only source of abruptness is a single optional `notch` event.

### The change
Add a **fray/chipping layer** on top of the existing smooth recession, driven by a new `fray` amount (0..1), so smooth bays and hard damage are separately controllable:

- **Multi-scale roughness.** Keep the existing low-frequency `wob()` bays as the base shape, then add higher-frequency deterministic noise so the edge is uneven at a fine scale.
- **Discrete chips.** Seeded, sparse, hard-edged bites along the fore edge — each with a steep entry and a short tail, so the outline steps in and out instead of curving. Several per sheet at high `fray`, none at 0.
- **Denser vertex sampling on the fore edge.** `N=40` cannot express a chip; raise the right-edge sample count so small features survive into the clip polygon.
- **Roughen the eroded corners.** Outer top/bottom corners currently pull in with a smooth power curve; add fray-scaled irregularity so they read torn, not rounded off.
- **Top and bottom edges** get a lighter share of the same roughness near their outer ends, tapering to true at the spine. The spine edge stays true and bound — unchanged.

Everything stays deterministic from the sheet seed: same seed and same amounts always produce the same outline.

### Wiring it in
- New `fray` field on each family in `FAMILIES` and threaded through `condition()` alongside `recession` / `cockle` / corner values, scaled by `notebookAge` and `geoIntensity` like the other geometry terms. Proposed family values: protected low, handled moderate, humid moderate-high, first-page highest.
- A `fray` slider in the section-H sandbox so you can dial it live.
- Two new tiles in the **D — geometric wear** row so fray is isolatable: a fray-only study and a "recession + fray" combination, plus a too-far reference.
- The **E — stack silhouette** studies inherit fray automatically through per-sheet condition, which is where it should pay off most: 26 strata each with an independently jagged fore edge should give the block the irregular, chewed profile in your photo rather than a smooth laminated curve.

---

## Verify
- Handled, protected, and first-page sheets render with no foxing specks; humid keeps its clustered foxing; the sandbox `foxingNb` slider still adds foxing to a handled sheet.
- At `fray = 0` every silhouette matches the current output exactly (no regression to the existing smooth model).
- Raising `fray` produces visible chips and irregularity on the fore edge and outer corners, with the spine edge still true.
- Stack studies read as an uneven, damaged block edge.
- Same seed reproduces the same outline across reloads. No console errors; build OK.

## Out of scope
Production notebook, F3-03, Material Lab, paper texture/material rendering, stack strata count and accumulation math, and all other wear factors (tone, grime, edge soiling, humid, fibre).
