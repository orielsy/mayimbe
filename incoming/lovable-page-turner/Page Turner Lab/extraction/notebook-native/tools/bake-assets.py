#!/usr/bin/env python3
"""
STAGE 1 ASSET BAKER — Mayimbe pocket notebook static asset system.

Offline / build-time only. Runs the project's EXISTING artwork code
(public/shared/paper-stack.js, public/shared/paper-surface.js,
public/notebook/cover-f3.js) in a headless browser and flattens each
visual INGREDIENT — not finished pages — into a static image file.

  python3 extraction/notebook-native/tools/bake-assets.py

Output: public/notebook-assets/*.webp + manifest.json
Deterministic: fixed seeds, no randomness, re-running overwrites identical art.
"""
import asyncio, json, os, io, http.server, socketserver, threading, functools, sys
from PIL import Image
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
PUBLIC = os.path.join(ROOT, "public")
OUT = os.path.join(PUBLIC, "notebook-assets")
W, H = 840, 1120
PORT = 8791

os.makedirs(OUT, exist_ok=True)


def serve():
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=PUBLIC, **k)

        def log_message(self, *a):
            pass

        def do_GET(self):
            if self.path.startswith("/__bake.html"):
                body = PAGE.encode()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            super().do_GET()

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), H)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


PAGE = """<!doctype html><meta charset=utf-8>
<style>html,body{margin:0;background:transparent}
#s{position:absolute;left:0;top:0}</style>
<script src="/shared/paper-stack.js"></script>
<script src="/shared/paper-surface.js"></script>
<script src="/notebook/cover-f3.js"></script>
<div id="s"></div>
<script>
const PS = window.PaperSurface, PK = window.PaperStack;
window.__cond = (o) => PK.condition(o);
window.__set = (w, h, css) => {
  const s = document.getElementById('s');
  s.setAttribute('style', 'position:absolute;left:0;top:0;width:' + w + 'px;height:' + h + 'px;' + css);
};

/* ---- page-1 trauma artwork, copied verbatim from the mature
   /notebook-lab-native paper system so the baked stains are the SAME
   drawings, not generic wear at higher strength. ---- */
const rnd = PK.rnd;

function p1TideTex(mir, k) {
  k = k == null ? 1 : k;
  return PS.texURL('p1tide_v2' + (mir ? '_m' : '') + '_k' + Math.round(k * 100), 420, 560, (g, w, h) => {
    g.globalAlpha = k;
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
      const gr = g.createLinearGradient(0, h * (f.base - 0.02), 0, h);
      gr.addColorStop(0, `rgba(152,116,64,${(f.a * 0.55).toFixed(3)})`);
      gr.addColorStop(1, `rgba(138,102,52,${(f.a * 0.30).toFixed(3)})`);
      g.save();
      g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) g.lineTo(x, yAt(x));
      g.lineTo(w, h); g.closePath(); g.clip();
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.restore();
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
    const bx = mir ? w * 0.14 : w * 0.86;
    const bg = g.createRadialGradient(bx, h * 0.78, 4, bx, h * 0.78, w * 0.42);
    bg.addColorStop(0, 'rgba(146,108,56,0.012)');
    bg.addColorStop(0.62, 'rgba(150,114,62,0.006)');
    bg.addColorStop(1, 'rgba(150,114,62,0)');
    g.fillStyle = bg; g.beginPath(); g.arc(bx, h * 0.78, w * 0.42, 0, 7); g.fill();
  });
}

function p1StainTex(mir, k) {
  k = k == null ? 1 : k;
  return PS.texURL('p1stain' + (mir ? '_m' : '') + '_k' + Math.round(k * 100), 300, 300, (g, w, h) => {
    g.globalAlpha = k;
    const cx = w / 2, cy = h / 2, R = w * 0.40;
    const body = g.createRadialGradient(cx, cy, 0, cx, cy, R);
    body.addColorStop(0, 'rgba(148,110,56,0.14)');
    body.addColorStop(0.72, 'rgba(140,102,50,0.20)');
    body.addColorStop(0.93, 'rgba(120,84,38,0.34)');
    body.addColorStop(1, 'rgba(120,84,38,0)');
    g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
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

function p1SmudgeTex(mir, k) {
  k = k == null ? 1 : k;
  return PS.texURL('p1smudge' + (mir ? '_m' : '') + '_k' + Math.round(k * 100), 360, 200, (g, w, h) => {
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
    const gr = g.createRadialGradient(w * 0.28, h * 0.5, 2, w * 0.28, h * 0.5, w * 0.3);
    gr.addColorStop(0, 'rgba(60,54,46,0.04)');
    gr.addColorStop(1, 'rgba(60,54,46,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(w * 0.28, h * 0.5, w * 0.3, 0, 7); g.fill();
  });
}
window.P1 = {p1TideTex, p1StainTex, p1SmudgeTex};
</script>"""


