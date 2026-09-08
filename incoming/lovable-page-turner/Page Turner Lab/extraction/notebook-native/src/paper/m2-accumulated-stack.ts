// @ts-nocheck -- mechanically ported from the frozen lab JS; typed at the public API boundary (types.ts) only.
/* EXTRACTED VERBATIM from public/shared/m2-accumulated-stack.js
   Mechanical conversion only: the IIFE wrapper and window globals became ES
   module imports/exports. Not one algorithm, constant or coordinate changed. */
/* ======================================================================
   THE CANONICAL M2 ACCUMULATED STACK — one definition, two consumers.

   This is the approved paper block shown in /paper-lab → Section N:

       Section M → Accumulated → M0 · Current Lab-Native (promoted M2)

       26 strata · seed 5100
       recession x1.16 · corner x1.09 · waviness x1.08
       notch 0.35 · extent -0.60%

   /paper-lab (Section M + Section N) and /notebook-lab-native both build
   their block through THIS module, so the geometry cannot diverge. The
   recipe is a PRESET, not a sandbox: nothing here is exposed to a runtime
   control or a URL parameter.

   Responsibilities, deliberately separated:
     M2 (this file + /shared/paper-stack.js) ....... geometry
     Lab-Native PAPERV2 ............................ surface history
     the notebook .................................. page motion

   The renderer below is the Paper Lab's own stackEl(), verbatim. It tags
   every node with BOTH the Paper Lab class names (.stackwrap / .stratum,
   so Section M/N styling is untouched) and neutral canonical ones
   (.m2stack / .m2sheet) that carry the internal coordinate system into any
   host page.
   ====================================================================== */
import { PaperStack } from './paper-stack';
import { PaperSurface } from './paper-surface';
import { PAPERV2 } from './paperv2';

const PS = PaperStack;

/* the approved candidate: M0 == the promoted M2 edge, read from the single
   place those numbers live. No second copy of the recipe. */
const CAND = PS.M2_EDGE;

/* the Paper Lab's internal sheet coordinates inside .stackwrap. A host frame
   maps its paper footprint onto this region instead of onto the wrapper box. */
const COORD = { sx: 0.06, sy: 0.07, sw: 0.86, sh: 0.86 };

const AGE = () => (PAPERV2 && PAPERV2.AGE != null) ? PAPERV2.AGE : 0.88;

/* ---- the canonical spec. Identical, term for term, to Section M's
   stackSpec(VAR[0]) — that equivalence is asserted in the Paper Lab. ---- */
function spec(o) {
  const NE = PS.NOTEBOOK_EDGE;
  return Object.assign({
    strata: 26, seed: 5100,
    familyMix: 0, exposure: 1, fei: 0.7,
    notebookEdge: Object.assign({}, NE, {
      recession:  NE.recession  * CAND.rec,
      cornerWear: NE.cornerWear * CAND.corner,
      cockle:     NE.cockle     * CAND.cockle,
    }),
    age: AGE(), geo: CAND.geo,
    humid: 0.10, foxing: 0.08, bloom: 0.05, compress: 0.28,
    notchRate: CAND.notch ? 0.08 + CAND.notch * 0.20 : 0,
    correlated: true, phase: 0.32 * 6.28, phaseVar: 0.5,
    limits: { frayChipping: CAND.fray, geometricIntensity: CAND.geo },
  }, o || {});
}

/* RIGHT-ONLY STACK DIRECTION (approved in Section N): every source of
   bottom-edge stepping is zeroed so all 26 sheets share one flush bottom
   line. Fore-edge geometry is untouched. */
function FLUSH_BOTTOM() {
  const base = spec();
  return {
    bottomDepth: 0, lift: 0,
    notebookEdge: Object.assign({}, base.notebookEdge, { bottomSag: 0 }),
  };
}

const model = o => PS.buildStackModel(spec(o));

/* ---- host coordinate system, injected once ---- */
(function injectCSS() {
  if (document.getElementById('m2stack-css')) return;
  const s = document.createElement('style');
  s.id = 'm2stack-css';
  s.textContent =
    '.nb-root{--sx:.06;--sy:.07;--sw:.86;--sh:.86}' +
    '.nb-root .m2stack{position:relative;aspect-ratio:3/4;container-type:inline-size;--u:1cqw}' +
    '.nb-root .m2stack>.m2sheet{position:absolute;top:7%;left:6%;height:86%;width:86%}';
  (document.head || document.documentElement).appendChild(s);
})();

/* ---- the renderer: the Paper Lab's stackEl(), unchanged ---- */
function render(sp) {
  const m = PS.buildStackModel(sp);
  const surface = PaperSurface && PaperSurface.surface;
  const flat = !!sp.flat, cheap = !!sp.cheap;
  const wrap = document.createElement('div');
  wrap.className = 'stackwrap m2stack';

  // block cast shadow so the stack sits on something
  const sh = document.createElement('div');
  sh.className = 'stratum m2sheet';
  sh.style.cssText = 'z-index:0;background:rgba(30,20,8,.45);' +
    'filter:blur(calc(var(--u)*2));transform:translate(calc(var(--u)*0.6),calc(var(--u)*1.2)) scale(1.004,.992)';
  wrap.appendChild(sh);

  for (const s of m.sheets) {
    const el = document.createElement('div');
    el.className = 'stratum m2sheet';
    el.style.transform = s.transform;
    el.style.width = s.width; el.style.height = s.height;
    el.style.clipPath = s.clip;
    let body;
    if (flat) {
      const v = s.i % 2 ? '236,226,203' : '229,217,192';
      body = `linear-gradient(168deg, rgb(${v}), rgb(${v}))`;
    } else if (cheap) { body = s.cheapBody; }
    else body = surface ? surface(s.cond) : s.cheapBody;
    el.style.background = s.seam + ', ' + body;
    el.style.zIndex = String(s.i + 1);
    el.dataset.stratum = String(s.i);
    el.dataset.seam = s.seam;
    /* physical reach of this sheet, as a fraction of the sheet region — the
       only thing a host needs in order to place its frame. */
    el.dataset.reachX = ((100 - s.foreInset) / 100 * (s.mx || 100) / 100).toFixed(6);
    el.dataset.reachY = ((100 - s.bottomInset) / 100 * (s.my || 100) / 100).toFixed(6);
    el.dataset.mx = String(s.mx || 100);
    el.dataset.my = String(s.my || 100);
    wrap.appendChild(el);
  }
  return wrap;
}

/* the notebook block: canonical spec + the approved flush bottom */
const notebook = o => render(spec(Object.assign(FLUSH_BOTTOM(), o || {})));

export const M2Stack = { CAND, COORD, spec, model, render, notebook, FLUSH_BOTTOM };
