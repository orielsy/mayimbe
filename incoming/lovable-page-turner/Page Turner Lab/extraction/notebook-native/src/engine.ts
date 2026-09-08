// @ts-nocheck -- mechanically ported from the frozen lab JS; typed at the public API boundary (types.ts) only.
/* ======================================================================
   NOTEBOOK ENGINE — extracted from public/notebook-lab-native/index.html
   (the module <script>), verbatim below the prelude.

   WHAT CHANGED (host isolation only):
     - the lab's module script became one factory function, so every binding
       is per-instance instead of per-document;
     - window.PaperStack / PaperSurface / PAPERV2 / M2Stack / F3_COVER became
       ES module imports;
     - document.getElementById(...) became root-scoped refs from markup.ts;
     - document.body state classes became notebook-root classes;
     - the lab HUD, nav buttons, URL tuning, ?perf/?pmode profiling harness,
       ?debug alignment rig and window.__protoB / window.__nbperf handles are
       gone. Where the preserved code still calls into them, they are inert
       stubs, so no algorithm below needed editing.

   WHAT DID NOT CHANGE: the paper/cover material systems, the canonical M2
   stack usage, the snapshot -> SVG foreignObject -> texture pipeline, the
   shader, the camera calibration, the geometry caches, the GPU warm-up, the
   DPR cap, the turn state machine, every shadow layer, and every constant.
   ==================================================================== */
/* @ts-nocheck — preserved lab source: kept byte-faithful rather than retyped
   for the type checker. See README ("remaining compromises"). */
import * as THREE from 'three';

import { PaperStack } from './paper/paper-stack';
import { PaperSurface } from './paper/paper-surface';
import { PAPERV2 } from './paper/paperv2';
import { M2Stack } from './paper/m2-accumulated-stack';
import { F3_COVER } from './cover/cover-f3';
import { buildMarkup } from './markup';
import { injectStyles } from './styles';
import { resolveProfile } from './perf/profile';
import type {
  NotebookEngine, NotebookPage, NotebookSnapshot, MountOptions, CloseSide,
} from './types';

/* the shared modules are referenced by the preserved code through these
   names; touching them here would be a behavioural change, so they are only
   re-exposed, never re-implemented. */
void PaperStack; void PaperSurface;

export function createNotebookEngine(host: HTMLElement, options: MountOptions): NotebookEngine {
  const doc = host.ownerDocument;
  const releaseStyles = injectStyles(doc);
  const refs = buildMarkup(host);
  /* ---------- performance budget (see perf/profile.ts) ----------
     Desktop resolves to the exact frozen lab values, so nothing about the
     desktop experience is altered by this. */
  const PROF = resolveProfile(options.perf ?? 'auto');


  /* ---------- host-scoped DOM refs (were document.getElementById) ---------- */
  const {
    root, stage, book, cover, leafL, leafR, backcover, stackL, stackR,
    openCoverEl, insideBackEl, backClosedEl, covercast, coveredge, coverseam,
    edgebandR, edgebandL, deskshadowEl, frontboardEl, hingeshadeEl, creaseEl,
    spreadEl, canvas, grabNext, grabPrev,
    snapLeaf, snapCover, snapCoverBack, snapCoverBackPhoto, snapBackBoard,
  } = refs;
  root.classList.add('nb-tier-' + PROF.tier);


  /* ---------- listener bookkeeping (dispose() must leave nothing) ---------- */
  const listeners: Array<[EventTarget, string, EventListener]> = [];
  const on = (target: EventTarget, type: string, fn: EventListener) => {
    target.addEventListener(type, fn);
    listeners.push([target, type, fn]);
  };

  /* ---------- lifecycle flags owned by the wrapper ---------- */
  let disposed = false, suspended = false, rafId = 0;
  /* frame pacing: the loop idles out when nothing moves (see frame()) */
  let lastActivity = 0;
  const kick = () => { if (!rafId && !suspended && !disposed) frame(); };
  let pendingResolve: (() => void) | null = null;
  const afterSettle = () => {
    const r = pendingResolve; pendingResolve = null;
    if (r) r();
    notifyState();
  };
  const notifyState = () => { if (options.onStateChange && !disposed) options.onStateChange(snapshot()); };

  /* ---------- inert stubs for the lab-only harnesses ----------
     The preserved code still calls these; every one is a dead branch. */
  const PERF_ON = false, PERF_DUR = 0;
  const M_NOCAST = false, M_NOEDGE = false, M_STATICBLUR = false;
  const M_NODESK = false, M_NORENDER = false, M_NOOPENX = false;
  const PSECT = { pose: [], chrome: [], openx: [], shadow: [], render: [], frame: [] };
  const pnow = () => 0;
  const dbg = { hold: false, flat: false };
  let perf = null;   // the lab's per-turn frame-time collector; never started
  const perfBegin = () => {}, perfSample = () => {}, perfEnd = () => {};
  const perfRender = () => { renderer.render(scene, camera); };
  const traceCoverFrame = () => {}, flushCoverTrace = () => {}, frameLog = () => {};
  const reportAlign = () => {};
  void M_NODESK; void M_NORENDER; void M_NOOPENX; void PERF_DUR;

  /* ---------- content ---------- */
  const pages: (NotebookPage | null)[] = options.pages.slice();
  /* a physical sheet always has two faces; an odd page count would leave the
     last sheet with no back, so it gets a blank (pageHTML(null) === ''). */
  if (pages.length % 2) pages.push(null);
  const SHEETS = pages.length / 2;
  let turned = 0;                  // sheets flipped; spread shows pages [2t-1, 2t]
  let turning = null;              // {kind:'paper'|'cover', dir, sheet, p, dragging, ...}

  /* ---------- notebook state ------------------------------------------
     CLOSED_FRONT -> the book block sits entirely right of the spine and the
     front cover caps it. OPEN -> the normal spread. CLOSED_BACK is the real
     end of the book: every sheet is on the left and the back board has been
     shut down onto them. It is the mirror of CLOSED_FRONT and uses the same
     cover mesh, shadow system and phases.
     -------------------------------------------------------------------- */
  const CLOSED_FRONT = 'CLOSED_FRONT', OPEN = 'OPEN', CLOSED_BACK = 'CLOSED_BACK';
  let state = CLOSED_FRONT;

/* ====================== PRESERVED SOURCE BEGINS ====================== */

function pageHTML(p, idx) {
  if (!p) return '';   // paste-down: bound board material, no page furniture
  const extra = p.kind === 'sketch' ? '<div class="ph-sketch"></div>'
    : p.kind === 'photo' ? '<div class="ph-photo"></div><p style="font-family:cursive;font-size:12px">— handwritten annotation —</p>'
    : p.kind === 'clipping' ? '<div class="ph-clip">clipping placeholder</div>' : '';
  /* small footer: page number + paper concept so wear types can be reviewed
     and eliminated/tuned page by page. idx identifies the physical sheet. */
  let footer = '';
  if (idx != null) {
    const r = PAPERV2 && PAPERV2.label(idx, pages.length);
    /* outer corner of the face as it RESTS: odd pages sit on the left half */
    const side = idx % 2 ? 'left:7%' : 'right:7%';
    footer = `<footer class="pagenum" style="${side}">p.${idx + 1}${r ? ' · ' + r : ''}</footer>`;
  }
  return `<article class="page-content"><h2>${p.title}</h2><p>${p.body}</p>${extra}</article>${footer}`;
}
/* ======================================================================
   DETERMINISTIC EDGE IRREGULARITY
   ----------------------------------------------------------------------
   Real stacked paper is hand-cut: corners are never all the same radius and
   no two sheets are identical. We express that as a tiny per-SHEET variation
   of the four corner radii (~2.1–3.9px against a 3px nominal).

   Per SHEET, not per page: a physical sheet has ONE silhouette, so its front
   and back faces must agree — otherwise the mesh mask at p=0 would not match
   the DOM page it resolves to at p=1.

   Deterministic (hashed from the sheet index), never per-frame: the edge
   cannot shimmer, and screenshots are reproducible.
   ==================================================================== */
const NOMINAL_R = 3;
function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
let irregular = true;   // diagnostics toggle
let thickness = true;   // diagnostics toggle
/* [tl, tr, br, bl] as seen from the RIGHT-hand (front) side of the sheet */
function sheetRadii(sheet) {
  if (!irregular) return [NOMINAL_R, NOMINAL_R, NOMINAL_R, NOMINAL_R];
  return [0, 1, 2, 3].map(k => +(NOMINAL_R + (hash1(sheet * 4 + k + 1) - 0.5) * 1.8).toFixed(2));
}
const mirrorR = r => [r[1], r[0], r[3], r[2]];   // same sheet, seen from behind
const cssR = r => `${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px`;
const sheetOf = pageIdx => Math.floor(pageIdx / 2);

/* ======================================================================
   MATERIAL SYSTEM — deterministic procedural wear
   ----------------------------------------------------------------------
   Two families of cue, deliberately mixed so no single frequency reads:

   1. MACRO: CSS gradient blobs, positioned/sized from a per-surface hash.
      Large rubbed areas, thumb zones, patchy edge yellowing, stains.
   2. MICRO: tiny canvas-generated tiles (fibres, specks, leather grain,
      scratches, abrasion) baked once into data URLs at boot.

   Both are plain `background-image` layers set inline, which is the one
   thing that matters for this architecture: `inlineComputed` copies
   background-image/-size/-position/-repeat, so a data-URL texture and a
   gradient are carried into the SVG raster verbatim. No pseudo-elements,
   no masks, no blend modes, no external files (data URLs also dodge the
   foreignObject CORS rules entirely).
   ==================================================================== */
let liftOn = true;                       // diagnostics toggle (resting curvature)
let WEAR = 1;                            // 0 = off, 1 = current, 1.7 = stronger
const wearFlags = { grain: true, edges: true, damage: true, cover: true };
const h2 = (n, k) => hash1(n * 13.37 + k * 7.77 + 5.5);
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
const PAPER_FRESH = [246, 241, 230], PAPER_AGED = [231, 219, 189];
const A = x => Math.max(0, x * WEAR).toFixed(3);          // wear-scaled alpha

/* ---------- canvas texture factory (deterministic, cached, data-URL) ---------- */
const TEXCACHE = new Map();
function texURL(key, w, h, draw) {
  let u = TEXCACHE.get(key);
  if (u) return u;
  const c = doc.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  u = `url("${c.toDataURL('image/png')}")`;
  TEXCACHE.set(key, u);
  return u;
}
function rnd(seed) {                     // small deterministic LCG
  let s = (Math.abs(seed) * 2654435761 % 2147483647) || 7;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}
/* Genuine tiling: the random parameters are generated ONCE, then drawn on a
   3x3 wrap. Re-rolling the randomness per pass (the naive version) leaves
   features clipped differently at each border and the tile grid becomes
   visible as rectangular blocks. */
function wrapped(g, w, h, items, draw) {
  for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
    g.save(); g.translate(dx, dy);
    for (const it of items) draw(it);
    g.restore();
  }
}
const many = (n, r, make) => Array.from({ length: n }, () => make(r));

/* paper: fibres + specks + soft mottling. Two tiles at different sizes are
   layered in paperSkin, so the visible period is their LCM, not 128px. */
function paperTile(v) {
  return texURL('paper' + v, 128, 128, (g, w, h) => {
    const r = rnd(41 + v * 17);
    const blobs = many(22, r, r0 => ({
      x: r0() * w, y: r0() * h, rad: 8 + r0() * 26, dark: r0() > 0.45 }));
    wrapped(g, w, h, blobs, b => {
      const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.rad);
      gr.addColorStop(0, b.dark ? 'rgba(126,102,58,.05)' : 'rgba(255,252,240,.055)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.rad, 0, 7); g.fill();
    });
    const fibres = many(140, r, r0 => ({
      x: r0() * w, y: r0() * h, a: r0() * Math.PI, len: 3 + r0() * 15,
      bx: (r0() - .5) * 3, by: (r0() - .5) * 3,
      light: r0() > 0.5, al: 0.03 + r0() * 0.06, lw: 0.5 + r0() * 0.6 }));
    wrapped(g, w, h, fibres, f => {
      g.strokeStyle = f.light
        ? `rgba(255,253,244,${(f.al + .02).toFixed(3)})`
        : `rgba(112,90,52,${f.al.toFixed(3)})`;
      g.lineWidth = f.lw;
      g.beginPath(); g.moveTo(f.x, f.y);
      g.quadraticCurveTo(f.x + Math.cos(f.a) * f.len * .5 + f.bx,
                         f.y + Math.sin(f.a) * f.len * .5 + f.by,
                         f.x + Math.cos(f.a) * f.len, f.y + Math.sin(f.a) * f.len);
      g.stroke();
    });
    const specks = many(80, r, r0 => ({
      x: r0() * w, y: r0() * h, rad: 0.25 + r0() * 0.7, al: 0.05 + r0() * 0.11 }));
    wrapped(g, w, h, specks, s0 => {
      g.fillStyle = `rgba(104,82,44,${s0.al.toFixed(3)})`;
      g.beginPath(); g.arc(s0.x, s0.y, s0.rad, 0, 7); g.fill();
    });
  });
}

/* leather: irregular pebbled cells, never a stripe */
function leatherTile() {
  return texURL('leather', 160, 160, (g, w, h) => {
    const r = rnd(913);
    const cells = many(300, r, r0 => ({
      x: r0() * w, y: r0() * h, rad: 1.6 + r0() * 4.2, sq: 0.6 + r0() * 0.6,
      rot: r0() * 3, d: 0.05 + r0() * 0.09, l: 0.03 + r0() * 0.05, lw: 0.7 + r0() * 0.7 }));
    wrapped(g, w, h, cells, c => {
      g.strokeStyle = `rgba(24,15,6,${c.d.toFixed(3)})`;
      g.lineWidth = c.lw;
      g.beginPath(); g.ellipse(c.x, c.y, c.rad, c.rad * c.sq, c.rot, 0, 7); g.stroke();
      g.strokeStyle = `rgba(255,232,190,${c.l.toFixed(3)})`;
      g.beginPath(); g.ellipse(c.x - .6, c.y - .7, c.rad * .8, c.rad * .55, c.rot, 0, 7); g.stroke();
    });
  });
}

/* board / pastedown: coarse fibrous cloth, no visible weave rhythm */
function boardTile() {
  return texURL('board', 128, 128, (g, w, h) => {
    const r = rnd(577);
    const fib = many(230, r, r0 => ({
      x: r0() * w, y: r0() * h, a: r0() * Math.PI, len: 2 + r0() * 9,
      dark: r0() > 0.5, al: 0.04 + r0() * 0.07, lw: 0.6 + r0() * 0.7 }));
    wrapped(g, w, h, fib, f => {
      g.strokeStyle = f.dark ? `rgba(20,12,5,${f.al.toFixed(3)})`
                             : `rgba(238,214,172,${(f.al * .7).toFixed(3)})`;
      g.lineWidth = f.lw;
      g.beginPath(); g.moveTo(f.x, f.y);
      g.lineTo(f.x + Math.cos(f.a) * f.len, f.y + Math.sin(f.a) * f.len); g.stroke();
    });
  });
}

/* individual abrasions: FEW, irregular, mostly absent. Stretched to the
   surface (background-size 100% 100%) so nothing repeats. */
