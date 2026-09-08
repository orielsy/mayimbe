// @ts-nocheck -- mechanically ported from the frozen lab JS; typed at the public API boundary (types.ts) only.
/* ======================================================================
   FINAL COVER PRESET — F3-03 "Slightly more scuffed" (Brick)
   ----------------------------------------------------------------------
   F3-03 is the SELECTED FINAL COVER DIRECTION for the notebook, chosen out
   of the /material-lab study. The production notebook cover is built from
   this preset. Source of truth: public/material-lab/index.html (section
   "F3 - Brick finalists"), sample F3-03.

   This file is a verbatim extraction of the lab primitives + wear families
   needed to reproduce that sample. Do not "improve" it here; if the
   direction changes, change it in the lab first and re-extract.
   ==================================================================== */

/* ---------- deterministic primitives ---------- */
function rnd(seed) {
  let s = (Math.abs(Math.floor(seed * 1000)) * 2654435761 % 2147483647) || 7;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}
const hash1 = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const h2 = (n, k) => hash1(n * 13.37 + k * 7.77 + 5.5);
const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
const clamp01 = v => Math.max(0, Math.min(1, v));

const TEXCACHE = new Map();
function texURL(key, w, h, draw) {
  let u = TEXCACHE.get(key);
  if (u) return u;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  u = `url("${c.toDataURL('image/png')}")`;
  TEXCACHE.set(key, u);
  return u;
}
function wrapped(g, w, h, items, draw) {
  for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
    g.save(); g.translate(dx, dy);
    for (const it of items) draw(it);
    g.restore();
  }
}
const many = (n, r, make) => Array.from({ length: n }, () => make(r));
const layer = (img, size, pos) => `${img} ${pos || '0 0'} / ${size} no-repeat`;
const tile = (img, size) => `${img} 0 0 / ${size} repeat`;

/* ======================================================================
   MICRO TEXTURES (canvas -> data URL)
   ==================================================================== */

/* leather: irregular pebbling, never a stripe */
function leatherTile(seed, density, contrast) {
  return texURL(`lea${seed}_${density}_${contrast}`, 160, 160, (g, w, h) => {
    const r = rnd(seed);
    const cells = many(density, r, r0 => ({
      x: r0() * w, y: r0() * h, rad: 1.5 + r0() * 4.4, sq: .55 + r0() * .65,
      rot: r0() * 3, d: (.05 + r0() * .10) * contrast, l: (.03 + r0() * .06) * contrast,
      lw: .6 + r0() * .8
    }));
    wrapped(g, w, h, cells, c => {
      g.lineWidth = c.lw;
      g.strokeStyle = `rgba(24,15,6,${c.d.toFixed(3)})`;
      g.beginPath(); g.ellipse(c.x, c.y, c.rad, c.rad * c.sq, c.rot, 0, 7); g.stroke();
      g.strokeStyle = `rgba(255,232,190,${c.l.toFixed(3)})`;
      g.beginPath(); g.ellipse(c.x - .7, c.y - .8, c.rad * .78, c.rad * .52, c.rot, 0, 7); g.stroke();
    });
  });
}

/* book cloth / board: dry fibres, no weave rhythm */
function clothTile(seed, density) {
  return texURL(`clo${seed}_${density}`, 128, 128, (g, w, h) => {
    const r = rnd(seed);
    const fib = many(density, r, r0 => ({
      x: r0() * w, y: r0() * h, a: r0() * Math.PI, len: 2 + r0() * 11,
      dark: r0() > .5, al: .04 + r0() * .08, lw: .55 + r0() * .8
    }));
    wrapped(g, w, h, fib, f => {
      g.lineWidth = f.lw;
      g.strokeStyle = f.dark ? `rgba(20,12,5,${f.al.toFixed(3)})`
                             : `rgba(240,218,178,${(f.al * .8).toFixed(3)})`;
      g.beginPath(); g.moveTo(f.x, f.y);
      g.lineTo(f.x + Math.cos(f.a) * f.len, f.y + Math.sin(f.a) * f.len); g.stroke();
    });
  });
}

/* ======================================================================
   BOARD-CLOTH FIBRE PRIMITIVES
   ----------------------------------------------------------------------
   Descendants of clothTile(): dry, irregular, non-woven fibres. There is
   deliberately no warp/weft rhythm here — this is an old notebook board
   covering, not a piece of upholstery.
   ==================================================================== */

/* Parametric fibre field. Everything the original clothTile() does, but with
   fibre length / width / density / contrast / light-dark ratio exposed so a
   study can shift the fibre scale without changing the material. */
function fibreTile(seed, o = {}) {
  const {
    density = 260, len = 11, minLen = 2, lw = .55, lwVar = .8,
    contrast = 1, lite = .5, size = 128, curl = 0,
  } = o;
  const key = `fib${seed}_${density}_${len}_${minLen}_${lw}_${lwVar}_${contrast}_${lite}_${size}_${curl}`;
  return texURL(key, size, size, (g, w, h) => {
    const r = rnd(seed);
    const fib = many(density, r, r0 => ({
      x: r0() * w, y: r0() * h, a: r0() * Math.PI, len: minLen + r0() * len,
      dark: r0() > lite, al: (.04 + r0() * .08) * contrast,
      lw: lw + r0() * lwVar, bend: (r0() - .5) * curl,
    }));
    wrapped(g, w, h, fib, f => {
      g.lineWidth = f.lw;
      g.lineCap = 'round';
      g.strokeStyle = f.dark ? `rgba(20,12,5,${f.al.toFixed(3)})`
                             : `rgba(240,218,178,${(f.al * .8).toFixed(3)})`;
      const ex = f.x + Math.cos(f.a) * f.len, ey = f.y + Math.sin(f.a) * f.len;
      g.beginPath(); g.moveTo(f.x, f.y);
      if (curl) {
        g.quadraticCurveTo((f.x + ex) / 2 - Math.sin(f.a) * f.bend,
                           (f.y + ey) / 2 + Math.cos(f.a) * f.bend, ex, ey);
      } else g.lineTo(ex, ey);
      g.stroke();
    });
  });
}

/* A localised handling zone: fibres flattened and slightly polished where a
   hand keeps landing. Soft-edged, no rectangle, no repeating motif. */
