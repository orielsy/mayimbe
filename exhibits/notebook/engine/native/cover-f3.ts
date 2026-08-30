/*
 * F3-03 "Slightly more scuffed" — Brick.
 *
 * This is the reachable production dependency closure of the canonical
 * /notebook-lab-native/cover-f3.js. Material-lab functions not called by
 * finalCoverSkin/finalBoardSkin are intentionally omitted; the selected
 * recipe and every algorithm it actually uses are preserved.
 */

type Random = () => number
interface WearMix {
  handled?: number
  edge?: number
  travel?: number
  loved?: number
  heavy?: number
  humid?: number
  clouds?: number
}

type WearKey = keyof Required<WearMix>

export interface F3Colorway {
  id: 'brick'
  name: string
  base: [string, string, string]
  fade: string
  damp: string
  drift: string
  traits: string[]
}

function rnd(seed: number): Random {
  let state = (Math.abs(Math.floor(seed * 1000)) * 2654435761 % 2147483647) || 7
  return () => (state = (state * 48271) % 2147483647) / 2147483647
}

const hash1 = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))
const textureCache = new Map<string, string>()

function texURL(
  key: string,
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void,
): string {
  const cached = textureCache.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context unavailable for F3 cover texture')
  draw(context, width, height)
  const url = `url("${canvas.toDataURL('image/png')}")`
  textureCache.set(key, url)
  return url
}

function wrapped<T>(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  items: T[],
  draw: (item: T) => void,
): void {
  for (const dx of [-width, 0, width]) {
    for (const dy of [-height, 0, height]) {
      context.save()
      context.translate(dx, dy)
      for (const item of items) draw(item)
      context.restore()
    }
  }
}

const many = <T>(count: number, random: Random, make: (random: Random) => T): T[] =>
  Array.from({ length: count }, () => make(random))

const layer = (image: string, size: string, position?: string): string =>
  `${image} ${position || '0 0'} / ${size} no-repeat`

const tile = (image: string, size: string): string => `${image} 0 0 / ${size} repeat`

function clothTile(seed: number, density: number): string {
  return texURL(`clo${seed}_${density}`, 128, 128, (g, w, h) => {
    const random = rnd(seed)
    const fibres = many(density, random, r => ({
      x: r() * w,
      y: r() * h,
      angle: r() * Math.PI,
      length: 2 + r() * 11,
      dark: r() > 0.5,
      alpha: 0.04 + r() * 0.08,
      width: 0.55 + r() * 0.8,
    }))

    wrapped(g, w, h, fibres, fibre => {
      g.lineWidth = fibre.width
      g.strokeStyle = fibre.dark
        ? `rgba(20,12,5,${fibre.alpha.toFixed(3)})`
        : `rgba(240,218,178,${(fibre.alpha * 0.8).toFixed(3)})`
      g.beginPath()
      g.moveTo(fibre.x, fibre.y)
      g.lineTo(
        fibre.x + Math.cos(fibre.angle) * fibre.length,
        fibre.y + Math.sin(fibre.angle) * fibre.length,
      )
      g.stroke()
    })
  })
}

interface HandlingOptions {
  depth?: number
  cornerA?: number
  cornerB?: number
  dark?: number
  scuff?: number
  light?: number
}

type PhysicalEdge = 'right' | 'left' | 'bottom' | 'top'

