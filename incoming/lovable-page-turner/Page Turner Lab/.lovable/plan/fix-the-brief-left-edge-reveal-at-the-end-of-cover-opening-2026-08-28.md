# Fix the brief left-edge reveal at the end of cover opening

Yes — there is a structural reason this can happen, and it is not the paper stack.

## What is going on

Everything on the left half of the book (inside cover, hinge shade, stacks, block edge, cover shadow) is
revealed spine-outward by one variable, `--openx`. It is computed from an idealised **rigid** board:

```text
openx = max(0, -cos(p * PI)) ^ 1.25
```

The thing actually painted during the swing is not a rigid board — it is a curled, perspective-projected
WebGL mesh. Its real free edge lands slightly *short* of the rigid prediction near the end of the swing,
and the `^1.25` term is a hand-tuned guess at that difference, not a measurement.

Near `p ≈ 0.9–1.0` the guess runs out: `openx` is already ~0.99 while the mesh still does not reach the
outer-left edge. For one or two frames a thin band on the outer left is uncovered by the mesh but already
un-clipped in the DOM, so whatever sits under the inside cover in that band is briefly visible.

## Plan

### 1. Confirm the band before changing the reveal (diagnostic only)

Using the existing dev freeze helpers, hold the cover at `p = 0.80 / 0.90 / 0.95 / 0.98 / 1.00` and, at each
pose, capture the rendered result twice — WebGL-only and DOM-only — plus a per-layer solo pass
(`opencover`, `coveredge`, `edgeL`, `stackL`, `leafL`, right leaf). Measure the mesh's real left-edge screen
X from the drawing buffer at each pose and compare it against the X implied by the current `openx`.

Deliverable: a table of `p → mesh edge X` vs `openx edge X`, and the name of the layer visible in the gap.
No fix is applied until that table shows the gap.

### 2. Replace the guessed reveal curve with the measured one

If confirmed, stop deriving `openx` from `cos` plus an exponent. Instead derive it from the same source of
truth the mesh uses: project the mesh's free-edge position for the current `p` through the cached camera /
hinge model (`world.hingeX`, cached `coverRect`) and convert that screen X into the reveal fraction. The DOM
clip then tracks the actual painted edge at every `p`, by construction, with no fudge factor and no
per-frame layout reads (the projection uses the geometry already cached in `measureLayout()`).

Keep a small conservative lag (sub-pixel to ~1px) so the DOM reveal can only ever trail the mesh, never lead
it. Endpoints stay exact: `openx = 0` at `p = 0`, `openx = 1` at `p = 1`.

### 3. Verify

Step opening and closing frame by frame at `turned = 0` and `turned = 3`, sampling the outer-left band
pixels through the last 15% of the swing, and confirm no frame shows a layer other than the inside cover
there. Re-check the closing direction independently.

## Not touched

F3-03, the material lab, page materials, notebook content, paper-stack depth system, page curl, cover
easing, `.opencover` geometry, `coveredge` z-order, transparent `.spread`, the DOM to WebGL handoff, and the
desk scene. This pass changes only how the reveal fraction is computed.
