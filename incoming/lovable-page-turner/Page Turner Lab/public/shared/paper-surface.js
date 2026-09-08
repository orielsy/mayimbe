/* ======================================================================
   SHARED PAPER SURFACE — the Paper Lab's current (v2) surface language.
   ----------------------------------------------------------------------
   One paper stock, one global oxidation history, family + exposure driving
   surface history, humidity as a neighbourhood episode. This is the ONLY
   surface implementation the Paper Lab and the Lab-Native notebook use;
   the legacy window.LABPAPER recipes are untouched and unrelated.

   Every layer is a plain CSS background layer (gradients + cached canvas
   data URLs), so the notebook's computed-style clone -> SVG foreignObject
   rasterisation path can carry it into the WebGL page-turn texture.

   Mirroring: the lab renders a RIGHT-hand sheet (bound edge at the left,
   fore edge at the right). A left-hand notebook page is the same physical
   sheet seen from the other side, so horizontal coordinates flip. Pass
   {mirror:true} to surface(); with mirror false the output is identical to
   the lab's previous inline implementation.
   ==================================================================== */
(function () {
'use strict';
const {rnd, clamp01, lerp, STOCK} = window.PaperStack;
/* the selected exposed cut-edge oxidation target (0.62) */
const EDGE_OX = window.PaperStack.EDGE_OXIDATION == null ? STOCK.oxidation : window.PaperStack.EDGE_OXIDATION;

const TEX = new Map();
function texURL(key, w, h, draw) {
  let u = TEX.get(key); if (u) return u;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  u = `url("${c.toDataURL('image/png')}")`; TEX.set(key, u); return u;
}
const layer = (url, size, pos) => `${url} ${pos || '0 0'}/${size} no-repeat`;
const tile  = (url, size) => `${url} 0 0/${size} repeat`;

/* mirror state for the duration of one surfaceRaw() call */
let MIR = false;
const mx = x => (MIR ? 100 - x : x);
const mdeg = d => (MIR ? (360 - d) % 360 : d);   // flip a linear-gradient's x component

const blot = (x, y, w, h, rgb, a) =>
  `radial-gradient(${w}% ${h}% at ${mx(x)}% ${y}%, rgba(${rgb},${a.toFixed(3)}), rgba(${rgb},0) 70%)`;

/* ---------- stock fibre ---------- */
function fibreTile(seed, strength) {
  return texURL('fib' + seed + '_' + strength.toFixed(2), 200, 200, (g, w, h) => {
    const r = rnd(seed);
    g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      const x = r() * w, y = r() * h, len = 2 + r() * 11, ang = (r() - .5) * 0.9 + (r() < .5 ? 0 : Math.PI / 2);
      const a = (0.020 + r() * 0.045) * strength;
      g.strokeStyle = r() < .55 ? `rgba(120,102,72,${a.toFixed(3)})` : `rgba(255,252,240,${(a * 1.2).toFixed(3)})`;
      g.lineWidth = r() < .8 ? 0.7 : 1.2;
      g.beginPath();
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
        g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(ang) * len, y + dy + Math.sin(ang) * len);
      }
      g.stroke();
    }
    for (let i = 0; i < 220; i++) {
      const x = r() * w, y = r() * h, rad = 0.4 + r() * 1.1;
      g.fillStyle = `rgba(133,112,74,${(0.05 + r() * 0.08) * strength})`;
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { g.beginPath(); g.arc(x + dx, y + dy, rad, 0, 7); g.fill(); }
    }
  });
}

/* broad, low-frequency tonal drift — the book's shared environmental history */
function drift(seed, amount) {
  const L = []; const r = rnd(seed);
  for (let i = 0; i < 4; i++) {
    L.push(blot(r() * 100, r() * 100, 45 + r() * 45, 40 + r() * 45, '176,150,102', 0.05 * amount + r() * 0.05 * amount));
  }
  return L;
}

/* foxing — discrete rust specks with darker cores, denser toward the exposed
   edge, plus a few soft damp-borne clusters. */