function handlingEdgeWear(seed: number, edge: PhysicalEdge, strength: number, options: HandlingOptions = {}): string {
  const {
    depth = 0.09,
    cornerA = 0,
    cornerB = 0.6,
    dark = 0.35,
    scuff = 1,
    light = 1,
  } = options
  const W = 360
  const H = 480
  const key = `hew${seed}_${edge}_${strength}_${depth}_${cornerA}_${cornerB}_${dark}_${scuff}_${light}`

  return texURL(key, W, H, (g, w, h) => {
    const random = rnd(seed)
    const along = edge === 'right' || edge === 'left' ? h : w
    const maxDepth = depth * Math.min(w, h)
    const map = (u: number, v: number): [number, number] => {
      if (edge === 'right') return [w - v, u * h]
      if (edge === 'left') return [v, u * h]
      if (edge === 'bottom') return [u * w, h - v]
      return [u * w, v]
    }

    const N = 240
    const profile: Array<{ d: number; i: number }> = new Array(N)
    let depthWalk = 0.4 + random() * 0.4
    let intensityWalk = 0.4 + random() * 0.4
    const gaps: Array<[number, number]> = []
    for (let k = 0; k < 3; k += 1) gaps.push([random(), 0.04 + random() * 0.09])

    for (let i = 0; i < N; i += 1) {
      const u = i / (N - 1)
      depthWalk = Math.min(1, Math.max(0.05, depthWalk + (random() - 0.5) * 0.16))
      intensityWalk = Math.min(1, Math.max(0, intensityWalk + (random() - 0.5) * 0.18))
      let quiet = 1
      for (const [gapU, gapWidth] of gaps) {
        quiet *= 1 - 0.85 * Math.exp(-((u - gapU) ** 2) / (2 * gapWidth * gapWidth))
      }
      const corner = 1
        + cornerA * Math.exp(-(u ** 2) / 0.012)
        + cornerB * Math.exp(-((1 - u) ** 2) / 0.012)
      profile[i] = { d: depthWalk * corner * quiet, i: intensityWalk * corner * quiet }
    }

    const step = along / (N - 1)
    for (let i = 0; i < N; i += 1) {
      const u = i / (N - 1)
      const point = profile[i]!
      const vDepth = Math.max(1, point.d * maxDepth)
      const [x0, y0] = map(u, 0)
      const [x1, y1] = map(u, vDepth)
      const gradient = g.createLinearGradient(x0, y0, x1, y1)
      const alpha = 0.22 * light * strength * point.i
      const mix = (from: number, to: number): number => Math.round(from + (to - from) * (1 - light))
      gradient.addColorStop(0, `rgba(${mix(232,190)},${mix(214,172)},${mix(178,138)},${alpha.toFixed(3)})`)
      gradient.addColorStop(0.45, `rgba(${mix(226,186)},${mix(206,168)},${mix(168,134)},${(alpha * 0.45).toFixed(3)})`)
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      g.strokeStyle = gradient
      g.lineWidth = step * 1.6
      g.beginPath()
      g.moveTo(x0, y0)
      g.lineTo(x1, y1)
      g.stroke()

      if (dark) {
        const [darkX, darkY] = map(u, vDepth * 0.45)
        const darkGradient = g.createLinearGradient(x0, y0, darkX, darkY)
        const darkAlpha = 0.10 * strength * dark * point.i
        darkGradient.addColorStop(0, `rgba(38,26,12,${darkAlpha.toFixed(3)})`)
        darkGradient.addColorStop(1, 'rgba(0,0,0,0)')
        g.strokeStyle = darkGradient
        g.beginPath()
        g.moveTo(x0, y0)
        g.lineTo(darkX, darkY)
        g.stroke()
      }
    }

    const count = Math.round(420 * scuff)
    for (let i = 0; i < count; i += 1) {
      const u = random()
      const point = profile[Math.min(N - 1, Math.round(u * (N - 1)))]!
      if (random() > point.i * 0.95) continue
      const v = random() * random() * Math.max(1, point.d * maxDepth)
      const [x, y] = map(u, v)
      const length = 2 + random() * 7
      const [x2, y2] = map(
        u + (random() - 0.5) * (length / along) * 2,
        v + (random() - 0.5) * 1.6,
      )
      g.lineWidth = 0.4 + random() * 0.6
      g.strokeStyle = random() > 0.35
        ? `rgba(240,222,186,${(0.05 + random() * 0.10 * strength).toFixed(3)})`
        : `rgba(30,20,9,${(0.03 + random() * 0.06 * strength).toFixed(3)})`
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x2, y2)
      g.stroke()
    }
  })
}

