/* ======================================================================
   LAB-NATIVE PAPER PROVIDER (Variant B)
   ----------------------------------------------------------------------
   The notebook's paper condition comes ONLY from the current Paper Lab
   language: /shared/paper-stack.js (families, notebook edge, condition,
   stack model) + /shared/paper-surface.js (stock, fibre, oxidation, grime,
   edge coloration, foxing, humidity bloom, stains, smudges, creases).

   Nothing here derives from the legacy window.LABPAPER concept recipes.

   Model
     * one paper stock, one global notebook age
     * two families only: Carried/Handled and Protected Interior, expressed
       as a continuous mix that moves from handled at the front of the block
       to protected in the interior
     * exposure declines from sheet 1 (the most exposed handled sheet)
     * humidity is a NEIGHBOURHOOD EPISODE: it rises, peaks and fades across
       a run of sheets, with correlated deformation phase and foxing density
     * one shared notebook-wide edge language; family only nudges it
     * rare events stay rare: at most one event on a few sheets
     * production ceilings enforced: fray <= 0.12, geometric intensity <= 0.55

   A physical SHEET (front face = even page index, back = odd) has ONE
   condition record. Only the mirror side differs between its two faces.
   ==================================================================== */
window.PAPERV2 = (function () {
'use strict';
const PS = window.PaperStack, SF = window.PaperSurface;
const {condition, PRODUCTION_LIMITS, M2_EDGE, NOTEBOOK_EDGE, clamp01, h2} = PS;

/* SELECTED EDGE: "M2 — Moderately more worn", promoted verbatim from the
   Paper Lab's large-format edge study. M2 is the notebook's MAXIMUM; every
   sheet shares this edge vocabulary and varies only downward from it. */
const M2_EDGE_SPEC = Object.assign({}, NOTEBOOK_EDGE, {
  recession:  NOTEBOOK_EDGE.recession  * M2_EDGE.rec,
  cornerWear: NOTEBOOK_EDGE.cornerWear * M2_EDGE.corner,
  cockle:     NOTEBOOK_EDGE.cockle     * M2_EDGE.cockle,
});

const AGE = 0.88;                  // global notebook age
const HUMID_PEAK_AT = 0.32;        // where in the block the damp episode peaked
const HUMID_RADIUS  = 0.34;        // how far it rises and fades, in block fraction


/* the damp episode: a smooth rise/peak/fade across neighbouring sheets */
function episode(t) {
  const d = Math.abs(t - HUMID_PEAK_AT) / HUMID_RADIUS;
  if (d >= 1) return 0;
  const x = 1 - d;
  return x * x * (3 - 2 * x);            // smoothstep bump
}

const CACHE = new Map();
/* sheet index (0 = first physical sheet) -> its condition record */
function sheet(i, sheets) {
  const n = Math.max(1, sheets || 6);
  const key = i + '/' + n;
  let c = CACHE.get(key);
  if (c) return c;

  const t = n === 1 ? 0 : Math.min(1, Math.max(0, i / (n - 1)));  // 0 = front

  /* family: handled at the front, transitioning to protected interior */
  const familyMix = clamp01((t - 0.42) / 0.34);      // 0 handled -> 1 protected
  /* exposure: sheet 1 is the maximum-exposure handled sheet */
  const exposure = clamp01(1 - Math.pow(t, 0.72) * 0.86);

  /* neighbourhood: one damp episode, shared characteristics between neighbours */
  const e = episode(t);
  const jitter = (h2(i + 3, 91) - 0.5) * 0.12;       // small individual deviation
  const humid  = clamp01(e * 0.9 + jitter * e);
  const foxing = clamp01(humid * 0.8);
  const bloom  = clamp01(humid * 0.55);

  /* rare events: at most one per sheet, and only on a few sheets */
  const roll = h2(i + 11, 47);
  const events = {};
  if (roll > 0.86) events.crease = 0.7 + h2(i, 5) * 0.3;
  else if (roll > 0.78) events.stain = 0.5 + h2(i, 6) * 0.35;
  else if (roll > 0.73) events.smudge = 0.5 + h2(i, 7) * 0.4;

  /* per-sheet variation moves DOWN from M2: sheet 0 IS the selected treatment,
     every other sheet is the same vocabulary, quieter. Never above M2. */
  const vary = i === 0 ? 1 : (0.78 + h2(i, 23) * 0.22);
  events.notch = M2_EDGE.notch * vary;

  c = condition({
    seed: 300 + i * 17,
    familyMix,
    exposure,
    notebookAge: AGE,
    familyEdgeInfluence: 0.7,             // edge belongs to the notebook, not the family
    notebookEdge: M2_EDGE_SPEC,           // the promoted M2 edge, shared by every sheet
    geoIntensity: PRODUCTION_LIMITS.geometricIntensity * vary,
    limits: PRODUCTION_LIMITS,
    foreInset: M2_EDGE.inset * vary,      // uneven extent / localized shortening
    neighborhood: {
      humid, foxing, bloom,
      compress: clamp01(0.18 + t * 0.30),
      cockle: e * 0.5,
      phase: (HUMID_PEAK_AT * 6.28) + (i * 0.55),   // correlated deformation
    },
    events,
  });

  c.sheetIndex = i;
  CACHE.set(key, c);
  return c;
}

/* ----------------------------------------------------------------------
   PAGE-1 EXPOSED-FACE SURFACE HISTORY
   The physical sheet is unchanged: geometry (cond.geo) is never touched,
   never copied-with-changes, never re-solved. We only build a SURFACE-ONLY
   twin of the sheet's condition record for the one exposed face, plus a few
   extra layers drawn with the same PaperSurface vocabulary.
   -------------------------------------------------------------------- */
const P1 = {
  humid: 0.18,      // surface moisture history on the exposed face (subtle)
  foxing: 0.32,     // discrete rust specks + a few clusters
  grime: 0.95,      // thumb / contact accumulation
  tone: 0.62,       // low-frequency tonal drift + warmth
  edge: 0.92,       // edge COLORATION only (never edge position)
  fibre: 1.0,
  stain: 0.92,
  smudge: 0.20,     // pencil/eraser mark: now barely visible
};

/* surface-only condition twin. geo is passed through by reference, unchanged. */
/* the trauma to page 1 did not stop at page 1: the sheet behind it and, more
   faintly, the next one carry the neighbourhood echo of the same event
   (transferred contact, moisture that soaked through, shared handling). This
   is a local echo only — it never changes the notebook's humidity episode. */
const TRAUMA_ECHO = [1, 0.30, 0.15];
function echoK(idx) { return TRAUMA_ECHO[idx] || 0; }

function faceSurfaceCondition(idx, c) {
  const k = echoK(idx);
  if (!k) return c;
  const up = (base, target) => base + Math.max(0, target - base) * k;
  return Object.assign({}, c, {
    humid:  up(c.humid,  P1.humid),
    foxing: up(c.foxing, P1.foxing),
    grime:  up(c.grime,  P1.grime),
    tone:   up(c.tone,   P1.tone),
    edge:   up(c.edge,   P1.edge),
    fibre:  up(c.fibre,  P1.fibre),
    events: Object.assign({}, c.events, {
      stain:  up((c.events && c.events.stain)  || 0, P1.stain),
      smudge: up((c.events && c.events.smudge) || 0, P1.smudge),
    }),
  });
}

/* ---- page-1 only textures. Surface pigment, drawn with the lab's own
   vocabulary (canvas -> data URL -> CSS background layer) so the
   computed-style clone still rasterises them into the WebGL page. ---- */
const rnd = PS.rnd;

/* a real tide line: a damp front that dried with a darker crest. Three fronts
   cross distinct heights so at least one stays legible around page content. */
function p1TideTex(mir, k) {
  k = k == null ? 1 : k;
  return SF.texURL('p1tide_v2' + (mir ? '_m' : '') + '_k' + Math.round(k * 100), 420, 560, (g, w, h) => {
    g.globalAlpha = k;
    const r = rnd(1207);
    const fronts = [
      {base: 0.53, amp: 0.028, a: 0.035, crest: 0.11},
      {base: 0.70, amp: 0.055, a: 0.07,  crest: 0.17},
      {base: 0.86, amp: 0.035, a: 0.05,  crest: 0.13},
    ];
    for (const f of fronts) {
      const yAt = x => {
        const t = x / w;
        return h * (f.base
          + Math.sin(t * 5.4 + f.base * 9) * f.amp
          + Math.sin(t * 13.7 + 1.3) * f.amp * 0.42
          + Math.sin(t * 27.1 + 2.7) * f.amp * 0.16);
      };
      /* absorbed body below the front */
      const gr = g.createLinearGradient(0, h * (f.base - 0.02), 0, h);
      gr.addColorStop(0, `rgba(152,116,64,${(f.a * 0.55).toFixed(3)})`);
      gr.addColorStop(1, `rgba(138,102,52,${(f.a * 0.30).toFixed(3)})`);
      g.save();
      g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) g.lineTo(x, yAt(x));
      g.lineTo(w, h); g.closePath(); g.clip();
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.restore();
      /* the crest itself — concentrated pigment where the water stopped */
      for (let pass = 0; pass < 3; pass++) {
        g.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = yAt(x) + (pass === 0 ? -1.8 : pass === 1 ? 0 : 3.2);
          if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.strokeStyle = pass === 0
          ? `rgba(244,224,178,${(f.crest * 0.25).toFixed(3)})`
          : pass === 1
            ? `rgba(104,68,28,${f.crest.toFixed(3)})`
            : `rgba(132,90,38,${(f.crest * 0.36).toFixed(3)})`;
        g.lineWidth = pass === 0 ? 2.2 : pass === 1 ? 2.8 : 7;
        g.stroke();
      }
    }
    /* a lateral bloom finger climbing out of the lower outer corner */
    const bx = mir ? w * 0.14 : w * 0.86;
    const bg = g.createRadialGradient(bx, h * 0.78, 4, bx, h * 0.78, w * 0.42);
    bg.addColorStop(0, 'rgba(146,108,56,0.012)');
    bg.addColorStop(0.62, 'rgba(150,114,62,0.006)');
    bg.addColorStop(1, 'rgba(150,114,62,0)');
    g.fillStyle = bg; g.beginPath(); g.arc(bx, h * 0.78, w * 0.42, 0, 7); g.fill();
  });
}

/* ringed liquid stain: concentrated dark rim, lighter soaked middle */
function p1StainTex(mir, k) {
  k = k == null ? 1 : k;
  return SF.texURL('p1stain' + (mir ? '_m' : '') + '_k' + Math.round(k * 100), 300, 300, (g, w, h) => {
    g.globalAlpha = k;
    const cx = w / 2, cy = h / 2, R = w * 0.40;
    const body = g.createRadialGradient(cx, cy, 0, cx, cy, R);
    body.addColorStop(0, 'rgba(148,110,56,0.14)');
    body.addColorStop(0.72, 'rgba(140,102,50,0.20)');
    body.addColorStop(0.93, 'rgba(120,84,38,0.34)');
    body.addColorStop(1, 'rgba(120,84,38,0)');
    g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    /* irregular rim — a dried edge is never a perfect circle */
    const r = rnd(mir ? 733 : 732);
    g.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const rad = R * (0.90 + Math.sin(a * 3 + 0.7) * 0.05 + Math.sin(a * 7 + 2.1) * 0.03 + r() * 0.02);
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad * 0.92;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.strokeStyle = 'rgba(112,76,32,0.40)'; g.lineWidth = 3.2; g.stroke();
    g.strokeStyle = 'rgba(96,64,26,0.26)'; g.lineWidth = 1.2; g.stroke();
  });
}

/* hand smear: dragged graphite / skin oil, directional streaks */
function p1SmudgeTex(mir, k) {
  k = k == null ? 1 : k;
  return SF.texURL('p1smudge' + (mir ? '_m' : '') + '_k' + Math.round(k * 100), 360, 200, (g, w, h) => {
    g.globalAlpha = k;
    const r = rnd(911);
    if (mir) { g.translate(w, 0); g.scale(-1, 1); }
    for (let i = 0; i < 26; i++) {
      const y = h * (0.18 + r() * 0.64);
      const x0 = w * (0.05 + r() * 0.25), len = w * (0.28 + r() * 0.6);
      const a = (0.008 + r() * 0.018);
      g.strokeStyle = `rgba(${r() < 0.6 ? '68,62,54' : '86,78,66'},${a.toFixed(3)})`;
      g.lineWidth = 2 + r() * 9;
      g.beginPath();
      g.moveTo(x0, y);
      g.bezierCurveTo(x0 + len * 0.35, y - 6 + r() * 12, x0 + len * 0.7, y - 4 + r() * 10, x0 + len, y + (r() - 0.5) * 10);
      g.stroke();
    }
    /* denser heel of the smear where the hand pressed hardest */
    const gr = g.createRadialGradient(w * 0.28, h * 0.5, 2, w * 0.28, h * 0.5, w * 0.3);
    gr.addColorStop(0, 'rgba(60,54,46,0.04)');
    gr.addColorStop(1, 'rgba(60,54,46,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(w * 0.28, h * 0.5, w * 0.3, 0, 7); g.fill();
  });
}

/* extra accumulated history for page 1, painted ABOVE the standard surface
   (CSS background layers: first listed = topmost). Same vocabulary only.
   k < 1 paints the neighbouring echo of the same event on the sheets behind. */
function page1Extras(c, mirror, k) {
  k = k == null ? 1 : k;
  const B = (x, y, w, h, rgb, a) => SF.blot(mirror ? 100 - x : x, y, w, h, rgb, a * k);
  const L = [];
  /* the deliberate smear — a hand dragged across the lower middle */
  if (k > 0.5) L.push(SF.layer(p1SmudgeTex(mirror, k), '46% 17%', (mirror ? 22 : 78) + '% 70%'));
  /* the deliberate stain — ringed, soaked, upper middle of the sheet.
     On the echo sheets it reads as what soaked through, slightly softened. */
  L.push(SF.layer(p1StainTex(mirror, k), (k < 1 ? '33% 24%' : '30% 22%'), (mirror ? 62 : 38) + '% 34%'));
  /* older, fainter second spill lower on the sheet */
  L.push(SF.layer(p1StainTex(!mirror, k), '17% 13%', (mirror ? 22 : 78) + '% 86%'));
  /* humidity: tide lines + bloom, the strongest damp evidence in the book */
  L.push(SF.layer(p1TideTex(mirror, k * (k < 1 ? 0.8 : 1)), '100% 100%', '0 0'));
  /* deeper thumb accumulation on the outer / lower-outer contact band */
  L.push(B(97, 60, 13, 26, '96,78,50', 0.20));
  L.push(B(94, 92, 17, 14, '90,72,46', 0.17));
  L.push(B(90, 20, 14, 16, '98,80,52', 0.10));
  /* broad tonal grime rising from the lower edge */
  L.push(`linear-gradient(0deg, rgba(146,112,62,${(0.06 * k).toFixed(3)}) 0%, rgba(156,124,74,${(0.03 * k).toFixed(3)}) 16%, rgba(156,124,74,0) 42%)`);
  return L;
}


/* label used by the page footer so sheets can be reviewed one by one */
function label(idx, total) {
  const n = Math.max(1, Math.ceil((total || 12) / 2));
  const c = sheet(Math.floor(idx / 2), n);
  const fam = c.mix < 0.25 ? 'handled' : c.mix > 0.75 ? 'protected' : 'transition';
  const k = echoK(idx);
  const f = k === 1 ? ' · face+' : k ? ` · echo ${k.toFixed(2)}` : '';
  return `${fam} · exp ${c.exposure.toFixed(2)} · hum ${c.humid.toFixed(2)}${f}`;
}

/* the full CSS background shorthand for one page face */
function skin(idx, mirror, total) {
  const n = Math.max(1, Math.ceil((total || 12) / 2));
  const phys = sheet(Math.floor(idx / 2), n);
  const surf = faceSurfaceCondition(idx, phys);
  const base = SF.surface(surf, {mirror: !!mirror});
  const k = echoK(idx);
  if (!k) return base;
  return page1Extras(surf, !!mirror, k).join(', ') + ', ' + base;
}

/* no decorative damage children: in the lab language material loss is
   communicated by geometry (the stack's edge profile), not by pasted nicks. */
function damage() {}

return {sheet, skin, damage, label, faceSurfaceCondition, AGE, P1};
})();