function foxingTex(seed, density, mir) {
  return texURL('fox' + seed + '_' + density.toFixed(2) + (mir ? '_m' : ''), 420, 560, (g, w, h) => {
    const r = rnd(seed);
    const X = x => (mir ? w - x : x);
    const specks = Math.round(10 + density * 90);
    for (let i = 0; i < specks; i++) {
      const bias = r();
      const x = X(w * (bias < 0.45 ? 0.55 + 0.45 * r() : r()));
      const y = r() * h;
      const rad = 0.6 + r() * 1.9;
      const core = (0.20 + r() * 0.30) * Math.min(1, 0.35 + density * 0.75);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad * 3.1);
      gr.addColorStop(0, `rgba(150,100,50,${(core * 0.55).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(150,100,50,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad * 3.1, 0, 7); g.fill();
      g.fillStyle = `rgba(122,74,32,${core.toFixed(3)})`;
      g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    }
    const clusters = Math.round(1 + density * 4);
    for (let c = 0; c < clusters; c++) {
      const cx = X(r() * w), cy = r() * h, spread = 26 + r() * 80;
      const n = Math.round(4 + r() * 9 * density);
      for (let i = 0; i < n; i++) {
        const x = cx + (r() - .5) * spread, y = cy + (r() - .5) * spread;
        const rad = 0.9 + r() * 3.4;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad * 2.4);
        gr.addColorStop(0, `rgba(146,96,48,${(0.14 + r() * 0.18).toFixed(3)})`);
        gr.addColorStop(.5, `rgba(158,112,62,${(0.06 + r() * 0.08).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(158,112,62,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad * 2.4, 0, 7); g.fill();
      }
    }
  });
}

/* handling grime — where thumbs actually land: outer edge, mid height */
function grimeLayers(seed, amount) {
  if (amount <= 0) return [];
  const r = rnd(seed + 3);
  return [
    blot(96, 48 + (r() - .5) * 22, 16, 26, '106,88,58', 0.16 * amount),
    blot(92, 86, 20, 16, '98,80,52', 0.10 * amount),
    blot(88, 12, 16, 12, '98,80,52', 0.07 * amount),
    `linear-gradient(${mdeg(270)}deg, rgba(120,98,62,${(0.10 * amount).toFixed(3)}), rgba(120,98,62,0) 26%)`,
  ];
}

/* edge oxidation — exposure darkening, strongest on the fore edge */
function edgeLayers(amount, ox) {
  const a = amount * ox;
  return [
    `linear-gradient(${mdeg(270)}deg, rgba(120,88,44,${(0.42 * a).toFixed(3)}) 0%, rgba(150,116,66,${(0.26 * a).toFixed(3)}) 3%, rgba(168,136,84,${(0.10 * a).toFixed(3)}) 7%, rgba(168,136,84,0) 15%)`,
    `linear-gradient(0deg, rgba(126,94,48,${(0.30 * a).toFixed(3)}) 0%, rgba(158,124,72,${(0.12 * a).toFixed(3)}) 4%, rgba(168,136,84,0) 11%)`,
    `linear-gradient(180deg, rgba(140,108,58,${(0.24 * a).toFixed(3)}) 0%, rgba(168,136,84,0) 9%)`,
    blot(97, 3, 16, 13, '118,86,42', 0.30 * a),
    blot(96, 97, 18, 14, '112,80,40', 0.34 * a),
  ];
}

/* humidity: bloom fronts + tide lines from the lower edge */
function humidLayers(seed, amount) {
  if (amount <= 0) return [];
  const r = rnd(seed + 11); const L = [];
  L.push(`linear-gradient(0deg, rgba(150,116,66,${(0.16 * amount).toFixed(3)}) 0%, rgba(160,128,78,${(0.09 * amount).toFixed(3)}) 9%, rgba(160,128,78,0) 30%)`);
  for (let i = 0; i < 3; i++) {
    L.push(blot(12 + r() * 76, 78 + r() * 22, 34 + r() * 30, 22 + r() * 18, '150,114,62', 0.10 * amount));
  }
  return L;
}

function stainLayers(seed, strength) {
  const r = rnd(seed + 29);
  const x = 18 + r() * 62, y = 18 + r() * 58, w = 8 + r() * 11, h = 7 + r() * 10;
  return [
    blot(x, y, w * 1.35, h * 1.35, '138,104,54', 0.10 * strength),
    blot(x, y, w, h, '126,92,46', 0.16 * strength),
    blot(x + w * 0.25, y + h * 0.2, w * 0.45, h * 0.45, '112,80,38', 0.12 * strength),
  ];
}

function smudgeLayers(seed, strength) {
  const r = rnd(seed + 41);
  const x = 22 + r() * 54, y = 24 + r() * 52;
  return [blot(x, y, 14 + r() * 9, 5 + r() * 4, '72,66,58', 0.14 * strength),
          blot(x + 4, y + 2, 8, 3, '62,56,50', 0.10 * strength)];
}

/* a crease event — a soft valley running in from the outer edge near a corner */
function creaseTex(seed, mir) {
  return texURL('cr' + seed + (mir ? '_m' : ''), 320, 320, (g, w, h) => {
    const r = rnd(seed);
    if (mir) { g.translate(w, 0); g.scale(-1, 1); }
    const ay = h * (.25 + r() * .5), bx = w * (.42 + r() * .45), by = ay + (r() - .5) * h * .3;
    const N = 70, pt = i => {
      const t = i / N; const x = 0 + (bx) * t, y = ay + (by - ay) * t;
      const dx = bx, dy = by - ay, len = Math.hypot(dx, dy) || 1;
      return [x - dy / len * Math.sin(t * 2.3) * 6, y + dx / len * Math.sin(t * 2.3) * 6];
    };
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) {
      const [x1, y1] = pt(i), [x2, y2] = pt(i + 1);
      const a = Math.max(0, 1 - i / N) ** .8 * (pass ? .26 : .44);
      g.strokeStyle = pass ? `rgba(96,76,42,${a.toFixed(3)})` : `rgba(255,254,247,${a.toFixed(3)})`;
      g.lineWidth = pass ? 2 : 1.3; g.beginPath(); g.moveTo(x1, y1 + (pass ? 1.2 : -1)); g.lineTo(x2, y2 + (pass ? 1.2 : -1)); g.stroke();
    }
  });
}