function scratchLayer(seed, count) {
  return texURL('scr' + seed + '_' + count, 480, 320, (g, w, h) => {
    const r = rnd(seed);
    for (let i = 0; i < count; i++) {
      const x = r() * w, y = r() * h, a = (r() - 0.5) * 2.4, len = 8 + r() * r() * 90;
      const bright = r() > 0.42;
      g.strokeStyle = bright
        ? `rgba(236,208,160,${(0.10 + r() * 0.22).toFixed(3)})`
        : `rgba(20,12,5,${(0.10 + r() * 0.22).toFixed(3)})`;
      g.lineWidth = 0.5 + r() * 1.1;
      g.beginPath(); g.moveTo(x, y);
      // interrupted: a scratch fades and returns, it is not one clean line
      let px = x, py = y;
      const steps = 3 + Math.floor(r() * 4);
      for (let k = 0; k < steps; k++) {
        const nx = px + Math.cos(a) * (len / steps) + (r() - .5) * 4;
        const ny = py + Math.sin(a) * (len / steps) + (r() - .5) * 4;
        if (r() > 0.28) { g.moveTo(px, py); g.lineTo(nx, ny); }
        px = nx; py = ny;
      }
      g.stroke();
    }
    // rubbed patches where the finish has gone
    for (let i = 0; i < 5; i++) {
      const x = r() * w, y = r() * h, rad = 14 + r() * 46;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(226,196,148,${(0.06 + r() * 0.10).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(x, y, rad, rad * (0.4 + r() * 0.5), r() * 3, 0, 7); g.fill();
    }
  });
}

/* corner abrasion: dense speckle + rubbed light, packed into one corner of
   the tile so it can be positioned at each corner independently */
function cornerAbrasion(seed, ax, ay) {
  return texURL(`corner${seed}_${ax}${ay}`, 128, 128, (g, w, h) => {
    const r = rnd(seed);
    const cx = ax * w, cy = ay * h;                 // the abraded corner
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 100);
    gr.addColorStop(0, 'rgba(228,198,150,.26)');
    gr.addColorStop(.55, 'rgba(214,182,132,.08)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) {                 // grime beside the rub
      const d = r() * r() * 122, a = r() * Math.PI / 2;
      const x = cx + (ax ? -1 : 1) * Math.cos(a) * d;
      const y = cy + (ay ? -1 : 1) * Math.sin(a) * d;
      g.fillStyle = r() > 0.45
        ? `rgba(28,18,8,${(0.05 + r() * 0.22).toFixed(3)})`
        : `rgba(238,212,168,${(0.05 + r() * 0.20).toFixed(3)})`;
      g.beginPath(); g.arc(x, y, 0.4 + r() * 1.5, 0, 7); g.fill();
    }
  });
}

/* ---------- helpers to keep the background shorthand readable ---------- */
const layer = (img, size, pos) => `${img} ${pos || '0 0'} / ${size} no-repeat`;
const tile = (img, size) => `${img} 0 0 / ${size} repeat`;

/* ======================================================================
   PAPER SKIN — the full `background` shorthand for one page
   Physical logic: outer edge and lower outer corner are handled; early
   sheets far more than deep ones; but history is NOT a smooth curve, so a
   hashed "character" per page lets a deep page be filthy and a shallow one
   be almost clean.
   ==================================================================== */
function paperSkin(idx) {
  const left = idx % 2 === 1;
  const total = pages.length || 12;
  const L = [];
  if (liftOn) L.push(left ? 'var(--lift-l)' : 'var(--lift-r)');
  L.push(PAPERV2.skin(idx, left, total));
  return L.join(', ');
}


/* ---------- cover / boards / pastedown ---------- */
function legacyCoverSkin() {
  if (!wearFlags.cover || !WEAR) return 'linear-gradient(148deg, #74562f, #4d3821 55%, #3a2a17)';
  const L = [];
  // corners: the four most damaged places on any carried notebook, each
  // worn by a different amount (asymmetry is the whole point)
  const corners = [
    ['right top', .95, 2, 1, 0], ['right bottom', 1, 5, 1, 1],
    ['left bottom', .55, 8, 0, 1], ['left top', .4, 11, 0, 0]];
  for (const [pos, k, seed, ax, ay] of corners) {
    L.push(layer(cornerAbrasion(seed, ax, ay), `${(11 + k * 8).toFixed(0)}% ${(13 + k * 10).toFixed(0)}%`, pos));
  }
  // few, irregular abrasions across the board
  L.push(layer(scratchLayer(31, 16), '100% 100%'));
  // MACRO: asymmetric perimeter history — some sections rubbed light, some
  // darkened with grime, some almost untouched
  L.push(`radial-gradient(30% 12% at 84% 0%, rgba(226,196,146,${A(.16)}), transparent 74%)`);
  L.push(`radial-gradient(22% 10% at 34% 0%, rgba(30,19,8,${A(.24)}), transparent 76%)`);
  L.push(`radial-gradient(26% 12% at 62% 100%, rgba(226,196,146,${A(.13)}), transparent 74%)`);
  L.push(`radial-gradient(18% 12% at 22% 100%, rgba(30,19,8,${A(.20)}), transparent 78%)`);
  L.push(`radial-gradient(9% 30% at 100% 62%, rgba(226,196,146,${A(.17)}), transparent 72%)`);
  L.push(`radial-gradient(7% 22% at 100% 22%, rgba(30,19,8,${A(.22)}), transparent 76%)`);
  // rubbed opening zone, where a thumb lifts the board
  L.push(`radial-gradient(24% 22% at 90% 50%, rgba(232,202,152,${A(.13)}), transparent 74%)`);
  // uneven dye across the whole surface
  L.push(`radial-gradient(66% 52% at 28% 30%, rgba(38,25,11,${A(.20)}), transparent 76%)`);
  L.push(`radial-gradient(48% 40% at 78% 74%, rgba(38,25,11,${A(.22)}), transparent 78%)`);
  L.push(`radial-gradient(40% 34% at 52% 12%, rgba(224,192,142,${A(.07)}), transparent 78%)`);
  // SPINE: several irregular longitudinal creases at different depths,
  // uneven top to bottom — thousands of openings, not one clean band
  L.push(layer(`linear-gradient(90deg, transparent 1.2%, rgba(20,12,5,${A(.42)}) 2.6%, transparent 4%)`, '100% 46%', '0 4%'));
  L.push(layer(`linear-gradient(90deg, transparent 3.4%, rgba(255,232,190,${A(.10)}) 4.6%, transparent 6.2%)`, '100% 62%', '0 30%'));
  L.push(layer(`linear-gradient(90deg, transparent 6%, rgba(20,12,5,${A(.26)}) 7.6%, transparent 9.4%)`, '100% 74%', '0 20%'));
  L.push(layer(`linear-gradient(90deg, transparent 8.6%, rgba(20,12,5,${A(.14)}) 10%, transparent 12%)`, '100% 38%', '0 62%'));
  L.push(`linear-gradient(90deg, rgba(26,16,7,${A(.62)}) 0%, rgba(26,16,7,${A(.18)}) 3.5%,` +
    ` rgba(255,230,190,${A(.06)}) 6.5%, rgba(26,16,7,${A(.07)}) 11%, transparent 18%)`);
  L.push(tile(leatherTile(), '150px 150px'));
  L.push(tile(leatherTile(), '97px 113px'));
  L.push(`radial-gradient(126% 116% at 50% 50%, transparent 58%, rgba(24,15,6,${A(.46)}) 100%)`);
  L.push('linear-gradient(148deg, #74562f, #4d3821 55%, #3a2a17)');
  return L.join(', ');
}

/* the inner faces: older and more intimate than the outside — glue haloes,
   a ghost where a label once sat, a darkened hinge */
function legacyInsideSkin(mirror) {
  const hinge = mirror ? '270deg' : '90deg';
  const L = [];
  if (WEAR) {
    L.push(layer(scratchLayer(77, 6), '100% 100%'));
    // faint rectangular ghost of something once pasted here
    L.push(layer(`linear-gradient(rgba(150,118,66,${A(.05)}), rgba(150,118,66,${A(.05)}))`, '29% 21%', '61% 23%'));
    L.push(layer(`radial-gradient(closest-side, transparent 62%, rgba(120,94,52,${A(.07)}) 100%)`, '34% 26%', '59% 21%'));
    L.push(`radial-gradient(30% 22% at ${mirror ? 22 : 78}% 26%, rgba(196,160,106,${A(.12)}), transparent 72%)`);
    L.push(`radial-gradient(22% 16% at ${mirror ? 66 : 34}% 72%, rgba(150,116,64,${A(.11)}), transparent 74%)`);
    // glue discoloration following the perimeter, unevenly
    L.push(`radial-gradient(120% 110% at 50% 50%, transparent 74%, rgba(176,142,84,${A(.13)}) 92%, rgba(30,19,8,${A(.20)}) 100%)`);
    L.push(tile(boardTile(), '124px 124px'));
    L.push(tile(boardTile(), '83px 91px'));
  }
  L.push(`linear-gradient(${hinge}, rgba(20,12,5,${A(.55)}), rgba(20,12,5,${A(.12)}) 6%, transparent 16%)`);
  L.push(`radial-gradient(124% 116% at 50% 50%, transparent 58%, rgba(20,12,5,${A(.40)}) 100%)`);
  L.push('linear-gradient(200deg, #6b5233, #4a3620 60%, #3e2d19)');
  return L.join(', ');
}

function legacyBoardSkin(left) {
  const L = [];
  if (WEAR) {
    L.push(layer(scratchLayer(left ? 121 : 143, 8), '100% 100%'));
    L.push(tile(leatherTile(), '150px 150px'));
    L.push(`radial-gradient(60% 48% at ${left ? 70 : 30}% 70%, rgba(38,25,11,${A(.20)}), transparent 78%)`);
  }
  L.push(`radial-gradient(124% 116% at 50% 50%, transparent 56%, rgba(24,15,6,${A(.44)}) 100%)`);
  L.push(`linear-gradient(${left ? 210 : 150}deg, #6a4f2c, #46331c 58%, #2f2213)`);
  return L.join(', ');
}

/* ---------- FINAL COVER DIRECTION: F3-03 (brick cloth/board) ----------
   F3-03 "Slightly more scuffed - Brick" from /material-lab is the selected
   final cover direction. Its recipe lives verbatim in ./cover-f3.js
   (FINAL_COVER_PRESET) and is the single source of truth for every visible
   cover surface: front cover (closed, opening, resting open), the front
   board, the pastedown and the back cover. The legacy* functions above are
   the previous leather direction, kept only as a fallback. */
const F3 = F3_COVER;
const F3_FLAT = 'linear-gradient(160deg, #6e4530, #523324 58%, #3d261a)';

function coverSkin() {
  if (!F3) return legacyCoverSkin();
  if (!wearFlags.cover || !WEAR) return F3_FLAT;
  return F3.coverSkin(1);
}

/* inner faces: same pigment and substrate, but only the quiet wear a
   protected surface picks up, plus this notebook's hinge + vignette */
function insideSkin(mirror) {
  if (!F3) return legacyInsideSkin(mirror);
  // The hinge/contact darkening is deliberately NOT part of this material: it
  // is structural, belongs to the spine, and is owned by .hingeshade in the DOM
  // for the whole motion. A %-based gradient here resolved against two boxes of
  // different width (cover raster vs resting pastedown) and stepped at settle.
  const L = [];
  L.push(`radial-gradient(124% 116% at 50% 50%, transparent 58%, rgba(20,12,5,${A(.40)}) 100%)`);
  return L.join(', ') + ', ' + (WEAR ? F3.boardSkin(.35) : F3_FLAT);
}


function boardSkin(left) {
  if (!F3) return legacyBoardSkin(left);
  const L = [];
  L.push(`radial-gradient(60% 48% at ${left ? 70 : 30}% 70%, rgba(38,25,11,${A(.16)}), transparent 78%)`);
  L.push(`radial-gradient(124% 116% at 50% 50%, transparent 56%, rgba(24,15,6,${A(.44)}) 100%)`);
  return L.join(', ') + ', ' + (WEAR ? F3.boardSkin(left ? .3 : .5) : F3_FLAT);
}

/* ---------- occasional real damage as DOM children ----------
   Real elements, so they clone into the snapshot with the page and land in
   the WebGL texture at exactly the same pixels. Inline styles only (the
   snapshot drops classes), and every property used is in SNAP_PROPS. */
function damageNodes(el, idx) {
  if (!wearFlags.damage || !WEAR) return;
  const left = idx % 2 === 1;
  const total = pages.length || 12;
  // dog-ears and edge nicks now come from the paper-lab per-page recipe
  PAPERV2.damage(el, idx, left, total);
}


/* A leaf is always paper. The inside of the front cover is .opencover and
   nothing else may impersonate it, so there is no board branch here. */
function dressLeaf(el, idx) {
  el.style.background = paperSkin(idx);
  damageNodes(el, idx);
}

/* ---------- PAGE CARDS (pre-rasterised faces) ----------
   Painting a page costs the renderer far more than it costs JS: ~20 stacked
   background layers, several data-URL textures and the damage nodes. Doing
   that inside the midpoint commit meant the new face arrived a few frames
   late — the flash. So every face is built ONCE into its own .nb-card, kept
   in a small pool inside the leaf, warmed (composited, invisible) while the
   book is idle, and promoted at the commit by removing one class. */
const CARDS = new Map();          // `${side}:${idx}` -> element
const CARD_POOL_MAX = 4;          // cards kept alive per leaf

function buildCard(idx) {
  const c = leafL.ownerDocument.createElement('div');
  c.className = 'nb-card warm';
  c.innerHTML = pageHTML(pages[idx], idx);
  dressLeaf(c, idx);
  return c;
}
/* ensure the card for `idx` exists and is attached to `leaf` (warm) */
function ensureCard(leaf, idx) {
  if (idx < 0 || idx >= pages.length) return null;
  const key = (leaf === leafL ? 'L:' : 'R:') + idx;
  let card = CARDS.get(key);
  if (!card) { card = buildCard(idx); CARDS.set(key, card); }
  /* a card re-entering the leaf (e.g. handed back by a finished turn) must
     come back warm, or two faces would be live in the same half at once */
  if (card.parentElement !== leaf) { card.classList.add('warm'); leaf.appendChild(card); }

  return card;
}
/* keep the pool bounded: drop the warm cards that have gone stale */
function trimCards(leaf) {
  const warm = [...leaf.children].filter(n => n.classList && n.classList.contains('nb-card')
    && n.classList.contains('warm'));
  while (warm.length > CARD_POOL_MAX) {
    const dead = warm.shift();
    for (const [k, v] of CARDS) if (v === dead) CARDS.delete(k);
    dead.remove();
  }
}
/* promote one card and warm the rest — the only DOM work the commit does */
function showCard(leaf, idx) {
  const card = ensureCard(leaf, idx);
  /* warm EVERY other card this leaf owns, including any that is momentarily
     detached, so exactly one face is ever live — except the face currently
     riding a turning sheet, which owns its own visibility */
  const side = leaf === leafL ? 'L:' : 'R:';
  for (const [k, v] of CARDS) {
    if (!k.startsWith(side) || v === card) continue;
    if (v.parentElement && v.parentElement.classList.contains('nb-face')) continue;
    v.classList.add('warm');
  }
  if (card) card.classList.remove('warm');
  trimCards(leaf);
  return card;
}


function hideCards(leaf) {
  for (const n of leaf.children) {
    if (n.classList && n.classList.contains('nb-card')) n.classList.add('warm');
  }
}
/* FACE CARDS. The back of a turning sheet shows the same page the resting
   half will hold when the turn lands, and one element cannot be in two
   places, so the flipper gets its own copy from a tiny separate pool. It is
   built once per page index and reused on every later turn. */
const FACES = new Map();
/* faces are parked in a hidden holder between turns so the renderer has
   already rasterised them when a sheet needs one */
let facePark = null;
function faceHolder() {
  if (facePark && facePark.isConnected) return facePark;
  facePark = leafR.ownerDocument.createElement('div');
  facePark.className = 'nb-facepark';
  (book || leafR.parentElement).appendChild(facePark);
  return facePark;
}
function buildFace(idx) {
  if (idx < 0 || idx >= pages.length) return null;
  let c = FACES.get(idx);
  if (!c) { c = buildCard(idx); FACES.set(idx, c); }
  if (!c.parentElement) { c.classList.add('warm'); faceHolder().appendChild(c); }
  if (FACES.size > 6) {
    for (const [k, v] of FACES) {
      if (k === idx) continue;
      if (v.parentElement && v.parentElement.classList.contains('nb-face')) continue;
      v.remove(); FACES.delete(k); break;
    }
  }
  return c;
}
function faceCard(idx) {
  const c = buildFace(idx);
  if (c) c.classList.remove('warm');
  return c;
}
function releaseFace(idx) {
  const c = FACES.get(idx);
  if (c) { c.classList.add('warm'); faceHolder().appendChild(c); }
}

/* Build (and let the compositor rasterise) the faces the next move needs,
   while nothing is animating. By the time the visitor clicks, the destination
   is already painted and the turn is pure compositor work. */
function prewarmNeighbours() {
  const w = leafL.ownerDocument.defaultView;
  const idle = (w && w.requestIdleCallback) ? w.requestIdleCallback.bind(w)
    : (fn) => setTimeout(fn, 180);
  idle(() => {
    if (typeof disposed !== 'undefined' && disposed) return;
    for (const t of [turned + 1, turned - 1]) {
      if (t < 0) continue;
      ensureCard(leafL, t * 2 - 1);
      ensureCard(leafR, t * 2);
    }
    /* the two sheet faces a forward / backward turn would carry */
    buildFace((turned + 1) * 2 - 1);
    buildFace(turned * 2);
    trimCards(leafL); trimCards(leafR);

  }, { timeout: 600 });
}

/* li < 0 means "no paper sheet rests on the left". The leaf becomes absent
   (and its contact shadow with it) and .opencover — already there, already
   stationary — is simply uncovered. */
function paintLeftLeaf(li) {
  const none = li < 0;
  leafL.classList.toggle('absent', none);
  book.classList.toggle('noleft', none);
  if (none) { hideCards(leafL); return; }
  showCard(leafL, li);
  leafL.style.borderRadius = cssR(mirrorR(sheetRadii(sheetOf(li))));
}
/* ri past the last page means "no paper sheet rests on the right" — the book
   is at its end and what the visitor sees is the back board's pastedown
   (.insideback), NOT a fabricated blank sheet. Symmetrical with
   paintLeftLeaf: the leaf goes absent and takes its contact shadow with it. */
function paintRightLeaf(ri) {
  const none = ri < 0 || ri >= pages.length;
  leafR.classList.toggle('absent', none);
  book.classList.toggle('noright', none);
  if (none) { hideCards(leafR); return; }
  showCard(leafR, ri);
  leafR.style.borderRadius = cssR(sheetRadii(sheetOf(ri)));
}

/* the boards and both cover faces are painted from the same material
   functions the snapshot uses, so nothing can drift between them */
const TITLE = 'CUADERNO';
/* The frozen title treatment from the material lab (seed 7), narrowed so that
   EVERY letter reads as worn foil rather than a mix of rubbed-out letters and
   near-intact ones. The per-letter hashes still set the amount, but the whole
   band now sits in the distressed range the good letters occupied. */
const TITLE_SEED = 7;
function titleHTML() {
  return [...TITLE].map((ch, i) => {
    const r = h2(i + TITLE_SEED, 91), r2 = h2(i + TITLE_SEED, 92), r3 = h2(i + TITLE_SEED, 93);
    const o = 0.22 + r * 0.22 + r2 * 0.08;
    const bx = (r3 - 0.5) * 0.6;
    return `<span style="opacity:${o.toFixed(2)};text-shadow:${bx.toFixed(2)}px 1px 0 rgba(22,14,6,.5)">${ch}</span>`;
  }).join('');
}
function dressChrome() {
  for (const t of [cover.querySelector('.title'), snapCover.querySelector('.title')]) {
    if (t) t.innerHTML = titleHTML();
  }
  cover.style.background = coverSkin();
  snapCover.style.background = coverSkin();
  snapCoverBack.style.background = insideSkin(false);
  if (snapCoverBackPhoto) snapCoverBackPhoto.style.background = insideSkin(false);
  /* ONE recipe for the inside of the front cover. The mesh samples the
     snapCoverBack raster (insideSkin(false), mirrored in U by the shader);
     the resting DOM object carries the mirrored recipe. Same composition,
     same box, so the settle frame changes renderer and nothing else. */
  openCoverEl.style.background = insideSkin(true);
  frontboardEl.style.background = boardSkin(true);
  backcover.style.background = boardSkin(false);
  /* The back board is the same story mirrored. Its INNER face (visible on the
     right at the end of the book) is the un-mirrored inside recipe — the same
     one snapCoverBack carries, i.e. the mesh's p = 0 front face. Its OUTER
     face at rest is the un-mirrored board recipe flipped in CSS, matching the
     shader's mirroring of the mesh back face at p = 1. */
  if (insideBackEl) insideBackEl.style.background = insideSkin(false);
  if (snapBackBoard) snapBackBoard.style.background = boardSkin(false);
  if (backClosedEl) backClosedEl.style.background = boardSkin(false);
}


function paintDOM() {
  const li = turned * 2 - 1, ri = turned * 2;
  // left leaf is a sheet seen from behind -> mirrored silhouette
  paintLeftLeaf(li);
  paintRightLeaf(ri);
  /* absence / noleft ownership is decided inside paintLeftLeaf(). */
  book.classList.toggle('closed', state === CLOSED_FRONT);
  book.classList.toggle('closedback', state === CLOSED_BACK);
  updateNavDisabled();
  updateStacks();
}

/* One owner for the navigation affordances. Forward is only dead once the
   notebook is physically shut on the back board; at the last spread it still
   has one move left — closing the back cover. */
function updateNavDisabled() {
  notifyState();
}





/* ======================================================================
   PAPER STACKS / PAGE BLOCK — the CANONICAL M2 ACCUMULATED BLOCK.
   ----------------------------------------------------------------------
   PROMOTED, NOT REINTERPRETED. The block is the object approved in
   /paper-lab → Section N: 26 strata, seed 5100, promoted-M2 geometry, built
   by /shared/m2-accumulated-stack.js. Both the lab and this notebook call
   the same factory, so there is exactly one physical stack in the project.

   What this file is allowed to own:
     - the FRAME the block sits in (position and uniform scale)
     - which canonical strata are visible on which side (pagination)
     - the SURFACE each stratum receives (Lab-Native PAPERV2, by depth)

   What it must never do (and no longer does):
     - reshape a canonical sheet (no width/height animation, no rescale())
     - share one clip across sheets, force a ladder, or normalise damage
     - paint a contour rim, a seam hack, a cut-contrast boost or a .blockedge
     - regenerate geometry during an animation frame

   PAGINATION. The six interactive sheets are the notebook's CONTENT; the 26
   strata are its physical THICKNESS. As pages transfer, canonical strata are
   handed from the right block to the left one — top of the block first — by
   opacity alone. Every stratum keeps its exact geometry in every state.

   MIRRORING. The left half is the same canonical block under scaleX(-1):
   spine right, fore edge left. No second damage algorithm.

   PERFORMANCE. Geometry, clips, seams and surfaces are generated once and
   the DOM is built once. A page turn writes 52 opacity values; a cover turn
   writes none.
   ==================================================================== */
const QS = new URLSearchParams('');   // no URL tuning in production
const qnum = (k, d) => (QS.has(k) && isFinite(+QS.get(k)) ? +QS.get(k) : d);

/* THE STACK IS A PRESET. These are read-only facts about the approved block,
   not dials — nothing below is exposed to a control or a URL parameter. */
const STRATA = 26;
const SAFE_PX = 1.0;              // board margin the paper may never eat
/* diagnostic only: neutralise surfaces so geometry alone is comparable with
   Section N. Never changes a single coordinate. */
const SEAMS_ONLY = qnum('silhouette', 0) > 0;

let STACK_BUILT = false;
let M2_TOP_REACH = 1, M2_MAX_REACH = 1, M2_MAX_REACH_Y = 1;

/* ---- build the canonical block once, per side ------------------------- */
function buildCanonicalBlock(host) {
  const block = M2Stack.notebook();
  const frame = doc.createElement('div');
  frame.className = 'm2frame';
  frame.appendChild(block);
  host.innerHTML = '';
  host.appendChild(frame);

  /* depth 0 = topmost sheet (highest z), depth 25 = deepest. Geometry is the
     M2 model's; only the SURFACE is resolved here, from physical depth, so
     the front of the block carries the handled Page-1 history and the deep
     sheets settle into Protected Interior. */
  /* the block's own cast shadow fades with the deepest sheet of the side */
  const cast = block.querySelector('.m2sheet:not([data-stratum])');
  if (cast) cast.dataset.depth = String(STRATA - 1);
  const strata = [...block.querySelectorAll('.m2sheet[data-stratum]')]
    .sort((a, b) => (+b.style.zIndex) - (+a.style.zIndex));

  strata.forEach((el, depth) => {
    el.dataset.depth = String(depth);
    if (SEAMS_ONLY) {
      el.style.background = 'linear-gradient(0deg, rgb(232,222,199), rgb(226,215,190))';
    } else if (PAPERV2) {
      el.style.background = el.dataset.seam + ', ' + PAPERV2.skin(depth * 2, false, STRATA * 2);
    }
  });
  return strata;
}

/* ---- the frame: the ONLY thing that adapts to this notebook ------------
   The block is placed so its deepest sheet lands exactly on the measured
   board margin, and the resting leaf is inset so its fore edge coincides
   with the TOP canonical sheet's fore edge. Both numbers are derived from
   the canonical model — neither is tuned. */
function layoutCanonicalFrame() {
  const halfR = leafR.parentElement.getBoundingClientRect();
  const board = (typeof cover !== 'undefined' && cover) ? cover.getBoundingClientRect() : null;
  const fbEl = frontboardEl;
  const fb = fbEl ? fbEl.getBoundingClientRect() : null;
  const halfL = leafL ? leafL.parentElement.getBoundingClientRect() : null;

  let avail = board ? board.right - halfR.right : 8;
  if (fb && halfL && halfL.width) avail = Math.min(avail, halfL.left - fb.left);
  const fore = Math.max(0, avail - SAFE_PX);

  /* frame width so that the deepest canonical sheet paints at half + fore */
  const halfW = halfR.width || 1;
  const frameW = (halfW + fore) / Math.max(0.01, M2_MAX_REACH);
  /* the leaf must not overhang the top canonical sheet */
  const shrink = Math.max(0, halfW - frameW * M2_TOP_REACH);

  const el = book;
  el.style.setProperty('--papershrinkx', shrink.toFixed(2) + 'px');
  el.style.setProperty('--papershrinky', '0px');     // approved flush bottom
  for (const s of [stackL, stackR]) {
    s.style.setProperty('--m2fore', fore.toFixed(2) + 'px');
    const f = s.querySelector('.m2frame');
    if (!f) continue;
    /* bottom: the block's deepest bottom edge sits on the leaf's bottom line */
    f.style.bottom = (-(halfR.height * (1 / Math.max(0.01, M2_MAX_REACH_Y) - 1))).toFixed(2) + 'px';
    /* SPINE REGISTRATION. Canonical sheets carry a little binding slop, so a
       few of them start marginally left of the gutter. That is real paper
       behaviour and must not be edited out of the model — instead the whole
       frame is nudged inward by the worst overhang, which moves the block
       without touching one sheet's geometry. */
    f.style.left = '0px';
    const base = s.getBoundingClientRect();
    let over = 0;
    for (const k of f.querySelectorAll('.m2sheet[data-stratum]')) {
      const r = k.getBoundingClientRect();
      if (r.width) over = Math.min(over, (s === stackL ? base.right - r.right : r.left - base.left));
    }
    if (over < 0) f.style.left = (-over).toFixed(2) + 'px';
  }

}

function buildStacks() {
  if (!STACK_BUILT) {
    const strata = buildCanonicalBlock(stackR);
    buildCanonicalBlock(stackL);
    /* reach facts, read straight off the canonical model */
    M2_TOP_REACH = +strata[0].dataset.reachX || 1;
    M2_MAX_REACH = Math.max(...strata.map(s => +s.dataset.reachX || 0));
    M2_MAX_REACH_Y = Math.max(...strata.map(s => +s.dataset.reachY || 0));
    STACK_BUILT = true;
    stacksKey = null;
  }
  layoutCanonicalFrame();
  if (false)
    requestAnimationFrame(() => assertStackContainment());
}

/* ---- containment assertion (debug only) --------------------------------
   The element box may reach past the board on purpose: the clip polygon only
   REMOVES material, so what matters is the painted extent. */
function assertStackContainment() {
  const fb = frontboardEl;
  if (!cover || !fb) return;
  let worst = Infinity, fails = 0;
  for (const [el, mirrored, board] of [
    [stackR, false, cover.getBoundingClientRect()],
    [stackL, true, fb.getBoundingClientRect()],
  ]) {
    for (const k of el.querySelectorAll('.m2sheet[data-stratum]')) {
      const r = k.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const mx = (+k.dataset.mx || 100) / 100, my = (+k.dataset.my || 100) / 100;
      const painted = {
        left: mirrored ? r.right - r.width * mx : r.left,
        right: mirrored ? r.right : r.left + r.width * mx,
        top: r.top,
        bottom: r.top + r.height * my,
      };
      const clear = {
        left: painted.left - board.left,
        right: board.right - painted.right - SAFE_PX,
        top: painted.top - board.top,
        bottom: board.bottom - painted.bottom - SAFE_PX,
      };
      for (const edge of ['left', 'right', 'top', 'bottom']) {
        worst = Math.min(worst, clear[edge]);
        if (clear[edge] < -0.05) {
          fails++;
          console.warn(`STACK CONTAINMENT FAILURE\nsheet: ${k.dataset.stratum}${mirrored ? ' (left)' : ''}\nedge: ${edge}\noverflow: ${(-clear[edge]).toFixed(2)}px`);
        }
      }
    }
  }
  console.log(`[stack] canonical M2 · ${STRATA} strata · seed 5100 · containment ${fails ? fails + ' FAILURES' : 'OK'} · min clearance ${worst.toFixed(2)}px`);
}



function visualTurned() {
  if (turning && turning.kind === 'paper') return turning.sheet + turning.p;
  return turned;
}
/* --openx: how much of the left half the swinging cover currently covers.
   This is MEASURED, not guessed. The old model assumed a rigid board
   (max(0,-cos(p*PI)) with a hand-tuned ^1.25 fudge for the curl). The painted
   object is a curled, perspective-projected mesh, so near the end of the swing
   the rigid prediction ran ahead of the real edge and a thin outer-left band
   was un-clipped in the DOM before the mesh reached it — the brief sliver of
   the surface beneath, visible for a frame or two as the book opens.

   coverFreeEdgeScreenX() projects the mesh's actual free edge through the same
   bend, hinge rotation, model position, camera and cached canvas rectangle GL
   uses. Converting that screen X into a reveal fraction makes the DOM clip
   track the painted edge by construction. REVEAL_LAG_PX keeps the DOM a hair
   behind the mesh so it can only ever trail, never lead. Endpoints stay exact.
   Uses only cached geometry — no per-frame layout reads. */
const REVEAL_LAG_PX = 1;
const tracePoint = new THREE.Vector3();
function coverFreeEdgeScreenX() {
  if (!geom || !geom.canvasRect) return NaN;
  const bend = uniforms.uBend.value;
  let x = GAP + PW, z = 0;
  if (bend > 0.001) {
    const radius = PW / bend;
    x = GAP + radius * Math.sin(bend);
    z = radius * (1 - Math.cos(bend));
  }
  const angle = -uniforms.uT.value * Math.PI;
  const qx = x * Math.cos(angle) + z * Math.sin(angle);
  const qz = -x * Math.sin(angle) + z * Math.cos(angle);
  tracePoint.set(qx + mesh.position.x, mesh.position.y, qz).project(camera);
  return geom.canvasRect.left + (tracePoint.x + 1) * geom.canvasRect.width / 2;
}
function measuredOpenX(p) {
  if (!geom || !geom.coverOpenRect) return NaN;
  const span = geom.hingeX - geom.coverOpenRect.left;   // full left reveal width
  if (!(span > 0)) return NaN;
  const edgeX = coverFreeEdgeScreenX();
  if (!isFinite(edgeX)) return NaN;
  return Math.max(0, Math.min(1, (geom.hingeX - edgeX - REVEAL_LAG_PX) / span));
}
/* PERF: --openx is non-inheriting (see @property in the stylesheet), so it is
   written to each consumer rather than to the shared .book ancestor. Six
   single-element style invalidations replace one subtree-wide recalculation.
   .deskshadow additionally receives --deskx: the same reveal expressed as a
   scaleX about its right edge, so the large blurred desk slab moves on the
   compositor instead of re-laying-out and repainting every frame. */
const OPENX_ELS = [];
let lastOpenX = 0;
function openxTargets() {
  if (!OPENX_ELS.length) {
    for (const el of [deskshadowEl, frontboardEl, openCoverEl, spreadEl, hingeshadeEl, creaseEl])
      if (el) OPENX_ELS.push(el);
  }
  return OPENX_ELS;
}
function setOpenX(open) {
  lastOpenX = open;
  const v = open.toFixed(4);
  const els = openxTargets();
  for (let i = 0; i < els.length; i++) els[i].style.setProperty('--openx', v);
  /* full slab width = book width + 2 * boardout; the closed slab started half
     a book width in from the left, so the equivalent scale about the right
     edge is (W - (1 - open) * bookW / 2) / W. */
  if (deskshadowEl && geom && geom.bookW) {
    const W = geom.bookW + 2 * BOARD_OUT_PX;
    deskshadowEl.style.setProperty(
      '--deskx', ((W - (1 - open) * geom.bookW / 2) / W).toFixed(5));
  }
}

/* The back board's swing is the front cover's motion mirrored in time: the
   book stays open (--openx pinned at 1) and instead the RIGHT side of the desk
   shadow retracts as the board leaves it. Same |cos| projection, same
   compositor treatment, one extra custom property. */
function setDeskBack(cover) {
  if (!deskshadowEl || !geom || !geom.bookW) return;
  const W = geom.bookW + 2 * BOARD_OUT_PX;
  deskshadowEl.style.setProperty(
    '--deskb', ((W - cover * geom.bookW / 2) / W).toFixed(5));
}

function updateChrome() {
  const _t0 = pnow();
  let open;
  if (turning && turning.kind === 'cover' && turning.back) {
    /* A back-cover turn never re-clips the opened front half. */
    open = 1;
    setDeskBack(Math.max(0, Math.min(1, turning.p)));
  } else if (state === CLOSED_BACK) {
    open = 1;
    setDeskBack(1);
  } else if (turning && turning.kind === 'cover') {
    const t = turning;
    const p = Math.max(0, Math.min(1, t.p));
    if (p <= 0) open = 0;
    else if (p >= 1) open = 1;
    else {
      /* PERF (#4): the projected-edge measurement is the exact reveal, but on
         a low tier the analytic curve it approximates is within a pixel and
         costs no measurement at all. Desktop keeps the measured path. */
      const m = PROF.analyticOpenX ? NaN : measuredOpenX(p);
      open = isFinite(m) ? m : Math.pow(Math.max(0, -Math.cos(p * Math.PI)), 1.25);
    }
    /* Monotonic in the direction of travel. The projected edge swings a hair
       PAST the resting open rectangle around p ~ .85 and comes back, so a raw
       reading would re-clip the outermost pixel column at the very end of the
       opening — exactly the one-frame sliver at the outer left. Opening can
       only reveal, closing can only cover. */
    if (!t.dragging) {
      if (t.dir === 1) open = t.revealSeen = Math.max(t.revealSeen || 0, open);
      else open = t.revealSeen = Math.min(t.revealSeen == null ? 1 : t.revealSeen, open);
    }
  } else {
    open = state === CLOSED_FRONT ? 0 : 1;
  }
  const _t1 = pnow();
  if (!M_NOOPENX) setOpenX(open);
  const _t2 = pnow();
  updateCoverShadow();
  if (PERF_ON) {
    PSECT.openx.push(_t2 - _t1);
    PSECT.chrome.push(_t1 - _t0);
  }

}



/* ---------- the resting open cover IS the WebGL cover at p = 1 ----------
   Not a second interpretation of it. There is ONE physical rectangle and ONE
   hinge, and both renderers derive from the same cached structure:

     hingeX          = world.hingeX   (centre of the gutter — the axis the
                                       mesh actually rotates about, see
                                       configureMesh/resize)
     openCover.left  = 2 * hingeX - cover.right
     openCover.right = 2 * hingeX - cover.left
     top / height    = the cover's own

   The previous implementation mirrored about cover.left instead of the hinge.
   With a 10px gutter the cover's bound edge is not the hinge, so the resting
   DOM box was displaced by twice that error — the "inside cover shift" seen
   at settle (opening) and at acquisition (closing).

   This rectangle is a property of the LAYOUT, not of the animation: it is
   measured once and cached (boot / resize / any real geometry change) so no
   animation frame ever forces a layout read-write-read cycle. */
let geom = null;              // cached layout geometry, see measureLayout()
const BOARD_OUT_PX = 1.5;     // must match .book { --boardout }

function measureLayout(cachedCoverRect, cachedCanvasRect) {
  const cr = cachedCoverRect || cover.getBoundingClientRect();
  const br = book.getBoundingClientRect();
  const sr = spreadEl ? spreadEl.getBoundingClientRect() : null;
  const xr = cachedCanvasRect || canvas.getBoundingClientRect();
  if (!cr.width || !br.width || !sr || !sr.width) return null;
  const hingeX = world.hingeX;
  // reflection of the closed cover about the true hinge, in viewport space
  const openLeftViewport = 2 * hingeX - (cr.left + cr.width);
  geom = {
    coverW: cr.width, coverH: cr.height,
    hingeX,
    /* Complete viewport-space rectangles are cached on layout/resize. Cover
       acquisition must never force a getBoundingClientRect() on click. */
    coverRect: { left: cr.left, top: cr.top, width: cr.width, height: cr.height },
    coverOpenRect: { left: openLeftViewport, top: cr.top, width: cr.width, height: cr.height },
    canvasRect: { left: xr.left, top: xr.top, width: xr.width, height: xr.height },
    // book-relative (for .opencover) and spread-relative (for the shadows)
    openLeft: openLeftViewport - br.left,
    coverLeft: cr.left - br.left,
    openTop:  cr.top - br.top,
    spineX: cr.left - sr.left,
    shadowTop: cr.top - sr.top,
    bookW: br.width,
  };
  layoutOpenCover();
  layoutCoverShadow();
  return geom;
}


function layoutOpenCover() {
  if (!openCoverEl || !geom) return;
  openCoverEl.style.left   = geom.openLeft.toFixed(2) + 'px';
  openCoverEl.style.top    = geom.openTop.toFixed(2) + 'px';
  openCoverEl.style.width  = geom.coverW.toFixed(2) + 'px';
  openCoverEl.style.height = geom.coverH.toFixed(2) + 'px';
  /* The two faces of the back board occupy exactly the two cover rectangles:
     the pastedown the closed-cover box on the right, the shut back board its
     mirror on the left. Same boxes as the mesh at p = 0 and p = 1. */
  if (insideBackEl) {
    insideBackEl.style.left   = geom.coverLeft.toFixed(2) + 'px';
    insideBackEl.style.top    = geom.openTop.toFixed(2) + 'px';
    insideBackEl.style.width  = geom.coverW.toFixed(2) + 'px';
    insideBackEl.style.height = geom.coverH.toFixed(2) + 'px';
  }
  if (backClosedEl) {
    backClosedEl.style.left   = geom.openLeft.toFixed(2) + 'px';
    backClosedEl.style.top    = geom.openTop.toFixed(2) + 'px';
    backClosedEl.style.width  = geom.coverW.toFixed(2) + 'px';
    backClosedEl.style.height = geom.coverH.toFixed(2) + 'px';
  }
}


/* PERF: everything about the cover-shadow layers that depends only on LAYOUT
   is written here, once, on boot/resize — never on an animation frame. The
   per-frame path is left with transforms and opacities. */
function layoutCoverShadow() {
  if (!geom || !coveredge) return;
  const g = geom;
  coveredge.style.left   = g.spineX + 'px';
  coveredge.style.top    = g.shadowTop + 'px';
  coveredge.style.width  = '0px';
  coveredge.style.height = g.coverH + 'px';
  if (coverseam) {
    coverseam.style.left   = g.spineX + 'px';
    coverseam.style.top    = g.shadowTop + 'px';
    coverseam.style.width  = '3px';
    coverseam.style.height = g.coverH + 'px';
  }
  if (covercast) {
    covercast.style.left   = g.spineX + 'px';
    covercast.style.top    = g.shadowTop + 'px';
    covercast.style.width  = g.coverW + 'px';
    covercast.style.height = g.coverH + 'px';
    covercast.style.borderRadius = '3px 9px 9px 3px';
    covercast.style.transformOrigin = '0% 50%';
    covercast.style.filter = M_STATICBLUR ? 'blur(18px)' : 'blur(22px)';
  }
}

/* ---------- the one cover shadow ----------
   p = 0 closed on the right, .5 vertical, 1 laid open on the left. The board
   is rigid, so its projected width on the desk is |cos(p*PI)| of its true
   width and its lift is sin(p*PI): both are continuous through the whole
   swing and identical whichever renderer happens to own the material on that
   frame. Nothing here reads a state class, so settle() cannot change it. */
let shadowHold = null;        // dev-only: freeze the shadow at a fixed p

function coverProgress() {
  if (turning && turning.kind === 'cover') return Math.max(0, Math.min(1, turning.p));
  return state === CLOSED_FRONT ? 0 : 1;
}

let edgeZ = null;
let edgeVis = 0, castSide = 0;
function updateCoverShadow() {
  if (!covercast) return;
  if (!geom && !measureLayout()) return;
  const _s0 = pnow();
  const g = geom;

  const p    = shadowHold != null ? shadowHold : coverProgress();
  const c    = Math.cos(p * Math.PI);                //  1 -> -1
  const a    = Math.abs(c);                          //  projected width factor
  const lift = Math.sin(p * Math.PI);                //  0 at both endpoints
  const sign = c >= 0 ? 1 : -1;                      //  which side of the spine

  const w = Math.max(1, g.coverW * a);
  const x = sign > 0 ? g.spineX : g.spineX - w;
  const y = g.shadowTop;

  // cast shadow: tight contact at both ends, soft and offset while raised
  if (M_NOCAST) { covercast.style.display = 'none'; } else {
  /* PERF: the cast slab used to change left, width, height, border-radius AND
     its blur radius every frame. A ~1500px-wide element with a re-specified
     blur kernel is re-rasterised from scratch on every one of those frames.
     Now its paint is frozen at layout time (full cover rect at the spine,
     one fixed blur) and the projection is a compositor transform: scaleX by
     the same |cos| factor about the spine, negative past vertical so the slab
     mirrors to the other side — which also mirrors the rounded corners, as
     the old border-radius swap did by hand. Because the slab is scaled, its
     penumbra compresses horizontally as the board foreshortens, which is what
     the animated radius was approximating anyway; the opacity curve, offsets
     and both endpoints (where the cast fades to nothing) are untouched. */
  covercast.style.transform =
    `translate(${(-sign * lift * 9).toFixed(2)}px, ${(2 + lift * 15).toFixed(2)}px) ` +
    `scaleX(${(sign * Math.max(a, 0.0008)).toFixed(5)})`;
  /* A board lying flat casts no separated shadow — only contact. So the cast
     fades out completely at BOTH endpoints; if it survived at p=1 it painted
     a dark slab over the open pastedown that the WebGL frame never had, which
     is exactly the flip seen on settle. Contact darkening at rest belongs to
     the materials, not to this layer. */
  covercast.style.opacity = (Math.pow(lift, 0.6) * 0.58).toFixed(3);
  }

  /* Board thickness — same projection, but expressed as compositor transforms
     on two persistent, never-repainted 6px bands instead of a three-part
     box-shadow string rebuilt on a cover-sized, cover-repositioned box.
     The old shadows were hard-edged copies at +3/-1, +6/-2, +9/-3, i.e. three
     2px-wide strips starting at the board's outer edge and inset 1px top and
     bottom: exactly what the bands paint. Scaling by `a` reproduces the
     thickness rotating out of view; translating by coverW * a keeps them
     pinned to the projected outer edge, mirrored past vertical. */
  if (M_NOEDGE) { if (edgeVis !== 0) { edgeVis = 0; coveredge.style.display = 'none'; } } else {
    const px = (g.coverW * a).toFixed(2);
    if (sign > 0) {
      edgebandR.style.transform = `translateX(${px}px) scaleX(${a.toFixed(4)})`;
      if (edgeVis !== 1) { edgeVis = 1; edgebandR.style.opacity = '1'; edgebandL.style.opacity = '0'; }
    } else {
      edgebandL.style.transform = `translateX(${-px}px) scaleX(${a.toFixed(4)})`;
      if (edgeVis !== -1) { edgeVis = -1; edgebandL.style.opacity = '1'; edgebandR.style.opacity = '0'; }
    }
  }

  /* bound-edge seam backing: only while the board is still over the page
     block (sign > 0) and still wide enough that the mesh covers the strip
     entirely. It fades out as the board approaches vertical, where there is
     no longer any mesh rim sitting over paper. Its box is static (see
     layoutCoverShadow); only the opacity moves. */
  if (coverseam) {
    coverseam.style.opacity =
      (sign > 0 ? Math.max(0, Math.min(1, (w - 10) / 24)) : 0).toFixed(3);
  }

  /* WHICH SIDE OF THE SPINE THE BOARD IS ON DECIDES WHAT IT IS UNDER.
     p < .5 : the board is still over the page block on the right — its
              thickness is the nearest thing to the eye (z 3).
     p > .5 : it has crossed the spine and become the structural surface the
              left-hand pages lie ON. Every sheet flipped left is above it, so
              its edge drops below .blockedge / .stack / .leaf (z 0).
     The switch happens at p = .5 where a = |cos(pi/2)| = 0: the edge is
     collapsed exactly edge-on, so the change of order is invisible. */
  const z = sign > 0 ? 3 : 0;
  if (z !== edgeZ) { edgeZ = z; coveredge.style.zIndex = String(z); }
  if (PERF_ON) PSECT.shadow.push(pnow() - _s0);
}



/* Paper transfer. During a COVER turn `turned` does not change, so the whole
   block geometry is already correct and rewriting 32 strata every frame is
   pure waste — applyPose() calls updateChrome() alone in that case. */
let stacksKey = null;
const HIDE_EMPTY_STRATA = PROF.tier !== 'desktop';
function updateStacks(force) {
  updateChrome();
  if (!STACK_BUILT) return;

  const vt = Math.max(0, Math.min(SHEETS, visualTurned()));
  const key = vt.toFixed(4);
  if (!force && key === stacksKey) return;
  stacksKey = key;

  /* PAGINATION, NOT DEFORMATION. The 26 canonical strata are distributed
     between the two halves according to how many interactive sheets have
     transferred. A stratum is handed over top-of-the-block first (depth 0 is
     the sheet nearest the reader), and the only property written is opacity:
     no canonical width, height, clip or transform is ever touched. */
  const moved = (vt / SHEETS) * STRATA;         // continuous: 0 .. 26
  for (const [el, left] of [[stackL, true], [stackR, false]]) {
    for (const k of el.querySelectorAll('.m2sheet[data-depth]')) {
      const d = +k.dataset.depth;
      /* left owns the strata already handed over (depth < moved); right owns
         the rest. The single boundary stratum crossfades, so the block grows
         and depletes continuously instead of switching on as a slab. */
      const a = left ? moved - d : d + 1 - moved;
      const v = (a <= 0 ? 0 : a >= 1 ? 1 : a).toFixed(3);
      /* PERF (#5): STACK COST. At any instant at most one stratum per side is
         mid-crossfade; the other 25 are already 0 or 1. Writing all 52 every
         frame is 52 style invalidations for two visible changes, and the zero
         ones stay in the compositor's layer list for free. So: memoise the
         last written value, and on a reduced tier take fully-transparent
         strata out of the paint tree entirely (display:none) instead of
         compositing 26 invisible clipped layers per side. */
      if (k.__nbOp === v) continue;
      k.__nbOp = v;
      k.style.opacity = v;
      if (HIDE_EMPTY_STRATA) k.style.display = v === '0.000' ? 'none' : '';
    }
  }
}





/* ======================================================================
   TEXTURES — rasterise the real rendered leaf, never re-draw it
   ----------------------------------------------------------------------
   Method: deep-clone the live leaf element, inline the *computed* style of
   every node (so every %, em, vw, clamp() and inherited value is already
   resolved to px by the same engine that laid out the DOM), wrap it in an
   SVG <foreignObject>, and decode that SVG as an image. One visual source of
   truth: no canvas re-implementation of any page element.

   Why a computed-style clone rather than shipping base.css into the SVG:
   the stylesheet uses clamp(..,3.2vw,..), and inside a foreignObject `vw`
   resolves against the SVG viewport, not the window — the type would silently
   shift. Resolving to px first removes that whole class of drift.

   Limitations (documented, all acceptable here):
   - Text anti-aliasing in an SVG image is grayscale, while live DOM text may
     use subpixel LCD AA. Sub-pixel colour fringing differs; glyph positions,
     metrics and wrapping are identical.
   - External resources (webfonts, <img src>) must be inlined as data URLs to
     be painted; system fonts (as used here) are fine.
   - Rasterisation is async, so textures are prepared up-front and on resize;
     the turn controls stay disabled for the first ~100ms after layout.
   - Firefox needs explicit width/height on the foreignObject child (we set it).
   ==================================================================== */
const SNAP_PROPS = [
  'display','position','top','right','bottom','left','float','clear','z-index',
  'box-sizing','width','height','min-width','min-height','max-width','max-height','aspect-ratio',
  'margin-top','margin-right','margin-bottom','margin-left',
  'padding-top','padding-right','padding-bottom','padding-left',
  'border-top-width','border-right-width','border-bottom-width','border-left-width',
  'border-top-style','border-right-style','border-bottom-style','border-left-style',
  'border-top-color','border-right-color','border-bottom-color','border-left-color',
  'border-top-left-radius','border-top-right-radius','border-bottom-right-radius','border-bottom-left-radius',
  'background-color','background-image','background-size','background-position','background-repeat','background-clip','background-origin',
  'color','opacity','mix-blend-mode','filter','box-shadow','text-shadow',
  'font-family','font-size','font-style','font-weight','font-variant','font-stretch',
  'line-height','letter-spacing','word-spacing','text-align','text-indent','text-transform',
  'text-decoration-line','text-decoration-color','text-decoration-style',
  'white-space','word-break','overflow-wrap','hyphens','direction','writing-mode','unicode-bidi',
  'overflow-x','overflow-y','vertical-align','list-style-type','list-style-position',
  'flex-direction','flex-wrap','align-items','justify-content','gap','transform','transform-origin',
];

function inlineComputed(srcRoot) {
  const clone = srcRoot.cloneNode(true);
  const srcs = [srcRoot, ...srcRoot.querySelectorAll('*')];
  const dsts = [clone, ...clone.querySelectorAll('*')];
  for (let i = 0; i < srcs.length; i++) {
    const cs = getComputedStyle(srcs[i]);
    let css = '';
    for (const prop of SNAP_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v !== '' && v !== 'auto' && v !== 'normal' && v !== 'none' && v !== 'currentcolor') css += `${prop}:${v};`;
      else if (v === 'none' && (prop === 'text-decoration-line' || prop === 'list-style-type')) css += `${prop}:none;`;
    }
    dsts[i].setAttribute('style', css);
    dsts[i].removeAttribute('class');
  }
  return clone;
}