# ---- layer recipes, all built from the project's own surface functions -------
RECIPES = {
    # transparent wear overlays
    "fibre-stock":    ("const t=PS.fibreTile(PK.STOCK.seed, PK.STOCK.fibre); return 'background:'+PS.tile(t,'200px 200px')", 200, 200, True),
    "foxing-light":   ("return 'background:'+PS.tile(PS.foxingTex(1301,0.32,false),'100% 100%')", W, H, True),
    "foxing-heavy":   ("return 'background:'+PS.tile(PS.foxingTex(2617,1.0,false),'100% 100%')", W, H, True),
    "water-stain":    ("return 'background:'+PS.stainLayers(733,1.0).join(',')", W, H, True),
    "humidity-bloom": ("return 'background:'+PS.humidLayers(911,1.0).join(',')", W, H, True),
    "grime-handling": ("return 'background:'+PS.grimeLayers(409,1.0).join(',')", W, H, True),
    "edge-oxidation": ("return 'background:'+PS.edgeLayers(1.0, PK.EDGE_OXIDATION).join(',')", W, H, True),
    "tonal-drift":    ("return 'background:'+PS.drift(281,1.0).join(',')", W, H, True),
    "smudge-abrasion":("return 'background:'+PS.smudgeLayers(617,1.0).join(',')", W, H, True),
    "crease":         ("return 'background:'+PS.layer(PS.creaseTex(101,false),'46% 40%','100% 100%')", W, H, True),

    # ---- page-1 trauma set: bespoke, heavier accidents that only the first
    # sheets of the block carry. Distinct seeds from the generic wear layers so
    # the front of the book never reads as "the same page, darker".
    "trauma-ring-stain":  ("return 'background:'+[PS.layer(P1.p1StainTex(false,1),'30% 22%','38% 34%'),PS.layer(P1.p1StainTex(true,1),'17% 13%','78% 86%')].join(',')", W, H, True),
    "trauma-tide-lines":  ("return 'background:'+PS.layer(P1.p1TideTex(false,1),'100% 100%','0 0')", W, H, True),
    "trauma-hand-smear":  ("return 'background:'+PS.layer(P1.p1SmudgeTex(false,1),'46% 17%','78% 70%')", W, H, True),
    "trauma-thumb-grime": ("return 'background:'+PS.grimeLayers(3121,1.0).concat(PS.grimeLayers(3617,0.6)).join(',')", W, H, True),
    "trauma-corner-fold": ("return 'background:'+[PS.layer(PS.creaseTex(881,false),'34% 30%','100% 100%'),PS.layer(PS.creaseTex(1447,false),'28% 22%','100% 0%')].join(',')", W, H, True),
}

# opaque paper substrates: stock tone + its own broad drift + fibre
SUBSTRATES = {
    "substrate-carried":   dict(tone=0.62, drift=0.9, fibre=1.00, seed=1201),
    "substrate-humidity":  dict(tone=0.78, drift=1.2, fibre=0.98, seed=1451),
    "substrate-protected": dict(tone=0.30, drift=0.5, fibre=0.94, seed=1699),
}
SUB_JS = """
const o = %s;
const t = PK.clamp01(PK.STOCK.oxidation*0.5 + o.tone*0.35);
const base = PK.STOCK.base.map((v,i)=>Math.round(PK.lerp(v, PK.STOCK.warm[i], t)));
const L = [];
L.push(...PS.drift(o.seed, o.drift));
L.push(PS.tile(PS.fibreTile(PK.STOCK.seed, PK.STOCK.fibre*o.fibre), '150px 150px'));
L.push('linear-gradient(168deg, rgb('+base.join(',')+'), rgb('+base.map(v=>v-6).join(',')+'))');
return 'background:'+L.join(',');
"""

# irregular fore-edge silhouettes, cut from the shared M2 edge model
HEAVY_EDGE = dict(recession=0.95, fray=0.62, cockle=0.72, cornerWear=0.94,
                  cornerSpine=0.26, compression=0.55, bottomSag=0.35)
HEAVY_LIM = {"frayChipping": 0.16, "geometricIntensity": 0.85}