/* ---------- surface ---------- */
const SURFACE_CACHE = new Map();
function surface(c, opts) {
  const mir = !!(opts && opts.mirror);
  const ev = c.events || {};
  const key = [c.seed, c.tone, c.grime, c.edge, c.foxing, c.humid, c.fibre,
    ev.crease || 0, ev.smudge || 0, ev.stain || 0].map(v => (+v || 0).toFixed(5)).join('|') + (mir ? '|m' : '');
  let v = SURFACE_CACHE.get(key);
  if (v === undefined) { v = surfaceRaw(c, mir); SURFACE_CACHE.set(key, v); }
  return v;
}
function surfaceRaw(c, mir) {
  MIR = !!mir;
  const ev = c.events || {};
  const L = [];
  if (ev.crease) L.push(layer(creaseTex(c.seed + 5, MIR), '46% 40%', (MIR ? '0%' : '100%') + ' 100%'));
  if (ev.smudge) L.push(...smudgeLayers(c.seed, ev.smudge));
  if (ev.stain)  L.push(...stainLayers(c.seed, ev.stain));
  L.push(...grimeLayers(c.seed, c.grime));
  if (c.foxing > 0.05) L.push(tile(foxingTex(c.seed + 13, clamp01(c.foxing), MIR), '100% 100%'));
  L.push(...humidLayers(c.seed, c.humid));
  L.push(...edgeLayers(c.edge, EDGE_OX));
  L.push(...drift(c.seed + 2, c.tone));
  L.push(tile(fibreTile(STOCK.seed, STOCK.fibre * c.fibre), '150px 150px'));
  /* No painted contact rim: segmented strokes on this straight texture edge
     read as periodic dark marks, while its bottom run reads as one continuous
     rule. The clipped page silhouette supplies the physical boundary; these
     remaining layers provide only broad, soft oxidation inside it. */
  const t = clamp01(STOCK.oxidation * 0.5 + c.tone * 0.35);
  const base = STOCK.base.map((v, i) => Math.round(lerp(v, STOCK.warm[i], t)));
  L.push(`linear-gradient(168deg, rgb(${base.join(',')}), rgb(${base.map(v => v - 6).join(',')}))`);
  MIR = false;
  return L.join(', ');
}

window.PaperSurface = {
  texURL, layer, tile, blot, fibreTile, drift, foxingTex, grimeLayers,
  edgeLayers, humidLayers, stainLayers, smudgeLayers, creaseTex, surface, surfaceRaw,
};
})();