function snapshotEl(el, w, h, dpr) {
  // stunt double: exact same classes, exact same box, so layout is identical.
  // CRITICAL: the *containing block* must also match the live one — % padding
  // (.leaf uses `padding: 6% 7%`) resolves against the containing block width,
  // not the element's own width, so a shrink-to-fit host silently strips the
  // page margins and reflows the copy. That was the "padding shift" on handoff.
  const host = el.parentElement;
  host.style.position = 'relative';
  host.style.width = w + 'px';
  host.style.height = h + 'px';
  el.style.position = 'absolute';
  el.style.inset = 'auto';
  el.style.left = '0px'; el.style.top = '0px';
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  void el.offsetWidth;                                        // force layout



  const clone = inlineComputed(el);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const inner = new XMLSerializer().serializeToString(clone);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * dpr)}" height="${Math.round(h * dpr)}" viewBox="0 0 ${w} ${h}">` +
    `<foreignObject x="0" y="0" width="${w}" height="${h}">${inner}</foreignObject></svg>`;

  return new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function snapshotLeaf(page, idx, w, h, dpr) {
  snapLeaf.innerHTML = pageHTML(page, idx);
  // Rasterise each page in the orientation it RESTS in: odd pages sit on the
  // left half, so their spine lift and their hand-cut corners are mirrored.
  // The mesh presents a raster un-mirrored on screen at both ends of the turn
  // (the sampler's U-flip only compensates for the 180 degree swing), so the
  // raster must already look like the DOM page it hands over to.
  const left = idx % 2 === 1;
  snapLeaf.classList.toggle('facing-left', left);
  // identical wear stack to the resting leaf: same page index, same hashes,
  // same damage child nodes — one code path, so nothing can drift
  dressLeaf(snapLeaf, idx);

  const rr = sheetRadii(sheetOf(idx));
  snapLeaf.style.borderRadius = cssR(left ? mirrorR(rr) : rr);
  return snapshotEl(snapLeaf, w, h, dpr);
}