interface BrokenPressureOptions {
  maxLen?: number
  edgeBias?: number
}

function brokenPressureMark(seed: number, count: number, strength: number, options: BrokenPressureOptions = {}): string {
  const { maxLen = 0.22, edgeBias = 0.55 } = options
  const W = 360
  const H = 480
  const key = `bpm${seed}_${count}_${strength}_${maxLen}_${edgeBias}`

  return texURL(key, W, H, (g, w, h) => {
    const random = rnd(seed)
    g.lineCap = 'round'
    for (let i = 0; i < count; i += 1) {
      let x = random() * w
      let y = random() * h
      const cx = w / 2
      const cy = h / 2
      x = cx + (x - cx) * (1 + edgeBias)
      y = cy + (y - cy) * (1 + edgeBias)
      x = Math.min(w - 8, Math.max(8, x))
      y = Math.min(h - 8, Math.max(8, y))
      const angle = random() * Math.PI
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)
      const total = (0.07 + random() * (maxLen - 0.07)) * Math.min(w, h) * 2.2
      const segments = 3 + Math.floor(random() * 4)
      let t = 0

      for (let segment = 0; segment < segments; segment += 1) {
        const segmentLength = total / segments * (0.35 + random() * 0.6)
        const gap = total / segments * (0.25 + random() * 0.7)
        const wobble = (random() - 0.5) * 5
        const x0 = x + dx * t - dy * wobble
        const y0 = y + dy * t + dx * wobble
        t += segmentLength
        const wobble2 = (random() - 0.5) * 5
        const x1 = x + dx * t - dy * wobble2
        const y1 = y + dy * t + dx * wobble2
        t += gap
        const fade = (0.35 + random() * 0.65) * strength
        g.lineWidth = 0.8 + random() * 1.1
        g.strokeStyle = `rgba(30,20,9,${(0.035 + random() * 0.05) * fade})`
        g.beginPath()
        g.moveTo(x0, y0)
        g.lineTo(x1, y1)
        g.stroke()
        g.lineWidth = 0.7 + random() * 0.9
        g.strokeStyle = `rgba(246,230,198,${(0.030 + random() * 0.045) * fade})`
        g.beginPath()
        g.moveTo(x0 - dy * 1.5, y0 + dx * 1.5)
        g.lineTo(x1 - dy * 1.5, y1 + dx * 1.5)
        g.stroke()
      }
    }
  })
}

