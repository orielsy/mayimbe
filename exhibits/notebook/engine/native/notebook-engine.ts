import * as THREE from 'three'

import './notebook-engine.css'
import { F3_COVER } from './cover-f3'
import { PaperStack } from './paper-stack'
import { PaperSurface } from './paper-surface'
import { createPaperV2 } from './paper-v2'
import { renderM2NotebookStack } from './m2-stack'
import type {
  NativeNotebookCloseSide,
  NativeNotebookEngine,
  NativeNotebookMountOptions,
  NativeNotebookPage,
  NativeNotebookSnapshot,
  NativeNotebookStateName,
} from './notebook-types'

const paperV2 = createPaperV2({
  paperStack: PaperStack as any,
  paperSurface: PaperSurface as any,
})

const PAPERV2 = {
  AGE: paperV2.age,
  skin: paperV2.skin,
  // The canonical Lab-Native PAPERV2 damage hook is a no-op. It was removed
  // during the earlier production extraction; keep the call site inert here.
  damage: (_el: HTMLElement, _idx: number, _left: boolean, _total: number) => undefined,
}

const M2Stack = {
  notebook: () => renderM2NotebookStack({
    paperStack: PaperStack as any,
    surface: condition => PaperSurface.surface(condition as any),
    age: paperV2.age,
  }),
}

function buildMarkup(root: HTMLElement, title: string, dedicationHTML: string) {
  root.classList.add('nbn')
  root.innerHTML = `
    <div class="stage">
      <div class="book closed">
        <div class="deskshadow"></div>
        <div class="frontboard"></div>
        <div class="backcover"></div>
        <div class="opencover"></div>
        <div class="insideback">${dedicationHTML}</div>
        <div class="backclosed"></div>
        <div class="spread">
          <div class="half left">
            <div class="stack stackL"></div>
            <div class="leaf leafL"></div>
          </div>
          <div class="half right">
            <div class="stack stackR"></div>
            <div class="leaf leafR"></div>
            <div class="cover"><span class="title">${title}</span></div>
          </div>
          <div class="covercast"></div>
          <div class="coveredge">
            <div class="edgeband r"></div>
            <div class="edgeband l"></div>
          </div>
          <div class="coverseam"></div>
        </div>
        <div class="hingeshade"></div>
        <div class="crease"></div>
      </div>
      <canvas class="gl"></canvas>
      <div class="grab next"></div>
      <div class="grab prev"></div>
    </div>
    <div class="snaphost">
      <div style="position:relative"><div class="leaf snapLeaf"></div></div>
      <div style="position:relative"><div class="cover snapCover"><span class="title">${title}</span></div></div>
      <div style="position:relative"><div class="cover inside snapCoverBack"></div></div>
      ${dedicationHTML ? `<div style="position:relative"><div class="cover inside snapCoverBackPhoto">${dedicationHTML}</div></div>` : ''}
      <div style="position:relative"><div class="cover snapBackBoard"></div></div>
    </div>`
}