function toTexture(img, w, h, dpr) {
  const c = doc.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  // no colour transform anywhere in this pipeline: the texture already holds
  // final sRGB bytes, so sampling and writing them raw makes the mesh at rest
  // byte-identical to the DOM pixels it replaces
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  return t;
}

let texes = [], coverTex = [], texKey = '', texReady = false, buildSeq = 0;
/* ---------- RESIDENT TEXTURE WINDOW ------------------------------------
   The lab rasterised every page up front: 24 foreignObject decodes plus 24
   uploads before the notebook could be touched. That is the single largest
   cost on a phone and it is entirely avoidable, because at most three sheets
   can ever be bound in the near future.

   texes[] keeps the same page-indexed shape the preserved code binds against
   (texes[sheet*2], texes[sheet*2+1]); entries outside the resident window are
   simply absent and are (re)built on demand, always ahead of the turn that
   needs them. residentSheets = Infinity restores the exact lab behaviour, so
   desktop is unchanged. */
let texBuild = new Map();                 // page index -> in-flight promise
let texW = 0, texH = 0, texDpr = 1;

const sheetWindow = (centre) => {
  const n = PROF.residentSheets;
  if (!isFinite(n)) return null;                        // desktop: everything
  const half = Math.max(0, Math.floor((n - 1) / 2));
  const lo = Math.max(0, centre - half);
  const hi = Math.min(SHEETS - 1, lo + n - 1);
  return { lo: Math.max(0, hi - n + 1), hi };
};