function rubZone(seed, strength) {
  return texURL(`rz${seed}_${strength}`, 200, 200, (g, w, h) => {
    const r = rnd(seed);
    const cx = w / 2, cy = h / 2;
    g.save();
    g.beginPath();
    for (let a = 0; a <= 6.3; a += .18) {
      const rad = (58 + Math.sin(a * 2.3 + seed) * 12 + Math.sin(a * 3.7) * 9) * (.85 + r() * .3);
      const x = cx + Math.cos(a) * rad * 1.28, y = cy + Math.sin(a) * rad * 1.05;
      a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.closePath(); g.clip();
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 108);
    gr.addColorStop(0, `rgba(228,208,170,${(.20 * strength).toFixed(3)})`);
    gr.addColorStop(.6, `rgba(220,198,158,${(.09 * strength).toFixed(3)})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // fibres lie down: short, low-contrast, aligned-ish strokes
    for (let i = 0; i < 260; i++) {
      const d = r() * r() * 96, a = r() * 6.3;
      const x = cx + Math.cos(a) * d * 1.3, y = cy + Math.sin(a) * d * 1.05;
      g.lineWidth = .5 + r() * .7;
      g.strokeStyle = r() > .4
        ? `rgba(236,216,178,${(.05 + r() * .12 * strength).toFixed(3)})`
        : `rgba(28,18,8,${(.03 + r() * .07 * strength).toFixed(3)})`;
      const ang = .25 + (r() - .5) * .5, l = 2 + r() * 5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * l, y + Math.sin(ang) * l); g.stroke();
    }
    g.restore();
  });
}

/* Edge-connected handling wear.
   A narrow, irregular band of compressed/polished fibres that grows out of a
   physical edge (where fingers and palms actually land) and fades inward.
   Never a closed shape: it is anchored to the edge, varies in depth along its
   length, and dissolves before it reaches the middle of the cover. */
function handlingEdgeWear(seed, edge, strength, o = {}) {
  const {
    depth = .09,          // max inward reach, fraction of the short axis
    cornerA = 0,          // extra weight at the start of the edge (0..1)
    cornerB = .6,         // extra weight at the end of the edge
    dark = .35,           // how much restrained darkening vs. polishing
    scuff = 1,            // directional micro-scuffing amount
    light = 1,            // brightness of the polished highlight band
  } = o;
  const W = 360, H = 480;
  const key = `hew${seed}_${edge}_${strength}_${depth}_${cornerA}_${cornerB}_${dark}_${scuff}_${light}`;
  return texURL(key, W, H, (g, w, h) => {
    const r = rnd(seed);
    const along = (edge === 'right' || edge === 'left') ? h : w;
    const maxD = depth * Math.min(w, h);
    // map edge-space (u along edge 0..1, v inward in px) into canvas space
    const map = (u, v) => {
      if (edge === 'right')  return [w - v, u * h];
      if (edge === 'left')   return [v, u * h];
      if (edge === 'bottom') return [u * w, h - v];
      return [u * w, v];
    };
    // irregular depth/intensity profile: slow random walk + a few quiet gaps
    const N = 240;
    const prof = new Array(N);
    let d = .4 + r() * .4, i0 = .4 + r() * .4;
    const gaps = [];
    for (let k = 0; k < 3; k++) gaps.push([r(), .04 + r() * .09]);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      d = Math.min(1, Math.max(.05, d + (r() - .5) * .16));
      i0 = Math.min(1, Math.max(0, i0 + (r() - .5) * .18));
      let q = 1;
      for (const [gu, gw] of gaps) q *= 1 - .85 * Math.exp(-((u - gu) ** 2) / (2 * gw * gw));
      const corner = 1 + cornerA * Math.exp(-(u ** 2) / .012) + cornerB * Math.exp(-((1 - u) ** 2) / .012);
      prof[i] = { d: d * corner * q, i: i0 * corner * q };
    }
    const step = along / (N - 1);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), p = prof[i];
      const vd = Math.max(1, p.d * maxD);
      const [x0, y0] = map(u, 0), [x1, y1] = map(u, vd);
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      const a = .22 * light * strength * p.i;
      const mx = (c0, c1) => Math.round(c0 + (c1 - c0) * (1 - light));
      gr.addColorStop(0, `rgba(${mx(232,190)},${mx(214,172)},${mx(178,138)},${a.toFixed(3)})`);
      gr.addColorStop(.45, `rgba(${mx(226,186)},${mx(206,168)},${mx(168,134)},${(a * .45).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.strokeStyle = gr;
      g.lineWidth = step * 1.6;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      // restrained grime right at the contact edge
      if (dark) {
        const gd = g.createLinearGradient(x0, y0, ...map(u, vd * .45));
        const ad = .10 * strength * dark * p.i;
        gd.addColorStop(0, `rgba(38,26,12,${ad.toFixed(3)})`);
        gd.addColorStop(1, 'rgba(0,0,0,0)');
        g.strokeStyle = gd;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(...map(u, vd * .45)); g.stroke();
      }
    }
    // micro-scuffs lying parallel to the edge, densest at the contact line
    const n = Math.round(420 * scuff);
    for (let i = 0; i < n; i++) {
      const u = r(), p = prof[Math.min(N - 1, Math.round(u * (N - 1)))];
      if (r() > p.i * .95) continue;
      const v = r() * r() * Math.max(1, p.d * maxD);
      const [x, y] = map(u, v);
      const len = 2 + r() * 7;
      const [x2, y2] = map(u + (r() - .5) * (len / along) * 2, v + (r() - .5) * 1.6);
      g.lineWidth = .4 + r() * .6;
      g.strokeStyle = r() > .35
        ? `rgba(240,222,186,${(.05 + r() * .10 * strength).toFixed(3)})`
        : `rgba(30,20,9,${(.03 + r() * .06 * strength).toFixed(3)})`;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    }
  });
}



/* Uneven pigment loss: large soft irregular areas that lost dye, with a few
   protected zones that stayed dark. Not a uniform desaturation. */
function fadeField(seed, strength) {
  return texURL(`fd${seed}_${strength}`, 256, 256, (g, w, h) => {
    const r = rnd(seed);
    const blobs = [];
    for (let i = 0; i < 14; i++) {
      blobs.push({ x: r() * w, y: r() * h, rx: 30 + r() * 90, ry: 24 + r() * 80,
        rot: r() * 3, lite: r() > .32, a: .06 + r() * .16 });
    }
    wrapped(g, w, h, blobs, b => {
      const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, Math.max(b.rx, b.ry));
      gr.addColorStop(0, b.lite ? `rgba(226,206,168,${b.a.toFixed(3)})`
                                : `rgba(44,30,14,${(b.a * .8).toFixed(3)})`);
      gr.addColorStop(.6, b.lite ? `rgba(220,198,158,${(b.a * .4).toFixed(3)})` : 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.save(); g.translate(b.x, b.y); g.rotate(b.rot);
      g.beginPath(); g.ellipse(0, 0, b.rx, b.ry, 0, 0, 7); g.fill(); g.restore();
    });
    // directional bleaching, as if one side faced the light: broad, soft and
    // wandering, never a straight scan line
    for (let i = 0; i < 18; i++) {
      const y = r() * h, len = 60 + r() * 150, x0 = r() * w - len / 2;
      const rad = 10 + r() * 26;
      const gr2 = g.createLinearGradient(x0, y, x0 + len, y);
      const a = (.012 + r() * .026).toFixed(3);
      gr2.addColorStop(0, 'rgba(232,214,178,0)');
      gr2.addColorStop(.5, `rgba(232,214,178,${a})`);
      gr2.addColorStop(1, 'rgba(232,214,178,0)');
      g.strokeStyle = gr2;
      g.lineWidth = rad; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y);
      g.quadraticCurveTo(x0 + len * .5, y + (r() - .5) * 40, x0 + len, y + (r() - .5) * 26);
      g.stroke();
    }
    g.globalAlpha = 1;
  });
}

/* Swelling / tonal drift from humidity: broad soft undulation plus slightly
   irregular thread relief. No spots, no mould. */
function humidDrift(seed) {
  return texURL('hd' + seed, 256, 256, (g, w, h) => {
    const r = rnd(seed);
    const items = many(11, r, r0 => ({
      x: r0() * w, y: r0() * h, rx: 45 + r0() * 90, ry: 35 + r0() * 80,
      dark: r0() > .48, a: .05 + r0() * .10
    }));
    wrapped(g, w, h, items, b => {
      const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, Math.max(b.rx, b.ry));
      gr.addColorStop(0, b.dark ? `rgba(58,40,18,${b.a.toFixed(3)})` : `rgba(198,176,136,${b.a.toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, 7); g.fill();
    });
    // waviness: gentle ridges where the cloth swelled over the board
    for (let i = 0; i < 16; i++) {
      const y0 = r() * h;
      g.lineWidth = 8 + r() * 16;
      g.strokeStyle = `rgba(${r() > .5 ? '250,236,206' : '34,22,10'},${(.012 + r() * .020).toFixed(3)})`;
      g.beginPath(); g.moveTo(-10, y0);
      for (let x = 0; x <= w + 10; x += 32) g.lineTo(x, y0 + Math.sin(x * .03 + i) * (3 + r() * 5));
      g.stroke();
    }
  });
}

/* Pressure marks: dents/creases from being packed against other objects. */
function pressureMarks(seed, count, strength) {
  return texURL(`pm${seed}_${count}_${strength}`, 256, 256, (g, w, h) => {
    const r = rnd(seed);
    for (let i = 0; i < count; i++) {
      const x = r() * w, y = r() * h, a = r() * 3.14, len = 30 + r() * 120;
      const dx = Math.cos(a), dy = Math.sin(a);
      g.lineCap = 'round';
      g.lineWidth = 2 + r() * 3;
      g.strokeStyle = `rgba(26,17,7,${(.10 + r() * .12) * strength})`;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + dx * len * .5 - dy * 8, y + dy * len * .5 + dx * 8, x + dx * len, y + dy * len);
      g.stroke();
      g.lineWidth = 1.4 + r() * 2;
      g.strokeStyle = `rgba(250,234,200,${(.08 + r() * .10) * strength})`;
      g.beginPath(); g.moveTo(x - dy * 2.6, y + dx * 2.6);
      g.quadraticCurveTo(x + dx * len * .5 - dy * 10.6, y + dy * len * .5 + dx * 10.6,
        x + dx * len - dy * 2.6, y + dy * len + dx * 2.6);
      g.stroke();
    }
  });
}

/* Broken pressure history: old fold-memory / compression read as a series of
   short interrupted impressions rather than one drawn line. Each "event" is a
   slightly wandering path chopped into segments with gaps, drawn as a shallow
   shadow/highlight pair so it reads as flattened fibre, not ink. Kept short,
   off-axis and biased away from the exact centre. */
function brokenPressureMark(seed, count, strength, o = {}) {
  const { maxLen = .22, edgeBias = .55 } = o;
  const W = 360, H = 480;
  const key = `bpm${seed}_${count}_${strength}_${maxLen}_${edgeBias}`;
  return texURL(key, W, H, (g, w, h) => {
    const r = rnd(seed);
    g.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      // anchor: pushed outward from centre so nothing sits dead-centre
      let x = r() * w, y = r() * h;
      const cx = w / 2, cy = h / 2;
      x = cx + (x - cx) * (1 + edgeBias);
      y = cy + (y - cy) * (1 + edgeBias);
      x = Math.min(w - 8, Math.max(8, x));
      y = Math.min(h - 8, Math.max(8, y));
      const a = r() * Math.PI, dx = Math.cos(a), dy = Math.sin(a);
      const total = (.07 + r() * (maxLen - .07)) * Math.min(w, h) * 2.2;
      const segs = 3 + Math.floor(r() * 4);
      let t = 0;
      for (let s0 = 0; s0 < segs; s0++) {
        const segLen = total / segs * (.35 + r() * .6);
        const gap = total / segs * (.25 + r() * .7);
        const wob = (r() - .5) * 5;
        const x0 = x + dx * t - dy * wob, y0 = y + dy * t + dx * wob;
        t += segLen;
        const wob2 = (r() - .5) * 5;
        const x1 = x + dx * t - dy * wob2, y1 = y + dy * t + dx * wob2;
        t += gap;
        const fade = (.35 + r() * .65) * strength;
        // shallow shadow
        g.lineWidth = .8 + r() * 1.1;
        g.strokeStyle = `rgba(30,20,9,${(.035 + r() * .05) * fade})`;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        // paired highlight, offset by a hair — compressed fibre catching light
        g.lineWidth = .7 + r() * .9;
        g.strokeStyle = `rgba(246,230,198,${(.030 + r() * .045) * fade})`;
        g.beginPath();
        g.moveTo(x0 - dy * 1.5, y0 + dx * 1.5);
        g.lineTo(x1 - dy * 1.5, y1 + dx * 1.5);
        g.stroke();
      }
    }
  });
}

/* paper: soft mottling + fibres + specks */
function paperTile(seed, mott, fibres, specks) {
  return texURL(`pap${seed}_${mott}_${fibres}_${specks}`, 128, 128, (g, w, h) => {
    const r = rnd(seed);
    const blobs = many(mott, r, r0 => ({
      x: r0() * w, y: r0() * h, rad: 9 + r0() * 27, dark: r0() > .45, a: .035 + r0() * .03
    }));
    wrapped(g, w, h, blobs, b => {
      const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.rad);
      gr.addColorStop(0, b.dark ? `rgba(126,102,58,${b.a.toFixed(3)})`
                                : `rgba(255,252,240,${(b.a * 1.15).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.rad, 0, 7); g.fill();
    });
    const fib = many(fibres, r, r0 => ({
      x: r0() * w, y: r0() * h, a: r0() * Math.PI, len: 3 + r0() * 15,
      bx: (r0() - .5) * 3, by: (r0() - .5) * 3, light: r0() > .5,
      al: .028 + r0() * .055, lw: .5 + r0() * .55
    }));
    wrapped(g, w, h, fib, f => {
      g.strokeStyle = f.light ? `rgba(255,253,244,${(f.al + .02).toFixed(3)})`
                              : `rgba(112,90,52,${f.al.toFixed(3)})`;
      g.lineWidth = f.lw;
      g.beginPath(); g.moveTo(f.x, f.y);
      g.quadraticCurveTo(f.x + Math.cos(f.a) * f.len * .5 + f.bx,
                         f.y + Math.sin(f.a) * f.len * .5 + f.by,
                         f.x + Math.cos(f.a) * f.len, f.y + Math.sin(f.a) * f.len);
      g.stroke();
    });
    const sp = many(specks, r, r0 => ({
      x: r0() * w, y: r0() * h, rad: .25 + r0() * .7, al: .05 + r0() * .11
    }));
    wrapped(g, w, h, sp, s => {
      g.fillStyle = `rgba(104,82,44,${s.al.toFixed(3)})`;
      g.beginPath(); g.arc(s.x, s.y, s.rad, 0, 7); g.fill();
    });
  });
}

/* foxing: sparse rust-brown spot clusters, organically distributed */
function foxTile(seed, clusters) {
  return texURL(`fox${seed}_${clusters}`, 256, 256, (g, w, h) => {
    const r = rnd(seed);
    const items = [];
    for (let c = 0; c < clusters; c++) {
      const cx = r() * w, cy = r() * h, n = 2 + Math.floor(r() * 6);
      for (let i = 0; i < n; i++) {
        items.push({
          x: cx + (r() - .5) * 34, y: cy + (r() - .5) * 34,
          rad: .8 + r() * r() * 3.4, a: .10 + r() * .22,
          warm: r() > .35
        });
      }
    }
    wrapped(g, w, h, items, s => {
      const gr = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.rad * 2.2);
      const col = s.warm ? '150,96,44' : '116,84,44';
      gr.addColorStop(0, `rgba(${col},${s.a.toFixed(3)})`);
      gr.addColorStop(.5, `rgba(${col},${(s.a * .35).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(s.x, s.y, s.rad * 2.2, s.rad * 1.9, s.a * 9, 0, 7); g.fill();
    });
  });
}

/* interrupted scratches + rubbed patches, stretched over the whole surface */
function scratchLayer(seed, count, patches, bright) {
  return texURL(`scr${seed}_${count}_${patches}_${bright}`, 480, 320, (g, w, h) => {
    const r = rnd(seed);
    for (let i = 0; i < count; i++) {
      const x = r() * w, y = r() * h, a = (r() - .5) * 3.0, len = 8 + r() * r() * 110;
      const lite = r() > (1 - bright);
      g.strokeStyle = lite ? `rgba(238,210,162,${(.10 + r() * .24).toFixed(3)})`
                           : `rgba(20,12,5,${(.10 + r() * .24).toFixed(3)})`;
      g.lineWidth = .4 + r() * 1.2;
      g.beginPath();
      let px = x, py = y;
      const steps = 3 + Math.floor(r() * 5);
      for (let k = 0; k < steps; k++) {
        const nx = px + Math.cos(a) * (len / steps) + (r() - .5) * 5;
        const ny = py + Math.sin(a) * (len / steps) + (r() - .5) * 5;
        if (r() > .26) { g.moveTo(px, py); g.lineTo(nx, ny); }   // interrupted
        px = nx; py = ny;
      }
      g.stroke();
    }
    for (let i = 0; i < patches; i++) {
      const x = r() * w, y = r() * h, rad = 14 + r() * 52;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(228,198,150,${(.05 + r() * .11).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(x, y, rad, rad * (.35 + r() * .55), r() * 3, 0, 7); g.fill();
    }
  });
}

/* corner abrasion, anchored per corner so the rub sits where the corner is.
   soft (0..1): mutes the bright highlight + reduces lite-particle density so
   the color shift reads as gentle tonal wear instead of a harsh bright pop.
   soft=0 keeps the original (A2/A3) behavior unchanged. */
function cornerAbrasion(seed, ax, ay, strength, soft = 0) {
  return texURL(`cor${seed}_${ax}${ay}_${strength}_${soft.toFixed(2)}_b2`, 128, 128, (g, w, h) => {
    const r = rnd(seed);
    const cx = ax * w, cy = ay * h;
    const s = soft;
    const hiCol = [
      Math.round(230 - (230 - 198) * s),
      Math.round(200 - (200 - 168) * s),
      Math.round(152 - (152 - 122) * s),
    ];
    const hiA = (.26 - .11 * s) * strength;
    const midCol = [
      Math.round(214 - (214 - 182) * s),
      Math.round(182 - (182 - 150) * s),
      Math.round(132 - (132 - 106) * s),
    ];
    const midA = (.08 - .02 * s) * strength;
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 104);
    gr.addColorStop(0, `rgba(${hiCol[0]},${hiCol[1]},${hiCol[2]},${hiA.toFixed(3)})`);
    gr.addColorStop(.55, `rgba(${midCol[0]},${midCol[1]},${midCol[2]},${midA.toFixed(3)})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const liteCol = [
      Math.round(240 - (240 - 214) * s),
      Math.round(214 - (214 - 188) * s),
      Math.round(170 - (170 - 148) * s),
    ];
    // soft, blurred particulate — reads as grainy abrasion, not pinprick dots
    g.filter = 'blur(1.7px)';
    for (let i = 0; i < 220; i++) {
      const d = r() * r() * 120, a = r() * Math.PI / 2;
      const x = cx + (ax ? -1 : 1) * Math.cos(a) * d;
      const y = cy + (ay ? -1 : 1) * Math.sin(a) * d;
      const lite = r() > (.45 + .16 * s);   // fewer bright dots as soft rises
      g.fillStyle = lite
        ? `rgba(${liteCol[0]},${liteCol[1]},${liteCol[2]},${(.05 + r() * (.20 - .07 * s) * strength).toFixed(3)})`
        : `rgba(28,18,8,${(.05 + r() * .22 * strength).toFixed(3)})`;
      g.beginPath(); g.arc(x, y, .6 + r() * 2.2, 0, 7); g.fill();
    }
    g.filter = 'none';
  });
}

/* micro-abrasion dust: soft chalky smudges for chipped edge finishes */
function chipTile(seed) {
  return texURL('chip2' + seed, 96, 96, (g, w, h) => {
    const r = rnd(seed);
    const pts = many(260, r, r0 => ({
      x: r0() * w, y: r0() * h, rad: .3 + r0() * 1.5,
      lite: r0() > .4, al: .06 + r0() * .26
    }));
    g.filter = 'blur(1.6px)';
    wrapped(g, w, h, pts, p => {
      g.fillStyle = p.lite ? `rgba(232,206,162,${p.al.toFixed(3)})`
                           : `rgba(22,14,6,${p.al.toFixed(3)})`;
      g.beginPath(); g.arc(p.x, p.y, p.rad, 0, 7); g.fill();
    });
    g.filter = 'none';
  });
}

/* ======================================================================
   MACRO / MEDIUM HELPERS (gradient layers)
   ==================================================================== */
const blot = (x, y, rx, ry, col, a) =>
  `radial-gradient(${rx}% ${ry}% at ${x}% ${y}%, rgba(${col},${a.toFixed(3)}),` +
  ` rgba(${col},${(a * .35).toFixed(3)}) 55%, transparent 80%)`;

/* soft ellipse wear zones along an edge — soft in BOTH axes, so no bands */
function patchyEdge(seed, side, k, amount) {   // side: 0 (left) or 100 (right)
  const L = [];
  const r = rnd(seed);
  let y = 0, z = 0;
  while (y < 100) {
    const hgt = 7 + r() * 22;
    const inten = r();
    if (inten > .3) {
      L.push(blot(side, y + hgt / 2, 9 + r() * 14, hgt * .8, k, .30 * amount * inten));
    }
    y += hgt; z++;
  }
  return L;
}

/* Edge-aging layers for the sandbox: perimeter abrasion + a vignette that
   scales with the "edge" control. Applied to both cover and paper surfaces
   so the slider reads on the whole sample, not just a faint paper edge. */
function edgeAging(edge, s, dark, light) {
  if (edge <= 0.02) return [];
  const L = [];
  L.push(...patchyEdge(901, 100, light, 1.1 * edge * s));
  L.push(...patchyEdge(902, 0, dark, 0.8 * edge * s));
  L.push(`radial-gradient(118% 110% at 50% 50%, transparent 60%, rgba(${dark},${(.20 * edge * s).toFixed(3)}) 100%)`);
  return L;
}

/* A corner fold crease. Real notebook pages crease where they get bent by
   hand or by a bag: across a corner, or in from the outer edge near a corner.
   Never a clean line through the middle of the sheet. The tile is drawn
   corner-anchored so it can be parked on whichever corner we pick. */
function creaseCorner(seed) {
  // corner: 0 TL, 1 TR, 2 BR, 3 BL -- right-side corners only: the left side
  // of these sheets is the bound spine and should stay crease-free
  return h2(seed, 11) < .55 ? 1 : 2;
}
function creaseTex(seed, corner) {
  return texURL('crn' + seed + '_' + corner, 320, 320, (g, w, h) => {
    const r = rnd(seed);
    // work in a space where the corner sits at (0,0), then mirror into place
    const fx = (corner === 1 || corner === 2) ? -1 : 1;
    const fy = (corner === 2 || corner === 3) ? -1 : 1;
    g.translate(fx < 0 ? w : 0, fy < 0 ? h : 0);
    g.scale(fx, fy);

    // fold chord: from a point down the vertical edge to a point along the top
    const acrossCorner = r() > .3;
    let ax, ay, bx, by;
    if (acrossCorner) {
      ay = h * (.30 + r() * .55); ax = 0;
      bx = w * (.28 + r() * .58); by = 0;
    } else {
      // a bend running in from the outer edge, dying out mid-sheet
      ay = h * (.18 + r() * .5); ax = 0;
      bx = w * (.45 + r() * .45); by = ay + (r() - .5) * h * .35;
    }
    const dieOut = !acrossCorner;
    const wob = 3 + r() * 7;
    const ph = r() * 6;
    const N = 80;
    const pt = i => {
      const t = i / N;
      const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const bend = Math.sin(t * 2.4 + ph) * wob * (dieOut ? 1 : .7);
      return [x + nx * bend, y + ny * bend];
    };
    // full strength at the sheet edge, tapering only where the fold dies out
    const fade = i => {
      const t = i / N;
      return dieOut ? Math.max(0, 1 - t) ** .8
                    : (0.55 + 0.45 * Math.sin(Math.PI * t) ** .5);
    };
    for (let pass = 0; pass < 2; pass++) {
      const off = pass ? 1.3 : -1.0;
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      for (let i = 0; i < N; i++) {
        const [x1, y1] = pt(i), [x2, y2] = pt(i + 1);
        const a = fade(i) * (pass ? .30 : .52) * (.65 + r() * .5);
        g.strokeStyle = pass ? `rgba(96,76,42,${a.toFixed(3)})`
                             : `rgba(255,254,247,${a.toFixed(3)})`;
        g.lineWidth = pass ? 2.0 : 1.4;
        g.beginPath();
        g.moveTo(x1 + nx * off, y1 + ny * off);
        g.lineTo(x2 + nx * off, y2 + ny * off);
        g.stroke();
      }
    }
    // the soft valley the fold leaves, plus faint soiling on the folded triangle
    for (let i = 0; i < N; i += 3) {
      const [x, y] = pt(i);
      const rad = 8 + r() * 11;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(122,98,56,${(0.05 * fade(i)).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    }
    if (acrossCorner) {
      g.fillStyle = 'rgba(126,102,58,0.045)';
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(0, 0); g.closePath(); g.fill();
    }
  });
}
function crease(seed, amount) {
  if (amount <= 0) return [];
  const corner = creaseCorner(seed);
  const sw = (26 + h2(seed, 6) * 22).toFixed(0);
  const sh = (24 + h2(seed, 7) * 22).toFixed(0);
  const px = (corner === 1 || corner === 2) ? 100 : 0;
  const py = (corner === 2 || corner === 3) ? 100 : 0;
  // nudge off the exact corner a little so repeats don't stack identically
  const jx = (h2(seed, 8) - .5) * 6, jy = (h2(seed, 9) - .5) * 6;
  return [layer(creaseTex(seed, corner), `${sw}% ${sh}%`,
    `calc(${px}% + ${jx.toFixed(1)}px) calc(${py}% + ${jy.toFixed(1)}px)`)];
}



const COVER_BASE = {
  leather: 'linear-gradient(148deg, #795b32, #503a22 55%, #3b2b18)',
  cloth:   'linear-gradient(160deg, #6f5738, #4d3c26 58%, #3b2e1d)',
  dark:    'linear-gradient(148deg, #6b4f2c, #46331c 58%, #322415)',
};


const A3_SUBSTRATE_SEED = 577;
const A3_TITLE = 'partial';           // one frozen title treatment for all
let A3_WEAR_ON = true;                // dev-only verification switch

/* the frozen surface — no per-concept parameters, ever */
function fixedBoardSubstrate() {
  return [
    tile(clothTile(A3_SUBSTRATE_SEED, 260), '112px 112px'),
    tile(clothTile(A3_SUBSTRATE_SEED + 1, 200), '71px 83px'),
    COVER_BASE.cloth,
  ];
}

/* ---- separable wear overlays (localized only; never touch the base) ---- */

const A4_KEYS = ['handled', 'edge', 'travel', 'loved', 'heavy', 'humid', 'clouds'];
const A4_LABELS = { handled: 'Handled', edge: 'Edge wear', travel: 'Travel', loved: 'Loved', heavy: 'Heavy', humid: 'Humid', clouds: 'Clouds' };
const cnt = (n, w) => Math.max(0, Math.round(n * w));
/* A4 impact mark: the nick itself, without the wide soft halo (that diffuse
   glow now lives only in the separate `clouds` factor). */
const a4Nick = (x, y, sz, s) => [
  blot(x, y, sz * .62, sz * .48, '244,220,178', .26 * s),
  blot(x + .4, y + .4, sz * .38, sz * .30, '26,16,7', .24 * s),
];

/* --- family builders: w = 0..1 weight, n = structural normaliser 0..1 --- */
function famHandled(w, n) {
  if (w < .03) return [];
  const e = w * n, S = .55;
  return [
    layer(scratchLayer(607, cnt(7, w), 0, .6), '100% 100%'),
    layer(handlingEdgeWear(601, 'right', 1.6 * e, { depth: .13, cornerB: .3, dark: .3, scuff: 1.3 }), '100% 100%'),
    layer(handlingEdgeWear(602, 'bottom', .9 * e, { depth: .08, cornerB: .28, dark: .35 }), '100% 100%'),
    layer(cornerAbrasion(604, 1, 1, .95 * e, S), '23% 18%', 'right bottom'),
    layer(cornerAbrasion(605, 1, 0, .6 * e, S), '17% 13%', 'right top'),
    
  ];
}
function famEdge(w, n) {
  if (w < .03) return [];
  const e = w * n, S = .55, L = [];
  for (const [pos, ax, ay, k, seed] of [
    ['right bottom', 1, 1, 1.15, 611], ['right top', 1, 0, .85, 612],
    ['left bottom', 0, 1, .7, 613], ['left top', 0, 0, .5, 614]]) {
    L.push(layer(cornerAbrasion(seed, ax, ay, k * e, S), `${(18 + k * 6).toFixed(0)}% ${(14 + k * 6).toFixed(0)}%`, pos));
  }
  L.push(layer(scratchLayer(618, cnt(8, w), 0, .5), '100% 100%'));
  if (w > .5) {
    L.push(`${chipTile(615)} 0 100% / 96px ${(6 + 4 * e).toFixed(0)}px repeat-x`);
    L.push(`${chipTile(616)} 100% 0 / ${(5 + 4 * e).toFixed(0)}px 96px repeat-y`);
  }
  return L;
}
function famTravel(w, n) {
  if (w < .03) return [];
  const e = w * n, S = .55;
  return [
    layer(scratchLayer(101, cnt(26, w), 0, .55), '100% 100%'),
    // crisp localised travel scratch cluster (carried over from A3-05)
    layer(scratchLayer(102, cnt(14, w), 0, .8), '62% 74%', '18% 22%'),
    layer(scratchLayer(105, cnt(6, w), 0, .7), '46% 38%', '72% 14%'),
    layer(scratchLayer(103, cnt(4, w), 0, .30), '78% 52%', '14% 62%'),
    layer(scratchLayer(104, cnt(3, w), 0, .22), '54% 40%', '68% 22%'),
    layer(brokenPressureMark(636, cnt(3, w), .55 * w, { maxLen: .16, edgeBias: .6 }), '100% 100%'),
    layer(handlingEdgeWear(634, 'right', .5 * e, { depth: .07, cornerB: .7, dark: .3, scuff: .9 }), '100% 100%'),
    layer(cornerAbrasion(635, 1, 1, .9 * e, S), '22% 17%', 'right bottom'),
  ];
}
function famLoved(w, n) {
  if (w < .03) return [];
  const e = w * n, S = .55;
  return [
    layer(handlingEdgeWear(641, 'right', 1.2 * e, { depth: .085, cornerB: .7, cornerA: .3, dark: .3 }), '100% 100%'),
    layer(cornerAbrasion(642, 1, 1, 1.05 * e, S), '22% 17%', 'right bottom'),
    layer(cornerAbrasion(643, 1, 0, .75 * e, S), '18% 14%', 'right top'),
    layer(scratchLayer(73, cnt(5, w), 0, .6), '100% 100%'),
  ];
}
/* clouds / smudges — the diffuse soft-focus staining that used to be baked
   into the other families. Now an isolated, opt-in factor. */
function famClouds(w, n) {
  if (w < .03) return [];
  const e = w * n;
  return [
    layer(scratchLayer(661, 0, cnt(5, w), .5), '100% 100%'),
    layer(scratchLayer(662, 0, cnt(4, w), .4), '72% 64%', '22% 26%'),
    blot(97, 24, 2.2, 1.8, '212,196,164', .30 * e),
    blot(96, 79, 2.6, 2.1, '212,196,164', .26 * e),
    blot(26, 64, 5, 4.4, '244,220,178', .16 * e),
    blot(50, 50, 22, 30, '226,210,178', .10 * e),
    ...patchyEdge(617, 100, '58,42,20', 1.1 * e),
    `radial-gradient(114% 106% at 50% 50%, transparent 56%, rgba(224,204,166,${(.12 * e).toFixed(3)}) 82%, rgba(30,20,9,${(.20 * e).toFixed(3)}) 100%)`,
  ];
}
function famHeavy(w, n) {
  if (w < .03) return [];
  const e = w * n, S = .55, L = [
    layer(handlingEdgeWear(651, 'right', 1.0 * e, { depth: .05, cornerB: .8, dark: .4 }), '100% 100%'),
    layer(handlingEdgeWear(658, 'bottom', .7 * e, { depth: .045, cornerB: .8, dark: .4, scuff: 1.1 }), '100% 100%'),
  ];
  for (const [pos, ax, ay, k, seed] of [
    ['right bottom', 1, 1, .9, 653], ['right top', 1, 0, .65, 654],
    ['left bottom', 0, 1, .6, 655], ['left top', 0, 0, .45, 656]]) {
    L.push(layer(cornerAbrasion(seed, ax, ay, k * e, S), `${(20 + k * 7).toFixed(0)}% ${(16 + k * 7).toFixed(0)}%`, pos));
  }
  L.push(layer(brokenPressureMark(657, cnt(5, w), .5 * w, { maxLen: .13, edgeBias: .75 }), '100% 100%'));
  L.push(layer(scratchLayer(85, cnt(30, w), 0, .5), '100% 100%'));
  // dense mid-cover scuff cluster (carried over from A3-07)
  L.push(layer(scratchLayer(86, cnt(22, w), 0, .38), '70% 66%', '26% 58%'));
  L.push(layer(scratchLayer(88, cnt(10, w), 0, .55), '40% 34%', '14% 20%'));
  if (w > .5) L.push(`${chipTile(660)} 0 100% / 96px ${(8 + 4 * e).toFixed(0)}px repeat-x`);
  L.push(layer(scratchLayer(87, cnt(16, w), 0, .30), '58% 52%', '74% 18%'));
  /* patchyEdge removed: its soft radial blots read as clouds */
  return L;
}
/* strength-scaled variant of humidDrift for the A4 sandbox, so the humid
   factor ramps gradually with the slider instead of snapping to full. */
function humidDriftScaled(seed, gain) {
  const g0 = Math.max(0, Math.min(1.4, gain));
  return texURL('hds' + seed + '_' + g0.toFixed(3), 256, 256, (g, w, h) => {
    const r = rnd(seed);
    /* Pure broad radial tonal drift — no directional strokes (stroke loops read
       as horizontal lines). More, broader, lower-contrast blobs keep the same
       diffuse damp-aged undulation without ever forming a line or a ring. */
    const items = many(11, r, r0 => ({
      x: r0() * w, y: r0() * h, rx: 120 + r0() * 90, ry: 105 + r0() * 80,
      dark: r0() > .5, a: (.034 + r0() * .048) * g0
    }));
    wrapped(g, w, h, items, b => {
      const rad = Math.max(b.rx, b.ry);
      const gr = g.createRadialGradient(b.x, b.y, rad * .2, b.x, b.y, rad);
      gr.addColorStop(0, b.dark ? `rgba(58,40,18,${b.a.toFixed(3)})` : `rgba(198,176,136,${(b.a * .7).toFixed(3)})`);
      gr.addColorStop(.55, b.dark ? `rgba(58,40,18,${(b.a * .4).toFixed(3)})` : `rgba(198,176,136,${(b.a * .3).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, 7); g.fill();
    });
  });
}

/* A4-only soft fade for humid aging: broad, very low-contrast tonal drift with
   no discrete radial blobs, so the surface fades/ages gradually without ever
   forming a visible circular "humidity ring" (the shared fadeField() leaves
   distinct bleached ellipses, which we must avoid here). */
function humidFadeSoft(seed, gain) {
  const g0 = Math.max(0, Math.min(1.4, gain));
  return texURL('hfs' + seed + '_' + g0.toFixed(3), 256, 256, (g, w, h) => {
    const r = rnd(seed);
    /* broad soft radial bleaching zones — no strokes (strokes read as lines).
       Each is a wide, very low-contrast faded patch for uneven pigment loss. */
    const fades = many(16, r, r0 => ({
      x: r0() * w, y: r0() * h, rx: 70 + r0() * 95, ry: 60 + r0() * 85,
      a: (.012 + r0() * .020) * g0
    }));
    wrapped(g, w, h, fades, f => {
      const gr = g.createRadialGradient(f.x, f.y, Math.max(f.rx, f.ry) * .25, f.x, f.y, Math.max(f.rx, f.ry));
      gr.addColorStop(0, `rgba(214,196,158,${f.a.toFixed(3)})`);
      gr.addColorStop(.6, `rgba(214,196,158,${(f.a * .4).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(214,196,158,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(f.x, f.y, f.rx, f.ry, r() * 3, 0, 7); g.fill();
    });
    /* a few very broad, faint dark undulations for uneven pigment loss */
    for (let i = 0; i < 5; i++) {
      const x = r() * w, y = r() * h, rx = 130 + r() * 80, ry = 110 + r() * 70;
      const a = (.020 + r() * .030) * g0;
      const gr = g.createRadialGradient(x, y, rx * .25, x, y, Math.max(rx, ry));
      gr.addColorStop(0, `rgba(48,33,15,${a.toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(x, y, rx, ry, r() * 3, 0, 7); g.fill();
    }
  });
}

/* humid aging — broad tonal drift, uneven pigment loss and an overall
   darker, damp-aged surface. No scratches, no impact marks, no blots:
   this is purely the ageing of the cloth's colour and tone.
   A power curve keeps low slider values faint and lets the surface
   darken progressively toward full, so 10 and 100 look very different.
   Pure CSS gradients only (no canvas textures): canvas PNGs at low alpha
   alias into fine vertical banding when upscaled, so we use
   resolution-independent radial/linear gradients that stay smooth. */
function famHumid(w, n) {
  if (w < .02) return [];
  const e = Math.pow(w, 1.4) * n;
  const L = [];
  /* broad, very low-contrast dark damp patches (uneven darkening) */
  for (let i = 0; i < 7; i++) {
    const x = (hash1(i * 3.1 + 1) * 100).toFixed(1);
    const y = (hash1(i * 3.1 + 2) * 100).toFixed(1);
    const rx = (62 + hash1(i * 3.1 + 3) * 46).toFixed(0);
    const ry = (52 + hash1(i * 3.1 + 4) * 42).toFixed(0);
    const a = (.035 + hash1(i * 3.1 + 5) * .045) * e;
    L.push(`radial-gradient(${rx}% ${ry}% at ${x}% ${y}%, rgba(46,32,14,${a.toFixed(3)}) 0%, rgba(46,32,14,${(a * .35).toFixed(3)}) 60%, rgba(46,32,14,0) 78%)`);
  }
  /* broad faded / bleached zones (uneven pigment loss) */
  for (let i = 0; i < 6; i++) {
    const x = (hash1(i * 5.7 + 11) * 100).toFixed(1);
    const y = (hash1(i * 5.7 + 12) * 100).toFixed(1);
    const rx = (56 + hash1(i * 5.7 + 13) * 44).toFixed(0);
    const ry = (46 + hash1(i * 5.7 + 14) * 40).toFixed(0);
    const a = (.026 + hash1(i * 5.7 + 15) * .030) * e;
    L.push(`radial-gradient(${rx}% ${ry}% at ${x}% ${y}%, rgba(198,176,138,${a.toFixed(3)}) 0%, rgba(198,176,138,${(a * .3).toFixed(3)}) 58%, rgba(198,176,138,0) 76%)`);
  }
  /* overall damp darkening, vignette and flat tint */
  L.push(`linear-gradient(168deg, rgba(46,32,14,${(.16 * e).toFixed(3)}) 0%, rgba(46,32,14,0) 42%, rgba(38,26,11,${(.20 * e).toFixed(3)}) 100%)`);
  L.push(`radial-gradient(120% 112% at 50% 46%, rgba(0,0,0,0) 48%, rgba(34,23,10,${(.26 * e).toFixed(3)}) 100%)`);
  L.push(`linear-gradient(0deg, rgba(52,38,18,${(.14 * e).toFixed(3)}), rgba(52,38,18,${(.14 * e).toFixed(3)}))`);
  return L;
}
const A4_FAMS = { handled: famHandled, edge: famEdge, travel: famTravel, loved: famLoved, heavy: famHeavy, humid: famHumid, clouds: famClouds };

/* structural load per unit weight — used to keep blends plausible */
const A4_LOAD = { handled: .9, edge: 1.15, travel: .7, loved: 1.0, heavy: 1.5, humid: .25, clouds: .2 };
const A4_CAP = 1.9;

/* mix: { handled: 0..100, ... } (percentages) -> css background layers */
function synthWear(mix, s = 1) {
  const w = {};
  for (const k of A4_KEYS) w[k] = clamp01((mix[k] || 0) / 100) * s;
  const load = A4_KEYS.reduce((t, k) => t + A4_LOAD[k] * w[k], 0);
  const n = load > A4_CAP ? A4_CAP / load : 1;
  // heaviest family stays closest to full strength; the rest give way first
  const top = A4_KEYS.reduce((a, k) => (w[k] > w[a] ? k : a), A4_KEYS[0]);
  const L = [];
  for (const k of A4_KEYS) {
    const nk = k === top ? Math.min(1, n + (1 - n) * .5) : n;
    L.push(...A4_FAMS[k](w[k], nk));
  }
  return L;
}

const COLORWAYS = [
  { id: 'brown', name: 'Brown (control)', base: ['#6f5738', '#4d3c26', '#3b2e1d'],
    fade: '198,178,140', damp: '46,32,16', drift: '150,124,86',
    traits: ['the current reference pigment', 'warm earth dye', 'fades toward pale tobacco'] },
  { id: 'olive', name: 'Faded olive', base: ['#5f5e3d', '#464626', '#36361f'],
    fade: '192,188,148', damp: '40,42,20', drift: '150,150,104',
    traits: ['army-cloth dye', 'drifts to dusty khaki', 'greys where sunlit'] },
  { id: 'moss', name: 'Deep moss / forest', base: ['#3f4f3e', '#2e3d2b', '#222e20'],
    fade: '158,172,142', damp: '24,36,22', drift: '110,132,100',
    traits: ['dense bottle-green dye', 'desaturates to grey-green', 'holds depth in the shadows'] },
  { id: 'navy', name: 'Dusty navy / old indigo', base: ['#3b485c', '#2b3646', '#222a36'],
    fade: '156,172,192', damp: '20,28,40', drift: '106,126,152',
    traits: ['indigo-dyed cloth', 'fades to denim slate', 'rub-through reads warm'] },
  { id: 'slate', name: 'Slate blue-gray', base: ['#545d64', '#404850', '#31383e'],
    fade: '178,190,198', damp: '30,36,42', drift: '132,146,156',
    traits: ['cool archival grey', 'quiet, institutional', 'fades pale and chalky'] },
  { id: 'burgundy', name: 'Muted burgundy / faded wine', base: ['#5f3739', '#472829', '#361f20'],
    fade: '192,152,142', damp: '40,20,20', drift: '146,100,94',
    traits: ['old library wine cloth', 'drifts to rose-brown brick', 'warm where handled'] },
  { id: 'charcoal', name: 'Charcoal / faded black', base: ['#2b2a28', '#1d1c1a', '#131210'],
    fade: '172,168,160', damp: '20,19,17', drift: '122,119,112',
    traits: ['soft black cloth', 'ages to warm graphite', 'shows every scuff'] },
  { id: 'brick', name: 'Muted brick / terracotta', base: ['#6e4530', '#523324', '#3d261a'],
    fade: '204,164,134', damp: '46,26,16', drift: '166,116,86',
    traits: ['clay-dyed cloth', 'fades to dusty terracotta', 'earthy, not orange'] },
];

const colorwayBase = c => `linear-gradient(160deg, ${c.base[0]}, ${c.base[1]} 58%, ${c.base[2]})`;

/* the frozen substrate, re-dyed: identical fibre tiles + seeds, new pigment */
function colorwaySubstrate(c) {
  return [
    tile(clothTile(A3_SUBSTRATE_SEED, 260), '112px 112px'),
    tile(clothTile(A3_SUBSTRATE_SEED + 1, 200), '71px 83px'),
    /* uneven dye take-up — resolution independent, no tiling artefacts */
    `radial-gradient(72% 58% at 26% 22%, rgba(${c.drift},.13), transparent 70%)`,
    `radial-gradient(64% 66% at 78% 68%, rgba(${c.damp},.16), transparent 72%)`,
    `radial-gradient(88% 52% at 60% 8%, rgba(${c.fade},.07), transparent 74%)`,
    colorwayBase(c),
  ];
}

/* how this specific pigment ages: light-driven drift toward its faded
   target, damp-side deepening, and neutral board where the colour has
   been worn off entirely. No new wear shapes — tone only. */
function colorwayAging(c) {
  return [
    /* rub-through: the perimeter loses pigment before the centre does */
    `radial-gradient(118% 112% at 46% 44%, transparent 52%, rgba(${c.fade},.13) 84%, rgba(${c.fade},.20) 100%)`,
    /* neutral board hue creeping in at the worked opening edge / bottom */
    `linear-gradient(275deg, rgba(176,158,128,.16), transparent 26%)`,
    `linear-gradient(0deg, rgba(176,158,128,.11), transparent 22%)`,
    /* sun / handling drift toward the faded target, broad and uneven */
    `radial-gradient(70% 62% at 30% 30%, rgba(${c.fade},.10), transparent 76%)`,
    `radial-gradient(58% 54% at 82% 24%, rgba(${c.fade},.07), transparent 74%)`,
    /* damp-side deepening keeps the pigment from reading flat */
    `radial-gradient(66% 60% at 22% 84%, rgba(${c.damp},.14), transparent 76%)`,
  ];
}

const COLOR_STUDY = COLORWAYS.map(c => ({
  id: 'a4c-' + c.id, name: c.name, traits: c.traits, colorway: c, title: A3_TITLE,
  controlled: true,
  build: (s = 1) => [
    ...synthWear(A4_COLOR_MIX, s),
    ...colorwayAging(c),
    ...colorwaySubstrate(c),
  ].join(', '),
}));

/* ======================================================================
   A6 — FINALIST STUDY: CHARCOAL × BRICK
   ----------------------------------------------------------------------
   Broad colour exploration closed: only Charcoal and Brick remain.
   Stage 1 renders one strong A4 wear concept in both pigments; Stage 2
/* ---- the frozen recipe ---------------------------------------------- */
const F3_BRICK = COLORWAYS.find(c => c.id === 'brick');
const F3_AMBIENT = { humid: 34, clouds: 20 };            // colour-study ambient base
const F3_04_BASE = { handled: 35, edge: 85, travel: 12, loved: 80, heavy: 8 };   // F2-04 Carried & Loved
const F3_03_DELTA = { edge: 86, travel: 34, loved: 76, heavy: 14 };              // restrained F2-06 influence
const FINAL_COVER_PRESET = { ...F3_AMBIENT, ...F3_04_BASE, ...F3_03_DELTA };

/* full outer cover face (front + back), F3-03 exactly as rendered in the lab */
function finalCoverSkin(s = 1) {
  return [
    ...synthWear(FINAL_COVER_PRESET, s),
    ...colorwayAging(F3_BRICK),
    ...colorwaySubstrate(F3_BRICK),
  ].join(', ');
}

/* the same pigment + substrate with only the quiet, protected wear an
   inside face / board would ever pick up */
function finalBoardSkin(s = .35) {
  return [
    ...synthWear({ handled: 24, edge: 40, travel: 0, loved: 55, heavy: 0, humid: 20, clouds: 10 }, s),
    ...colorwayAging(F3_BRICK),
    ...colorwaySubstrate(F3_BRICK),
  ].join(', ');
}

export const F3_COVER = {
  id: 'F3-03',
  name: 'Slightly more scuffed - Brick',
  preset: FINAL_COVER_PRESET,
  colorway: F3_BRICK,
  coverSkin: finalCoverSkin,
  boardSkin: finalBoardSkin,
};
