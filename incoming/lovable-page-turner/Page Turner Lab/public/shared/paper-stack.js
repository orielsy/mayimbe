/* ======================================================================
   SHARED PAPER STACK MODEL — one algorithm, two consumers.
   /paper-lab (exploration) and /notebook (production) both load this file,
   so the final stack algorithm exists exactly once. Pure deterministic
   modelling: no DOM, no canvas, no page-turn machinery.

   PRODUCTION LIMITS. condition() accepts a `limits` object; production
   passes PaperStack.PRODUCTION_LIMITS so no recipe — family, exposure,
   humidity, per-sheet variation, compression or frayScale — can push a
   sheet past the approved visual ceiling. Per-sheet geometric variation
   moves DOWN from the ceiling (0.72 .. 1.0), never above it.
   ====================================================================== */
(function(){
'use strict';

/* SELECTED PRODUCTION EDGE — "M2 — Moderately more worn", promoted verbatim
   from the large-format Paper Lab edge study (Section M). These are the exact
   values that produced M2; they are the new maximum, not the average. */
const M2_EDGE = {
  geo: 0.65, fray: 0.16,
  rec: 1.16, corner: 1.09, cockle: 1.08,
  notch: 0.35, inset: 0.60,
};
const PRODUCTION_LIMITS = { frayChipping: M2_EDGE.fray, geometricIntensity: M2_EDGE.geo };
/* the previous approved ceiling, kept so Variant A (/notebook) is unchanged */
const LEGACY_LIMITS_A = { frayChipping: 0.12, geometricIntensity: 0.55 };
/* exposed cut-edge oxidation target for the selected treatment */
const EDGE_OXIDATION = 0.62;
/* per-sheet geometric variation: strictly at or below the ceiling */
const GEO_VAR_LO = 0.72, GEO_VAR_HI = 1.0;


/* ---------- deterministic primitives (no Math.random anywhere) ---------- */
function rnd(seed){let s=(Math.abs(Math.floor(seed*1000))*2654435761%2147483647)||7;
  return()=> (s=(s*48271)%2147483647)/2147483647;}
const hash1=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const h2=(n,k)=>hash1(n*13.37+k*7.77+5.5);
const clamp01=v=>Math.max(0,Math.min(1,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const STOCK = {
  seed: 577,
  base: [232,222,201],      // aged cream, never white
  warm: [214,193,157],      // oxidised warmth pulled in at the edges
  fibre: 0.85,              // fibre visibility of the stock itself
  oxidation: 0.62,          // broad age of the whole book
};

/* Every polygon is a pure function of cond.geo, so identical geometry is only
   ever solved once. Zoom, the flat/silhouette toggle, crops and repeated
   sandbox states all hit this cache instead of re-deriving hundreds of points. */
const EDGE_CACHE=new Map();
function edgeProfile(cond){
  const g=cond.geo;
  const key=g.seed+'|'+[g.recession,g.cockle,g.cornerOuter,g.cornerSpine,g.notch,
    g.neighborPhase,g.fray||0,g.foreInset||0,g.bottomInset||0]
    .map(v=>(+v||0).toFixed(5)).join(',');
  let v=EDGE_CACHE.get(key);
  if(v===undefined){v=edgeProfileRaw(cond);EDGE_CACHE.set(key,v);}
  return v;
}
function edgeProfileRaw(cond){
  const {seed,recession,cockle,cornerOuter,cornerSpine,notch,neighborPhase}=cond.geo;
  const F=Math.max(0,cond.geo.fray||0);   // torn / chipped damage amount
  /* block-level extent: how far this sheet's fore edge / bottom edge fall short
     of the nominal rectangle, in % of the sheet. 0 = full extent (default). */
  const FI=Math.max(0,cond.geo.foreInset||0);
  const BI=Math.max(0,cond.geo.bottomInset||0);
  const pts=[];
  const R=recession;                 // 0..1 -> up to ~2.6% of width
  const maxR=2.6*R;
  const wavePh=neighborPhase;        // shared across a neighbourhood
  const N=40;
  const NR=F>0?150:N;                // fore edge needs dense sampling for chips
  /* Smooth low-frequency profile noise. Real paper edges recede in broad
     shallow bays, not in per-vertex spikes, so the seed drives the phases of
     a few sine terms rather than the value at each vertex. */
  const ph=k=>h2(seed,k)*6.28;
  const wob=(t,k)=> 0.55*Math.sin(t*2.1+ph(k)) + 0.30*Math.sin(t*4.3+ph(k+1))
                  + 0.15*Math.sin(t*7.7+ph(k+2));
  /* ---- fray layer: multi-scale roughness + discrete hard-edged chips ----
     Deterministic from the sheet seed. At F=0 both terms are exactly 0, so
     the smooth model above is preserved bit-for-bit. */
  const rough=(t,k)=>{           // stepped fine noise -> abrupt, not curved
    const s=Math.floor(t*110);
    const a=h2(seed,k+s*2)-0.5, b=h2(seed,k+s*2+1)-0.5;
    return (a*0.7+b*0.3)*2;
  };
  const chips=[];
  if(F>0){
    const nch=Math.round(2+7*Math.min(1.5,F));
    for(let k=0;k<nch;k++){
      const at=0.04+0.92*h2(seed,200+k*3);
      const w=0.010+0.048*h2(seed,201+k*3);
      const dep=(0.45+1.9*h2(seed,202+k*3))*F*2.2;
      chips.push([at,w,dep]);
    }
  }
  const chipAt=t=>{              // steep entry, short tail -> a bite, not a bay
    let d=0;
    for(let k=0;k<chips.length;k++){
      const at=chips[k][0], w=chips[k][1], dep=chips[k][2];
      const dd=t-at;
      if(dd>-w*0.3 && dd<w){
        const u = dd<0 ? (dd+w*0.3)/(w*0.3) : 1-(dd/w);
        const v = dep*Math.max(0,u);
        if(v>d) d=v;
      }
    }
    return d;
  };
  const co=cornerOuter;
  /* corner envelope: damage and extent variation ramp in over the first ~9% of
     the fore edge and out over the last ~9%, so the two right-hand corners stay
     coherent corners instead of sprouting needle-like protrusions. */
  const sstep=u=>{const x=clamp01(u);return x*x*(3-2*x);};
  const cornerEnv=t=>sstep(t/0.09)*sstep((1-t)/0.09);
  /* the fore edge as a function of t (0 = top-right, 1 = bottom-right) */
  const notchAt=0.35+0.42*h2(seed,3);
  const foreX=t=>{
    const ce=cornerEnv(t);
    let x=100 - FI - maxR*(0.55+0.45*wob(t,40))*(0.35+0.65*ce);
    x -= (Math.sin(t*3.6+wavePh)*0.5+0.5)*1.1*cockle*(0.4+0.6*ce);
    // corner erosion: material is lost, so the edge only ever pulls inward
    const cTop=Math.max(0,1-t/0.13)**1.6, cBot=Math.max(0,1-(1-t)/0.15)**1.6;
    x -= co*2.6*cTop;
    x -= co*3.1*cBot;
    if(F>0){
      x -= Math.max(0, F*0.85*rough(t,400))*ce;              // fine unevenness
      x -= chipAt(t)*ce;                                     // discrete bites
      x -= co*F*1.8*(cTop+cBot)*Math.abs(rough(t,500));      // torn, not rounded
    }
    if(notch>0){
      const d=Math.abs(t-notchAt);
      if(d<0.045) x -= notch*2.6*Math.cos(d/0.045*Math.PI/2)**1.4;
    }
    return x;
  };
  const xTop=foreX(0), xBot=foreX(1);
  // top edge, left -> right; the last stretch converges onto the fore edge so
  // the top-right corner closes cleanly instead of leaving a horizontal whisker
  for(let i=0;i<=N;i++){
    const t=i/N;
    let y=(0.55*R*(0.55+0.45*wob(t,20))*t) + (Math.sin(t*3.1+wavePh)*0.45+0.45)*0.5*cockle;
    if(F>0) y += Math.max(0, F*0.55*rough(t,300)) * t*t;
    const nominal=t*100;
    const k=sstep((t-0.55)/0.4);                 // converge over the outer 40%
    const x=Math.min(nominal, lerp(nominal, xTop, k));
    pts.push([x, Math.max(0,y)]);
  }
  // right edge, top -> bottom
  for(let i=0;i<=NR;i++){
    const t=i/NR;
    pts.push([foreX(t), lerp(0,100,t)]);
  }
  // bottom edge, right -> left
  for(let i=0;i<=N;i++){
    const t=i/N;
    let y=100 - BI*(0.25+0.75*(1-t)) - 0.55*R*(0.55+0.45*wob(1-t,60))*(1-t)
              - (Math.sin((1-t)*2.6+wavePh)*0.45+0.45)*0.5*cockle;
    if(F>0) y -= Math.max(0, F*0.55*rough(1-t,600)) * (1-t)*(1-t);
    const nominal=(1-t)*100;
    const k=sstep(((1-t)-0.55)/0.4);
    const x=Math.min(nominal, lerp(nominal, xBot, k));
    pts.push([x, Math.min(100,y)]);
  }


  // spine corners: compressed, not lost
  const cs=cornerSpine;
  pts.push([cs*1.1, 100-cs*1.4]);
  pts.push([0, 100-cs*2.2]);
  pts.push([0, cs*2.0]);
  pts.push([cs*0.9, cs*1.1]);
  return 'polygon(' + pts.map(p=>`${p[0].toFixed(2)}% ${p[1].toFixed(2)}%`).join(',') + ')';
}

/* ======================================================================
   THE NOTEBOOK — one paper block, one shared edge history.
   Every sheet in the notebook inherits this geometric condition. Families
   only nudge it; exposure and humidity only modify it modestly. This is what
   makes the whole block read as one physical object rather than a sampler.
   ==================================================================== */
const NOTEBOOK_EDGE = {
  recession:0.60, fray:0.50, cockle:0.40, cornerWear:0.55, cornerSpine:0.18,
  compression:0.40, bottomSag:0.35,
};

/* ======================================================================
   FAMILIES — two, and they describe SURFACE HISTORY.
   A family is how a run of sheets experienced life, not a different paper.
   Geometry lives in NOTEBOOK_EDGE; edgeMod is a restrained ±~5-8% nudge.
   ==================================================================== */
const FAMILIES = {
  handled:{ id:'handled', name:'Carried / Handled',
    cause:'repeatedly opened, carried, thumbed at the outer edge',
    surface:{tone:0.55, grime:1.00, edge:1.00, fibre:1.00},
    edgeMod:{recession:1.06, fray:1.06, cockle:1.00, cornerWear:1.08, cornerSpine:1.05} },
  protected:{ id:'protected', name:'Protected Interior',
    cause:'deep in the block, shielded from air, light and hands — protected age, not clean paper',
    surface:{tone:0.34, grime:0.20, edge:0.42, fibre:0.94},
    edgeMod:{recession:0.95, fray:0.95, cockle:0.95, cornerWear:0.94, cornerSpine:0.96} },
};
const famLabel=m=> m<=0.02 ? FAMILIES.handled.name
  : m>=0.98 ? FAMILIES.protected.name
  : `Handled → Protected (${Math.round(m*100)}% protected)`;

/* ---------- sheetCondition ----------
   family        : which end of the two-family axis (continuous via familyMix)
   exposure      : how much air / light / thumbs this depth of the block saw
   neighborhood  : the environmental episode — humidity, foxing, bloom, compression
   notebookEdge  : the shared paper-block geometry, overridable for studies
   events        : rare, individual, optional
   ---------------------------------------------------------------------- */
function condition(o){
  const A=FAMILIES.handled, B=FAMILIES.protected;
  /* 0 = fully Carried/Handled, 1 = fully Protected Interior; continuous. */
  const mix = o.familyMix!=null ? clamp01(o.familyMix)
            : o.familyBlend ? clamp01(o.familyBlend.t)
            : (o.family==='protected' ? 1 : 0);
  const exposure = o.exposure==null ? 0.55 : Math.max(0,o.exposure);
  const fei = o.familyEdgeInfluence==null ? 1 : clamp01(o.familyEdgeInfluence);
  const age=o.notebookAge==null?1:o.notebookAge;
  const nb=o.neighborhood||{};             // {humid, foxing, bloom, compress, cockle, phase}
  const ev=o.events||{};                   // {crease, stain, smudge, notch}
  const seed=o.seed==null?101:o.seed;
  /* LIMITS: applied to the recipe itself, not to a debug slider. When present
     no downstream term — family, exposure, humidity, compression, per-sheet
     variation or frayScale — can exceed the approved production ceiling. */
  const LIM=o.limits||null;
  let gi=o.geoIntensity==null?1:o.geoIntensity;
  if(LIM && LIM.geometricIntensity!=null) gi=Math.min(gi,LIM.geometricIntensity);
  const E={...NOTEBOOK_EDGE, ...(o.notebookEdge||{})};

  const fs=k=>lerp(A.surface[k],B.surface[k],mix);
  /* family edge influence: at fei=0 the families are geometrically identical */
  const fe=k=>lerp(1, lerp(A.edgeMod[k],B.edgeMod[k],mix), fei);

  /* exposure moves surface history a lot and geometry only a little */
  const xS=0.55+0.85*exposure;    // grime / rubbing
  const xE=0.60+0.80*exposure;    // edge dirt & oxidation
  const xT=0.80+0.40*exposure;    // tonal warmth
  const xG=0.94+0.14*exposure;    // geometry — deliberately narrow

  /* environment: one episode, shared by a run of sheets */
  const humid  = clamp01((nb.humid||0) + (nb.bloom||0)*0.45)*age;
  const foxing = clamp01(nb.foxing==null ? (nb.humid||0)*0.85 : nb.foxing)*age;
  const comp   = nb.compress||0;
  const nbCk   = nb.cockle||0;

  return {
    seed, age, mix, exposure, familyLabel:famLabel(mix),
    family: mix<0.5?A:B,
    tone:(fs('tone')*xT + humid*0.18)*age,
    grime:fs('grime')*xS*age,
    edge:fs('edge')*xE*age,
    foxing, humid, fibre:fs('fibre'), events:ev, nb,
    geo:{ seed,
      recession:clamp01((E.recession*fe('recession')*xG + comp*E.compression*0.35)*gi),
      cockle:((E.cockle*fe('cockle') + humid*0.55 + nbCk*0.45)*gi),
      cornerOuter:clamp01((E.cornerWear*fe('cornerWear')*xG + comp*0.18)*gi),
      cornerSpine:E.cornerSpine*fe('cornerSpine')*gi,
      fray:(v=>LIM&&LIM.frayChipping!=null?Math.min(v,LIM.frayChipping):v)
           (Math.max(0,E.fray*fe('fray')*xG*gi*(o.frayScale==null?1:o.frayScale))),
      bottomSag:E.bottomSag,
      foreInset:o.foreInset||0, bottomInset:o.bottomInset||0,
      notch:(ev.notch||0)*gi,
      neighborPhase:(nb.phase==null? h2(seed,17)*6.28 : nb.phase) },
  };
}

const MODEL_CACHE=new Map();
const MODEL_KEYS=['strata','seed','family','familyMix','exposure','fei','notebookEdge',
  'age','geo','humid','foxing','bloom','compress','notchRate',
  'correlated','phase','phaseVar','foreDepth','bottomDepth','lift','registration',
  'clusterAmp','indivAmp','limits','boxScale','frayScale','seam','foreStep','bottomStep',
  'placementMode'];
const PERF=/[?&]debug/.test(location.search);
const tmark=(label,t0)=>{if(PERF)console.log(label,(performance.now()-t0).toFixed(1)+' ms');};
function buildStackModel(spec){
  const key=MODEL_KEYS.map(k=>JSON.stringify(spec[k]==null?null:spec[k])).join('|');
  let m=MODEL_CACHE.get(key);
  if(m) return m;
  const t0=performance.now();
  const n=spec.strata||24;
  const seed=spec.seed;
  const foreDepth   = spec.foreDepth   == null ? 3.2 : spec.foreDepth;    // % sheet width
  const bottomDepth = spec.bottomDepth == null ? 1.6 : spec.bottomDepth;  // % sheet height
  const lift        = spec.lift        == null ? 2.2 : spec.lift;         // % height, whole block
  const reg         = spec.registration== null ? 0.25: spec.registration; // % spine slop (tiny)
  const clusterAmp  = spec.clusterAmp  == null ? 0.34: spec.clusterAmp;
  const indivAmp    = spec.indivAmp    == null ? 0.19: spec.indivAmp;

  /* clusters of 3-6 consecutive sheets that share a deformation */
  const cl=[];{let id=0,left=0;
    for(let i=0;i<n;i++){ if(left<=0){left=3+Math.floor(h2(seed,900+id)*4);id++;} cl.push(id-1);left--; }}

  /* ---- OPT-IN legible cascade (spec.foreStep / spec.bottomStep) -------------
     Without it the envelope below can hand two neighbouring sheets almost the
     same extent, and since a shorter sheet sits ON TOP the longer one is simply
     hidden: twenty strata collapse to the three or four "record" extents, which
     is what made the block read as one beige strip. With it, every sheet is
     guaranteed a small monotonic step of its own — irregular in size, so it is
     a cascade rather than a staircase, and no sheet can occlude another. */
  const stepArr=(o,keyOff)=>{
    if(!o) return null;
    const a=[]; let acc=0;
    for(let i=0;i<n;i++){
      a.push(acc);
      const u=h2(seed,i*11+keyOff), v=h2(seed,i*19+keyOff+1);
      /* mostly mid steps, occasionally a tight pair or a fat one */
      let s=lerp(o.min,o.max,u*u*(3-2*u));
      if(v<0.12) s*=0.55;                 // two sheets pressed nearly flush
      else if(v>0.93) s*=1.35;            // one sheet standing a little proud
      acc+=s;
    }
    return a;
  };
  const FSTEP=stepArr(spec.foreStep,120), BSTEP=stepArr(spec.bottomStep,320);

  const sheets=[];
  for(let i=0;i<n;i++){
    const t=n>1? i/(n-1) : 0;
    const cid=cl[i];
    const cPhase=h2(seed,940+cid)*6.28;
    const phase=spec.correlated? spec.phase + cPhase*0.15*(spec.phaseVar||0) + Math.sin(i*0.55)*(spec.phaseVar||0)
                               : h2(seed,i)*6.28;
    /* ---- extent envelope: upper sheets generally shorter, but wavy, never a
       linear staircase; clusters shift together; sheets deviate a little ---- */
    const env  = 0.74*t + 0.26*(0.5+0.5*Math.sin(t*4.2+h2(seed,7)*6.28))
                        + 0.09*Math.sin(t*9.1+h2(seed,8)*6.28);
    const cOff = (h2(seed,960+cid)-0.5)*2*clusterAmp;
    const dOff = (h2(seed,i*31+3)-0.5)*2*indivAmp;
    const kX   = clamp01(env + cOff + dOff);
    const kY   = clamp01(0.35 + 0.55*env + (h2(seed,980+cid)-0.5)*clusterAmp
                              + (h2(seed,i*17+5)-0.5)*indivAmp*1.4);
    /* wear removes material: a sheet may be nearly full extent, but never
       protrudes past the block face (that produced corner whiskers). */
    const foreInset   = FSTEP ? FSTEP[i] : Math.max(0, foreDepth*kX);
    const bottomInset = BSTEP ? BSTEP[i] : Math.max(0, bottomDepth*kY);


    const c=condition({
      family:spec.family, familyMix:spec.familyMix, exposure:spec.exposure,
      familyEdgeInfluence:spec.fei, notebookEdge:spec.notebookEdge,
      seed:seed+i*17, notebookAge:spec.age, limits:spec.limits, frayScale:spec.frayScale,
      /* per-sheet geometric variation moves DOWN from the approved ceiling:
         the strongest sheet equals spec.geo, the rest are quieter. No sheet
         can become a rogue, dramatically more damaged outlier. */
      geoIntensity:spec.geo*(GEO_VAR_LO+(GEO_VAR_HI-GEO_VAR_LO)*h2(seed,i*5.7)),
      neighborhood:{humid:spec.humid*(spec.correlated?(0.6+0.4*Math.sin(i*0.7+spec.phase)):h2(seed,i*2.2)),
                    foxing:spec.foxing, bloom:spec.bloom,
                    compress:spec.compress*(0.35+0.65*kX), phase},
      events:{notch: (h2(seed,i*9.3)<spec.notchRate? 0.6+0.5*h2(seed,i):0)},
    });

    /* spine stays registered: only a hair of compression slop, and a small
       upward lift for block thickness. No lateral fan. */
    const dx = (h2(seed,i*3.1)-0.5)*2*reg;
    const dy = -t*lift + (h2(seed,i*7.3)-0.5)*2*reg*0.5;

    /* ---- cut-edge treatment, sized to the per-sheet spacing of the block ----
       Three ideas, all page-relative so thumbnail and zoom agree:
         1. a tight contact seam (sub-mm occlusion + trapped dirt)
         2. a cut edge slightly warmer / older than the page face
         3. a little outer grime, strongest at the outer fore edge and bottom
       Everything varies deterministically per sheet so 26 strata never read as
       a barcode: opacity, tone, band width and the seam angle all wobble. */
    const sp=Math.max(0.06, foreDepth/n);          // % of sheet width per stratum
    const U=k=>`calc(var(--u)*${(sp*k).toFixed(4)})`;
    const r1=h2(seed,i*23+9), r2=h2(seed,i*29+4), r3=h2(seed,i*37+11), r4=h2(seed,i*41+2);
    const dirty=clamp01(0.35+0.5*c.edge+(r1-0.5)*0.8);   // this sheet's own grubbiness
    const seamA=(0.30+0.45*dirty)*(0.75+0.5*r2);          // contact seam opacity
    const seamW=0.34+0.30*r3;                             // seam width, in spacings
    const cutW =seamW+0.55+0.45*r4;                       // cut-edge band width
    // cut-edge tone: warm tan -> oxidised cream, shifted per sheet
    const cw=clamp01(0.35+0.55*dirty+(r3-0.5)*0.3);
    const cut=[Math.round(lerp(233,201,cw)),Math.round(lerp(216,172,cw)),Math.round(lerp(180,127,cw))];
    const cutA=(0.55+0.30*r2).toFixed(3);
    const grimeA=(0.08+0.20*dirty).toFixed(3);
    const aR=270+(r2-0.5)*2.4;                            // break perfect striping
    /* the seam carries the contact depth that used to be a per-sheet
       drop-shadow(): a hard dark line right at the cut, then the sheet's own
       edge tone. Same read, no filter surface. */
    /* ---- OPT-IN readable contact seam (spec.seam) --------------------------
       Consumers that need the block to read as MANY SHEETS at presentation size
       pass spec.seam. Nothing about geometry, damage or surface changes: the
       boundary between adjacent sheets simply gets a real, px-floored width and
       a warm dark tone, deterministically varied per sheet so it never becomes
       a barcode. Without spec.seam the historical treatment is bit-identical. */
    const SO=spec.seam||null;
    /* the seam bands are painted from the element BOX edge, but this sheet's
       actual cut edge sits inward of it by its own recession. Offset every band
       by that amount or the whole treatment is clipped away and the block loses
       its boundaries — this is what made twenty strata read as one strip. */
    const clipStr=edgeProfile(c);
    let _mx=0,_my=0;{const re=/(-?[\d.]+)%\s+(-?[\d.]+)%/g;let g;
      while((g=re.exec(clipStr))){if(+g[1]>_mx)_mx=+g[1];if(+g[2]>_my)_my=+g[2];}}
    _mx=_mx||100; _my=_my||100;
    let seam;
    if(SO){
      const gain   = SO.gain   ==null?1   :SO.gain;      // seam darkness multiplier
      const wLo    = SO.widthLo==null?0.55:SO.widthLo;   // CSS px
      const wHi    = SO.widthHi==null?0.80:SO.widthHi;   // CSS px
      const cutGain= SO.cutGain==null?1   :SO.cutGain;   // cut-edge tonal contrast
      const cutLo  = SO.cutLo  ==null?1.5 :SO.cutLo;     // CSS px
      const cutHi  = SO.cutHi  ==null?3.0 :SO.cutHi;     // CSS px
      const botMul = SO.bottom ==null?0.65:SO.bottom;    // legacy knob, kept for API compat
      const w1=h2(seed,i*53+7), w2=h2(seed,i*59+13), w3=h2(seed,i*61+19);
      const sm=x=>x*x*(3-2*x);
      /* width: an explicit perceived range in CSS px, deterministically varied
         so no two boundaries are the same line. */
      const sPx=lerp(wLo,wHi,sm(w1));
      /* local continuity: a few boundaries nearly vanish where two sheets are
         pressed flat against each other — this keeps the block off "barcode". */
      const faint = w3<0.13 ? 0.55+0.25*w3 : 1;
      const sA=clamp01((0.56+0.20*w2+0.08*dirty)*gain*faint);
      /* cut edge: warmer, slightly darker, slightly more oxidised than the face,
         but still paper — never brown. */
      const cwid=lerp(cutLo,cutHi,sm(w2));
      /* tonal separation BETWEEN neighbours. What makes a block read as many
         sheets is each cut edge being a visibly different value from the one
         beside it. Organic, not alternating: a slow drift across the block plus
         a fast per-sheet hash, so runs of similar sheets and occasional strong
         steps both occur, exactly like a real fore edge. */
      const amp=(SO.alt==null?0.22:SO.alt);
      const drift=Math.sin(i*1.17+seed*0.013)*0.55+Math.sin(i*2.63+1.9)*0.28;
      const org=(drift*0.6+(w3-0.5)*1.5+(r4-0.5)*0.9)*amp;
      const ccw=clamp01(cw*0.80+0.12*cutGain+org);
      const cutC=[Math.round(lerp(236,188,ccw)),Math.round(lerp(219,160,ccw)),Math.round(lerp(184,114,ccw))];
      const cutAA=clamp01((0.60+0.28*r2)*cutGain).toFixed(3);
      const px=v=>`max(${v.toFixed(2)}px, ${U(v/2.6)})`;   // px floor, still scale-aware
      const DX=(100-_mx).toFixed(3)+'%';
      const at=(d,v)=>`calc(${d} + ${v})`;
      const C=px(sPx+cwid);
      /* QUIET EDGE PASS v3. Any painted band at a fixed distance from every
         sheet's cut edge stacks into a barcode, no matter how it is tinted —
         including the bottom-edge falloff, which read as periodic horizontal
         dashes down the block. Bottom bands are therefore GONE too; separation
         comes from recession, silhouette and value drift only. */
      const cutSoft=clamp01((0.10+0.06*r2)*cutGain).toFixed(3);
      seam=[
        // fore edge: this sheet's own tone, fading inward. No line, no band.
        `linear-gradient(${aR.toFixed(2)}deg, rgba(0,0,0,0) 0 ${DX},`+
          ` rgba(${cutC.join(',')},${cutSoft}) ${DX} ${at(DX,C)}, rgba(0,0,0,0) ${at(DX,px(sPx+cwid*3.2))})`,
        // outer grime falling off inward, never the same reach twice
        `linear-gradient(270deg, rgba(118,90,50,${(grimeA*0.6).toFixed(3)}) ${DX} ${at(DX,U(1.9+1.4*r1))},`+
          ` rgba(136,107,64,${(grimeA*0.28).toFixed(3)}) ${at(DX,U(1.9+1.4*r1))} ${at(DX,U(4.6+2*r3))}, rgba(0,0,0,0) ${at(DX,U(8.5))})`,
        `radial-gradient(120% 90% at 100% 100%, rgba(104,78,42,${(grimeA*0.7).toFixed(3)}) 0, rgba(0,0,0,0) ${U(14)})`,
      ].join(', ');

    } else {

    /* same rule for the historical (production) treatment: no contact line and
       no cut BAND — only a soft per-sheet tonal falloff at the cut. */
    const cutSoftH=clamp01(cutA*0.22).toFixed(3);
      seam=[
      // fore edge: soft per-sheet tone, fading inward
      `linear-gradient(${aR.toFixed(2)}deg, rgba(${cut.join(',')},${cutSoftH}) 0 ${U(cutW)}, rgba(0,0,0,0) ${U(cutW*3)})`,
      // outer grime falling off inward, never the same reach twice
      `linear-gradient(270deg, rgba(118,90,50,${(grimeA*0.6).toFixed(3)}) 0 ${U(1.9+1.4*r1)},`+
        ` rgba(136,107,64,${(grimeA*0.28).toFixed(3)}) ${U(1.9+1.4*r1)} ${U(4.6+2*r3)}, rgba(0,0,0,0) ${U(8.5)})`,

      // bottom outer corner picks up a touch more grime
      `radial-gradient(120% 90% at 100% 100%, rgba(104,78,42,${(grimeA*0.9).toFixed(3)}) 0, rgba(0,0,0,0) ${U(14)})`,
    ].join(', ');
    }


    /* fore-edge crops are a geometry study: surface aging is deliberately
       reduced to a tone + edge oxidation so 26 magnified sheets stay cheap */
    const tw=clamp01(STOCK.oxidation*0.5+c.tone*0.35);
    const bs=STOCK.base.map((v,j)=>Math.round(lerp(v,STOCK.warm[j],tw)));
    const cheapBody=`linear-gradient(272deg, rgba(124,96,54,${(0.10+0.22*c.edge).toFixed(3)}) 0 ${U(6)}, rgba(0,0,0,0) ${U(16)}),`+
      `linear-gradient(168deg, rgb(${bs.join(',')}), rgb(${bs.map(v=>v-6).join(',')}))`;

    /* boxScale = the fraction of the container a full-extent sheet occupies.
       The lab frames its stacks (86%); production fills its own block box (100).
       foreInset / bottomInset are also exported raw so a consumer can scale the
       block's DEPTH per frame (sheets transferring) without re-deriving any
       geometry: only width/height/opacity change. */
    const box=spec.boxScale==null?86:spec.boxScale;
    sheets.push({i,z:i+1,cond:c,seam,cheapBody,box,foreInset,bottomInset,dx,dy,t,
      transform:`translate(${dx.toFixed(3)}%, ${dy.toFixed(3)}%)`,
      width :(box*(100-foreInset)/100).toFixed(3)+'%',
      height:(box*(100-bottomInset)/100).toFixed(3)+'%',
      mx:_mx, my:_my, clip:clipStr});
  }

  /* ---- recession resolve (step mode only) ---------------------------------
     Sheets are made visible by ENDING at different places, never by being
     moved to different places. The spine stays registered; only the physical
     extent of each sheet changes.

       paperBlockOuterEdge : the fixed envelope inside the cover (the deepest
                             reach any stratum is allowed, = the best sheet)
       target_r            : envelope - cumulative inset for rank r
       foreInset           : solved, bound-anchored, so that this sheet's OWN
                             M2 profile (which already recedes by its own
                             amount) lands its outermost point on target_r

     The polygons, damage, fray and corner envelope are untouched: the solve
     only decides how much material the sheet has left. Depth order follows
     actual reach, so no stratum can be swallowed by the one above it. */
  /* placementMode:
       'recession' (default) — bound-anchored solve below: FSTEP/BSTEP are
                    CUMULATIVE RECESSION targets; sheets only end earlier.
       'cascade'  — legacy Paper Lab experiment: FSTEP/BSTEP are used raw as
                    foreInset/bottomInset with no solve. Never production. */
  if(FSTEP && sheets.length>1 && (spec.placementMode||'recession')!=='cascade'){
    const order=sheets.map(s=>s).sort((a,b)=>b.mx-a.mx);
    const MAXI=32;                                   // never shrink to a chip
    let prevX=order[0].mx, prevY=order[0].my||100;
    order.forEach((s,rank)=>{
      const tX = rank===0 ? Math.min(s.mx,prevX)
               : Math.min(prevX-(FSTEP[rank]-FSTEP[rank-1]), s.mx);
      const tY = rank===0 ? Math.min(s.my||100,prevY)
               : Math.min(prevY-((BSTEP?BSTEP[rank]-BSTEP[rank-1]:0)), s.my||100);
      const fi = Math.min(MAXI, Math.max(0, 100 - tX*100/(s.mx||100)));
      const bi = Math.min(MAXI, Math.max(0, 100 - tY*100/(s.my||100)));
      s.foreInset=fi; s.bottomInset=bi;
      s.width =(s.box*(100-fi)/100).toFixed(3)+'%';
      s.height=(s.box*(100-bi)/100).toFixed(3)+'%';
      s.z=rank+1;                                    // longest reach at the bottom
      prevX=(s.mx||100)*(100-fi)/100;                // this sheet's ACTUAL edge
      prevY=(s.my||100)*(100-bi)/100;
    });
  }



  m={n,sheets};
  MODEL_CACHE.set(key,m);
  tmark('stack model ['+spec.seed+'/'+n+']',t0);
  return m;
}


window.PaperStack = { rnd, hash1, h2, clamp01, lerp, STOCK,
  edgeProfile, NOTEBOOK_EDGE, FAMILIES, famLabel, condition, buildStackModel,
  PRODUCTION_LIMITS, LEGACY_LIMITS_A, M2_EDGE, EDGE_OXIDATION };
})();