function buildPageTexture(i) {
  if (texes[i] || texBuild.has(i)) return texBuild.get(i) || Promise.resolve();
  const seq = buildSeq, w = texW, h = texH, dpr = texDpr;
  const p = (async () => {
    const img = await pageImage(i, w, h, dpr);
    if (seq !== buildSeq || disposed) return;             // superseded by a resize
    texes[i] = toTexture(img, w, h, dpr);
    if (turning) bindFaces(turning);
  })().finally(() => texBuild.delete(i));
  texBuild.set(i, p);
  return p;
}

/** keep the window around `centre` resident; drop everything else */
function prefetchAround(centre) {
  const win = sheetWindow(centre);
  if (!win) return;
  for (let s = win.lo; s <= win.hi; s++) {
    buildPageTexture(s * 2); buildPageTexture(s * 2 + 1);
  }
  for (let i = 0; i < texes.length; i++) {
    const s = i >> 1;
    if (texes[i] && (s < win.lo || s > win.hi)) { texes[i].dispose(); texes[i] = null; }
  }
}
const sheetResident = s => !!(texes[s * 2] && texes[s * 2 + 1]);

/* ---------- BAKED TEXTURES (#1) ----------------------------------------
   The foreignObject -> SVG -> decode path is the single most expensive thing
   the notebook does on a phone: it serialises a cloned subtree with every
   computed style inlined, then asks the image decoder to lay out and paint
   HTML. It produces the same pixels every time for a given page and size, so
   on mobile it should not happen on the device at all.

   `options.baked` supplies pre-rendered images (see tools/bake-textures.mjs,
   which drives THIS engine's bake() through Playwright, so the baked pixels
   are by construction the pipeline's own output). When an entry exists it is
   decoded and uploaded directly; anything missing silently falls back to live
   rasterisation, so a stale or partial manifest can never break a page. */
const BAKED = options.baked || null;
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    if (!/^data:/.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
const bakedPage  = i => (BAKED && BAKED.pages  && BAKED.pages[i])  || null;
const bakedCover = i => (BAKED && BAKED.covers && BAKED.covers[i]) || null;
/** baked-or-live page raster; identical output either way */
function pageImage(i, w, h, dpr) {
  const b = bakedPage(i);
  return b ? loadImage(b).catch(() => snapshotLeaf(pages[i], i, w, h, dpr))
           : snapshotLeaf(pages[i], i, w, h, dpr);
}

async function buildTextures() {
  /* CSS-ONLY (#9): nothing samples a texture, so nothing is rasterised. This
     is why the fallback is not just a graceful degradation but the cheapest
     path in the project: zero foreignObject decodes, zero GPU uploads. */
  if (CSS_ONLY) { texReady = true; paintDOM(); return; }
  const r = leafR.getBoundingClientRect();
  const cr = cover.getBoundingClientRect();
  if (!r.width) return;
  const dpr = Math.min(devicePixelRatio, PROF.texDpr);
  const w = r.width, h = r.height;

  const key = `${w.toFixed(2)}x${h.toFixed(2)}x${cr.width.toFixed(2)}@${dpr}`;
  if (key === texKey) return;
  texKey = key;
  const seq = ++buildSeq;
  texW = w; texH = h; texDpr = dpr;

  /* Only the sheets that can be bound soon are rasterised before the notebook
     becomes interactive; the rest follow (desktop) or never (mobile window). */
  const win = sheetWindow(turned);
  const first = win ? win.lo : 0;
  const last = win ? win.hi : SHEETS - 1;
  const next = [];
  for (let s = first; s <= last; s++) {
    for (const i of [s * 2, s * 2 + 1]) {
      const img = await pageImage(i, w, h, dpr);
      if (seq !== buildSeq) return;                         // superseded by a resize
      next[i] = toTexture(img, w, h, dpr);
    }
  }
  // the front cover uses the identical pipeline — same source of truth,
  // just a different DOM element and a stiffer material profile
  const nextCover = [];
  if (cr.width) {
    /* [0] front cover outer, [1] its pastedown, [2] the back board's outer
       face — the back turn reuses [1] as its front face (the pastedown is one
       material, painted once) and [2] as its back face. */
    const coverEls = [snapCover, snapCoverBack, snapBackBoard, snapCoverBackPhoto].filter(Boolean);
    for (let ci = 0; ci < coverEls.length; ci++) {
      const el = coverEls[ci], bc = bakedCover(ci);
      const img = bc ? await loadImage(bc).catch(() => snapshotEl(el, cr.width, cr.height, dpr))
                     : await snapshotEl(el, cr.width, cr.height, dpr);
      if (seq !== buildSeq) return;
      nextCover.push(toTexture(img, cr.width, cr.height, dpr));
    }
  }
  // swap only once the whole set is ready — never show a half-built set
  const old = texes.filter(Boolean).concat(coverTex);
  texes = next; coverTex = nextCover;
  old.forEach(t => t.dispose());
  texReady = true;
  if (turning) bindFaces(turning);
  paintDOM();
  warmGPU();
  /* the remaining sheets (desktop) are filled in after first interactivity,
     one per idle slot, so they never block the opening */
  if (!win) {
    const idle = (typeof requestIdleCallback === 'function')
      ? requestIdleCallback : (fn => setTimeout(fn, 32));
    let i = 0;
    const pump = () => {
      if (disposed || seq !== buildSeq) return;
      while (i < pages.length && texes[i]) i++;
      if (i >= pages.length) return;
      buildPageTexture(i).then(() => idle(pump));
    };
    idle(pump);
  }
}


/* ======================================================================
   SCENE — world units are CSS pixels
   ----------------------------------------------------------------------
   Camera choice: PERSPECTIVE, but calibrated so the z = 0 plane maps exactly
   1:1 to CSS pixels (fov derived from camera distance and canvas height).
   Reasoning:
   - Orthographic guarantees the 1:1 match at rest but the curl reads as a
     flat, "cardboard" fold: the lifted half never foreshortens, which is what
     made the mid-turn page look like a different scale from the resting page.
   - A perspective camera foreshortens the lifted half naturally. The risk is
     a scale jump on handoff — that is removed by pinning the paper's rest
     pose to z = 0 and calibrating the frustum to the pixel grid, so at
     p = 0 and p = 1 the mesh is *mathematically* the DOM rectangle.
   - Distance is deliberately long (2.6x stage height ≈ 21° fov): enough
     depth cue for the curl, little enough that the small z excursions of the
     paper cannot read as a size change.
   ==================================================================== */
/* (the canvas is the root-scoped ref built by markup.ts) */
/* Cap for the WebGL drawing buffer only. DOM owns sharpness at rest; WebGL
   owns motion, and a bending, foreshortened, shaded page does not need the
   same pixel density. Debug-selectable (1.0 / 1.25 / 1.5 / 2.0). */
let MAX_GL_DPR = PROF.glDpr;
/* ---------- CSS-ONLY ESCAPE HATCH (#9) ----------------------------------
   Some devices have no usable WebGL at all (old/locked-down browsers, blocked
   contexts, software rasterisers that would render at 3 fps). Rather than
   failing to mount, the engine drops to a pure-CSS book flip: no shader, no
   mesh, no rasterisation of any page — the resting DOM halves themselves are
   rotated about the spine in two 90-degree phases with the state committed at
   the vertical, which is the classic page-flip and costs one compositor
   animation per turn. Everything else (materials, stack, chrome, semantics)
   is the real thing, because all of it already lives in the DOM.

   Forced with `perf: { … }` + `fallback: 'css'`; otherwise only used when the
   context genuinely cannot be created. */
let CSS_ONLY = options.fallback === 'css';
let renderer: any = null;
if (!CSS_ONLY) {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: PROF.antialias,
      powerPreference: PROF.tier === 'desktop' ? 'default' : 'low-power',
    });
  } catch (err) {
    CSS_ONLY = true;
  }
}
if (CSS_ONLY) {
  root.classList.add('nb-css-only');
  canvas.style.display = 'none';
  renderer = {                       // inert stand-in: nothing below branches
    render() {}, setSize() {}, setPixelRatio() {}, dispose() {},
    domElement: canvas, getContext: () => null,
    setViewport() {}, setClearColor() {}, forceContextLoss() {},
    info: { memory: {}, render: {} },
  };
}
/* the CSS canvas box, cached by resize(); buffer density can then change
   mid-flight without another layout read */
