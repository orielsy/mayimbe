/* ======================================================================
   PAPER-LAB — the Material Lab paper concepts, ported to the production
   notebook as a functional, per-page aging model.
   ----------------------------------------------------------------------
   Rules (fixed by design review, not tunable at runtime):

     * 12 pages, 12 concepts, one each. Page 1 is ALWAYS
       "First-page heavy wear"; the rest follow a fixed order.
     * Every non-random factor ramps DOWN from page 1 to page 12:
         grain    0.15 -> 0.00
         wear     1.00 -> 0.00
         stains   4    -> 0     (integer)
         edge     1.00 fixed on every page
     * creases and dog-ears are random (deterministic per page), so the
       book never reads as a mechanical gradient.

   Everything is deterministic: same page index -> same paper, every render,
   which is what the DOM -> WebGL -> DOM handoff depends on.

   Exposed as window.LABPAPER so the notebook's own primitives (rnd, layer,
   tile, cornerAbrasion, ...) keep their names untouched.
   ==================================================================== */
window.LABPAPER = (function () {
  'use strict';

  /* ---------- deterministic primitives (lab-identical) ---------- */
  function rnd(seed) {
    let s = (Math.abs(Math.floor(seed * 1000)) * 2654435761 % 2147483647) || 7;
    return () => (s = (s * 48271) % 2147483647) / 2147483647;
  }
  const hash1 = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const h2 = (n, k) => hash1(n * 13.37 + k * 7.77 + 5.5);
  const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgbs = c => `rgb(${c[0]},${c[1]},${c[2]})`;
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

  /* ---------- mirroring ----------
     The lab always renders a right-hand sheet (bound edge on the left).
     Left-hand notebook pages are the same sheet seen from the other side,
     so every horizontal coordinate flips. MIR is set for the duration of
     one skin() call; nothing is cached across it except textures, whose
     geometry is corner-anchored and chosen per side. */
  let MIR = false;
  const mx = x => (MIR ? 100 - x : x);
  const outerSide = () => (MIR ? 0 : 100);
  const innerSide = () => (MIR ? 100 : 0);

  /* ---------- micro textures ---------- */
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

  function foxTile(seed, clusters) {
    return texURL(`fox${seed}_${clusters}`, 256, 256, (g, w, h) => {
      const r = rnd(seed);
      const items = [];
      for (let c = 0; c < clusters; c++) {
        const cx = r() * w, cy = r() * h, n = 2 + Math.floor(r() * 6);
        for (let i = 0; i < n; i++) {
          items.push({
            x: cx + (r() - .5) * 34, y: cy + (r() - .5) * 34,
            rad: .8 + r() * r() * 3.4, a: .10 + r() * .22, warm: r() > .35
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

  function cornerAbrasion(seed, ax, ay, strength, soft = 0) {
    return texURL(`cor${seed}_${ax}${ay}_${strength}_${soft.toFixed(2)}`, 128, 128, (g, w, h) => {
      const r = rnd(seed);
      const cx = ax * w, cy = ay * h, s = soft;
      const hiCol = [230 - (230 - 198) * s, 200 - (200 - 168) * s, 152 - (152 - 122) * s].map(Math.round);
      const midCol = [214 - (214 - 182) * s, 182 - (182 - 150) * s, 132 - (132 - 106) * s].map(Math.round);
      const hiA = (.26 - .11 * s) * strength, midA = (.08 - .02 * s) * strength;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 104);
      gr.addColorStop(0, `rgba(${hiCol[0]},${hiCol[1]},${hiCol[2]},${hiA.toFixed(3)})`);
      gr.addColorStop(.55, `rgba(${midCol[0]},${midCol[1]},${midCol[2]},${midA.toFixed(3)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const liteCol = [240 - (240 - 214) * s, 214 - (214 - 188) * s, 170 - (170 - 148) * s].map(Math.round);
      g.filter = 'blur(1.7px)';
      for (let i = 0; i < 220; i++) {
        const d = r() * r() * 120, a = r() * Math.PI / 2;
        const x = cx + (ax ? -1 : 1) * Math.cos(a) * d;
        const y = cy + (ay ? -1 : 1) * Math.sin(a) * d;
        const lite = r() > (.45 + .16 * s);
        g.fillStyle = lite
          ? `rgba(${liteCol[0]},${liteCol[1]},${liteCol[2]},${(.05 + r() * (.20 - .07 * s) * strength).toFixed(3)})`
          : `rgba(28,18,8,${(.05 + r() * .22 * strength).toFixed(3)})`;
        g.beginPath(); g.arc(x, y, .6 + r() * 2.2, 0, 7); g.fill();
      }
      g.filter = 'none';
    });
  }

  /* ---------- macro helpers ---------- */
  const blot = (x, y, rx, ry, col, a) =>
    `radial-gradient(${rx}% ${ry}% at ${mx(x)}% ${y}%, rgba(${col},${a.toFixed(3)}),` +
    ` rgba(${col},${(a * .35).toFixed(3)}) 55%, transparent 80%)`;

  function patchyEdge(seed, side, k, amount) {
    const L = [];
    const r = rnd(seed);
    let y = 0;
    while (y < 100) {
      const hgt = 7 + r() * 22;
      const inten = r();
      if (inten > .3) L.push(blot(side, y + hgt / 2, 9 + r() * 14, hgt * .8, k, .30 * amount * inten));
      y += hgt;
    }
    return L;
  }

  /* corner folds. 0 TL, 1 TR, 2 BR, 3 BL — always on the OUTER side, never
     on the bound spine edge. */
  const creaseCorner = seed => {
    const outerTop = h2(seed, 11) < .55;
    if (MIR) return outerTop ? 0 : 3;
    return outerTop ? 1 : 2;
  };
  function creaseTex(seed, corner) {
    return texURL('crn' + seed + '_' + corner, 320, 320, (g, w, h) => {
      const r = rnd(seed);
      const fx = (corner === 1 || corner === 2) ? -1 : 1;
      const fy = (corner === 2 || corner === 3) ? -1 : 1;
      g.translate(fx < 0 ? w : 0, fy < 0 ? h : 0);
      g.scale(fx, fy);
      const acrossCorner = r() > .3;
      let ax, ay, bx, by;
      if (acrossCorner) {
        ay = h * (.30 + r() * .55); ax = 0;
        bx = w * (.28 + r() * .58); by = 0;
      } else {
        ay = h * (.18 + r() * .5); ax = 0;
        bx = w * (.45 + r() * .45); by = ay + (r() - .5) * h * .35;
      }
      const dieOut = !acrossCorner;
      const wob = 3 + r() * 7, ph = r() * 6, N = 80;
      const pt = i => {
        const t = i / N;
        const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
        const dx = bx - ax, dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const bend = Math.sin(t * 2.4 + ph) * wob * (dieOut ? 1 : .7);
        return [x + nx * bend, y + ny * bend];
      };
      const fade = i => {
        const t = i / N;
        return dieOut ? Math.max(0, 1 - t) ** .8 : (0.55 + 0.45 * Math.sin(Math.PI * t) ** .5);
      };
      for (let pass = 0; pass < 2; pass++) {
        const off = pass ? 1.3 : -1.0;
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        for (let i = 0; i < N; i++) {
          const [x1, y1] = pt(i), [x2, y2] = pt(i + 1);
          const a = fade(i) * (pass ? .30 : .52) * (.65 + r() * .5);
          g.strokeStyle = pass ? `rgba(96,76,42,${a.toFixed(3)})` : `rgba(255,254,247,${a.toFixed(3)})`;
          g.lineWidth = pass ? 2.0 : 1.4;
          g.beginPath();
          g.moveTo(x1 + nx * off, y1 + ny * off);
          g.lineTo(x2 + nx * off, y2 + ny * off);
          g.stroke();
        }
      }
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
    const jx = (h2(seed, 8) - .5) * 6, jy = (h2(seed, 9) - .5) * 6;
    return [layer(creaseTex(seed, corner), `${sw}% ${sh}%`,
      `calc(${px}% + ${jx.toFixed(1)}px) calc(${py}% + ${jy.toFixed(1)}px)`)];
  }

  const PAPER_FRESH = [249, 245, 237], PAPER_AGED = [223, 206, 168];
  const base = t => rgbs(mixc(PAPER_FRESH, PAPER_AGED, clamp01(t)));
  function grainLayers(g = 1) {
    if (g <= 0) return [];
    return [
      tile(paperTile(3, Math.round(22 * g) || 1, Math.round(140 * g) || 1, Math.round(80 * g) || 1), '118px 118px'),
      tile(paperTile(4, Math.round(16 * g) || 1, Math.round(90 * g) || 1, Math.round(50 * g) || 1), '191px 173px'),
    ];
  }
  const cornerPos = (vert) => `${MIR ? 'left' : 'right'} ${vert}`;

  /* ======================================================================
     THE 12 CONCEPTS (identical recipes to the Material Lab)
     ==================================================================== */
  const PAPERS = [
    {
      id: 'first', name: 'First-page heavy wear', nicks: true,
      build: (s, o = {}) => [
        layer(cornerAbrasion(51, MIR ? 0 : 1, 1, .8 * s), '30% 22%', cornerPos('bottom')),
        layer(cornerAbrasion(52, MIR ? 0 : 1, 0, .5 * s), '20% 15%', cornerPos('top')),
        blot(100, 48, 28, 32, '108,80,40', .38 * s),
        ...patchyEdge(53, outerSide(), '124,94,48', 1.7 * s * (o.edge ?? 1)),
        ...patchyEdge(54, innerSide(), '124,94,48', .6 * s * (o.edge ?? 1)),
        ...crease(55, .6 * s),
        tile(foxTile(57, Math.round(3 * s) || 1), '211px 197px'),
        ...grainLayers(1.1 * (o.grain ?? 1)),
        `radial-gradient(128% 118% at 50% 50%, transparent 34%, rgba(134,100,50,${(.42 * s).toFixed(3)}) 100%)`,
        base(.78),
      ]
    },
    {
      id: 'handled', name: 'Heavily handled page',
      build: (s, o = {}) => [
        blot(100, 52, 26, 26, '116,88,44', .30 * s),
        blot(100, 58, 12, 13, '96,72,36', .26 * s),
        blot(100, 100, 32, 24, '104,78,38', .34 * s),
        layer(cornerAbrasion(11, MIR ? 0 : 1, 1, .9 * s), '34% 26%', cornerPos('bottom')),
        ...patchyEdge(12, outerSide(), '138,106,56', 1.1 * s * (o.edge ?? 1)),
        ...grainLayers(o.grain ?? 1),
        `radial-gradient(136% 124% at 50% 50%, transparent 54%, rgba(146,112,62,${(.14 * s).toFixed(3)}) 100%)`,
        base(.52),
      ]
    },
    {
      id: 'mixed', name: 'Mixed lived-in page', nicks: true,
      build: (s, o = {}) => [
        ...crease(61, .55 * s),
        tile(foxTile(58, Math.round(3 * s) || 1), '233px 211px'),
        blot(100, 56, 20, 22, '116,88,44', .22 * s),
        blot(100, 100, 24, 18, '108,82,40', .24 * s),
        blot(34, 30, 16, 12, '150,118,64', .05 * s),
        ...patchyEdge(62, outerSide(), '138,106,56', 1.0 * s * (o.edge ?? 1)),
        ...grainLayers(o.grain ?? 1),
        `radial-gradient(134% 122% at 50% 50%, transparent 58%, rgba(146,112,62,${(.14 * s).toFixed(3)}) 100%)`,
        base(.32),
      ]
    },
    {
      id: 'yellowed', name: 'Yellowed edge page',
      build: (s, o = {}) => [
        ...patchyEdge(21, outerSide(), '156,120,58', 1.4 * s * (o.edge ?? 1)),
        ...patchyEdge(22, innerSide(), '156,120,58', 1.0 * s * (o.edge ?? 1)),
        blot(50, 1, 46, 9, '158,120,56', .30 * s),
        blot(24, 100, 34, 10, '146,110,52', .26 * s),
        blot(78, 100, 26, 8, '152,116,54', .20 * s),
        ...grainLayers(.85 * (o.grain ?? 1)),
        `radial-gradient(120% 110% at 50% 50%, transparent 54%, rgba(156,118,56,${(.40 * s).toFixed(3)}) 100%)`,
        base(.22),
      ]
    },
    {
      id: 'smudged', name: 'Smudged working page',
      build: (s, o = {}) => [
        ...Array.from({ length: 7 }, (_, i) => {
          const t = i / 6;
          return blot(22 + t * 46, 74 - t * 26, 11 - t * 4, 7 - t * 2.5, '70,64,56', (.20 - t * .13) * s);
        }),
        ...Array.from({ length: 4 }, (_, i) => {
          const t = i / 3;
          return blot(16 + t * 22, 40 - t * 12, 8, 5, '74,68,60', (.11 - t * .06) * s);
        }),
        blot(18, 84, 9, 7, '66,60,52', .30 * s),
        blot(26, 88, 8, 6, '66,60,52', .24 * s),
        blot(100, 62, 14, 16, '120,92,48', .12 * s),
        ...grainLayers(o.grain ?? 1),
        `radial-gradient(136% 124% at 50% 50%, transparent 62%, rgba(140,110,62,${(.12 * s).toFixed(3)}) 100%)`,
        base(.28),
      ]
    },
    {
      id: 'humid', name: 'Humidity-aged',
      build: (s, o = {}) => {
        const L = [], r = rnd(808);
        for (let i = 0; i < 7; i++) {
          L.push(blot(10 + r() * 80, 10 + r() * 80, 20 + r() * 26, 14 + r() * 22,
            r() > .5 ? '150,120,66' : '206,196,168', (.10 + r() * .12) * s));
        }
        L.push(layer(`linear-gradient(96deg, transparent, rgba(146,116,64,${(.05 * s).toFixed(3)}) 30%, transparent 62%)`, '100% 46%', '0 12%'));
        L.push(layer(`linear-gradient(84deg, transparent, rgba(255,252,242,${(.16 * s).toFixed(3)}) 40%, transparent 70%)`, '100% 40%', '0 46%'));
        L.push(...grainLayers(o.grain ?? 1));
        L.push(`radial-gradient(132% 120% at 46% 56%, transparent 56%, rgba(140,110,60,${(.16 * s).toFixed(3)}) 100%)`);
        L.push(base(.34));
        return L;
      }
    },
    {
      id: 'creased', name: 'Creased page',
      build: (s, o = {}) => [
        ...crease(31, s), ...crease(32, .7 * s),
        blot(56, 44, 26, 20, '150,118,64', .04 * s),
        ...grainLayers(.9 * (o.grain ?? 1)),
        `radial-gradient(136% 124% at 50% 50%, transparent 66%, rgba(146,112,62,${(.10 * s).toFixed(3)}) 100%)`,
        base(.24),
      ]
    },
    {
      id: 'foxed', name: 'Foxed page',
      build: (s, o = {}) => [
        tile(foxTile(55, Math.round(13 * s) || 1), '246px 231px'),
        tile(foxTile(56, Math.round(8 * s) || 1), '167px 189px'),
        blot(72, 30, 18, 14, '150,116,64', .05 * s),
        ...grainLayers(.9 * (o.grain ?? 1)),
        `radial-gradient(136% 124% at 50% 50%, transparent 64%, rgba(146,112,62,${(.10 * s).toFixed(3)}) 100%)`,
        base(.30),
      ]
    },
    {
      id: 'stain', name: 'Stain variation',
      build: (s, o = {}) => {
        const L = [], r = rnd(606);
        const cx = 58, cy = 62;
        for (let i = 0; i < 6; i++) {
          L.push(blot(cx + (r() - .5) * 26, cy + (r() - .5) * 22,
            12 + r() * 18, 9 + r() * 15, '150,114,58', (.11 + r() * .10) * s));
        }
        L.push(blot(30, 22, 12, 9, '150,118,64', .05 * s));
        L.push(...grainLayers(.9 * (o.grain ?? 1)));
        L.push(`radial-gradient(136% 124% at 50% 50%, transparent 66%, rgba(146,112,62,${(.10 * s).toFixed(3)}) 100%)`);
        L.push(base(.22));
        return L;
      }
    },
    {
      id: 'dogear', name: 'Dog-eared page',
      build: (s, o = {}) => [
        blot(100, 100, 22, 16, '120,92,48', .16 * s),
        ...patchyEdge(41, outerSide(), '138,106,56', .8 * s * (o.edge ?? 1)),
        ...grainLayers(.9 * (o.grain ?? 1)),
        `radial-gradient(136% 124% at 50% 50%, transparent 64%, rgba(146,112,62,${(.11 * s).toFixed(3)}) 100%)`,
        base(.26),
      ]
    },
    {
      id: 'clean', name: 'Clean interior page',
      build: (s, o = {}) => [
        ...grainLayers(.7 * (o.grain ?? 1)),
        `radial-gradient(140% 128% at 50% 50%, transparent 74%, rgba(150,118,64,${(.06 * s).toFixed(3)}) 100%)`,
        base(.10),
      ]
    },
    {
      id: 'deep', name: 'Deep interior page',
      build: (s, o = {}) => [
        ...grainLayers(.55 * (o.grain ?? 1)),
        blot(100, 66, 8, 12, '132,104,56', .05 * s),
        `radial-gradient(146% 134% at 50% 50%, transparent 80%, rgba(150,118,64,${(.05 * s).toFixed(3)}) 100%)`,
        base(.02),
      ]
    },
  ];

  /* ======================================================================
     PER-SHEET FACTOR MODEL
     A sheet is one physical piece of paper: its front (even idx) and back
     (odd idx) share ONE recipe — same concept, same factor values, same
     seed — so the wear type never changes when the page is turned. Only
     the mirror/edge sides differ between the two faces. Sheet 0 is the
     first sheet and carries the maximum of every ramped factor; the last
     sheet carries the minimum. Creases and dog-ears are random.
     ==================================================================== */
  const TOTAL = PAPERS.length;                 // 12 concepts, 12 sheets
  const GRAIN_HI = 0.15, GRAIN_LO = 0.00;
  const WEAR_HI = 1.00, WEAR_LO = 0.00;
  const EDGE_FIXED = 1.00;
  const STAIN_HI = 4, STAIN_LO = 0;
  const CREASE_MAX = 4, DOGEAR_MAX = 0;   // dog-ears disabled in the notebook

  function recipe(idx, total) {
    const n = Math.max(1, Math.ceil((total || TOTAL) / 2));
    const i = Math.max(0, Math.min(n - 1, Math.floor(idx / 2)));
    const t = n === 1 ? 0 : i / (n - 1);              // 0 on page 1, 1 on the last
    const seed = 1 + i * 7;
    const rr = rnd(400 + i * 31);
    return {
      concept: i === 0
        ? PAPERS.find(p => p.id === 'first')   // sheet 0 keeps the first-page heavy-wear concept
        : PAPERS.find(p => p.id === 'handled'), // every other sheet is handled-type
      wear:    +(WEAR_HI + (WEAR_LO - WEAR_HI) * t).toFixed(3),
      grain:   +(GRAIN_HI + (GRAIN_LO - GRAIN_HI) * t).toFixed(4),
      edge:    EDGE_FIXED,
      stains:  Math.round(STAIN_HI + (STAIN_LO - STAIN_HI) * t),
      creases: Math.floor(rr() * (CREASE_MAX + 1)),   // random, not ramped
      dogears: 0,                                       // dog-ears disabled in the notebook
      seed,
    };
  }

  /* extra stains / creases / edge aging, exactly as the lab's tuned model */
  function extras(o) {
    const extra = [];
    const r = rnd(700 + o.seed * 13);
    for (let i = 0; i < o.stains; i++) {
      const lobes = 2 + Math.floor(r() * 4);
      const cx = 12 + r() * 76, cy = 12 + r() * 76;
      for (let j = 0; j < lobes; j++) {
        extra.push(blot(cx + (r() - .5) * 20, cy + (r() - .5) * 18,
          8 + r() * 14, 6 + r() * 11, '152,118,64', (.04 + r() * .05) * o.wear));
      }
    }
    for (let i = 0; i < o.creases; i++) extra.push(...crease(700 + o.seed * 13 + i * 7, .8 * o.wear));
    if (o.edge > 0.02) {
      extra.push(...patchyEdge(910, outerSide(), '138,106,56', 1.3 * o.edge * o.wear));
      extra.push(...patchyEdge(911, innerSide(), '120,90,46', .9 * o.edge * o.wear));
      extra.push(`radial-gradient(122% 114% at 50% 50%, transparent 58%, rgba(118,88,44,${(.16 * o.edge * o.wear).toFixed(3)}) 100%)`);
    }
    return extra;
  }

  /* ---------- public: the background shorthand for one page ---------- */
  function skin(idx, mirror, total, scale) {
    MIR = !!mirror;
    const o = recipe(idx, total);
    const s = o.wear * (scale == null ? 1 : scale);
    const L = [...extras({ ...o, wear: s }), ...o.concept.build(s, { edge: o.edge, grain: o.grain })];
    MIR = false;
    return L.join(', ');
  }

  /* ---------- public: physical damage as real DOM children ----------
     Inline styles only: the snapshot rasteriser drops classes. */
  function damage(el, idx, mirror, total) {
    const o = recipe(idx, total);
    const side = mirror ? 'left' : 'right';
    const n = Math.round(o.dogears);
    for (let i = 0; i < n; i++) {
      const seed = 700 + o.seed * 13 + i * 17;
      const r = rnd(seed);
      const size = 11 + r() * 6;                       // % of the sheet
      const corner = rnd(seed + 9999)() < .5 ? 'top' : 'bottom';
      const shGrad = (corner === 'top' ? 45 : 315) * (mirror ? -1 : 1);
      const sh = document.createElement('div');
      sh.style.cssText =
        `position:absolute;${side}:0;${corner}:0;width:${size.toFixed(1)}%;height:${size.toFixed(1)}%;` +
        `background-image:linear-gradient(${shGrad}deg, rgba(96,74,40,${(.30 * o.wear).toFixed(2)}), rgba(96,74,40,0) 62%);` +
        `z-index:3;`;
      const rot = ((corner === 'top' ? -45 : 45) + (r() - .5) * 8) * (mirror ? -1 : 1);
      const fold = document.createElement('div');
      fold.style.cssText =
        `position:absolute;${side}:${(-size * .34).toFixed(1)}%;${corner}:${(-size * .34).toFixed(1)}%;` +
        `width:${size.toFixed(1)}%;height:${size.toFixed(1)}%;transform:rotate(${rot.toFixed(1)}deg);` +
        `background-image:linear-gradient(160deg, rgba(238,229,206,.95), rgba(214,199,166,.95));` +
        `box-shadow:0 0 6px rgba(70,52,26,.28);z-index:4;`;
      el.append(sh, fold);
    }
    if (o.concept.nicks) {
      const r = rnd(92 + o.seed);
      for (let i = 0; i < 3; i++) {
        const d = document.createElement('div');
        d.style.cssText =
          `position:absolute;${side}:0;top:${(12 + r() * 74).toFixed(0)}%;` +
          `width:${(5 + r() * 7).toFixed(0)}px;height:${(1 + r() * 2).toFixed(0)}px;` +
          `background-image:linear-gradient(${mirror ? 90 : 270}deg, rgba(120,94,50,${(.34 * o.wear).toFixed(2)}), rgba(120,94,50,0));` +
          `z-index:3;`;
        el.appendChild(d);
      }
    }
  }

  return { PAPERS, recipe, skin, damage, TOTAL };
})();