function scratchLayer(seed: number, count: number, patches: number, bright: number): string {
  return texURL(`scr${seed}_${count}_${patches}_${bright}`, 480, 320, (g, w, h) => {
    const random = rnd(seed)
    for (let i = 0; i < count; i += 1) {
      const x = random() * w
      const y = random() * h
      const angle = (random() - 0.5) * 3.0
      const length = 8 + random() * random() * 110
      const light = random() > 1 - bright
      g.strokeStyle = light
        ? `rgba(238,210,162,${(0.10 + random() * 0.24).toFixed(3)})`
        : `rgba(20,12,5,${(0.10 + random() * 0.24).toFixed(3)})`
      g.lineWidth = 0.4 + random() * 1.2
      g.beginPath()
      let px = x
      let py = y
      const steps = 3 + Math.floor(random() * 5)
      for (let k = 0; k < steps; k += 1) {
        const nx = px + Math.cos(angle) * (length / steps) + (random() - 0.5) * 5
        const ny = py + Math.sin(angle) * (length / steps) + (random() - 0.5) * 5
        if (random() > 0.26) {
          g.moveTo(px, py)
          g.lineTo(nx, ny)
        }
        px = nx
        py = ny
      }
      g.stroke()
    }

    for (let i = 0; i < patches; i += 1) {
      const x = random() * w
      const y = random() * h
      const radius = 14 + random() * 52
      const gradient = g.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(228,198,150,${(0.05 + random() * 0.11).toFixed(3)})`)
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = gradient
      g.beginPath()
      g.ellipse(x, y, radius, radius * (0.35 + random() * 0.55), random() * 3, 0, 7)
      g.fill()
    }
  })
}

function cornerAbrasion(seed: number, ax: number, ay: number, strength: number, soft = 0): string {
  return texURL(`cor${seed}_${ax}${ay}_${strength}_${soft.toFixed(2)}_b2`, 128, 128, (g, w, h) => {
    const random = rnd(seed)
    const cx = ax * w
    const cy = ay * h
    const hiColor = [
      Math.round(230 - (230 - 198) * soft),
      Math.round(200 - (200 - 168) * soft),
      Math.round(152 - (152 - 122) * soft),
    ]
    const hiAlpha = (0.26 - 0.11 * soft) * strength
    const midColor = [
      Math.round(214 - (214 - 182) * soft),
      Math.round(182 - (182 - 150) * soft),
      Math.round(132 - (132 - 106) * soft),
    ]
    const midAlpha = (0.08 - 0.02 * soft) * strength
    const gradient = g.createRadialGradient(cx, cy, 0, cx, cy, 104)
    gradient.addColorStop(0, `rgba(${hiColor[0]},${hiColor[1]},${hiColor[2]},${hiAlpha.toFixed(3)})`)
    gradient.addColorStop(0.55, `rgba(${midColor[0]},${midColor[1]},${midColor[2]},${midAlpha.toFixed(3)})`)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gradient
    g.fillRect(0, 0, w, h)

    const liteColor = [
      Math.round(240 - (240 - 214) * soft),
      Math.round(214 - (214 - 188) * soft),
      Math.round(170 - (170 - 148) * soft),
    ]
    g.filter = 'blur(1.7px)'
    for (let i = 0; i < 220; i += 1) {
      const distance = random() * random() * 120
      const angle = random() * Math.PI / 2
      const x = cx + (ax ? -1 : 1) * Math.cos(angle) * distance
      const y = cy + (ay ? -1 : 1) * Math.sin(angle) * distance
      const light = random() > 0.45 + 0.16 * soft
      g.fillStyle = light
        ? `rgba(${liteColor[0]},${liteColor[1]},${liteColor[2]},${(0.05 + random() * (0.20 - 0.07 * soft) * strength).toFixed(3)})`
        : `rgba(28,18,8,${(0.05 + random() * 0.22 * strength).toFixed(3)})`
      g.beginPath()
      g.arc(x, y, 0.6 + random() * 2.2, 0, 7)
      g.fill()
    }
    g.filter = 'none'
  })
}

function chipTile(seed: number): string {
  return texURL(`chip2${seed}`, 96, 96, (g, w, h) => {
    const random = rnd(seed)
    const points = many(260, random, r => ({
      x: r() * w,
      y: r() * h,
      radius: 0.3 + r() * 1.5,
      light: r() > 0.4,
      alpha: 0.06 + r() * 0.26,
    }))
    g.filter = 'blur(1.6px)'
    wrapped(g, w, h, points, point => {
      g.fillStyle = point.light
        ? `rgba(232,206,162,${point.alpha.toFixed(3)})`
        : `rgba(22,14,6,${point.alpha.toFixed(3)})`
      g.beginPath()
      g.arc(point.x, point.y, point.radius, 0, 7)
      g.fill()
    })
    g.filter = 'none'
  })
}

const blot = (x: number, y: number, rx: number, ry: number, color: string, alpha: number): string =>
  `radial-gradient(${rx}% ${ry}% at ${x}% ${y}%, rgba(${color},${alpha.toFixed(3)}), rgba(${color},${(alpha * 0.35).toFixed(3)}) 55%, transparent 80%)`

function patchyEdge(seed: number, side: number, color: string, amount: number): string[] {
  const layers: string[] = []
  const random = rnd(seed)
  let y = 0
  while (y < 100) {
    const height = 7 + random() * 22
    const intensity = random()
    if (intensity > 0.3) {
      layers.push(blot(side, y + height / 2, 9 + random() * 14, height * 0.8, color, 0.30 * amount * intensity))
    }
    y += height
  }
  return layers
}

const countFor = (count: number, weight: number): number => Math.max(0, Math.round(count * weight))

function famHandled(weight: number, normalizer: number): string[] {
  if (weight < 0.03) return []
  const exposure = weight * normalizer
  const soft = 0.55
  return [
    layer(scratchLayer(607, countFor(7, weight), 0, 0.6), '100% 100%'),
    layer(handlingEdgeWear(601, 'right', 1.6 * exposure, { depth: 0.13, cornerB: 0.3, dark: 0.3, scuff: 1.3 }), '100% 100%'),
    layer(handlingEdgeWear(602, 'bottom', 0.9 * exposure, { depth: 0.08, cornerB: 0.28, dark: 0.35 }), '100% 100%'),
    layer(cornerAbrasion(604, 1, 1, 0.95 * exposure, soft), '23% 18%', 'right bottom'),
    layer(cornerAbrasion(605, 1, 0, 0.6 * exposure, soft), '17% 13%', 'right top'),
  ]
}

function famEdge(weight: number, normalizer: number): string[] {
  if (weight < 0.03) return []
  const exposure = weight * normalizer
  const soft = 0.55
  const layers: string[] = []
  const corners: Array<[string, number, number, number, number]> = [
    ['right bottom', 1, 1, 1.15, 611],
    ['right top', 1, 0, 0.85, 612],
    ['left bottom', 0, 1, 0.7, 613],
    ['left top', 0, 0, 0.5, 614],
  ]
  for (const [position, ax, ay, scale, seed] of corners) {
    layers.push(layer(
      cornerAbrasion(seed, ax, ay, scale * exposure, soft),
      `${(18 + scale * 6).toFixed(0)}% ${(14 + scale * 6).toFixed(0)}%`,
      position,
    ))
  }
  layers.push(layer(scratchLayer(618, countFor(8, weight), 0, 0.5), '100% 100%'))
  if (weight > 0.5) {
    layers.push(`${chipTile(615)} 0 100% / 96px ${(6 + 4 * exposure).toFixed(0)}px repeat-x`)
    layers.push(`${chipTile(616)} 100% 0 / ${(5 + 4 * exposure).toFixed(0)}px 96px repeat-y`)
  }
  return layers
}

function famTravel(weight: number, normalizer: number): string[] {
  if (weight < 0.03) return []
  const exposure = weight * normalizer
  const soft = 0.55
  return [
    layer(scratchLayer(101, countFor(26, weight), 0, 0.55), '100% 100%'),
    layer(scratchLayer(102, countFor(14, weight), 0, 0.8), '62% 74%', '18% 22%'),
    layer(scratchLayer(105, countFor(6, weight), 0, 0.7), '46% 38%', '72% 14%'),
    layer(scratchLayer(103, countFor(4, weight), 0, 0.30), '78% 52%', '14% 62%'),
    layer(scratchLayer(104, countFor(3, weight), 0, 0.22), '54% 40%', '68% 22%'),
    layer(brokenPressureMark(636, countFor(3, weight), 0.55 * weight, { maxLen: 0.16, edgeBias: 0.6 }), '100% 100%'),
    layer(handlingEdgeWear(634, 'right', 0.5 * exposure, { depth: 0.07, cornerB: 0.7, dark: 0.3, scuff: 0.9 }), '100% 100%'),
    layer(cornerAbrasion(635, 1, 1, 0.9 * exposure, soft), '22% 17%', 'right bottom'),
  ]
}

function famLoved(weight: number, normalizer: number): string[] {
  if (weight < 0.03) return []
  const exposure = weight * normalizer
  const soft = 0.55
  return [
    layer(handlingEdgeWear(641, 'right', 1.2 * exposure, { depth: 0.085, cornerB: 0.7, cornerA: 0.3, dark: 0.3 }), '100% 100%'),
    layer(cornerAbrasion(642, 1, 1, 1.05 * exposure, soft), '22% 17%', 'right bottom'),
    layer(cornerAbrasion(643, 1, 0, 0.75 * exposure, soft), '18% 14%', 'right top'),
    layer(scratchLayer(73, countFor(5, weight), 0, 0.6), '100% 100%'),
  ]
}

function famClouds(weight: number, normalizer: number): string[] {
  if (weight < 0.03) return []
  const exposure = weight * normalizer
  return [
    layer(scratchLayer(661, 0, countFor(5, weight), 0.5), '100% 100%'),
    layer(scratchLayer(662, 0, countFor(4, weight), 0.4), '72% 64%', '22% 26%'),
    blot(97, 24, 2.2, 1.8, '212,196,164', 0.30 * exposure),
    blot(96, 79, 2.6, 2.1, '212,196,164', 0.26 * exposure),
    blot(26, 64, 5, 4.4, '244,220,178', 0.16 * exposure),
    blot(50, 50, 22, 30, '226,210,178', 0.10 * exposure),
    ...patchyEdge(617, 100, '58,42,20', 1.1 * exposure),
    `radial-gradient(114% 106% at 50% 50%, transparent 56%, rgba(224,204,166,${(0.12 * exposure).toFixed(3)}) 82%, rgba(30,20,9,${(0.20 * exposure).toFixed(3)}) 100%)`,
  ]
}

function famHeavy(weight: number, normalizer: number): string[] {
  if (weight < 0.03) return []
  const exposure = weight * normalizer
  const soft = 0.55
  const layers: string[] = [
    layer(handlingEdgeWear(651, 'right', 1.0 * exposure, { depth: 0.05, cornerB: 0.8, dark: 0.4 }), '100% 100%'),
    layer(handlingEdgeWear(658, 'bottom', 0.7 * exposure, { depth: 0.045, cornerB: 0.8, dark: 0.4, scuff: 1.1 }), '100% 100%'),
  ]
  const corners: Array<[string, number, number, number, number]> = [
    ['right bottom', 1, 1, 0.9, 653],
    ['right top', 1, 0, 0.65, 654],
    ['left bottom', 0, 1, 0.6, 655],
    ['left top', 0, 0, 0.45, 656],
  ]
  for (const [position, ax, ay, scale, seed] of corners) {
    layers.push(layer(
      cornerAbrasion(seed, ax, ay, scale * exposure, soft),
      `${(20 + scale * 7).toFixed(0)}% ${(16 + scale * 7).toFixed(0)}%`,
      position,
    ))
  }
  layers.push(layer(brokenPressureMark(657, countFor(5, weight), 0.5 * weight, { maxLen: 0.13, edgeBias: 0.75 }), '100% 100%'))
  layers.push(layer(scratchLayer(85, countFor(30, weight), 0, 0.5), '100% 100%'))
  layers.push(layer(scratchLayer(86, countFor(22, weight), 0, 0.38), '70% 66%', '26% 58%'))
  layers.push(layer(scratchLayer(88, countFor(10, weight), 0, 0.55), '40% 34%', '14% 20%'))
  if (weight > 0.5) layers.push(`${chipTile(660)} 0 100% / 96px ${(8 + 4 * exposure).toFixed(0)}px repeat-x`)
  layers.push(layer(scratchLayer(87, countFor(16, weight), 0, 0.30), '58% 52%', '74% 18%'))
  return layers
}

function famHumid(weight: number, normalizer: number): string[] {
  if (weight < 0.02) return []
  const exposure = Math.pow(weight, 1.4) * normalizer
  const layers: string[] = []
  for (let i = 0; i < 7; i += 1) {
    const x = (hash1(i * 3.1 + 1) * 100).toFixed(1)
    const y = (hash1(i * 3.1 + 2) * 100).toFixed(1)
    const rx = (62 + hash1(i * 3.1 + 3) * 46).toFixed(0)
    const ry = (52 + hash1(i * 3.1 + 4) * 42).toFixed(0)
    const alpha = (0.035 + hash1(i * 3.1 + 5) * 0.045) * exposure
    layers.push(`radial-gradient(${rx}% ${ry}% at ${x}% ${y}%, rgba(46,32,14,${alpha.toFixed(3)}) 0%, rgba(46,32,14,${(alpha * 0.35).toFixed(3)}) 60%, rgba(46,32,14,0) 78%)`)
  }
  for (let i = 0; i < 6; i += 1) {
    const x = (hash1(i * 5.7 + 11) * 100).toFixed(1)
    const y = (hash1(i * 5.7 + 12) * 100).toFixed(1)
    const rx = (56 + hash1(i * 5.7 + 13) * 44).toFixed(0)
    const ry = (46 + hash1(i * 5.7 + 14) * 40).toFixed(0)
    const alpha = (0.026 + hash1(i * 5.7 + 15) * 0.030) * exposure
    layers.push(`radial-gradient(${rx}% ${ry}% at ${x}% ${y}%, rgba(198,176,138,${alpha.toFixed(3)}) 0%, rgba(198,176,138,${(alpha * 0.3).toFixed(3)}) 58%, rgba(198,176,138,0) 76%)`)
  }
  layers.push(`linear-gradient(168deg, rgba(46,32,14,${(0.16 * exposure).toFixed(3)}) 0%, rgba(46,32,14,0) 42%, rgba(38,26,11,${(0.20 * exposure).toFixed(3)}) 100%)`)
  layers.push(`radial-gradient(120% 112% at 50% 46%, rgba(0,0,0,0) 48%, rgba(34,23,10,${(0.26 * exposure).toFixed(3)}) 100%)`)
  layers.push(`linear-gradient(0deg, rgba(52,38,18,${(0.14 * exposure).toFixed(3)}), rgba(52,38,18,${(0.14 * exposure).toFixed(3)}))`)
  return layers
}

const WEAR_KEYS: WearKey[] = ['handled', 'edge', 'travel', 'loved', 'heavy', 'humid', 'clouds']
const WEAR_LOAD: Record<WearKey, number> = {
  handled: 0.9,
  edge: 1.15,
  travel: 0.7,
  loved: 1.0,
  heavy: 1.5,
  humid: 0.25,
  clouds: 0.2,
}
const WEAR_CAP = 1.9
const wearFamilies: Record<WearKey, (weight: number, normalizer: number) => string[]> = {
  handled: famHandled,
  edge: famEdge,
  travel: famTravel,
  loved: famLoved,
  heavy: famHeavy,
  humid: famHumid,
  clouds: famClouds,
}

function synthWear(mix: WearMix, strength = 1): string[] {
  const weights = {} as Record<WearKey, number>
  for (const key of WEAR_KEYS) weights[key] = clamp01((mix[key] || 0) / 100) * strength
  const load = WEAR_KEYS.reduce((total, key) => total + WEAR_LOAD[key] * weights[key], 0)
  const normalizer = load > WEAR_CAP ? WEAR_CAP / load : 1
  const strongest = WEAR_KEYS.reduce((current, key) => weights[key] > weights[current] ? key : current, WEAR_KEYS[0])
  const layers: string[] = []
  for (const key of WEAR_KEYS) {
    const localNormalizer = key === strongest
      ? Math.min(1, normalizer + (1 - normalizer) * 0.5)
      : normalizer
    layers.push(...wearFamilies[key](weights[key], localNormalizer))
  }
  return layers
}

const A3_SUBSTRATE_SEED = 577

export const F3_BRICK: F3Colorway = {
  id: 'brick',
  name: 'Muted brick / terracotta',
  base: ['#6e4530', '#523324', '#3d261a'],
  fade: '204,164,134',
  damp: '46,26,16',
  drift: '166,116,86',
  traits: ['clay-dyed cloth', 'fades to dusty terracotta', 'earthy, not orange'],
}

const colorwayBase = (colorway: F3Colorway): string =>
  `linear-gradient(160deg, ${colorway.base[0]}, ${colorway.base[1]} 58%, ${colorway.base[2]})`

function colorwaySubstrate(colorway: F3Colorway): string[] {
  return [
    tile(clothTile(A3_SUBSTRATE_SEED, 260), '112px 112px'),
    tile(clothTile(A3_SUBSTRATE_SEED + 1, 200), '71px 83px'),
    `radial-gradient(72% 58% at 26% 22%, rgba(${colorway.drift},.13), transparent 70%)`,
    `radial-gradient(64% 66% at 78% 68%, rgba(${colorway.damp},.16), transparent 72%)`,
    `radial-gradient(88% 52% at 60% 8%, rgba(${colorway.fade},.07), transparent 74%)`,
    colorwayBase(colorway),
  ]
}

function colorwayAging(colorway: F3Colorway): string[] {
  return [
    `radial-gradient(118% 112% at 46% 44%, transparent 52%, rgba(${colorway.fade},.13) 84%, rgba(${colorway.fade},.20) 100%)`,
    'linear-gradient(275deg, rgba(176,158,128,.16), transparent 26%)',
    'linear-gradient(0deg, rgba(176,158,128,.11), transparent 22%)',
    `radial-gradient(70% 62% at 30% 30%, rgba(${colorway.fade},.10), transparent 76%)`,
    `radial-gradient(58% 54% at 82% 24%, rgba(${colorway.fade},.07), transparent 74%)`,
    `radial-gradient(66% 60% at 22% 84%, rgba(${colorway.damp},.14), transparent 76%)`,
  ]
}

const F3_AMBIENT: WearMix = { humid: 34, clouds: 20 }
const F3_04_BASE: WearMix = { handled: 35, edge: 85, travel: 12, loved: 80, heavy: 8 }
const F3_03_DELTA: WearMix = { edge: 86, travel: 34, loved: 76, heavy: 14 }

export const FINAL_COVER_PRESET: Required<WearMix> = {
  handled: F3_04_BASE.handled || 0,
  edge: F3_03_DELTA.edge || 0,
  travel: F3_03_DELTA.travel || 0,
  loved: F3_03_DELTA.loved || 0,
  heavy: F3_03_DELTA.heavy || 0,
  humid: F3_AMBIENT.humid || 0,
  clouds: F3_AMBIENT.clouds || 0,
}

export function finalCoverSkin(strength = 1): string {
  return [
    ...synthWear(FINAL_COVER_PRESET, strength),
    ...colorwayAging(F3_BRICK),
    ...colorwaySubstrate(F3_BRICK),
  ].join(', ')
}

export function finalBoardSkin(strength = 0.35): string {
  return [
    ...synthWear({ handled: 24, edge: 40, travel: 0, loved: 55, heavy: 0, humid: 20, clouds: 10 }, strength),
    ...colorwayAging(F3_BRICK),
    ...colorwaySubstrate(F3_BRICK),
  ].join(', ')
}

export const F3_COVER = {
  id: 'F3-03',
  name: 'Slightly more scuffed - Brick',
  preset: FINAL_COVER_PRESET,
  colorway: F3_BRICK,
  coverSkin: finalCoverSkin,
  boardSkin: finalBoardSkin,
} as const