let glCssW = 0, glCssH = 0, glDprNow = 0;
function applyGlDpr(d) {
  const px = Math.min(devicePixelRatio || 1, d);
  if (px === glDprNow || !glCssW) return;
  glDprNow = px;
  renderer.setPixelRatio(px);
  renderer.setSize(glCssW, glCssH, false);
}
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // see texture note below
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 1, 20000);

let PW = 100, PH = 100, GAP = 2;                              // page box in px
let geo = new THREE.PlaneGeometry(1, 1, 96, 6);

const uniforms = {
  uT:     { value: 0 },     // 0..1 turn progress
  uBend:  { value: 0 },     // curl amount, 0 at both ends
  uEnv:   { value: 0 },     // shading envelope, 0 at both ends -> texture as-is
  uX0:    { value: GAP },   // page inner edge, in local x
  uW:     { value: PW },
  uFront: { value: null },
  uBack:  { value: null },
  uSize:  { value: new THREE.Vector2(PW, PH) },
  // per-corner radii (tl, tr, br, bl) of THIS sheet, in the same right-facing
  // orientation as the front texture — keeps the GL silhouette identical to
  // the DOM leaf's deterministic hand-cut corners
  uRad4:  { value: new THREE.Vector4(3, 3, 3, 3) },
  // visible paper-edge thickness in CSS px; gated by uEnv so it is absent at
  // both ends of the turn and can never appear in a resting frame
  uThick: { value: 1.6 },

};

const mat = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  transparent: true,
  uniforms,
  vertexShader: `
    uniform float uT, uBend, uW, uX0;
    varying vec2 vUv; varying vec3 vNormal; varying float vCurve;
    void main() {
      vUv = uv;
      float s = position.x - uX0;                 // 0 at inner edge, uW at outer edge
      float u = clamp(s / uW, 0.0, 1.0);
      vec3 p = position;
      float phi = 0.0;
      if (uBend > 0.001) {
        float R = uW / uBend;                     // arc length preserved: no width loss
        phi = u * uBend;
        p.x = uX0 + R * sin(phi);
        p.z = R * (1.0 - cos(phi));
        // NOTE: no vertical taper. Any y-scaling here shows up as the page
        // resolving to the wrong height at the end of the turn.
      }
      float a = -uT * 3.14159265;                 // swing the sheet about the hinge (x = 0)
      float ca = cos(a), sa = sin(a);
      vec3 q = vec3(p.x * ca + p.z * sa, p.y, -p.x * sa + p.z * ca);
      vec3 tan_ = vec3(cos(phi), 0.0, sin(phi));
      vec3 tr = vec3(tan_.x * ca + tan_.z * sa, 0.0, -tan_.x * sa + tan_.z * ca);
      vNormal = normalize(cross(vec3(0.0, 1.0, 0.0), tr));
      vCurve = phi;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(q, 1.0);
    }`,
  fragmentShader: `
    precision highp float;
    uniform sampler2D uFront, uBack;
    uniform float uEnv, uThick;
    uniform vec4 uRad4;                       // tl, tr, br, bl
    uniform vec2 uSize;
    varying vec2 vUv; varying vec3 vNormal; varying float vCurve;

    // uv.y == 1 is the TOP of the texture (three flips canvas textures)
    float radiusAt(vec2 uv) {
      float top = step(0.5, uv.y), right = step(0.5, uv.x);
      float lft = mix(uRad4.w, uRad4.x, top);   // bl -> tl
      float rgt = mix(uRad4.z, uRad4.y, top);   // br -> tr
      return mix(lft, rgt, right);
    }
    // signed distance to the rounded-rect silhouette, in CSS px (negative inside)
    float silhouette(vec2 uv) {
      float r = radiusAt(uv);
      vec2 h = uSize * 0.5;
      vec2 d = abs((uv - 0.5) * uSize) - (h - r);
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
    }
    void main() {
      vec4 c = gl_FrontFacing ? texture2D(uFront, vUv)
                              : texture2D(uBack, vec2(1.0 - vUv.x, vUv.y));
      vec3 n = normalize(gl_FrontFacing ? vNormal : -vNormal);
      vec3 L = normalize(vec3(-0.25, 0.45, 1.0));
      float lit  = 0.74 + 0.26 * abs(dot(n, L));
      float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0) * 0.06;
      float ao   = 1.0 - 0.16 * smoothstep(0.0, 1.3, vCurve);
      // uEnv is 0 at p=0 and p=1 -> the sheet resolves to the resting paper
      // exactly, so the DOM swap cannot show a brightness step.
      float shade = mix(1.0, lit * ao, uEnv);

      // mesh UV is mirrored w.r.t. screen space at p=1, so evaluating the sheet's
      // own corner radii here yields the mirrored silhouette the left leaf shows
      float sd = silhouette(vUv);
      float a = 1.0 - smoothstep(-0.5, 0.5, sd);
      if (a <= 0.002) discard;

      vec3 rgb = c.rgb * shade + spec * uEnv;

      /* --- paper thickness ------------------------------------------------
         Not extruded geometry: a sub-2px shaded band hugging the silhouette,
         weighted by how edge-on the sheet is (n.z -> 0). Face-on it vanishes;
         at grazing angles it reads as the cut edge of a real sheet. Scaled by
         uEnv, so a resting page is exactly its texture. */
      float graze = 1.0 - abs(n.z);
      float band  = 1.0 - smoothstep(-uThick, -0.35, sd);   // 1 at the very rim
      float edge  = band * graze * uEnv;
      vec3 edgeCol = rgb * 0.66 + vec3(0.055, 0.045, 0.030);
      rgb = mix(rgb, edgeCol, clamp(edge, 0.0, 1.0) * 0.9);

      gl_FragColor = vec4(rgb, a);

    }`,
});
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

let world = { cx: 0, cy: 0, hingeX: 0 };

/* Fit the mesh to an arbitrary DOM rectangle (a leaf, or the front cover).
   The hinge always stays at the centre of the gutter, so a 180° swing maps
   the right-hand object exactly onto the left-hand one. */
/* Geometry is a property of the LAYOUT (paper rect, cover rect), not of the
   gesture. Allocating a 96x6 plane on the frame the user asks the cover to
   move used to cost a visible hitch, so both profiles are built once per
   layout and cached; switching profiles at interaction time is a pointer
   assignment plus a few uniform writes. */
const geoCache = new Map();
function planeFor(w, h, gap) {
  const key = w.toFixed(2) + 'x' + h.toFixed(2) + '@' + gap.toFixed(2);
  let g = geoCache.get(key);
  if (!g) {
    /* tessellation is a screen-space decision: the curl is low-frequency, so
       a phone gets PROF.segX columns instead of the desktop lab's 96 */
    g = new THREE.PlaneGeometry(w, h, PROF.segX, PROF.segY);
    g.translate(gap + w / 2, 0, 0);
    geoCache.set(key, g);
  }
  return g;
}
function configureMesh(rect, radii, thick) {
  PW = rect.width;
  PH = rect.height;
  GAP = rect.left - world.hingeX;
  geo = planeFor(PW, PH, GAP);
  mesh.geometry = geo;
  mesh.position.set(world.hingeX - world.cx, world.cy - (rect.top + PH / 2), 0);
  uniforms.uW.value = PW;
  uniforms.uX0.value = GAP;
  uniforms.uSize.value.set(PW, PH);
  const r = typeof radii === 'number' ? [radii, radii, radii, radii] : radii;
  uniforms.uRad4.value.set(r[0], r[1], r[2], r[3]);
  uniforms.uThick.value = thickness ? (thick == null ? 1.6 : thick) : 0;
}

/* the mesh silhouette for a paper turn is the SHEET's silhouette (shared by
   both of its pages), so p=0 matches the right leaf and p=1 the left one */
const meshRadiiForSheet = s => sheetRadii(s);


function resize() {
  const stageR = stage.getBoundingClientRect();
  const cvsR = canvas.getBoundingClientRect();
  const leafRect = leafR.getBoundingClientRect();
  if (!stageR.width || !leafRect.width) return;

  /* PERFORMANCE — the drawing buffer is decoupled from the CSS canvas box.
     The notebook is presented large on purpose, so at device DPR the moving
     page was shading several times more pixels per frame than before. The CSS
     canvas keeps its exact physical size (geometry, camera and DOM<->GL
     registration all derive from cvsR, never from the buffer); only the
     internal buffer density is capped, and the browser upscales it. The DOM
     resting state is untouched and stays full resolution. */
  /* MOBILE — the same decoupling, now also time-varying: the buffer density
     drops for the duration of a turn (resolution scaling) and is restored on
     the settle frame, so a phone pays the reduced fill cost exactly while the
     page is moving and can never resolve the difference. */
  glCssW = cvsR.width; glCssH = cvsR.height;
  applyGlDpr(turning ? PROF.motionDpr : MAX_GL_DPR);

  // 1 world unit == 1 CSS px on the z = 0 plane
  const dist = stageR.height * 2.6;
  camera.fov = 2 * Math.atan((cvsR.height / 2) / dist) * 180 / Math.PI;
  camera.aspect = cvsR.width / cvsR.height;
  camera.position.set(0, 0, dist);
  camera.near = dist * 0.05; camera.far = dist * 4;
  camera.updateProjectionMatrix();

  // world origin = canvas centre (which coincides with the stage centre)
  world.cx = cvsR.left + cvsR.width / 2;
  world.cy = cvsR.top + cvsR.height / 2;
  // Hinge sits at the centre of the gutter, not at the leaf edge.
  world.hingeX = (leafRect.left + leafL.getBoundingClientRect().right) / 2;

  // a new layout invalidates every cached plane and the cached rectangles
  for (const g of geoCache.values()) g.dispose();
  geoCache.clear();
  configureMesh(leafRect, meshRadiiForSheet(sheetOf(turned * 2)));
  // build the cover plane now too, so no turn ever allocates one
  const coverRect = cover.getBoundingClientRect();
  planeFor(coverRect.width, coverRect.height, coverRect.left - world.hingeX);

  measureLayout(coverRect, cvsR);

  buildTextures();
  reportAlign(leafRect, stageR);

}
on(window, 'resize', resize);


/* ======================================================================
   TURN STATE MACHINE
   One mesh, one gesture model, two MATERIAL PROFILES. A cover is not a
   second animation system: it is the same turn with a stiffer bend, a
   heavier shading envelope and its own source rectangle.
   ==================================================================== */
/* Easing is part of the material, not of the widget. Paper keeps its existing
   cubic motion. A cover must feel heavy WITHOUT remaining mathematically
   parked at either endpoint: this measured curve retains gentle endpoint
   velocity, adds middle momentum, and therefore produces visible free-edge
   displacement in the first two motion frames at 60 Hz. */
const easeInOutCubic = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const easeHeavyCover = k => k - 0.2 * Math.sin(2 * Math.PI * k) / (2 * Math.PI);
const MATERIAL = {
  paper: { bend: 1.15, env: 1.00, maxMs: 800,  curve: easeInOutCubic },
  cover: { bend: 0.34, env: 1.35, maxMs: 1150, curve: easeHeavyCover },
};
const MIN_MS = 160;




/* Upload every texture and compile the program while the canvas is still
   hidden. Without this the first cover turn stalls ~170 ms on its very first
   frame (geometry rebuild + first-ever texture upload), which ate the slow
   part of the easing curve and made the opening feel late and abrupt. */
let warmed = false;
let warmPending = 0;
function warmGPU() {

  if (warmed || !texReady) return;
  warmed = true;
  const f = uniforms.uFront.value, b = uniforms.uBack.value;
  for (const pair of [coverTex, coverTex.slice(1, 3), texes.slice(0, 2)]) {
    if (pair.length < 2) continue;
    uniforms.uFront.value = pair[0];
    uniforms.uBack.value = pair[1];
    renderer.render(scene, camera);      // canvas is not .active -> invisible
  }
  uniforms.uFront.value = f; uniforms.uBack.value = b;
  /* ...and composite once, empty. Rendering while hidden warms the GL side,
     but the first time the canvas is actually *shown* the browser still has
     to present its drawing buffer, and that presentation is what stalled the
     opening frame. Show an empty (fully transparent) frame at load instead. */
  mesh.visible = false;
  renderer.render(scene, camera);
  canvas.classList.add('active');
  /* The teardown of the warm-up is deferred by two frames, so a turn can begin
     inside that window (the cover is clickable the instant textures are
     ready). If it does, the turn now OWNS the canvas: tearing down here would
     hide the canvas and blank the mesh for a frame or two, and because the DOM
     cover is already hidden by .coverflight the page underneath bled through
     at the very start of the opening. reveal() cancels this callback; the
     callback also refuses to fire once a turn exists. */
  warmPending = requestAnimationFrame(() => {
    warmPending = requestAnimationFrame(() => {
      warmPending = 0;
      mesh.visible = true;
      if (turning) return;                 // a turn claimed the canvas
      canvas.classList.remove('active');
      renderer.render(scene, camera);
    });
  });

}
function bindFaces(t) {
  if (t.kind === 'cover') {
    /* The back board is the same board mesh with its two faces swapped for the
       back-board pair: pastedown facing the reader at p = 0, outer board
       revealed (and mirrored by the shader) as it comes over. */
    uniforms.uFront.value = t.back ? (coverTex[3] || coverTex[1]) : coverTex[0];
    uniforms.uBack.value  = t.back ? coverTex[2] : coverTex[1];
  } else {
    uniforms.uFront.value = texes[t.sheet * 2];
    uniforms.uBack.value = texes[t.sheet * 2 + 1];
  }
}
function reveal(t) {
  // the turn takes the canvas away from any pending warm-up teardown
  if (warmPending) { cancelAnimationFrame(warmPending); warmPending = 0; }
  /* resolution scaling starts here and is undone in settle() */
  applyGlDpr(PROF.motionDpr);
  lastActivity = performance.now();
  kick();
  /* Preparation is deliberately not presentation. Keep GL hidden while its
     exact resting pose is uploaded; frame() alone owns the acquire frame. */
  if (t.kind === 'cover') canvas.classList.remove('active');
  mesh.visible = true;
  root.classList.add('turning');
  turning = t;
  if (t.kind === 'cover') {
    t.phase = 'acquire';
    t.acquireP = t.p;
    t.trace = [];
    t.traceLast = 0;
  }
  bindFaces(t);
  // buffer preparation only — the resting DOM remains visible above the desk
  applyPose();
  renderer.render(scene, camera);
  if (t.kind !== 'cover') canvas.classList.add('active');
  return t;
}