const escapeHTML = (value: string) =>
  value.replace(/[&<>\"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] as string)

export async function mountNativeNotebook(
  host: HTMLElement,
  options: NativeNotebookMountOptions,
): Promise<NativeNotebookEngine> {
  if (!host) throw new Error('mountNativeNotebook: a host element is required')

  const pages: (NativeNotebookPage | null)[] = options.pages.slice()
  if (!pages.length) throw new Error('mountNativeNotebook: options.pages must not be empty')
  if (pages.length % 2 === 1) pages.push(null)

  const SHEETS = pages.length / 2
  const sectionToPage = options.sectionToPage || {}
  const TITLE = options.title == null ? 'CUADERNO' : options.title
  const TITLE_SEED = 7
  const dedication = options.dedication
  const dedicationHTML = dedication
    ? (dedication.imageSrc
        ? `<img class="backphoto" src="${dedication.imageSrc}" alt="${escapeHTML(dedication.imageAlt || '')}" />`
        : '')
      + (dedication.lines?.length
        ? `<div class="dedication">${dedication.lines.map(line => `<span>${escapeHTML(line)}</span>`).join('')}</div>`
        : '')
    : ''

  const root = document.createElement('div')
  buildMarkup(root, escapeHTML(TITLE), dedicationHTML)
  const q = <T extends Element>(selector: string) => root.querySelector(selector) as T

  const stage = q<HTMLElement>('.stage')
  const book = q<HTMLElement>('.book')
  const cover = q<HTMLElement>('.cover')
  const leafL = q<HTMLElement>('.leafL')
  const leafR = q<HTMLElement>('.leafR')
  const backcover = q<HTMLElement>('.backcover')
  const stackL = q<HTMLElement>('.stackL')
  const stackR = q<HTMLElement>('.stackR')
  const openCoverEl = q<HTMLElement>('.opencover')
  const insideBackEl = q<HTMLElement>('.insideback')
  const backClosedEl = q<HTMLElement>('.backclosed')
  const covercast = q<HTMLElement>('.covercast')
  const coveredge = q<HTMLElement>('.coveredge')
  const coverseam = q<HTMLElement>('.coverseam')
  const edgebandR = q<HTMLElement>('.edgeband.r')
  const edgebandL = q<HTMLElement>('.edgeband.l')
  const deskshadowEl = q<HTMLElement>('.deskshadow')
  const frontboardEl = q<HTMLElement>('.frontboard')
  const hingeshadeEl = q<HTMLElement>('.hingeshade')
  const creaseEl = q<HTMLElement>('.crease')
  const spreadEl = q<HTMLElement>('.spread')
  const canvas = q<HTMLCanvasElement>('canvas.gl')
  const grabNext = q<HTMLElement>('.grab.next')
  const grabPrev = q<HTMLElement>('.grab.prev')

  const snapLeaf = q<HTMLElement>('.snapLeaf')
  const snapCover = q<HTMLElement>('.snapCover')
  const snapCoverBack = q<HTMLElement>('.snapCoverBack')
  const snapCoverBackPhoto = root.querySelector('.snapCoverBackPhoto') as HTMLElement | null
  const snapBackBoard = q<HTMLElement>('.snapBackBoard')

  const CLOSED_FRONT: NativeNotebookStateName = 'CLOSED_FRONT'
  const OPEN: NativeNotebookStateName = 'OPEN'
  const CLOSED_BACK: NativeNotebookStateName = 'CLOSED_BACK'
  let state: NativeNotebookStateName = CLOSED_FRONT
  let turned = 0
  let turning: any = null
  let canNext = false
  let canPrev = false
  let disposed = false
  let fontsPending = true

  function pageHTML(page: NativeNotebookPage | null | undefined, idx?: number) {
    if (!page) return ''
    const extra = page.kind === 'sketch'
      ? '<div class="ph-sketch"></div>'
      : page.kind === 'photo'
        ? '<div class="ph-photo"></div>'
        : page.kind === 'clipping'
          ? '<div class="ph-clip">clipping placeholder</div>'
          : ''
    const footer = idx == null
      ? ''
      : `<footer class="pagenum" style="${idx % 2 ? 'left:7%' : 'right:7%'}">p.${idx + 1}</footer>`
    return `<article class="page-content"><h2>${page.title}</h2><p>${page.body}</p>${extra}</article>${footer}`
  }

  const NOMINAL_R = 3
  function hash1(n: number) {
    const value = Math.sin(n * 127.1 + 311.7) * 43758.5453
    return value - Math.floor(value)
  }
  const irregular = true
  const thickness = true
  function sheetRadii(sheet: number): number[] {
    if (!irregular) return [NOMINAL_R, NOMINAL_R, NOMINAL_R, NOMINAL_R]
    return [0, 1, 2, 3].map(k => +(NOMINAL_R + (hash1(sheet * 4 + k + 1) - 0.5) * 1.8).toFixed(2))
  }
  const mirrorR = (r: number[]) => [r[1]!, r[0]!, r[3]!, r[2]!]
  const cssR = (r: number[]) => `${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px`
  const sheetOf = (pageIndex: number) => Math.floor(pageIndex / 2)

  const liftOn = true
  const WEAR = 1
  const h2 = (n: number, k: number) => hash1(n * 13.37 + k * 7.77 + 5.5)
  const A = (x: number) => Math.max(0, x * WEAR).toFixed(3)

  function paperSkin(idx: number) {
    const left = idx % 2 === 1
    const layers: string[] = []
    if (liftOn) layers.push(left ? 'var(--lift-l)' : 'var(--lift-r)')
    layers.push(PAPERV2.skin(idx, left, pages.length))
    return layers.join(', ')
  }

  function coverSkin() {
    return F3_COVER.coverSkin(1)
  }

  function insideSkin(_mirror: boolean) {
    return `radial-gradient(124% 116% at 50% 50%, transparent 58%, rgba(20,12,5,${A(0.4)}) 100%), ${F3_COVER.boardSkin(0.35)}`
  }

  function boardSkin(left: boolean) {
    return `radial-gradient(60% 48% at ${left ? 70 : 30}% 70%, rgba(38,25,11,${A(0.16)}), transparent 78%), radial-gradient(124% 116% at 50% 50%, transparent 56%, rgba(24,15,6,${A(0.44)}) 100%), ${F3_COVER.boardSkin(left ? 0.3 : 0.5)}`
  }

  function primeCoverVars() {
    root.style.setProperty('--f3-cover', coverSkin())
    root.style.setProperty('--f3-inside', insideSkin(false))
    root.style.setProperty('--f3-inside-m', insideSkin(true))
    root.style.setProperty('--f3-board-l', boardSkin(true))
    root.style.setProperty('--f3-board-r', boardSkin(false))
  }

  function dressLeaf(element: HTMLElement, idx: number) {
    element.style.background = paperSkin(idx)
    PAPERV2.damage(element, idx, idx % 2 === 1, pages.length)
  }

  function paintLeftLeaf(idx: number) {
    const absent = idx < 0
    leafL.classList.toggle('absent', absent)
    book.classList.toggle('noleft', absent)
    if (absent) {
      leafL.innerHTML = ''
      return
    }
    leafL.innerHTML = pageHTML(pages[idx], idx)
    dressLeaf(leafL, idx)
    leafL.style.borderRadius = cssR(mirrorR(sheetRadii(sheetOf(idx))))
  }

  function paintRightLeaf(idx: number) {
    const absent = idx < 0 || idx >= pages.length
    leafR.classList.toggle('absent', absent)
    book.classList.toggle('noright', absent)
    if (absent) {
      leafR.innerHTML = ''
      return
    }
    leafR.innerHTML = pageHTML(pages[idx], idx)
    dressLeaf(leafR, idx)
    leafR.style.borderRadius = cssR(sheetRadii(sheetOf(idx)))
  }

  function titleHTML() {
    return [...TITLE].map((character, index) => {
      const r = h2(index + TITLE_SEED, 91)
      const r2 = h2(index + TITLE_SEED, 92)
      const r3 = h2(index + TITLE_SEED, 93)
      const opacity = 0.22 + r * 0.22 + r2 * 0.08
      const x = (r3 - 0.5) * 0.6
      return `<span style="opacity:${opacity.toFixed(2)};text-shadow:${x.toFixed(2)}px 1px 0 rgba(22,14,6,.5)">${escapeHTML(character)}</span>`
    }).join('')
  }

  function dressChrome() {
    for (const title of [cover.querySelector('.title'), snapCover.querySelector('.title')]) {
      if (title) title.innerHTML = titleHTML()
    }
    cover.style.background = coverSkin()
    snapCover.style.background = coverSkin()
    snapCoverBack.style.background = insideSkin(false)
    if (snapCoverBackPhoto) snapCoverBackPhoto.style.background = insideSkin(false)
    openCoverEl.style.background = insideSkin(true)
    frontboardEl.style.background = boardSkin(true)
    backcover.style.background = boardSkin(false)
    insideBackEl.style.background = insideSkin(false)
    snapBackBoard.style.background = boardSkin(false)
    backClosedEl.style.background = boardSkin(false)
  }

  function paintDOM() {
    paintLeftLeaf(turned * 2 - 1)
    paintRightLeaf(turned * 2)
    book.classList.toggle('closed', state === CLOSED_FRONT)
    book.classList.toggle('closedback', state === CLOSED_BACK)
    updateNavDisabled()
    updateStacks()
  }

  function updateNavDisabled() {
    canNext = texReady && state !== CLOSED_BACK
    canPrev = texReady && state !== CLOSED_FRONT
  }

  const STRATA = 26
  const SAFE_PX = 1.0
  let STACK_BUILT = false
  let M2_TOP_REACH = 1
  let M2_MAX_REACH = 1
  let M2_MAX_REACH_Y = 1

  function buildCanonicalBlock(hostElement: HTMLElement) {
    const block = M2Stack.notebook()
    const frame = document.createElement('div')
    frame.className = 'm2frame'
    frame.appendChild(block)
    hostElement.innerHTML = ''
    hostElement.appendChild(frame)
    const cast = block.querySelector('.m2sheet:not([data-stratum])') as HTMLElement | null
    if (cast) cast.dataset.depth = String(STRATA - 1)
    const strata = ([...block.querySelectorAll('.m2sheet[data-stratum]')] as HTMLElement[])
      .sort((a, b) => +b.style.zIndex - +a.style.zIndex)
    strata.forEach((element, depth) => {
      element.dataset.depth = String(depth)
      element.style.background = `${element.dataset.seam}, ${PAPERV2.skin(depth * 2, false, STRATA * 2)}`
    })
    return strata
  }

  function layoutCanonicalFrame() {
    const halfR = (leafR.parentElement as HTMLElement).getBoundingClientRect()
    const board = cover.getBoundingClientRect()
    const fb = frontboardEl.getBoundingClientRect()
    const halfL = (leafL.parentElement as HTMLElement).getBoundingClientRect()
    let available = board.right - halfR.right
    if (halfL.width) available = Math.min(available, halfL.left - fb.left)
    const fore = Math.max(0, available - SAFE_PX)
    const halfWidth = halfR.width || 1
    const frameWidth = (halfWidth + fore) / Math.max(0.01, M2_MAX_REACH)
    const shrink = Math.max(0, halfWidth - frameWidth * M2_TOP_REACH)
    book.style.setProperty('--papershrinkx', `${shrink.toFixed(2)}px`)
    book.style.setProperty('--papershrinky', '0px')
    for (const stack of [stackL, stackR]) {
      stack.style.setProperty('--m2fore', `${fore.toFixed(2)}px`)
      const frame = stack.querySelector('.m2frame') as HTMLElement | null
      if (!frame) continue
      frame.style.bottom = `${(-(halfR.height * (1 / Math.max(0.01, M2_MAX_REACH_Y) - 1))).toFixed(2)}px`
      frame.style.left = '0px'
      const baseRect = stack.getBoundingClientRect()
      let over = 0
      for (const child of frame.querySelectorAll('.m2sheet[data-stratum]')) {
        const rect = child.getBoundingClientRect()
        if (rect.width) over = Math.min(over, stack === stackL ? baseRect.right - rect.right : rect.left - baseRect.left)
      }
      if (over < 0) frame.style.left = `${(-over).toFixed(2)}px`
    }
  }

  function buildStacks() {
    if (!STACK_BUILT) {
      const strata = buildCanonicalBlock(stackR)
      buildCanonicalBlock(stackL)
      M2_TOP_REACH = +(strata[0]!.dataset.reachX || 1)
      M2_MAX_REACH = Math.max(...strata.map(element => +(element.dataset.reachX || 0)))
      M2_MAX_REACH_Y = Math.max(...strata.map(element => +(element.dataset.reachY || 0)))
      STACK_BUILT = true
      stacksKey = null
    }
    layoutCanonicalFrame()
  }

  function visualTurned() {
    if (turning?.kind === 'paper') return turning.sheet + turning.p
    return turned
  }

  const REVEAL_LAG_PX = 1
  function measuredOpenX(_progress: number) {
    if (!geom?.coverOpenRect) return Number.NaN
    const span = geom.hingeX - geom.coverOpenRect.left
    if (!(span > 0)) return Number.NaN
    const edgeX = coverFreeEdgeScreenX()
    if (!Number.isFinite(edgeX)) return Number.NaN
    return Math.max(0, Math.min(1, (geom.hingeX - edgeX - REVEAL_LAG_PX) / span))
  }

  const OPENX_ELS: HTMLElement[] = []
  function openxTargets() {
    if (!OPENX_ELS.length) {
      for (const element of [deskshadowEl, frontboardEl, openCoverEl, spreadEl, hingeshadeEl, creaseEl]) OPENX_ELS.push(element)
    }
    return OPENX_ELS
  }

  function setOpenX(open: number) {
    const value = open.toFixed(4)
    for (const element of openxTargets()) element.style.setProperty('--openx', value)
    if (geom?.bookW) {
      const width = geom.bookW + 2 * BOARD_OUT_PX
      deskshadowEl.style.setProperty('--deskx', ((width - (1 - open) * geom.bookW / 2) / width).toFixed(5))
    }
  }

  function setDeskBack(coverProgress: number) {
    if (!geom?.bookW) return
    const width = geom.bookW + 2 * BOARD_OUT_PX
    deskshadowEl.style.setProperty('--deskb', ((width - coverProgress * geom.bookW / 2) / width).toFixed(5))
  }

  function updateChrome() {
    let open: number
    if (turning?.kind === 'cover' && turning.back) {
      open = 1
      setDeskBack(Math.max(0, Math.min(1, turning.p)))
    } else if (state === CLOSED_BACK) {
      open = 1
      setDeskBack(1)
    } else if (turning?.kind === 'cover') {
      const progress = Math.max(0, Math.min(1, turning.p))
      if (progress <= 0) open = 0
      else if (progress >= 1) open = 1
      else {
        const measured = measuredOpenX(progress)
        open = Number.isFinite(measured) ? measured : Math.pow(Math.max(0, -Math.cos(progress * Math.PI)), 1.25)
      }
      if (!turning.dragging) {
        if (turning.dir === 1) open = turning.revealSeen = Math.max(turning.revealSeen || 0, open)
        else open = turning.revealSeen = Math.min(turning.revealSeen == null ? 1 : turning.revealSeen, open)
      }
    } else {
      open = state === CLOSED_FRONT ? 0 : 1
    }
    setOpenX(open)
    updateCoverShadow()
  }

  type Geom = {
    coverW: number
    coverH: number
    hingeX: number
    coverRect: { left: number; top: number; width: number; height: number }
    coverOpenRect: { left: number; top: number; width: number; height: number }
    canvasRect: { left: number; top: number; width: number; height: number }
    openLeft: number
    coverLeft: number
    openTop: number
    spineX: number
    shadowTop: number
    bookW: number
  }
  let geom: Geom | null = null
  const BOARD_OUT_PX = 1.5

  function measureLayout(cachedCoverRect?: DOMRect | null, cachedCanvasRect?: DOMRect | null) {
    const coverRect = cachedCoverRect || cover.getBoundingClientRect()
    const bookRect = book.getBoundingClientRect()
    const spreadRect = spreadEl.getBoundingClientRect()
    const canvasRect = cachedCanvasRect || canvas.getBoundingClientRect()
    if (!coverRect.width || !bookRect.width || !spreadRect.width) return null
    const hingeX = world.hingeX
    const openLeftViewport = 2 * hingeX - (coverRect.left + coverRect.width)
    geom = {
      coverW: coverRect.width,
      coverH: coverRect.height,
      hingeX,
      coverRect: { left: coverRect.left, top: coverRect.top, width: coverRect.width, height: coverRect.height },
      coverOpenRect: { left: openLeftViewport, top: coverRect.top, width: coverRect.width, height: coverRect.height },
      canvasRect: { left: canvasRect.left, top: canvasRect.top, width: canvasRect.width, height: canvasRect.height },
      openLeft: openLeftViewport - bookRect.left,
      coverLeft: coverRect.left - bookRect.left,
      openTop: coverRect.top - bookRect.top,
      spineX: coverRect.left - spreadRect.left,
      shadowTop: coverRect.top - spreadRect.top,
      bookW: bookRect.width,
    }
    layoutOpenCover()
    layoutCoverShadow()
    return geom
  }

  function layoutOpenCover() {
    if (!geom) return
    openCoverEl.style.left = `${geom.openLeft.toFixed(2)}px`
    openCoverEl.style.top = `${geom.openTop.toFixed(2)}px`
    openCoverEl.style.width = `${geom.coverW.toFixed(2)}px`
    openCoverEl.style.height = `${geom.coverH.toFixed(2)}px`
    insideBackEl.style.left = `${geom.coverLeft.toFixed(2)}px`
    insideBackEl.style.top = `${geom.openTop.toFixed(2)}px`
    insideBackEl.style.width = `${geom.coverW.toFixed(2)}px`
    insideBackEl.style.height = `${geom.coverH.toFixed(2)}px`
    backClosedEl.style.left = `${geom.openLeft.toFixed(2)}px`
    backClosedEl.style.top = `${geom.openTop.toFixed(2)}px`
    backClosedEl.style.width = `${geom.coverW.toFixed(2)}px`
    backClosedEl.style.height = `${geom.coverH.toFixed(2)}px`
  }

  function layoutCoverShadow() {
    if (!geom) return
    coveredge.style.left = `${geom.spineX}px`
    coveredge.style.top = `${geom.shadowTop}px`
    coveredge.style.width = '0px'
    coveredge.style.height = `${geom.coverH}px`
    coverseam.style.left = `${geom.spineX}px`
    coverseam.style.top = `${geom.shadowTop}px`
    coverseam.style.width = '3px'
    coverseam.style.height = `${geom.coverH}px`
    covercast.style.left = `${geom.spineX}px`
    covercast.style.top = `${geom.shadowTop}px`
    covercast.style.width = `${geom.coverW}px`
    covercast.style.height = `${geom.coverH}px`
    covercast.style.borderRadius = '3px 9px 9px 3px'
    covercast.style.transformOrigin = '0% 50%'
    covercast.style.filter = 'blur(22px)'
  }

  function coverProgress() {
    if (turning?.kind === 'cover') return Math.max(0, Math.min(1, turning.p))
    return state === CLOSED_FRONT ? 0 : 1
  }

  let edgeZ: number | null = null
  let edgeVis = 0
  function updateCoverShadow() {
    if (!geom && !measureLayout()) return
    const g = geom!
    const progress = coverProgress()
    const cosine = Math.cos(progress * Math.PI)
    const projection = Math.abs(cosine)
    const lift = Math.sin(progress * Math.PI)
    const sign = cosine >= 0 ? 1 : -1
    const width = Math.max(1, g.coverW * projection)
    covercast.style.transform = `translate(${(-sign * lift * 9).toFixed(2)}px, ${(2 + lift * 15).toFixed(2)}px) scaleX(${(sign * Math.max(projection, 0.0008)).toFixed(5)})`
    covercast.style.opacity = (Math.pow(lift, 0.6) * 0.58).toFixed(3)
    const pixels = (g.coverW * projection).toFixed(2)
    if (sign > 0) {
      edgebandR.style.transform = `translateX(${pixels}px) scaleX(${projection.toFixed(4)})`
      if (edgeVis !== 1) {
        edgeVis = 1
        edgebandR.style.opacity = '1'
        edgebandL.style.opacity = '0'
      }
    } else {
      edgebandL.style.transform = `translateX(${-Number(pixels)}px) scaleX(${projection.toFixed(4)})`
      if (edgeVis !== -1) {
        edgeVis = -1
        edgebandL.style.opacity = '1'
        edgebandR.style.opacity = '0'
      }
    }
    coverseam.style.opacity = (sign > 0 ? Math.max(0, Math.min(1, (width - 10) / 24)) : 0).toFixed(3)
    const z = sign > 0 ? 3 : 0
    if (z !== edgeZ) {
      edgeZ = z
      coveredge.style.zIndex = String(z)
    }
  }

  let stacksKey: string | null = null
  function updateStacks(force?: boolean) {
    updateChrome()
    if (!STACK_BUILT) return
    const visual = Math.max(0, Math.min(SHEETS, visualTurned()))
    const key = visual.toFixed(4)
    if (!force && key === stacksKey) return
    stacksKey = key
    const moved = (visual / SHEETS) * STRATA
    for (const [element, left] of [[stackL, true], [stackR, false]] as [HTMLElement, boolean][]) {
      for (const sheet of element.querySelectorAll('.m2sheet[data-depth]')) {
        const node = sheet as HTMLElement
        const depth = +node.dataset.depth!
        const alpha = left ? moved - depth : depth + 1 - moved
        node.style.opacity = (alpha <= 0 ? 0 : alpha >= 1 ? 1 : alpha).toFixed(3)
      }
    }
  }

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
  ]

  function inlineComputed(sourceRoot: HTMLElement) {
    const clone = sourceRoot.cloneNode(true) as HTMLElement
    const sources = [sourceRoot, ...sourceRoot.querySelectorAll('*')] as HTMLElement[]
    const destinations = [clone, ...clone.querySelectorAll('*')] as HTMLElement[]
    for (let index = 0; index < sources.length; index++) {
      const computed = getComputedStyle(sources[index]!)
      let css = ''
      for (const property of SNAP_PROPS) {
        const value = computed.getPropertyValue(property)
        if (value !== '' && value !== 'auto' && value !== 'normal' && value !== 'none' && value !== 'currentcolor') css += `${property}:${value};`
        else if (value === 'none' && (property === 'text-decoration-line' || property === 'list-style-type')) css += `${property}:none;`
      }
      destinations[index]!.setAttribute('style', css)
      destinations[index]!.removeAttribute('class')
    }
    return clone
  }

  function snapshotEl(element: HTMLElement, width: number, height: number, dpr: number): Promise<HTMLImageElement> {
    const parent = element.parentElement as HTMLElement
    parent.style.position = 'relative'
    parent.style.width = `${width}px`
    parent.style.height = `${height}px`
    element.style.position = 'absolute'
    element.style.inset = 'auto'
    element.style.left = '0px'
    element.style.top = '0px'
    element.style.width = `${width}px`
    element.style.height = `${height}px`
    void element.offsetWidth
    const clone = inlineComputed(element)
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
    const inner = new XMLSerializer().serializeToString(clone)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width * dpr)}" height="${Math.round(height * dpr)}" viewBox="0 0 ${width} ${height}"><foreignObject x="0" y="0" width="${width}" height="${height}">${inner}</foreignObject></svg>`
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.decoding = 'sync'
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    })
  }

  function snapshotLeaf(page: NativeNotebookPage | null, idx: number, width: number, height: number, dpr: number) {
    snapLeaf.innerHTML = pageHTML(page, idx)
    const left = idx % 2 === 1
    snapLeaf.classList.toggle('facing-left', left)
    dressLeaf(snapLeaf, idx)
    const radii = sheetRadii(sheetOf(idx))
    snapLeaf.style.borderRadius = cssR(left ? mirrorR(radii) : radii)
    return snapshotEl(snapLeaf, width, height, dpr)
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 20000)

  function toTexture(image: HTMLImageElement, width: number, height: number, dpr: number) {
    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = Math.round(width * dpr)
    textureCanvas.height = Math.round(height * dpr)
    textureCanvas.getContext('2d')!.drawImage(image, 0, 0, textureCanvas.width, textureCanvas.height)
    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.colorSpace = THREE.NoColorSpace
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    return texture
  }

  let textures: THREE.Texture[] = []
  let coverTextures: THREE.Texture[] = []
  let texKey = ''
  let texReady = false
  let buildSeq = 0

  async function buildTextures() {
    const rect = leafR.getBoundingClientRect()
    const coverRect = cover.getBoundingClientRect()
    if (!rect.width) return
    const dpr = Math.min(devicePixelRatio, 2)
    const key = `${rect.width.toFixed(2)}x${rect.height.toFixed(2)}x${coverRect.width.toFixed(2)}@${dpr}`
    if (key === texKey) return
    texKey = key
    const sequence = ++buildSeq
    const next: THREE.Texture[] = []
    for (let index = 0; index < pages.length; index++) {
      const image = await snapshotLeaf(pages[index]!, index, rect.width, rect.height, dpr)
      if (sequence !== buildSeq || disposed) return
      next.push(toTexture(image, rect.width, rect.height, dpr))
    }
    const nextCover: THREE.Texture[] = []
    if (coverRect.width) {
      for (const element of [snapCover, snapCoverBack, snapBackBoard, snapCoverBackPhoto].filter(Boolean) as HTMLElement[]) {
        const image = await snapshotEl(element, coverRect.width, coverRect.height, dpr)
        if (sequence !== buildSeq || disposed) return
        nextCover.push(toTexture(image, coverRect.width, coverRect.height, dpr))
      }
    }
    const old = textures.concat(coverTextures)
    textures = next
    coverTextures = nextCover
    old.forEach(texture => texture.dispose())
    texReady = true
    if (turning) bindFaces(turning)
    paintDOM()
    warmGPU()
  }

  const MAX_GL_DPR = 1.25
  let PW = 100
  let PH = 100
  let GAP = 2
  let geometry = new THREE.PlaneGeometry(1, 1, 96, 6)
  const uniforms = {
    uT: { value: 0 },
    uBend: { value: 0 },
    uEnv: { value: 0 },
    uX0: { value: GAP },
    uW: { value: PW },
    uFront: { value: null as THREE.Texture | null },
    uBack: { value: null as THREE.Texture | null },
    uSize: { value: new THREE.Vector2(PW, PH) },
    uRad4: { value: new THREE.Vector4(3, 3, 3, 3) },
    uThick: { value: 1.6 },
  }

  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    uniforms,
    vertexShader: `
      uniform float uT, uBend, uW, uX0;
      varying vec2 vUv; varying vec3 vNormal; varying float vCurve;
      void main() {
        vUv = uv;
        float s = position.x - uX0;
        float u = clamp(s / uW, 0.0, 1.0);
        vec3 p = position;
        float phi = 0.0;
        if (uBend > 0.001) {
          float R = uW / uBend;
          phi = u * uBend;
          p.x = uX0 + R * sin(phi);
          p.z = R * (1.0 - cos(phi));
        }
        float a = -uT * 3.14159265;
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
      uniform vec4 uRad4;
      uniform vec2 uSize;
      varying vec2 vUv; varying vec3 vNormal; varying float vCurve;
      float radiusAt(vec2 uv) {
        float top = step(0.5, uv.y), right = step(0.5, uv.x);
        float lft = mix(uRad4.w, uRad4.x, top);
        float rgt = mix(uRad4.z, uRad4.y, top);
        return mix(lft, rgt, right);
      }
      float silhouette(vec2 uv) {
        float r = radiusAt(uv);
        vec2 h = uSize * 0.5;
        vec2 d = abs((uv - 0.5) * uSize) - (h - r);
        return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
      }
      void main() {
        vec4 c = gl_FrontFacing ? texture2D(uFront, vUv) : texture2D(uBack, vec2(1.0 - vUv.x, vUv.y));
        vec3 n = normalize(gl_FrontFacing ? vNormal : -vNormal);
        vec3 L = normalize(vec3(-0.25, 0.45, 1.0));
        float lit = 0.74 + 0.26 * abs(dot(n, L));
        float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0) * 0.06;
        float ao = 1.0 - 0.16 * smoothstep(0.0, 1.3, vCurve);
        float shade = mix(1.0, lit * ao, uEnv);
        float sd = silhouette(vUv);
        float a = 1.0 - smoothstep(-0.5, 0.5, sd);
        if (a <= 0.002) discard;
        vec3 rgb = c.rgb * shade + spec * uEnv;
        float graze = 1.0 - abs(n.z);
        float band = 1.0 - smoothstep(-uThick, -0.35, sd);
        float edge = band * graze * uEnv;
        vec3 edgeCol = rgb * 0.66 + vec3(0.055, 0.045, 0.030);
        rgb = mix(rgb, edgeCol, clamp(edge, 0.0, 1.0) * 0.9);
        gl_FragColor = vec4(rgb, a);
      }`,
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  const world = { cx: 0, cy: 0, hingeX: 0 }
  const geometryCache = new Map<string, THREE.PlaneGeometry>()
  const webglDebug = new URLSearchParams(window.location.search).get('notebookDebug') === 'webgl'
  const nativeRect = Element.prototype.getBoundingClientRect
  const debugViewport = new THREE.Vector4()

  const compactRect = (rect: DOMRect) => ({
    x: +rect.x.toFixed(1),
    y: +rect.y.toFixed(1),
    w: +rect.width.toFixed(1),
    h: +rect.height.toFixed(1),
  })

  function emitWebGLDiagnostic(phase: string) {
    if (!webglDebug) return
    mesh.updateMatrixWorld(true)
    camera.updateMatrixWorld(true)
    renderer.getViewport(debugViewport)
    const box = new THREE.Box3().setFromObject(mesh)
    const projected = box.isEmpty()
      ? null
      : [
          new THREE.Vector3(box.min.x, box.min.y, box.min.z),
          new THREE.Vector3(box.max.x, box.max.y, box.max.z),
        ].map(point => point.project(camera)).map(point => ({
          x: +point.x.toFixed(3),
          y: +point.y.toFixed(3),
          z: +point.z.toFixed(3),
        }))
    const gl = renderer.getContext()
    const samplePixel = new Uint8Array(4)
    const framebufferSamples = [-0.5, 0, 0.25, 0.5, 0.75].map(ndcX => {
      const x = Math.max(0, Math.min(canvas.width - 1, Math.round((ndcX + 1) * canvas.width / 2)))
      const y = Math.max(0, Math.min(canvas.height - 1, Math.round(canvas.height / 2)))
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, samplePixel)
      return { ndcX, rgba: Array.from(samplePixel) }
    })
    window.dispatchEvent(new CustomEvent('mayimbe:notebook-webgl', {
      detail: {
        phase,
        time: +performance.now().toFixed(0),
        contextLost: gl.isContextLost(),
        glError: gl.getError(),
        active: canvas.classList.contains('active'),
        meshVisible: mesh.visible,
        stageLocal: compactRect(stage.getBoundingClientRect()),
        stageVisual: compactRect(nativeRect.call(stage)),
        canvasLocal: compactRect(canvas.getBoundingClientRect()),
        canvasVisual: compactRect(nativeRect.call(canvas)),
        leafLocal: compactRect(leafR.getBoundingClientRect()),
        coverLocal: compactRect(cover.getBoundingClientRect()),
        drawingBuffer: { w: canvas.width, h: canvas.height },
        framebufferSamples,
        viewport: {
          x: debugViewport.x,
          y: debugViewport.y,
          w: debugViewport.z,
          h: debugViewport.w,
        },
        camera: {
          aspect: +camera.aspect.toFixed(4),
          fov: +camera.fov.toFixed(3),
          z: +camera.position.z.toFixed(1),
        },
        world: {
          cx: +world.cx.toFixed(1),
          cy: +world.cy.toFixed(1),
          hingeX: +world.hingeX.toFixed(1),
        },
        mesh: {
          x: +mesh.position.x.toFixed(1),
          y: +mesh.position.y.toFixed(1),
          projected,
        },
      },
    }))
  }

  const onContextLost = (event: Event) => {
    event.preventDefault()
    emitWebGLDiagnostic('context-lost')
  }
  const onContextRestored = () => emitWebGLDiagnostic('context-restored')
  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)

  function planeFor(width: number, height: number, gap: number) {
    const key = `${width.toFixed(2)}x${height.toFixed(2)}@${gap.toFixed(2)}`
    let plane = geometryCache.get(key)
    if (!plane) {
      plane = new THREE.PlaneGeometry(width, height, 96, 6)
      plane.translate(gap + width / 2, 0, 0)
      geometryCache.set(key, plane)
    }
    return plane
  }

  function configureMesh(rect: { left: number; top: number; width: number; height: number }, radii: number | number[], thick?: number) {
    PW = rect.width
    PH = rect.height
    GAP = rect.left - world.hingeX
    geometry = planeFor(PW, PH, GAP)
    mesh.geometry = geometry
    mesh.position.set(world.hingeX - world.cx, world.cy - (rect.top + PH / 2), 0)
    uniforms.uW.value = PW
    uniforms.uX0.value = GAP
    uniforms.uSize.value.set(PW, PH)
    const values = typeof radii === 'number' ? [radii, radii, radii, radii] : radii
    uniforms.uRad4.value.set(values[0]!, values[1]!, values[2]!, values[3]!)
    uniforms.uThick.value = thickness ? (thick == null ? 1.6 : thick) : 0
  }

  function resize(rasterise = true) {
    const stageRect = stage.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()
    const leafRect = leafR.getBoundingClientRect()
    if (!stageRect.width || !leafRect.width) return
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MAX_GL_DPR))
    renderer.setSize(canvasRect.width, canvasRect.height, false)
    const distance = stageRect.height * 2.6
    camera.fov = 2 * Math.atan(canvasRect.height / 2 / distance) * 180 / Math.PI
    camera.aspect = canvasRect.width / canvasRect.height
    camera.position.set(0, 0, distance)
    camera.near = distance * 0.05
    camera.far = distance * 4
    camera.updateProjectionMatrix()
    world.cx = canvasRect.left + canvasRect.width / 2
    world.cy = canvasRect.top + canvasRect.height / 2
    world.hingeX = (leafRect.left + leafL.getBoundingClientRect().right) / 2
    for (const cached of geometryCache.values()) cached.dispose()
    geometryCache.clear()
    configureMesh(leafRect, sheetRadii(sheetOf(turned * 2)))
    const coverRect = cover.getBoundingClientRect()
    planeFor(coverRect.width, coverRect.height, coverRect.left - world.hingeX)
    measureLayout(coverRect, canvasRect)
    emitWebGLDiagnostic('resize')
    if (rasterise) void buildTextures()
  }

  const easeInOutCubic = (k: number) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
  const easeHeavyCover = (k: number) => k - (0.2 * Math.sin(2 * Math.PI * k)) / (2 * Math.PI)
  const MATERIAL = {
    paper: { bend: 1.15, env: 1.0, maxMs: 800, curve: easeInOutCubic },
    cover: { bend: 0.34, env: 1.35, maxMs: 1150, curve: easeHeavyCover },
  } as const
  const MIN_MS = 160
  let warmed = false
  let warmPending = 0

  function warmGPU() {
    if (warmed || !texReady) return
    warmed = true
    const front = uniforms.uFront.value
    const back = uniforms.uBack.value
    for (const pair of [coverTextures, coverTextures.slice(1, 3), textures.slice(0, 2)]) {
      if (pair.length < 2) continue
      uniforms.uFront.value = pair[0]!
      uniforms.uBack.value = pair[1]!
      renderer.render(scene, camera)
    }
    uniforms.uFront.value = front
    uniforms.uBack.value = back
    mesh.visible = false
    renderer.render(scene, camera)
    canvas.classList.add('active')
    warmPending = requestAnimationFrame(() => {
      warmPending = requestAnimationFrame(() => {
        warmPending = 0
        mesh.visible = true
        if (turning) return
        canvas.classList.remove('active')
        renderer.render(scene, camera)
      })
    })
  }

  function bindFaces(turn: any) {
    if (turn.kind === 'cover') {
      uniforms.uFront.value = turn.back ? coverTextures[3] || coverTextures[1]! : coverTextures[0]!
      uniforms.uBack.value = turn.back ? coverTextures[2]! : coverTextures[1]!
    } else {
      uniforms.uFront.value = textures[turn.sheet * 2]!
      uniforms.uBack.value = textures[turn.sheet * 2 + 1]!
    }
  }

  function reveal(turn: any) {
    if (warmPending) {
      cancelAnimationFrame(warmPending)
      warmPending = 0
    }
    if (turn.kind === 'cover') canvas.classList.remove('active')
    mesh.visible = true
    root.classList.add('turning')
    turning = turn
    if (turn.kind === 'cover') {
      turn.phase = 'acquire'
      turn.acquireP = turn.p
    }
    bindFaces(turn)
    applyPose()
    renderer.render(scene, camera)
    if (turn.kind !== 'cover') canvas.classList.add('active')
    emitWebGLDiagnostic(`${turn.kind}-reveal`)
    return turn
  }

  function beginTurn(direction: number) {
    if (!texReady || state !== OPEN || turning) return null
    const sheet = direction === 1 ? turned : turned - 1
    if (sheet < 0 || sheet >= SHEETS) return null
    turned = sheet
    paintLeftLeaf(sheet * 2 - 1)
    paintRightLeaf(sheet * 2 + 2)
    configureMesh(leafR.getBoundingClientRect(), sheetRadii(sheetOf(turned * 2)))
    return reveal({ kind: 'paper', dir: direction, sheet, p: direction === 1 ? 0 : 1, dragging: true, ease: 'out' })
  }

  function beginCoverTurn(direction: number) {
    if (!texReady || turning || !coverTextures.length) return null
    if (direction === 1 && state !== CLOSED_FRONT) return null
    if (direction === -1 && (state !== OPEN || turned !== 0)) return null
    if (!geom?.coverRect) return null
    configureMesh(geom.coverRect, [2, 8, 8, 2], 5.0)
    return reveal({ kind: 'cover', dir: direction, p: direction === 1 ? 0 : 1, dragging: true, ease: 'out' })
  }

  function beginBackCoverTurn(direction: number) {
    if (!texReady || turning || coverTextures.length < 3) return null
    if (direction === 1 && !(state === OPEN && turned >= SHEETS)) return null
    if (direction === -1 && state !== CLOSED_BACK) return null
    if (!geom?.coverRect) return null
    configureMesh(geom.coverRect, [2, 8, 8, 2], 5.0)
    return reveal({ kind: 'cover', back: true, dir: direction, p: direction === 1 ? 0 : 1, dragging: true, ease: 'out' })
  }

  function launch(turn: any, target: number, ease?: string) {
    const distance = Math.abs(target - turn.p)
    turn.dragging = false
    turn.target = target
    turn.from = turn.p
    if (turn.phase === 'dragging') {
      turn.phase = 'moving'
      turn.t0 = performance.now()
    } else if (turn.kind !== 'cover') {
      turn.t0 = 0
    }
    turn.ease = ease || 'out'
    turn.dur = Math.max(MIN_MS, MATERIAL[turn.kind as 'paper' | 'cover'].maxMs * Math.pow(distance, 0.85))
  }

  function finishTurn() {
    if (!turning?.dragging) return
    const done = turning.dir === 1 ? turning.p > 0.5 : turning.p < 0.5
    launch(turning, turning.dir === 1 ? (done ? 1 : 0) : done ? 0 : 1, 'out')
  }

  let stacksSolvedOpen = false
  function settleCoverDOM(turn: any) {
    if (turn.back) {
      state = turn.target === 1 ? CLOSED_BACK : OPEN
      book.classList.toggle('closedback', state === CLOSED_BACK)
      book.classList.remove('coverflight', 'backflight')
      updateChrome()
      updateNavDisabled()
      return
    }
    state = turn.target === 1 ? OPEN : CLOSED_FRONT
    book.classList.toggle('closed', state === CLOSED_FRONT)
    book.classList.remove('coverflight')
    updateChrome()
    updateNavDisabled()
    solveStacksOnce()
  }

  function solveStacksOnce() {
    if (state === OPEN && !stacksSolvedOpen) {
      stacksSolvedOpen = true
      requestAnimationFrame(() => {
        if (disposed) return
        buildStacks()
        updateStacks(true)
      })
    }
  }

  let settleWaiters: (() => void)[] = []
  function flushSettleWaiters() {
    const waiters = settleWaiters
    settleWaiters = []
    for (const waiter of waiters) waiter()
  }

  function settle() {
    const turn = turning
    turning = null
    if (turn.kind === 'cover') settleCoverDOM(turn)
    else {
      turned = turn.target === 1 ? turn.sheet + 1 : turn.sheet
      paintDOM()
    }
    root.classList.remove('turning')
    canvas.classList.remove('active')
    emitWebGLDiagnostic(`${turn.kind}-settled`)
    flushSettleWaiters()
  }

  function emitTurnMilestones(turn: any, progress: number) {
    if (!webglDebug) return
    const emitted = turn.debugMilestones || (turn.debugMilestones = new Set<number>())
    for (const milestone of [0.25, 0.5, 0.75, 1]) {
      if (progress < milestone || emitted.has(milestone)) continue
      emitted.add(milestone)
      emitWebGLDiagnostic(`${turn.kind}-${milestone * 100}%`)
    }
  }

  function applyPose() {
    const progress = turning ? turning.p : 0
    const profile = MATERIAL[(turning ? turning.kind : 'paper') as 'paper' | 'cover']
    const envelope = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI)
    uniforms.uT.value = progress
    uniforms.uBend.value = envelope * profile.bend
    uniforms.uEnv.value = Math.min(1, envelope * profile.env)
    if (turning?.kind === 'cover') updateChrome()
    else updateStacks()
  }

  let rafId = 0
  let running = false
  function frame() {
    if (!running) return
    const now = performance.now()
    if (turning) {
      const turn = turning
      if (turn.kind === 'cover') {
        if (turn.phase === 'acquire') {
          turn.p = turn.acquireP
          turn.t0 = now
          applyPose()
          renderer.render(scene, camera)
          canvas.classList.add('active')
          emitWebGLDiagnostic('cover-first-frame')
          turn.phase = turn.dragging ? 'dragging' : 'moving'
        } else if (turn.phase === 'dragging') {
          applyPose()
          renderer.render(scene, camera)
        } else if (turn.phase === 'endpoint') {
          turn.phase = 'settle'
          settle()
        } else if (turn.phase === 'moving') {
          const k = Math.min(1, (now - turn.t0) / turn.dur)
          const eased = turn.ease === 'inout' ? MATERIAL.cover.curve(k) : 1 - Math.pow(1 - k, 3)
          turn.p = k >= 1 ? turn.target : turn.from + (turn.target - turn.from) * eased
          if (!turn.ownershipRelinquished && k > 0) {
            turn.ownershipRelinquished = true
            book.classList.add(turn.back ? 'backflight' : 'coverflight')
            if (turn.back) book.classList.remove('closedback')
            else if (turn.dir === 1) book.classList.remove('closed')
          }
          applyPose()
          renderer.render(scene, camera)
          emitTurnMilestones(turn, k)
          if (k >= 1) turn.phase = 'endpoint'
        }
      } else if (turn.dragging) {
        applyPose()
        renderer.render(scene, camera)
      } else if (!turn.startPresented) {
        turn.startPresented = true
        applyPose()
        renderer.render(scene, camera)
      } else if (turn.endpointPresented) {
        settle()
      } else {
        if (turn.t0 === 0) turn.t0 = now
        const k = Math.min(1, (now - turn.t0) / turn.dur)
        const eased = turn.ease === 'inout' ? MATERIAL[turn.kind as 'paper' | 'cover'].curve(k) : 1 - Math.pow(1 - k, 3)
        turn.p = k >= 1 ? turn.target : turn.from + (turn.target - turn.from) * eased
        applyPose()
        renderer.render(scene, camera)
        emitTurnMilestones(turn, k)
        if (k >= 1) turn.endpointPresented = true
      }
    }
    rafId = requestAnimationFrame(frame)
  }

  const tracePoint = new THREE.Vector3()
  function coverFreeEdgeScreenX() {
    if (!geom?.canvasRect) return Number.NaN
    const bend = uniforms.uBend.value
    let x = GAP + PW
    let z = 0
    if (bend > 0.001) {
      const radius = PW / bend
      x = GAP + radius * Math.sin(bend)
      z = radius * (1 - Math.cos(bend))
    }
    const angle = -uniforms.uT.value * Math.PI
    const qx = x * Math.cos(angle) + z * Math.sin(angle)
    const qz = -x * Math.sin(angle) + z * Math.cos(angle)
    tracePoint.set(qx + mesh.position.x, mesh.position.y, qz).project(camera)
    return geom.canvasRect.left + (tracePoint.x + 1) * geom.canvasRect.width / 2
  }

  let startX = 0
  let dragBase = 0
  function drag(turn: any, event: PointerEvent) {
    if (!turn) return
    startX = event.clientX
    dragBase = turn.p
    stage.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent) => {
    if (!turning?.dragging) return
    const width = stage.getBoundingClientRect().width / 2
    turning.p = Math.max(0, Math.min(1, dragBase + (startX - event.clientX) / width))
  }
  const onPointerUp = () => finishTurn()
  const onCoverDown = (event: PointerEvent) => drag(beginCoverTurn(1), event)
  const onGrabNext = (event: PointerEvent) => drag(beginTurn(1), event)
  const onGrabPrev = (event: PointerEvent) => drag(state === OPEN && turned === 0 ? beginCoverTurn(-1) : beginTurn(-1), event)
  stage.addEventListener('pointermove', onPointerMove)
  stage.addEventListener('pointerup', onPointerUp)
  stage.addEventListener('pointercancel', onPointerUp)
  cover.addEventListener('pointerdown', onCoverDown)
  grabNext.addEventListener('pointerdown', onGrabNext)
  grabPrev.addEventListener('pointerdown', onGrabPrev)
  const onResize = () => resize()
  window.addEventListener('resize', onResize)

  function awaitSettle(started: unknown): Promise<void> {
    if (!started) return Promise.resolve()
    return new Promise<void>(resolve => settleWaiters.push(resolve))
  }

  function doNext() {
    if (!canNext) return null
    const turn = state === CLOSED_FRONT
      ? beginCoverTurn(1)
      : state === OPEN && turned >= SHEETS
        ? beginBackCoverTurn(1)
        : beginTurn(1)
    if (turn) launch(turn, 1, 'inout')
    return turn
  }

  function doPrevious() {
    if (!canPrev) return null
    if (state === CLOSED_BACK) {
      const turn = beginBackCoverTurn(-1)
      if (turn) launch(turn, 0, 'inout')
      return turn
    }
    const turn = state === OPEN && turned === 0 ? beginCoverTurn(-1) : beginTurn(-1)
    if (turn) launch(turn, 0, 'inout')
    return turn
  }

  function jumpTo(nextState: NativeNotebookStateName, nextTurned: number) {
    if (turning) {
      turning = null
      root.classList.remove('turning')
      canvas.classList.remove('active')
      book.classList.remove('coverflight', 'backflight')
      flushSettleWaiters()
    }
    state = nextState
    turned = Math.max(0, Math.min(SHEETS, nextTurned))
    paintDOM()
    solveStacksOnce()
    updateChrome()
  }

  primeCoverVars()
  host.appendChild(root)
  dressChrome()
  buildStacks()
  paintDOM()
  resize(false)
  await buildTextures()
  running = true
  rafId = requestAnimationFrame(frame)

  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      if (disposed || !fontsPending) return
      texKey = ''
      void buildTextures()
    })
  }

  const engine: NativeNotebookEngine = {
    root,
    async open() {
      if (state !== CLOSED_FRONT) return
      const turn = beginCoverTurn(1)
      if (turn) launch(turn, 1, 'inout')
      await awaitSettle(turn)
    },
    async close(side: NativeNotebookCloseSide = 'front') {
      if (side === 'back') {
        if (state === CLOSED_BACK) return
        if (!(state === OPEN && turned >= SHEETS)) jumpTo(OPEN, SHEETS)
        const turn = beginBackCoverTurn(1)
        if (turn) launch(turn, 1, 'inout')
        await awaitSettle(turn)
        return
      }
      if (state === CLOSED_FRONT) return
      if (!(state === OPEN && turned === 0)) jumpTo(OPEN, 0)
      const turn = beginCoverTurn(-1)
      if (turn) launch(turn, 0, 'inout')
      await awaitSettle(turn)
    },
    async goToPage(page: number) {
      const index = Math.max(0, Math.min(pages.length - 1, Math.floor(page)))
      jumpTo(OPEN, Math.floor(index / 2))
    },
    async goToSection(section: string) {
      const page = sectionToPage[section]
      if (page == null) throw new Error(`goToSection: unknown section "${section}"`)
      await engine.goToPage(page)
    },
    async next() {
      await awaitSettle(doNext())
    },
    async previous() {
      await awaitSettle(doPrevious())
    },
    suspend() {
      if (!running) return
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
    },
    resume() {
      if (running || disposed) return
      running = true
      rafId = requestAnimationFrame(frame)
    },
    getState(): NativeNotebookSnapshot {
      return { state, turned, page: turned * 2 < pages.length ? turned * 2 : -1 }
    },
    async restore(snapshot) {
      const restoredState = (snapshot.state || OPEN) as NativeNotebookStateName
      const restoredTurned = snapshot.turned != null
        ? snapshot.turned
        : snapshot.page != null
          ? Math.floor(snapshot.page / 2)
          : 0
      jumpTo(restoredState, restoredTurned)
    },
    dispose() {
      if (disposed) return
      disposed = true
      fontsPending = false
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      if (warmPending) cancelAnimationFrame(warmPending)
      rafId = warmPending = 0
      flushSettleWaiters()
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      stage.removeEventListener('pointermove', onPointerMove)
      stage.removeEventListener('pointerup', onPointerUp)
      stage.removeEventListener('pointercancel', onPointerUp)
      cover.removeEventListener('pointerdown', onCoverDown)
      grabNext.removeEventListener('pointerdown', onGrabNext)
      grabPrev.removeEventListener('pointerdown', onGrabPrev)
      for (const texture of textures.concat(coverTextures)) texture.dispose()
      textures = []
      coverTextures = []
      for (const cached of geometryCache.values()) cached.dispose()
      geometryCache.clear()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      root.remove()
    },
  }

  if (options.signal) {
    if (options.signal.aborted) engine.dispose()
    else options.signal.addEventListener('abort', () => engine.dispose(), { once: true })
  }

  return engine
}