MASKS = {
    "edge-mask-a": dict(seed=311, exposure=0.95, familyMix=0.0),
    "edge-mask-b": dict(seed=907, exposure=0.55, familyMix=0.5),
    "edge-mask-c": dict(seed=1531, exposure=0.20, familyMix=1.0),
    # heavier fore-edge silhouettes for the traumatised front of the block —
    # each a genuinely different sheet so neighbours never repeat a profile
    "edge-mask-heavy-1": dict(seed=4201, exposure=1.0, familyMix=0.0,
                              notebookEdge=HEAVY_EDGE, limits=HEAVY_LIM,
                              events={"notch": 0.95}),
    "edge-mask-heavy-2": dict(seed=4703, exposure=0.95, familyMix=0.0,
                              notebookEdge=dict(HEAVY_EDGE, recession=0.86, cockle=0.62),
                              limits=HEAVY_LIM, events={"notch": 0.7}),
    "edge-mask-heavy-3": dict(seed=5209, exposure=0.88, familyMix=0.1,
                              notebookEdge=dict(HEAVY_EDGE, recession=0.78, fray=0.5,
                                                cockle=0.55),
                              limits=HEAVY_LIM, events={"notch": 0.45}),
}
MASK_JS = """
const cond = PK.condition(Object.assign({limits: PK.PRODUCTION_LIMITS, notebookAge: 1}, %s));
const clip = PK.edgeProfile(cond);
return 'background:#ffffff;-webkit-clip-path:'+clip+';clip-path:'+clip;
"""

COVERS = {
    "cover-brick-front": "return 'background:'+window.F3_COVER.coverSkin(1)",
    "cover-brick-inside": "return 'background:'+window.F3_COVER.boardSkin(0.35)",
}


# broad, low-frequency overlays carry no fine detail: export them at half the
# master size (CSS scales them back up) and at a lower WebP quality.
SOFT = {"tonal-drift", "humidity-bloom", "grime-handling", "edge-oxidation",
        "water-stain", "smudge-abrasion",
        "trauma-hand-smear", "trauma-thumb-grime"}