function beginTurn(dir) {
  if (CSS_ONLY) return null;
  if (!texReady || state !== OPEN || turning) return null;
  const sheet = dir === 1 ? turned : turned - 1;
  if (sheet < 0 || sheet >= SHEETS) return null;
  /* mobile texture window: a sheet outside it is pulled in now and the turn
     is refused for this tick rather than binding a missing face */
  if (!sheetResident(sheet)) { prefetchAround(sheet); return null; }
  turned = sheet;                          // DOM shows the "not yet flipped" spread
  paintLeftLeaf(sheet * 2 - 1);
  paintRightLeaf(sheet * 2 + 2);
  configureMesh(leafR.getBoundingClientRect(), meshRadiiForSheet(sheetOf(turned * 2)));
  return reveal({ kind: 'paper', dir, sheet, p: dir === 1 ? 0 : 1, dragging: true, ease: 'out' });
}
/* dir = 1 opens the notebook, dir = -1 closes it back onto the front cover */
function beginCoverTurn(dir) {
  if (CSS_ONLY) return null;
  if (!texReady || turning || !coverTex.length) return null;
  if (dir === 1 && state !== CLOSED_FRONT) return null;
  if (dir === -1 && (state !== OPEN || turned !== 0)) return null;
  /* Settled state remains untouched throughout flight. The resting DOM cover
     stays visible for acquisition and relinquishes ownership only on the first
     genuinely moving frame. Geometry is the resize-time cached cover box. */
  if (!geom || !geom.coverRect) return null;
  configureMesh(geom.coverRect, [2, 8, 8, 2], 5.0);  // stiffer, visibly thicker board
  return reveal({ kind: 'cover', dir, p: dir === 1 ? 0 : 1, dragging: true, ease: 'out' });
}
/* THE END OF THE BOOK IS A COVER TURN, NOT A PAGE TURN.
   dir = 1 shuts the back board down onto the finished block (OPEN at the last
   spread -> CLOSED_BACK); dir = -1 lifts it again. It is the SAME mesh, the
   same board profile, the same phase machine and the same shadow system as
   the front cover — only the bound faces and the DOM ownership differ, so
   nothing about the paper-turn system is involved. */
function beginBackCoverTurn(dir) {
  if (CSS_ONLY) return null;
  if (!texReady || turning || coverTex.length < 3) return null;
  if (dir === 1 && !(state === OPEN && turned >= SHEETS)) return null;
  if (dir === -1 && state !== CLOSED_BACK) return null;
  if (!geom || !geom.coverRect) return null;
  configureMesh(geom.coverRect, [2, 8, 8, 2], 5.0);
  return reveal({ kind: 'cover', back: true, dir, p: dir === 1 ? 0 : 1, dragging: true, ease: 'out' });
}
function launch(t, target, ease) {
  const dist = Math.abs(target - t.p);
  if (!perf) perfBegin(t);
  t.dragging = false;
  t.target = target;
  t.from = t.p;
  /* A button-launched turn is still waiting for its single acquire frame.
     A pointer-released turn already owns the canvas, so its motion clock can
     start now without reacquiring or presenting a duplicate resting pose. */
  if (t.phase === 'dragging') {
    t.phase = 'moving';
    t.t0 = performance.now();
  } else if (t.kind !== 'cover') {
    /* Preserve the established paper lifecycle; cover acquisition does not
       use this sentinel and records its clock on its own acquire frame. */
    t.t0 = 0;
  }
  t.ease = ease || 'out';
  t.dur = Math.max(MIN_MS, MATERIAL[t.kind].maxMs * Math.pow(dist, 0.85));
  if (PERF_ON && PERF_DUR && t.kind === 'cover') t.dur = PERF_DUR;   // bench sweep only
}
function finishTurn() {
  if (!turning || !turning.dragging || dbg.hold) return;
  const done = turning.dir === 1 ? turning.p > 0.5 : turning.p < 0.5;
  launch(turning, turning.dir === 1 ? (done ? 1 : 0) : (done ? 0 : 1), 'out');
}
let stacksSolvedOpen = false;
function settleCoverDOM(t) {
  if (t.back) {
    /* The front cover is untouched by a back turn: the book stays open, only
       the back board changes hands from the mesh back to the DOM. */
    state = t.target === 1 ? CLOSED_BACK : OPEN;
    book.classList.toggle('closedback', state === CLOSED_BACK);
    book.classList.remove('coverflight', 'backflight');
    updateChrome();
    updateNavDisabled();
    return;
  }
  state = t.target === 1 ? OPEN : CLOSED_FRONT;
  book.classList.toggle('closed', state === CLOSED_FRONT);
  book.classList.remove('coverflight');
  updateChrome();
  updateNavDisabled();
  /* The paper envelope only physically exists once the book is open: closed,
     the leaf sits under the cover and the measured board margin is not the one
     the eye will ever see. Solve the stack ONCE against the real open spread —
     never during motion, never per frame. */
  if (state === OPEN && !stacksSolvedOpen) {
    stacksSolvedOpen = true;
    requestAnimationFrame(() => { buildStacks(); updateStacks(true); });
  }
}

function settle() {
  const t = turning;
  turning = null;
  if (t.kind === 'cover') {
    /* Cover settlement never rebuilds page HTML, damage nodes, or stacks. */
    settleCoverDOM(t);
  } else {
    turned = t.target === 1 ? t.sheet + 1 : t.sheet;
    paintDOM();
  }
  root.classList.remove('turning');
  canvas.classList.remove('active');
  flushCoverTrace(t);
  perfEnd(t);
  /* restore full buffer density now that nothing is moving, and pull the next
     spread's rasters in before they are needed */
  applyGlDpr(MAX_GL_DPR);
  lastActivity = performance.now();
  prefetchAround(turned);
  prewarmNeighbours();
  afterSettle();

}


let chromeTick = 0;
function applyPose() {
  const _a0 = pnow();
  const p = turning ? turning.p : 0;
  const m = MATERIAL[turning ? turning.kind : 'paper'];
  const env = Math.sin(Math.min(1, Math.max(0, p)) * Math.PI);   // 0 at both ends
  uniforms.uT.value = p;
  uniforms.uBend.value = dbg.flat ? 0 : env * m.bend;
  uniforms.uEnv.value = dbg.flat ? 0 : Math.min(1, env * m.env);
  /* A cover turn does not transfer any paper: `turned` is unchanged, so the
     block geometry underneath is already correct. Only the cover chrome moves. */
  const _a1 = pnow();
  if (PERF_ON) PSECT.pose.push(_a1 - _a0);
  if (turning && turning.kind === 'cover') {
    /* PERF (#4): FREEZE CHROME DURING MOTION. The cover chrome (openx clip,
       cast slab, thickness bands, seam) is a DOM style pass on six elements
       every frame. On a phone it is run every PROF.chromeStride-th frame
       instead; both ENDPOINTS always run, so no resting state can be stale
       and the handoff to the DOM is bit-identical to the lab's. */
    const t = turning, st = PROF.chromeStride;
    const endpoint = t.p <= 0 || t.p >= 1 || t.endpointPresented || t.dragging;
    if (st <= 1 || endpoint || (chromeTick++ % st) === 0) updateChrome();
  }
  else updateStacks();                  // stacks transfer continuously mid-turn
}

/* ---------- frame lifecycle ----------
   Cover automation is an explicit phase machine. Exactly one rAF presents the
   acquired rest pose and records t0. The very next rAF computes a non-zero k,
   relinquishes DOM ownership, and moves. The exact target is then presented
   once before DOM settlement on the following rAF. Paper keeps its proven
   lifecycle unchanged. No timers, fades, or synthetic delays. */
let lastFrameAt = 0, frameEma = 0, frameSamples = 0;
function frame() {
  if (disposed) { rafId = 0; return; }
  const now = performance.now();
  if (turning) {
    perfSample(now);
    const t = turning;
    if (t.kind === 'cover') {
      if (t.phase === 'acquire') {
        t.p = t.acquireP;
        t.t0 = now;
        applyPose();
        renderer.render(scene, camera);
        canvas.classList.add('active');
        traceCoverFrame(t, 'acquire', now);
        t.phase = t.dragging ? 'dragging' : 'moving';
      } else if (t.phase === 'dragging') {
        applyPose(); perfRender();
      } else if (t.phase === 'endpoint') {
        t.phase = 'settle';
        traceCoverFrame(t, 'settle', now);
        settle();
      } else if (t.phase === 'moving') {
        const k = Math.min(1, (now - t.t0) / t.dur);
        const e = t.ease === 'inout' ? MATERIAL.cover.curve(k) : 1 - Math.pow(1 - k, 3);
        t.p = k >= 1 ? t.target : t.from + (t.target - t.from) * e;

        /* Ownership changes only when there is real movement. Until here the
           exact DOM rest pose and exact GL rest pose coexist. */
        if (!t.ownershipRelinquished && k > 0) {
          t.ownershipRelinquished = true;
          book.classList.add(t.back ? 'backflight' : 'coverflight');
          if (t.back) book.classList.remove('closedback');
          else if (t.dir === 1) book.classList.remove('closed');
        }
        applyPose(); perfRender();
        if (PERF_ON) PSECT.frame.push(performance.now() - now);
        if (k >= 1) {
          t.phase = 'endpoint';
          traceCoverFrame(t, 'endpoint', now);
        } else {
          traceCoverFrame(t, 'moving', now);
        }
      }
    } else if (t.dragging) {
      applyPose(); renderer.render(scene, camera);
    } else if (!t.startPresented) {
      t.startPresented = true;
      applyPose(); renderer.render(scene, camera);
      frameLog('start-handoff', t.p, now);
    } else if (t.endpointPresented) {
      frameLog('settle', t.p, now);
      settle();                                   // endpoint frame has been shown
    } else {
      if (t.t0 === 0) t.t0 = now;
      const k = Math.min(1, (now - t.t0) / t.dur);
      const e = t.ease === 'inout'
        ? MATERIAL[t.kind].curve(k)
        : 1 - Math.pow(1 - k, 3);
      t.p = k >= 1 ? t.target : t.from + (t.target - t.from) * e;
      applyPose(); renderer.render(scene, camera);
      if (k >= 1) { t.endpointPresented = true; frameLog('endpoint-present', t.p, now); }
      else frameLog('moving', t.p, now);
    }
  }
  /* FRAME PACING — the loop exists to drive motion. Once the notebook has
     been at rest for PROF.idleStopMs there is nothing to present, so the rAF
     chain stops entirely (zero main-thread and GPU cost between turns) and is
     restarted by kick() from reveal()/resume()/resize(). */
  /* PERF (#4/#9 probe): ADAPTIVE BUDGET. If a device cannot hold the budget
     it was given, the engine lowers its own cost mid-session instead of
     dropping frames: first the in-flight buffer density, then the chrome
     stride. Never raises anything, never touches geometry mid-turn, and is
     off on desktop. */
  if (PROF.adaptive && turning) {
    if (lastFrameAt) {
      const dt = now - lastFrameAt;
      frameEma = frameEma ? frameEma * 0.8 + dt * 0.2 : dt;
      if (++frameSamples > 20 && frameEma > 24) {
        frameSamples = 0; frameEma = 0;
        if (PROF.motionDpr > 0.55) { PROF.motionDpr = Math.max(0.55, PROF.motionDpr * 0.8); applyGlDpr(PROF.motionDpr); }
        else if (PROF.chromeStride < 4) { PROF.chromeStride++; PROF.analyticOpenX = true; }
      }
    }
    lastFrameAt = now;
  } else { lastFrameAt = 0; frameEma = 0; frameSamples = 0; }
  if (turning || warmPending) lastActivity = now;
  const idleStop = PROF.idleStopMs > 0 && !turning &&
                   (now - lastActivity) > PROF.idleStopMs;
  rafId = (suspended || disposed || idleStop) ? 0 : requestAnimationFrame(frame);
}

