/* ======================================================================
   NOTEBOOK STYLESHEET — extracted from public/notebook-lab-native/index.html
   (<style> block) plus the parts of public/notebook-lab-native/base.css that
   describe the notebook itself.

   HOST ISOLATION: every rule is namespaced under the notebook root class
   `.nb-root`. The lab's `body.*` state classes became root state classes and
   the lab-only diagnostic rules (debug panel, shadow solo, freeze modes,
   no-lift, HUD, header, controls) are not carried.

   Nothing about geometry, timing, colour or layering was changed.
   ==================================================================== */

export const NOTEBOOK_ROOT_CLASS = 'nb-root';

const STYLE_ID = 'nb-native-notebook-css';
let refCount = 0;

export const NOTEBOOK_CSS = `
/* PERF: --openx is registered as a NON-INHERITED custom property.
   Writing --openx on .book every animation frame was the single most
   expensive thing in the cover frame: an inherited custom property
   invalidates the computed style of the WHOLE .book subtree, which includes
   the 26-stratum paper block and every damage node. Declaring it
   non-inheriting means a write invalidates only the element it is written to;
   updateChrome() sets it on exactly the six consumers. */
@property --openx {
  syntax: '<number>';
  inherits: false;
  initial-value: 0;
}

.nb-root {
  --paper: #f4efe3;
  --ink: #3b3125;
  --desk: #241d16;
  /* the desk the notebook lies on. Override --nb-desk on the host to sit the
     notebook on a different surface. */
  background: var(--nb-desk, radial-gradient(circle at 50% 20%, #3a2f24, var(--desk)));
  color: #e8e0d2;
  font: 15px/1.5 Georgia, serif;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 12px 24px;
}
.nb-root *, .nb-root *::before, .nb-root *::after { box-sizing: border-box; }

/* PRESENTATION SIZING — the notebook as large as comfortably fits. Geometry
   is untouched: the stage keeps its 3/2 box and every internal measurement is
   relative to it, so stack, turns, cover and paper system scale as one. */
.nb-root .stage {
  position: relative;
  width: var(--nb-stage-width, min(94vw, calc((100vh - 230px) * 1.5), 1500px));
  aspect-ratio: 3/2;
  touch-action: none;
  margin-inline: auto;
}

/* ---------------- book body ----------------
   --openx: 0 = shut, 1 = flat open. Driven per-frame from the cover turn
   (updateChrome). Everything on the left half is *revealed* by it, spine
   outward, so nothing can pop into existence ahead of the swinging board. */
.nb-root .book { position: absolute; inset: 0; }
.nb-root .book { --boardout: 1.5px; }

/* The cast shadow is its OWN element, never clipped. */
.nb-root .deskshadow {
  position: absolute;
  top: calc(-1 * var(--boardout)); bottom: calc(-1 * var(--boardout));
  right: calc(-1 * var(--boardout));
  left: calc(-1 * var(--boardout));
  transform-origin: 100% 50%;
  transform: scaleX(var(--deskx, .5));
  will-change: transform;
  border-radius: 10px; background: #2a1f12;
  box-shadow: 0 34px 70px rgba(0,0,0,.62), 0 12px 30px rgba(0,0,0,.45);
}

/* THE BOARDS ARE RIGID OBJECTS. */
.nb-root .backcover, .nb-root .frontboard {
  position: absolute;
  top: calc(-1 * var(--boardout)); bottom: calc(-1 * var(--boardout));
  background: var(--f3-board-r, linear-gradient(160deg, #6e4530, #523324 58%, #3d261a));
  box-shadow: 0 2px 0 #1d100a inset;
}
.nb-root .backcover  { left: calc(50% - 7px); right: calc(-1 * var(--boardout)); border-radius: 2px 10px 10px 2px; }
.nb-root .frontboard {
  left: calc(-1 * var(--boardout)); right: calc(50% - 7px); border-radius: 10px 2px 2px 10px;
  background: var(--f3-board-l, linear-gradient(200deg, #6e4530, #523324 58%, #3d261a));
  clip-path: inset(-40px -40px -40px calc((1 - var(--openx)) * 100%));
}

/* THE RESTING OPEN FRONT COVER — the same rectangle the WebGL cover occupies
   at p = 1 (layoutOpenCover mirrors the measured live .cover rect about the
   hinge), revealed spine-outward under the swinging board. */
.nb-root .opencover {
  position: absolute; z-index: 0;
  border-radius: 8px 2px 2px 8px;
  background: var(--f3-inside-m, linear-gradient(200deg, #6e4530, #523324 60%, #3d261a));
  box-shadow: inset 0 0 0 1px rgba(255,225,175,.08);
  clip-path: inset(-40px -40px -40px calc((1 - var(--openx)) * 100%));
  pointer-events: none;
}

/* THE BACK BOARD, BOTH FACES */
.nb-root .insideback {
  position: absolute; z-index: 0;
  border-radius: 2px 8px 8px 2px;
  background: var(--f3-inside, linear-gradient(200deg, #6e4530, #523324 60%, #3d261a));
  box-shadow: inset 0 0 0 1px rgba(255,225,175,.08);
  pointer-events: none;
}

/* DEDICATION PAGE (inside back cover). The same markup is rasterized by the
   snapCoverBackPhoto stunt double, so both MUST share these rules. */
.nb-root .backphoto {
  position: absolute; left: 50%; top: 6.5%;
  width: 56%;
  transform: translateX(-50%);
  border-radius: 100%;
  display: block;
  box-shadow: 0 3px 10px rgba(20,8,4,.45), 0 0 0 1px rgba(255,225,175,.12);
}
.nb-root .dedication {
  position: absolute; left: 0; right: 0; top: 63%;
  text-align: center;
  font-family: Georgia, "Times New Roman", serif;
  font-variant: small-caps;
  letter-spacing: .09em;
  line-height: 2.05;
  font-size: 14px;
  color: rgba(33,17,8,.86);
  text-shadow: 0 1px 0 rgba(255,224,185,.18), 0 -1px 1px rgba(0,0,0,.6);
  pointer-events: none;
}
.nb-root .dedication span { display: block; }
.nb-root .dedication span:first-child { font-size: 16.5px; letter-spacing: .11em; }
.nb-root .backclosed {
  position: absolute; z-index: 6; display: none;
  border-radius: 8px 2px 2px 8px;
  background: var(--f3-board-r, linear-gradient(160deg, #6e4530, #523324 58%, #3d261a));
  transform: scaleX(-1);
  box-shadow: inset 0 0 0 1px rgba(255,225,175,.10), inset 0 -40px 60px rgba(0,0,0,.28);
  pointer-events: none;
}
.nb-root .book.closedback .backclosed { display: block; }
.nb-root .book.closedback .half.right,
.nb-root .book.closedback .backcover, .nb-root .book.closedback .insideback,
.nb-root .book.backflight .backcover, .nb-root .book.backflight .insideback { visibility: hidden; }
.nb-root .book.closedback .deskshadow, .nb-root .book.backflight .deskshadow {
  transform-origin: 0 50%; transform: scaleX(var(--deskb, 1));
}

.nb-root .spread {
  position: absolute; inset: 0;
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  /* layout container, not a physical surface — transparent so the physical
     hierarchy (frontboard / backcover / crease) shows through. */
  background: transparent;
  border-radius: 6px; padding: 7px;
  clip-path: inset(-40px -40px -40px calc((1 - var(--openx)) * 50%));
}

.nb-root .half { position: relative; }

/* contact shadow: the active leaf sits ON the stack, it does not float. */
.nb-root .half::before {
  content: ''; position: absolute; inset: 0 var(--papershrinkx, 0px) var(--papershrinky, 0px) 0;
  z-index: 0; border-radius: 3px;
  box-shadow: 0 3px 7px rgba(0,0,0,.30), 0 0 0 1px rgba(74,60,38,.40);
  pointer-events: none;
}
.nb-root .half.left::before { inset: 0 0 var(--papershrinky, 0px) var(--papershrinkx, 0px); }

/* PAPER BLOCK SHRINK — the cover is the hard envelope and never moves; the
   paper block gives back a couple of CSS px at the fore edge. */
.nb-root .leaf {
  position: absolute; inset: 0 var(--papershrinkx, 0px) var(--papershrinky, 0px) 0; z-index: 2;
  background: var(--lift-r), var(--paper);
  color: var(--ink);
  overflow: hidden; border-radius: 3px;
  user-select: text;
}
/* PAGE CARD. The painted face of a sheet lives in its own element so a page
   can be built and RASTERISED ahead of time, then promoted at the midpoint of
   a turn for the cost of one class toggle. Repainting the leaf itself at the
   commit is what produced the mid-turn flash: the browser had to lay out and
   paint ~20 background layers plus the damage nodes in the very frame the
   sheet was edge-on, so the layer underneath showed through. */
.nb-root .nb-card {
  position: absolute; inset: 0;
  padding: 6% 7%; overflow: hidden; border-radius: inherit;
  backface-visibility: hidden;
}
/* pre-warmed, effectively invisible, but composited so it is already rastered
   by the time it is promoted */
.nb-root .nb-card.warm {
  opacity: .001; pointer-events: none; will-change: opacity;
}
/* the page the turning sheet leaves behind: the SAME card element, re-parented
   to a static holder so nothing is cloned and nothing is repainted */
.nb-root .nb-under { z-index: 1 !important; background: none !important;
  pointer-events: none; user-select: none; }
.nb-root .pagenum {
  position: absolute; bottom: 4.2%;
  font-size: 9.5px; line-height: 1; letter-spacing: .04em;
  font-style: italic; opacity: .5; pointer-events: none; user-select: none;
}


/* resting page lift near the binding — shading only, never geometry */
.nb-root {
  --lift-r: linear-gradient(90deg,
    rgba(38,26,10,.22) 0%,
    rgba(38,26,10,.145) 1.6%,
    rgba(38,26,10,.055) 4.2%,
    rgba(255,249,233,.30) 8.5%,
    rgba(255,249,233,.115) 14%,
    rgba(255,249,233,.028) 18%,
    rgba(255,249,233,0) 22%);
  --lift-l: linear-gradient(270deg,
    rgba(38,26,10,.22) 0%,
    rgba(38,26,10,.145) 1.6%,
    rgba(38,26,10,.055) 4.2%,
    rgba(255,249,233,.30) 8.5%,
    rgba(255,249,233,.115) 14%,
    rgba(255,249,233,.028) 18%,
    rgba(255,249,233,0) 22%);
}
.nb-root .half.left .leaf { background: var(--lift-l), var(--paper);
                   inset: 0 0 var(--papershrinky, 0px) var(--papershrinkx, 0px); }
.nb-root .leaf.facing-left { background: var(--lift-l), var(--paper); }
.nb-root .leaf.absent { visibility: hidden; }
.nb-root .book.noleft .half.left::before { display: none; }
.nb-root .book.noright .half.right::before { display: none; }

/* ---------------- paper stacks (passive DOM, never WebGL) ----------------
   PHYSICAL Z-ORDER (explicit, documented — not DOM order luck):
     0  .deskshadow            the shadow the whole book casts on the desk
     0  .backcover/.frontboard rigid boards
     0  .opencover             the resting inside of the front board
     1  .stack .m2sheet        the bound page block, INSIDE its board
     2  .leaf                  the resting sheet on top of the block
     3  .crease                gutter contact shading
     5  canvas.nb-gl           the moving WebGL sheet or cover
     6  .hingeshade            spine contact shadow */
.nb-root .stack {
  position: absolute; inset: 0; z-index: 1;
  pointer-events: none;
}
.nb-root .half.left .stack { transform: scaleX(-1); }
.nb-root .m2frame {
  position: absolute; top: 0; left: 0; bottom: 0;
  right: calc(-1 * var(--m2fore, 0px));
}
.nb-root .m2frame > .m2stack {
  position: absolute;
  left: calc(-1 * var(--sx) / var(--sw) * 100%);
  top:  calc(-1 * var(--sy) / var(--sh) * 100%);
  width: calc(100% / var(--sw)); height: calc(100% / var(--sh));
  aspect-ratio: auto;
}
.nb-root .m2stack > .m2sheet { will-change: opacity; }

/* hinge / contact shading (STRUCTURE, not material) */
.nb-root .hingeshade {
  position: absolute; top: 7px; bottom: 7px;
  right: calc(50% + 5px);
  width: clamp(26px, 7.5%, 62px);
  pointer-events: none; z-index: 6;
  opacity: var(--openx);
  clip-path: inset(0 0 0 calc((1 - var(--openx)) * 100%));
  background: linear-gradient(270deg,
    rgba(20,12,5,.46),
    rgba(20,12,5,.20) 22%,
    rgba(20,12,5,.06) 58%,
    rgba(20,12,5,0) 100%);
}

/* binding channel — a valley, not a slot */
.nb-root .crease {
  position: absolute; top: 7px; bottom: 7px; left: 50%; width: 10px;
  transform: translateX(-50%); pointer-events: none; z-index: 3;
  opacity: var(--openx);
  background:
    linear-gradient(90deg,
      rgba(20,14,7,.00) 0%,
      rgba(20,14,7,.55) 26%,
      rgba(20,14,7,.62) 40%,
      rgba(146,118,80,.34) 50%,
      rgba(20,14,7,.62) 60%,
      rgba(20,14,7,.55) 74%,
      rgba(20,14,7,.00) 100%);
}

/* ---------------- front cover ---------------- */
.nb-root .cover {
  position: absolute; inset: -7px -7px -7px 0; z-index: 4;
  border-radius: 2px 8px 8px 2px;
  background: var(--f3-cover, linear-gradient(160deg, #6e4530, #523324 58%, #3d261a));
  color: #e9d8b6; display: flex; align-items: center; justify-content: center;
  font: 600 clamp(16px, 3vw, 28px)/1.2 Georgia, serif; letter-spacing: .26em;
  box-shadow: inset 0 0 0 1px rgba(255,225,175,.10), inset 0 -40px 60px rgba(0,0,0,.28);
  cursor: grab;
}
.nb-root .cover .title {
  color: #d8bb8b;
  padding-left: .26em;
}
.nb-root .cover .title span { display: inline-block; }
.nb-root .cover.inside {
  background: var(--f3-inside, linear-gradient(200deg, #6e4530, #523324 60%, #3d261a));
  box-shadow: inset 0 0 0 1px rgba(255,225,175,.08);
}
.nb-root .book:not(.closed) .cover, .nb-root .book.coverflight .cover { visibility: hidden; }

/* ---------------- continuous cover shadow ---------------- */
.nb-root .covercast, .nb-root .coveredge {
  position: absolute; z-index: 3; pointer-events: none;
  border-radius: 3px 9px 9px 3px;
  will-change: transform, opacity;
}
.nb-root .covercast { background: #150d06; }
.nb-root .coveredge { background: transparent; border-radius: 0; }
.nb-root .edgeband {
  position: absolute; top: 1px; bottom: 1px; width: 6px;
  pointer-events: none; will-change: transform; opacity: 0;
}
.nb-root .edgeband.r {
  left: 0; transform-origin: 0 50%;
  background: linear-gradient(90deg,
    #2b160e 0 33.333%, #55362a 33.333% 66.666%, #23120c 66.666% 100%);
}
.nb-root .edgeband.l {
  right: 0; transform-origin: 100% 50%;
  background: linear-gradient(270deg,
    #2b160e 0 33.333%, #55362a 33.333% 66.666%, #23120c 66.666% 100%);
}
/* bound-edge seam backing: the mesh rim blends into board instead of paper */
.nb-root .coverseam {
  position: absolute; z-index: 3; pointer-events: none;
  background: #55372a;
  will-change: opacity;
}

/* the GL canvas overscans the stage (see the resize/camera notes) */
.nb-root canvas.nb-gl {
  position: absolute; inset: -24%; width: 148%; height: 148%;
  z-index: 5;
  pointer-events: none;
  opacity: 0;
  will-change: opacity;
  transform: translateZ(0);
}
.nb-root canvas.nb-gl.active { opacity: 1; }
.nb-root .grab { position: absolute; top: 0; height: 100%; width: 12%; cursor: grab; z-index: 6; }
.nb-root .grab.next { right: 0; } .nb-root .grab.prev { left: 0; }
.nb-root .book.closed ~ .grab { display: none; }
.nb-root.turning .leaf { user-select: none; }

/* offscreen stunt double used to rasterise a page at the real leaf size */
.nb-root .nb-snaphost {
  position: fixed; left: -10000px; top: 0;
  visibility: hidden; pointer-events: none;
}

/* page furniture (from base.css) */
.nb-root .page-content h2 { font-size: clamp(16px, 3.2vw, 24px); margin: 0 0 .5em; }
.nb-root .page-content p { margin: 0 0 .8em; font-size: clamp(12px, 1.7vw, 15px); }
.nb-root .ph-photo { background: #cfc4b0; border: 1px solid #8a7c66; aspect-ratio: 4/3; }
.nb-root .ph-sketch {
  aspect-ratio: 1/1;
  background:
    repeating-linear-gradient(35deg, rgba(60,50,35,.35) 0 1px, transparent 1px 5px),
    repeating-linear-gradient(-25deg, rgba(60,50,35,.25) 0 1px, transparent 1px 7px);
  border-radius: 50%;
}
.nb-root .ph-clip {
  background: #e6dcc6;
  padding: 10px;
  font-size: 11px;
  color: #6b5c45;
  width: 70%;
}

/* ---------------- CSS-ONLY FALLBACK (#9) ----------------
   No mesh, no raster: the resting DOM halves themselves swing about the
   spine. Everything here is compositor-only (transform / opacity) so the
   cheapest device still gets a book, not a crossfade. */
.nb-root.nb-css-only .stage {
  perspective: 2000px;
  perspective-origin: 50% 42%;
}
.nb-root.nb-css-only .book { transform-style: preserve-3d; }
.nb-root.nb-css-only .nb-spin {
  backface-visibility: hidden;
  will-change: transform;
  box-shadow: 0 18px 42px rgba(0,0,0,.42), 0 4px 12px rgba(0,0,0,.32);
}
/* the lighting overlay spin() parks on the swinging face */
.nb-root.nb-css-only .nb-shade {
  position: absolute; inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  will-change: opacity;
  z-index: 9;
}
/* THE TURNING SHEET. One object, two faces, one animation: the browser hides
   whichever face points away, so the page change happens with no DOM work at
   the vertical and nothing underneath is ever uncovered. */
.nb-root.nb-css-only .half { transform-style: preserve-3d; }
.nb-root.nb-css-only .nb-flip {
  z-index: 8; transform-style: preserve-3d; will-change: transform;
  pointer-events: none; background: none;
  /* .leaf clips its content; clipping would flatten the 3-D space and the two
     faces would render on top of each other instead of back to back */
  overflow: visible; box-shadow: none;
}

.nb-root.nb-css-only .nb-flip .nb-face {
  position: absolute; inset: 0; overflow: hidden;
  border-radius: inherit; backface-visibility: hidden;
  background: var(--lift-r), var(--paper);
  box-shadow: 0 18px 42px rgba(0,0,0,.42), 0 4px 12px rgba(0,0,0,.32);
}
.nb-root.nb-css-only .nb-flip .nb-face.back {
  transform: rotateY(180deg);
  background: var(--lift-l), var(--paper);
}
.nb-root.nb-css-only .nb-flip .nb-card { opacity: 1; }
/* where the faces of the NEXT turn wait: same size as a half, so the raster
   the renderer makes here is the one the turning sheet uses */
.nb-root.nb-css-only .nb-facepark {
  position: absolute; top: 0; bottom: 0; left: 50%; right: 0;
  z-index: 0; pointer-events: none; opacity: .001; overflow: hidden;
}

/* the swinging leaf must not be clipped by the spread's reveal window */
.nb-root.nb-css-only .spread { clip-path: none; }

`;



/** Injects the notebook stylesheet once per document; ref-counted so several
 *  mounted notebooks share it and the last dispose() removes it. */
export function injectStyles(doc: Document): () => void {
  let el = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = doc.createElement('style');
    el.id = STYLE_ID;
    el.textContent = NOTEBOOK_CSS;
    (doc.head || doc.documentElement).appendChild(el);
  }
  refCount++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    refCount--;
    if (refCount <= 0) {
      refCount = 0;
      el?.parentNode?.removeChild(el);
    }
  };
}