async def shot(page, w, h, js, transparent, path, soft=False):
    css = await page.evaluate("(() => { %s })()" % js)
    await page.evaluate("([w,h,c]) => window.__set(w,h,c)", [w, h, css])
    buf = await page.locator("#s").screenshot(omit_background=transparent)
    img = Image.open(io.BytesIO(buf)).convert("RGBA" if transparent else "RGB")
    if soft:
        img = img.resize((img.width // 2, img.height // 2), Image.LANCZOS)
    img.save(path, "WEBP", quality=78 if soft else 92, method=6)
    return img.size


async def main():
    httpd = serve()
    assets = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(headless=True)
            ctx = await b.new_context(viewport={"width": 1000, "height": 1300},
                                      device_scale_factor=1)
            page = await ctx.new_page()
            await page.goto("http://127.0.0.1:%d/__bake.html" % PORT,
                            wait_until="domcontentloaded")

            async def emit(aid, label, group, w, h, js, transparent):
                path = os.path.join(OUT, aid + ".webp")
                size = await shot(page, w, h, js, transparent, path,
                                  soft=aid in SOFT)
                assets.append(dict(id=aid, label=label, group=group,
                                   path="/notebook-assets/%s.webp" % aid,
                                   w=size[0], h=size[1], format="webp",
                                   transparent=transparent,
                                   bytes=os.path.getsize(path)))
                print("  %-20s %sx%s  %6.1f KB" % (aid, size[0], size[1],
                                                   os.path.getsize(path) / 1024))

            print("substrates")
            for aid, o in SUBSTRATES.items():
                await emit(aid, aid.replace("substrate-", "").title() + " substrate",
                           "substrate", W, H, SUB_JS % json.dumps(o), False)
            print("wear overlays")
            labels = {
                "fibre-stock": "Fibre / stock texture", "foxing-light": "Foxing — light",
                "foxing-heavy": "Foxing — heavy", "water-stain": "Water stain",
                "humidity-bloom": "Humidity bloom / tide mark", "grime-handling": "Handling grime",
                "edge-oxidation": "Edge oxidation", "tonal-drift": "Tonal drift",
                "smudge-abrasion": "Smudge / abrasion", "crease": "Crease",
                "trauma-ring-stain": "Trauma — ring stain + spill",
                "trauma-tide-lines": "Trauma — multi-front tide lines",
                "trauma-hand-smear": "Trauma — hand smear drag",
                "trauma-thumb-grime": "Trauma — thumb grime",
                "trauma-corner-fold": "Trauma — corner folds / dog-ear",
            }
            for aid, (js, w, h, tr) in RECIPES.items():
                await emit(aid, labels[aid], "trauma" if aid.startswith("trauma-") else "wear",
                           w, h, js, tr)
            print("edge masks")
            for aid, o in MASKS.items():
                label = ("Heavy edge silhouette " + aid[-1] if "heavy" in aid
                         else "Edge silhouette " + aid[-1].upper())
                await emit(aid, label, "mask", W, H, MASK_JS % json.dumps(o), True)
            print("cover materials")
            await emit("cover-brick-front", "Brick front cover board (F3-03)", "cover",
                       W, H, COVERS["cover-brick-front"], False)
            await emit("cover-brick-inside", "Brick inside board / pastedown", "cover",
                       W, H, COVERS["cover-brick-inside"], False)
            await b.close()
    finally:
        httpd.shutdown()

    recipes = {
        "carried": {
            "id": "carried", "label": "Carried / Handled",
            "note": "Repeatedly opened, thumbed at the fore edge, exposed to light and air.",
            "substrate": "substrate-carried", "edgeMask": "edge-mask-a",
            "layers": [
                {"asset": "fibre-stock", "opacity": 0.85, "repeat": True},
                {"asset": "tonal-drift", "opacity": 0.75},
                {"asset": "foxing-light", "opacity": 0.55},
                {"asset": "grime-handling", "opacity": 0.95},
                {"asset": "smudge-abrasion", "opacity": 0.6},
                {"asset": "edge-oxidation", "opacity": 1.0},
                {"asset": "crease", "opacity": 0.7},
            ],
        },
        "humidity": {
            "id": "humidity", "label": "Humidity Affected",
            "note": "A damp episode shared by a run of neighbouring sheets: blooms, tide marks, heavy foxing.",
            "substrate": "substrate-humidity", "edgeMask": "edge-mask-b",
            "layers": [
                {"asset": "fibre-stock", "opacity": 0.8, "repeat": True},
                {"asset": "tonal-drift", "opacity": 1.0},
                {"asset": "humidity-bloom", "opacity": 1.0},
                {"asset": "water-stain", "opacity": 0.85, "mirror": True},
                {"asset": "foxing-heavy", "opacity": 0.8},
                {"asset": "edge-oxidation", "opacity": 0.7},
                {"asset": "grime-handling", "opacity": 0.35},
            ],
        },
        "protected": {
            "id": "protected", "label": "Protected Interior",
            "note": "Deep in the block — protected age rather than clean paper: quiet drift, faint foxing, almost no grime.",
            "substrate": "substrate-protected", "edgeMask": "edge-mask-c",
            "layers": [
                {"asset": "fibre-stock", "opacity": 0.7, "repeat": True},
                {"asset": "tonal-drift", "opacity": 0.4},
                {"asset": "foxing-light", "opacity": 0.28, "mirror": True},
                {"asset": "edge-oxidation", "opacity": 0.35},
            ],
        },
        "trauma": {
            "id": "trauma", "label": "Front-of-block trauma",
            "note": "The first sheets: a ringed spill, tide lines, a hand smear and thumb grime over a chewed fore edge. Echoes onto the two sheets behind it.",
            "substrate": "substrate-carried", "edgeMask": "edge-mask-heavy-1",
            "layers": [
                {"asset": "fibre-stock", "opacity": 0.88, "repeat": True},
                {"asset": "tonal-drift", "opacity": 0.9},
                {"asset": "trauma-tide-lines", "opacity": 0.95},
                {"asset": "trauma-ring-stain", "opacity": 1.0},
                {"asset": "foxing-heavy", "opacity": 0.7},
                {"asset": "trauma-thumb-grime", "opacity": 1.0},
                {"asset": "trauma-hand-smear", "opacity": 0.9},
                {"asset": "grime-handling", "opacity": 0.8},
                {"asset": "edge-oxidation", "opacity": 1.0},
                {"asset": "trauma-corner-fold", "opacity": 0.8},
                {"asset": "crease", "opacity": 0.7},
            ],
        },
    }

    manifest = {
        "version": 1, "stage": "Notebook rebuild · Stage 1",
        "master": {"w": W, "h": H, "aspect": "3:4"},
        "generatedBy": "extraction/notebook-native/tools/bake-assets.py",
        "runtime": {"canvas": 0, "webgl": 0, "technique": "CSS + static images"},
        "assets": assets,
        "recipes": recipes,
        "totalBytes": sum(a["bytes"] for a in assets),
    }
    for dest in (os.path.join(OUT, "manifest.json"),
                 os.path.join(ROOT, "src", "assets", "notebook-assets.manifest.json")):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w") as f:
            json.dump(manifest, f, indent=2)
    print("\n%d assets, %.1f KB total" % (len(assets), manifest["totalBytes"] / 1024))


asyncio.run(main())
