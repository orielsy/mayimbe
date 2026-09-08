/* ======================================================================
   NOTEBOOK MARKUP — the <body> of public/notebook-lab-native/index.html,
   minus the lab chrome (header, controls, HUD, debug panel), rebuilt inside
   a host element instead of the document.

   Structure, element order, class names and ids are unchanged: the engine's
   measurements, z-order and CSS all depend on them. Ids are kept as they
   were, but nothing looks them up through document.getElementById — every
   lookup is root-scoped (see refs()), so several notebooks can coexist.
   ==================================================================== */
import { PORTRAIT_DATA_URL } from './assets/portrait';
import { NOTEBOOK_ROOT_CLASS } from './styles';

/** The gift inscription pressed into the inside back board. Part of the
 *  physical object (not page content), exactly as in the source. */
const DEDICATION_HTML =
  '<div class="dedication">' +
  '<span>Para Antony, con mucho cari\u00f1o.</span>' +
  '<span>De parte de</span>' +
  '<span>Orielsy Diaz</span>' +
  '</div>';

const PORTRAIT_HTML = (cls: string) =>
  `<img class="${cls}" src="${PORTRAIT_DATA_URL}" alt="Antony Santos portrait" />`;

const MARKUP = `
<div class="stage" id="stage">
  <div class="book closed" id="book">
    <div class="deskshadow"></div>
    <div class="frontboard"></div>
    <div class="backcover"></div>
    <!-- the resting inside of the front cover: the SAME rectangle the WebGL
         cover occupies at p = 1 (see layoutOpenCover). It lives here, above
         the boards and below the spread, so every sheet later flipped onto
         the left lands on top of it — as it physically must. -->
    <div class="opencover" id="opencover"></div>
    <!-- the two faces of the back board: the pastedown exposed after the last
         sheet (carrying the dedication), and the outer board at rest once the
         notebook has been shut from the back. -->
    <div class="insideback" id="insideback">${PORTRAIT_HTML('backphoto orielsy')}${DEDICATION_HTML}</div>
    <div class="backclosed" id="backclosed"></div>

    <div class="spread" id="spread">
      <div class="half left">
        <div class="stack" id="stackL"></div>
        <div class="leaf" id="leafL"></div>
      </div>
      <div class="half right">
        <div class="stack" id="stackR"></div>
        <div class="leaf" id="leafR"></div>

        <div class="cover" id="cover"><span class="title">CUADERNO</span></div>
      </div>
      <!-- CONTINUOUS COVER SHADOW SYSTEM (see updateCoverShadow). These two
           layers are DOM for the whole motion — closed, mid-swing under
           WebGL, and open — so the renderer can change hands without the
           shadow changing hands. -->
      <div class="covercast" id="covercast"></div>
      <div class="coveredge" id="coveredge">
        <div class="edgeband r" id="edgebandR"></div>
        <div class="edgeband l" id="edgebandL"></div>
      </div>
      <div class="coverseam" id="coverseam"></div>
    </div>

    <!-- structural hinge/contact shading: DOM for the whole motion, so the
         renderer can change hands without this shadow changing hands -->
    <div class="hingeshade"></div>
    <div class="crease"></div>
  </div>
  <canvas class="nb-gl" id="gl"></canvas>
  <div class="grab next" id="grabNext"></div>
  <div class="grab prev" id="grabPrev"></div>
</div>

<div class="nb-snaphost" id="snapHost">
  <div style="position:relative"><div class="leaf" id="snapLeaf"></div></div>
  <div style="position:relative"><div class="cover" id="snapCover"><span class="title">CUADERNO</span></div></div>
  <div style="position:relative"><div class="cover inside" id="snapCoverBack"></div></div>
  <div style="position:relative"><div class="cover inside" id="snapCoverBackPhoto">${PORTRAIT_HTML('backphoto')}${DEDICATION_HTML}</div></div>
  <div style="position:relative"><div class="cover" id="snapBackBoard"></div></div>
</div>
`;

export interface NotebookRefs {
  root: HTMLElement;
  stage: HTMLElement;
  book: HTMLElement;
  cover: HTMLElement;
  leafL: HTMLElement;
  leafR: HTMLElement;
  backcover: HTMLElement;
  stackL: HTMLElement;
  stackR: HTMLElement;
  openCoverEl: HTMLElement;
  insideBackEl: HTMLElement;
  backClosedEl: HTMLElement;
  covercast: HTMLElement;
  coveredge: HTMLElement;
  coverseam: HTMLElement;
  edgebandR: HTMLElement;
  edgebandL: HTMLElement;
  deskshadowEl: HTMLElement;
  frontboardEl: HTMLElement;
  hingeshadeEl: HTMLElement;
  creaseEl: HTMLElement;
  spreadEl: HTMLElement;
  canvas: HTMLCanvasElement;
  grabNext: HTMLElement;
  grabPrev: HTMLElement;
  snapLeaf: HTMLElement;
  snapCover: HTMLElement;
  snapCoverBack: HTMLElement;
  snapCoverBackPhoto: HTMLElement;
  snapBackBoard: HTMLElement;
}

/** Builds the notebook DOM inside `host` and returns root-scoped refs. */
export function buildMarkup(host: HTMLElement): NotebookRefs {
  const root = host.ownerDocument.createElement('div');
  root.className = NOTEBOOK_ROOT_CLASS;
  root.innerHTML = MARKUP;
  host.appendChild(root);

  const q = <T extends HTMLElement>(sel: string): T => {
    const el = root.querySelector(sel) as T | null;
    if (!el) throw new Error('[notebook] missing element ' + sel);
    return el;
  };

  return {
    root,
    stage: q('#stage'),
    book: q('#book'),
    cover: q('#cover'),
    leafL: q('#leafL'),
    leafR: q('#leafR'),
    backcover: q('.backcover'),
    stackL: q('#stackL'),
    stackR: q('#stackR'),
    openCoverEl: q('#opencover'),
    insideBackEl: q('#insideback'),
    backClosedEl: q('#backclosed'),
    covercast: q('#covercast'),
    coveredge: q('#coveredge'),
    coverseam: q('#coverseam'),
    edgebandR: q('#edgebandR'),
    edgebandL: q('#edgebandL'),
    deskshadowEl: q('.deskshadow'),
    frontboardEl: q('.frontboard'),
    hingeshadeEl: q('.hingeshade'),
    creaseEl: q('.crease'),
    spreadEl: q('#spread'),
    canvas: q<HTMLCanvasElement>('canvas.nb-gl'),
    grabNext: q('#grabNext'),
    grabPrev: q('#grabPrev'),
    snapLeaf: q('#snapLeaf'),
    snapCover: q('#snapCover'),
    snapCoverBack: q('#snapCoverBack'),
    snapCoverBackPhoto: q('#snapCoverBackPhoto'),
    snapBackBoard: q('#snapBackBoard'),
  };
}