/* ======================= PRESERVED SOURCE ENDS ======================= */

  /* ---------- pointer (source lines 1926-1944, listeners now tracked) ---- */
  let startX = 0, base = 0;
  function drag(t, e) {
    if (!t) return;
    perfBegin(t);
    startX = e.clientX; base = t.p; stage.setPointerCapture(e.pointerId);
  }
  on(stage, 'pointermove', (e: any) => {
    if (!turning || !turning.dragging || dbg.hold) return;
    const w = stage.getBoundingClientRect().width / 2;
    turning.p = Math.max(0, Math.min(1, base + (startX - e.clientX) / w));
  });
  on(stage, 'pointerup', finishTurn as EventListener);
  on(stage, 'pointercancel', finishTurn as EventListener);
  on(cover, 'pointerdown', (e: any) => drag(beginCoverTurn(1), e));
  on(grabNext, 'pointerdown', (e: any) => drag(beginTurn(1), e));
  on(grabPrev, 'pointerdown', (e: any) => {
    drag(state === OPEN && turned === 0 ? beginCoverTurn(-1) : beginTurn(-1), e);
  });

  /* ---------- semantic navigation ----------
     Exactly the moves the lab's two buttons made, in physical order: open the
     front cover, turn a sheet, then — with every sheet on the left — shut the
     back board. Each returns a promise that resolves on the settle frame. */
  function run(t, target: number): Promise<void> {
    if (!t) return Promise.resolve();
    launch(t, target, 'inout');
    return new Promise<void>(res => { pendingResolve = res; });
  }
  /* ---------- CSS-ONLY FLIP (#9) ----------
     Two 90-degree phases about the spine with the commit at the vertical, so
     no face is ever seen from behind and no second copy of a page is needed.
     Runs on the compositor (transform only) and touches the DOM exactly twice
     per turn: the commit, and the cleanup. */
  const CSS_HALF = 340;
  const EASE_IN  = 'cubic-bezier(.42,0,.92,.42)';   // the lift accelerates
  const EASE_OUT = 'cubic-bezier(.08,.62,.24,1)';   // the fall lands with weight
  /** ANIMATED --openx. The WebGL path drives it per frame from the projected
   *  board edge; here the board is a compositor rotation, so the reveal is
   *  handed to the same registered custom property as a transition. One style
   *  write per turn instead of one per frame, and nothing pops at the commit. */
  function openXTo(v: number, ms: number) {
    const els = openxTargets();
    for (const el of els) el.style.transition = `--openx ${ms}ms linear`;
    if (deskshadowEl) deskshadowEl.style.transition = `--openx ${ms}ms linear, transform ${ms}ms linear`;
    setOpenX(v);
    setTimeout(() => { for (const el of els) el.style.transition = ''; }, ms + 40);
  }
  /* `hold` keeps the leaf parked edge-on at its end rotation after the
     outbound half finishes. Without it the animation (fill:none) snaps the
     element back to 0deg for one frame BEFORE the midpoint commit repaints it,
     which is the flash of the old page you see mid-turn. The caller releases
     the hold once the DOM has been repainted. */
  function spin(el: HTMLElement, from: number, to: number, origin: string, easing: string,
                hold = false): Promise<() => void> {
    if (!el) return Promise.resolve(() => {});
    const prevOrigin = el.style.transformOrigin;
    const prevZ = el.style.zIndex;
    el.style.transformOrigin = origin;
    el.style.zIndex = '8';
    el.classList.add('nb-spin');

    /* LIGHTING. A rotating rectangle with a flat texture reads as a sticker;
       the one cue that sells it for free is that the face turns away from the
       light as it lifts. This is a single compositor-animated overlay whose
       gradient runs from the hinge outward, so the spine side stays dark and
       the fore edge catches the light — the same direction the shader's
       envelope uses. */
    const hingeLeft = origin.indexOf('left') === 0;
    const shade = doc.createElement('div');
    shade.className = 'nb-shade';
    shade.style.background = `linear-gradient(${hingeLeft ? 90 : 270}deg,
      rgba(24,15,6,.62) 0%, rgba(24,15,6,.34) 26%, rgba(24,15,6,.12) 62%, rgba(24,15,6,.02) 100%)`;
    el.appendChild(shade);

    const opts: KeyframeAnimationOptions = { duration: CSS_HALF, easing, fill: hold ? 'forwards' : 'none' };
    const lifting = Math.abs(to) > Math.abs(from);
    const a = el.animate(
      [{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }], opts);
    const s = shade.animate(lifting ? [{ opacity: 0 }, { opacity: 1 }]
                          : [{ opacity: 1 }, { opacity: 0 }],
                          { ...opts, fill: hold ? 'forwards' : 'none' });
    const release = () => {
      try { a.cancel(); s.cancel(); } catch { /* already gone */ }
      shade.remove();
      el.classList.remove('nb-spin');
      el.style.transformOrigin = prevOrigin;
      el.style.zIndex = prevZ;
    };
    return (a.finished || new Promise(r => { a.onfinish = r; }))
      .catch(() => {})
      .then(() => { if (!hold) release(); return release; });
  }


  async function cssFlip(kind: 'cover-open' | 'cover-close' | 'next' | 'prev' | 'back-close' | 'back-open') {
    if (turning) return;
    root.classList.add('turning');
    const commit = () => { paintDOM(); updateChrome(); };
    /* Park the incoming leaf edge-on BEFORE the repaint so its freshly painted
       face never shows flat for a frame; the inbound animation takes over from
       the same angle and the inline transform is cleared when it lands. */
    const park = (el: HTMLElement | null, deg: number, origin: string) => {
      if (!el) return;
      el.style.transformOrigin = origin;
      el.style.transform = `rotateY(${deg}deg)`;
      el.style.backfaceVisibility = 'hidden';
    };
    const unpark = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.transform = '';
      el.style.backfaceVisibility = '';
    };
    /* UNDERSTUDY. When the incoming leaf is parked edge-on and repainted, the
       half it rests on has nothing left in it, so the layer underneath (the
       stack / the open cover / page one's wear) is uncovered for the frames
       before the leaf sweeps over it. In a real notebook that surface never
       shows: the previous page sits there until the turning sheet lands on it.
       The stand-in is the OUTGOING CARD ITSELF, re-parented into a static
       holder behind the leaf — nothing is cloned, so nothing is repainted
       (cloning was itself a source of the mid-turn stall). */
    const understudy = (el: HTMLElement | null): (() => void) => {
      const half = el && el.parentElement;
      if (!el || !half) return () => {};
      const live = [...el.children].find(
        n => (n as HTMLElement).classList?.contains('nb-card')
          && !(n as HTMLElement).classList.contains('warm')) as HTMLElement | undefined;
      if (!live) return () => {};
      const holder = doc.createElement('div');
      holder.className = el.className.replace(/\bnb-spin\b/g, '') + ' nb-under';
      holder.style.borderRadius = el.style.borderRadius;
      holder.appendChild(live);
      half.insertBefore(holder, el);
      return () => { holder.remove(); };
    };

    /** out-half (held edge-on) → repaint → release → in-half */
    async function half(outEl: HTMLElement | null, outFrom: number, outTo: number, outOrigin: string,
                        inEl: HTMLElement | null, inFrom: number, inOrigin: string,
                        between: () => void) {
      const release = await spin(outEl as HTMLElement, outFrom, outTo, outOrigin, EASE_IN, true);
      const dropUnderstudy = understudy(inEl);
      park(inEl, inFrom, inOrigin);
      between();
      commit();
      release();
      await spin(inEl as HTMLElement, inFrom, 0, inOrigin, EASE_OUT);
      unpark(inEl);
      dropUnderstudy();
    }


    if (kind === 'next' || kind === 'prev') {
      /* SHEET TURN — single two-faced flipper.
         Swinging the two resting halves in sequence means the book has to
         repaint a half while nothing covers it, which is the flash. A real
         sheet is ONE object with two faces, so that is what turns here: a
         .nb-flip element carrying the outgoing face on the front and the
         page it becomes on the back. The browser swaps faces itself at 90°
         (backface-visibility) — zero DOM work mid-turn — and the resting
         halves are only ever repainted while the flipper covers them. */
      const fwd = kind === 'next';
      const outEl = fwd ? leafR : leafL;
      const halfEl = outEl && outEl.parentElement;
      const nextTurned = turned + (fwd ? 1 : -1);
      const backIdx = fwd ? nextTurned * 2 - 1 : nextTurned * 2;

      if (halfEl) {
        const flip = doc.createElement('div');
        flip.className = 'leaf nb-flip';
        flip.style.borderRadius = outEl.style.borderRadius;
        flip.style.transformOrigin = fwd ? 'left center' : 'right center';
        const front = doc.createElement('div'); front.className = 'nb-face front';
        const back = doc.createElement('div'); back.className = 'nb-face back';
        const live = [...outEl.children].find(
          n => (n as HTMLElement).classList?.contains('nb-card')
            && !(n as HTMLElement).classList.contains('warm')) as HTMLElement | undefined;
        if (live) front.appendChild(live);
        const backCard = faceCard(backIdx);
        if (backCard) back.appendChild(backCard);
        const shadeFront = doc.createElement('div');
        const shadeBack = doc.createElement('div');
        const grad = (hingeLeft: boolean) => `linear-gradient(${hingeLeft ? 90 : 270}deg,
          rgba(24,15,6,.62) 0%, rgba(24,15,6,.34) 26%, rgba(24,15,6,.12) 62%, rgba(24,15,6,.02) 100%)`;
        shadeFront.className = shadeBack.className = 'nb-shade';
        shadeFront.style.background = grad(fwd);
        shadeBack.style.background = grad(!fwd);
        front.appendChild(shadeFront); back.appendChild(shadeBack);
        flip.append(front, back);
        halfEl.appendChild(flip);

        /* the half the sheet is leaving is repainted NOW, underneath the
           flipper, which sits flat on top of it at 0° */
        turned = nextTurned;
        if (fwd) paintRightLeaf(turned * 2); else paintLeftLeaf(turned * 2 - 1);

        const dur = CSS_HALF * 2;
        const a = flip.animate(
          [{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${fwd ? -180 : 180}deg)` }],
          { duration: dur, easing: 'cubic-bezier(.42,0,.35,1)', fill: 'forwards' });
        shadeFront.animate([{ opacity: 0 }, { opacity: 1 }],
          { duration: CSS_HALF, easing: EASE_IN, fill: 'forwards' });
        shadeBack.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: .5 }, { opacity: 0, offset: 1 }],
          { duration: dur, easing: 'linear', fill: 'forwards' });

        /* past the vertical the flipper covers the OTHER half, so that one is
           repainted behind it and is already correct when the sheet lands */
        const mid = setTimeout(() => { commit(); }, CSS_HALF + 40);
        await (a.finished || new Promise(r => { a.onfinish = r; })).catch(() => {});
        clearTimeout(mid); commit();
        if (live) live.classList.add('warm');
        flip.remove();
        releaseFace(backIdx);

      } else {
        turned = nextTurned; commit();
      }
    } else if (kind === 'cover-open' || kind === 'cover-close') {

      const open = kind === 'cover-open';
      /* the reveal rides WITH the board instead of snapping at the vertical:
         --openx transitions across the whole lifting half, so the left side of
         the book is uncovered spine-outward exactly as the board leaves it. */
      if (open && !stacksSolvedOpen) { stacksSolvedOpen = true; buildStacks(); }
      openXTo(open ? 1 : 0, CSS_HALF);
      await half(open ? cover : (openCoverEl || frontboardEl), 0, open ? -90 : 90,
                 open ? 'left center' : 'right center',
                 open ? (openCoverEl || frontboardEl) : cover, open ? 90 : -90,
                 open ? 'right center' : 'left center',
                 () => { state = open ? OPEN : CLOSED_FRONT; setOpenX(open ? 1 : 0); });
    } else {
      const closing = kind === 'back-close';
      await half(closing ? leafR : (backClosedEl || backcover), 0, closing ? -90 : 90,
                 closing ? 'left center' : 'right center',
                 closing ? (backClosedEl || backcover) : leafR, closing ? 90 : -90,
                 closing ? 'right center' : 'left center',
                 () => { state = closing ? CLOSED_BACK : OPEN; });
    }


    root.classList.remove('turning');
    updateStacks(true);
    notifyState();
    /* build and rasterise the faces the next move will need, now, while
       nothing is moving — so the next commit is a class toggle */
    prewarmNeighbours();
  }


  function forwardTurn() {
    if (CSS_ONLY) {
      if (state === CLOSED_FRONT) return cssFlip('cover-open');
      if (state === CLOSED_BACK) return Promise.resolve();
      return turned >= SHEETS ? cssFlip('back-close') : cssFlip('next');
    }
    const t = state === CLOSED_FRONT ? beginCoverTurn(1)
            : (state === OPEN && turned >= SHEETS) ? beginBackCoverTurn(1)
            : beginTurn(1);
    return run(t, 1);
  }
  function backwardTurn() {
    if (CSS_ONLY) {
      if (state === CLOSED_BACK) return cssFlip('back-open');
      if (state === CLOSED_FRONT) return Promise.resolve();
      return turned === 0 ? cssFlip('cover-close') : cssFlip('prev');
    }
    if (state === CLOSED_BACK) return run(beginBackCoverTurn(-1), 0);
    const t = state === OPEN && turned === 0 ? beginCoverTurn(-1) : beginTurn(-1);
    return run(t, 0);
  }

  const idle = () => !turning && texReady && !disposed;
  async function until(step: () => Promise<void>, done: () => boolean, guard = 64) {
    while (!done() && guard-- > 0) {
      if (!idle()) await new Promise(r => setTimeout(r, 32));
      else await step();
    }
  }

  function snapshot(): NotebookSnapshot {
    /* right-hand page of the current spread, 1-based: turned sheets are
       flipped left, so pages [2t, 2t+1] are showing. */
    const page = Math.min(pages.length, turned * 2 + 1);
    return { state: state as NotebookSnapshot['state'], turned, page };
  }

  /* ---------- boot (source lines 2178-2197) ---------- */
  dressChrome();
  buildStacks();
  /* THE STACK TUNING CONTROLS ARE GONE. The block is the approved canonical
     M2 object and is frozen: no control and no URL parameter may change its
     physical appearance. */
  paintDOM();
  resize();
  frame();
  // fonts can settle after first layout; re-rasterise once they have
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(() => { if (disposed) return; texKey = ''; buildTextures(); });
  }
  /* the notebook is sized by its host, which can change without the window
     doing so; resize() is the same measured path the lab ran on window resize */
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { if (!disposed) resize(); }) : null;
  if (ro) ro.observe(host);

  /* ---------- automatic suspension ----------------------------------
     A notebook that is scrolled away or in a background tab must cost
     nothing. Manual suspend()/resume() still work; this only automates the
     two cases every embed hits. */
  let autoSuspended = false;
  const autoSuspend = (want: boolean) => {
    if (disposed || want === autoSuspended) return;
    autoSuspended = want;
    if (want) engine.suspend(); else engine.resume();
  };
  if (PROF.pauseHidden) {
    on(doc, 'visibilitychange', () => autoSuspend(doc.hidden));
  }
  const io = (PROF.pauseOffscreen && typeof IntersectionObserver !== 'undefined')
    ? new IntersectionObserver(es => autoSuspend(!es.some(e => e.isIntersecting)), { threshold: 0 })
    : null;
  if (io) io.observe(host);


  const engine: NotebookEngine = {
    async open() {
      if (state === CLOSED_BACK) await backwardTurn();
      if (state === CLOSED_FRONT) await forwardTurn();
    },
    async close(side: CloseSide = 'front') {
      if (side === 'front') {
        await until(() => backwardTurn(), () => state === CLOSED_FRONT);
      } else {
        await until(() => forwardTurn(), () => state === CLOSED_BACK);
      }
    },
    next() { return forwardTurn(); },
    previous() { return backwardTurn(); },
    async goToPage(page: number) {
      const i = Math.max(0, Math.min(pages.length - 1, Math.round(page) - 1));
      const target = Math.floor(i / 2);
      if (state === CLOSED_FRONT) await forwardTurn();
      if (state === CLOSED_BACK) await backwardTurn();
      await until(() => (turned < target ? forwardTurn() : backwardTurn()),
                  () => turned === target || state !== OPEN);
    },
    async goToSection(section: string) {
      const map = options.sectionToPage || {};
      const page = map[section];
      if (page == null) throw new Error('[notebook] unknown section: ' + section);
      await engine.goToPage(page);
    },
    suspend() {
      if (suspended) return;
      suspended = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
    resume() {
      if (!suspended || disposed) return;
      suspended = false;
      resize();
      lastActivity = performance.now();
      kick();
    },
    getState() { return snapshot(); },
    /* ---------- BAKE (#1) ----------
       Rasterise every page and cover face through the engine's own snapshot
       pipeline and hand back encoded images. Used offline by
       tools/bake-textures.mjs; never called at runtime on a user's device. */
    async bake(opts: any = {}) {
      const type = opts.type || 'image/webp', quality = opts.quality ?? 0.9;
      const r = leafR.getBoundingClientRect(), cr = cover.getBoundingClientRect();
      const dpr = opts.dpr || Math.min(devicePixelRatio, PROF.texDpr);
      const enc = (img, w, h) => {
        const c = doc.createElement('canvas');
        c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL(type, quality);
      };
      const out = { w: r.width, h: r.height, coverW: cr.width, coverH: cr.height, dpr, pages: [], covers: [] };
      for (let i = 0; i < pages.length; i++) {
        out.pages.push(enc(await snapshotLeaf(pages[i], i, r.width, r.height, dpr), r.width, r.height));
      }
      for (const el of [snapCover, snapCoverBack, snapBackBoard, snapCoverBackPhoto].filter(Boolean)) {
        out.covers.push(enc(await snapshotEl(el, cr.width, cr.height, dpr), cr.width, cr.height));
      }
      return out;
    },
    restore(s: NotebookSnapshot) {
      if (turning) { turning = null; root.classList.remove('turning'); }
      canvas.classList.remove('active');
      turned = Math.max(0, Math.min(SHEETS, s.turned | 0));
      state = s.state === OPEN || s.state === CLOSED_BACK ? s.state : CLOSED_FRONT;
      book.classList.toggle('closed', state === CLOSED_FRONT);
      book.classList.toggle('closedback', state === CLOSED_BACK);
      book.classList.remove('coverflight', 'backflight');
      paintDOM();
      setOpenX(state === CLOSED_FRONT ? 0 : 1);
      updateChrome();
      if (state !== CLOSED_FRONT && !stacksSolvedOpen) {
        stacksSolvedOpen = true;
        buildStacks(); updateStacks(true);
      }
      prefetchAround(turned);
      notifyState();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (warmPending) cancelAnimationFrame(warmPending);
      rafId = 0;
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      for (const [t, type, fn] of listeners) t.removeEventListener(type, fn);
      listeners.length = 0;
      for (const g of geoCache.values()) g.dispose();
      geoCache.clear();
      for (const t of texes) t && t.dispose();
      for (const t of coverTex) t && t.dispose();
      texes.length = 0; coverTex.length = 0;
      geo.dispose();
      mesh.material.dispose();
      renderer.dispose();
      root.remove();
      releaseStyles();
    },
  };

  if (options.signal) {
    if (options.signal.aborted) engine.dispose();
    else options.signal.addEventListener('abort', () => engine.dispose(), { once: true });
  }

  return engine;
}
