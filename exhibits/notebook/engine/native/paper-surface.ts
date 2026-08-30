import { EDGE_OXIDATION, PaperStack, STOCK, type PaperCondition } from './paper-stack'

/*
 * Production extraction of /public/shared/paper-surface.js from the canonical
 * /notebook-lab-native source.
 *
 * Every layer remains CSS gradients + cached canvas data URLs so the native
 * computed-style -> SVG foreignObject -> WebGL texture handoff can keep using
 * the same material language. The old window.PaperSurface global is removed.
 */

const { rnd, clamp01, lerp } = PaperStack
const EDGE_OX = EDGE_OXIDATION == null ? STOCK.oxidation : EDGE_OXIDATION
const textureCache = new Map<string, string>()

export function texURL(
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
  if (!context) throw new Error('Canvas 2D context unavailable for notebook paper texture')
  draw(context, width, height)
  const url = `url("${canvas.toDataURL('image/png')}")`
  textureCache.set(key, url)
  return url
}

export const layer = (url: string, size: string, position?: string): string =>
  `${url} ${position || '0 0'}/${size} no-repeat`

export const tile = (url: string, size: string): string => `${url} 0 0/${size} repeat`

const mirrorX = (x: number, mirror: boolean): number => mirror ? 100 - x : x
const mirrorDegrees = (degrees: number, mirror: boolean): number => mirror ? (360 - degrees) % 360 : degrees

export function blot(
  x: number,
  y: number,
  width: number,
  height: number,
  rgb: string,
  alpha: number,
  mirror = false,
): string {
  return `radial-gradient(${width}% ${height}% at ${mirrorX(x, mirror)}% ${y}%, rgba(${rgb},${alpha.toFixed(3)}), rgba(${rgb},0) 70%)`
}

export function fibreTile(seed: number, strength: number): string {
  return texURL(`fib${seed}_${strength.toFixed(2)}`, 200, 200, (g, w, h) => {
    const random = rnd(seed)
    g.fillStyle = 'rgba(0,0,0,0)'
    g.fillRect(0, 0, w, h)

    for (let i = 0; i < 1400; i += 1) {
      const x = random() * w
      const y = random() * h
      const length = 2 + random() * 11
      const angle = (random() - 0.5) * 0.9 + (random() < 0.5 ? 0 : Math.PI / 2)
      const alpha = (0.020 + random() * 0.045) * strength
      g.strokeStyle = random() < 0.55
        ? `rgba(120,102,72,${alpha.toFixed(3)})`
        : `rgba(255,252,240,${(alpha * 1.2).toFixed(3)})`
      g.lineWidth = random() < 0.8 ? 0.7 : 1.2
      g.beginPath()
      for (const dx of [-w, 0, w]) {
        for (const dy of [-h, 0, h]) {
          g.moveTo(x + dx, y + dy)
          g.lineTo(x + dx + Math.cos(angle) * length, y + dy + Math.sin(angle) * length)
        }
      }
      g.stroke()
    }

    for (let i = 0; i < 220; i += 1) {
      const x = random() * w
      const y = random() * h
      const radius = 0.4 + random() * 1.1
      g.fillStyle = `rgba(133,112,74,${(0.05 + random() * 0.08) * strength})`
      for (const dx of [-w, 0, w]) {
        for (const dy of [-h, 0, h]) {
          g.beginPath()
          g.arc(x + dx, y + dy, radius, 0, 7)
          g.fill()
        }
      }
    }
  })
}

export function drift(seed: number, amount: number, mirror = false): string[] {
  const layers: string[] = []
  const random = rnd(seed)
  for (let i = 0; i < 4; i += 1) {
    layers.push(blot(
      random() * 100,
      random() * 100,
      45 + random() * 45,
      40 + random() * 45,
      '176,150,102',
      0.05 * amount + random() * 0.05 * amount,
      mirror,
    ))
  }
  return layers
}

export function foxingTex(seed: number, density: number, mirror: boolean): string {
  return texURL(`fox${seed}_${density.toFixed(2)}${mirror ? '_m' : ''}`, 420, 560, (g, w, h) => {
    const random = rnd(seed)
    const X = (x: number): number => mirror ? w - x : x
    const specks = Math.round(10 + density * 90)

    for (let i = 0; i < specks; i += 1) {
      const bias = random()
      const x = X(w * (bias < 0.45 ? 0.55 + 0.45 * random() : random()))
      const y = random() * h
      const radius = 0.6 + random() * 1.9
      const core = (0.20 + random() * 0.30) * Math.min(1, 0.35 + density * 0.75)
      const gradient = g.createRadialGradient(x, y, 0, x, y, radius * 3.1)
      gradient.addColorStop(0, `rgba(150,100,50,${(core * 0.55).toFixed(3)})`)
      gradient.addColorStop(1, 'rgba(150,100,50,0)')
      g.fillStyle = gradient
      g.beginPath()
      g.arc(x, y, radius * 3.1, 0, 7)
      g.fill()
      g.fillStyle = `rgba(122,74,32,${core.toFixed(3)})`
      g.beginPath()
      g.arc(x, y, radius, 0, 7)
      g.fill()
    }

    const clusters = Math.round(1 + density * 4)
    for (let c = 0; c < clusters; c += 1) {
      const cx = X(random() * w)
      const cy = random() * h
      const spread = 26 + random() * 80
      const count = Math.round(4 + random() * 9 * density)
      for (let i = 0; i < count; i += 1) {
        const x = cx + (random() - 0.5) * spread
        const y = cy + (random() - 0.5) * spread
        const radius = 0.9 + random() * 3.4
        const gradient = g.createRadialGradient(x, y, 0, x, y, radius * 2.4)
        gradient.addColorStop(0, `rgba(146,96,48,${(0.14 + random() * 0.18).toFixed(3)})`)
        gradient.addColorStop(0.5, `rgba(158,112,62,${(0.06 + random() * 0.08).toFixed(3)})`)
        gradient.addColorStop(1, 'rgba(158,112,62,0)')
        g.fillStyle = gradient
        g.beginPath()
        g.arc(x, y, radius * 2.4, 0, 7)
        g.fill()
      }
    }
  })
}

export function grimeLayers(seed: number, amount: number, mirror = false): string[] {
  if (amount <= 0) return []
  const random = rnd(seed + 3)
  return [
    blot(96, 48 + (random() - 0.5) * 22, 16, 26, '106,88,58', 0.16 * amount, mirror),
    blot(92, 86, 20, 16, '98,80,52', 0.10 * amount, mirror),
    blot(88, 12, 16, 12, '98,80,52', 0.07 * amount, mirror),
    `linear-gradient(${mirrorDegrees(270, mirror)}deg, rgba(120,98,62,${(0.10 * amount).toFixed(3)}), rgba(120,98,62,0) 26%)`,
  ]
}

export function edgeLayers(amount: number, oxidation: number, mirror = false): string[] {
  const alpha = amount * oxidation
  return [
    `linear-gradient(${mirrorDegrees(270, mirror)}deg, rgba(120,88,44,${(0.42 * alpha).toFixed(3)}) 0%, rgba(150,116,66,${(0.26 * alpha).toFixed(3)}) 3%, rgba(168,136,84,${(0.10 * alpha).toFixed(3)}) 7%, rgba(168,136,84,0) 15%)`,
    `linear-gradient(0deg, rgba(126,94,48,${(0.30 * alpha).toFixed(3)}) 0%, rgba(158,124,72,${(0.12 * alpha).toFixed(3)}) 4%, rgba(168,136,84,0) 11%)`,
    `linear-gradient(180deg, rgba(140,108,58,${(0.24 * alpha).toFixed(3)}) 0%, rgba(168,136,84,0) 9%)`,
    blot(97, 3, 16, 13, '118,86,42', 0.30 * alpha, mirror),
    blot(96, 97, 18, 14, '112,80,40', 0.34 * alpha, mirror),
  ]
}

export function humidLayers(seed: number, amount: number, mirror = false): string[] {
  if (amount <= 0) return []
  const random = rnd(seed + 11)
  const layers = [
    `linear-gradient(0deg, rgba(150,116,66,${(0.16 * amount).toFixed(3)}) 0%, rgba(160,128,78,${(0.09 * amount).toFixed(3)}) 9%, rgba(160,128,78,0) 30%)`,
  ]
  for (let i = 0; i < 3; i += 1) {
    layers.push(blot(
      12 + random() * 76,
      78 + random() * 22,
      34 + random() * 30,
      22 + random() * 18,
      '150,114,62',
      0.10 * amount,
      mirror,
    ))
  }
  return layers
}

export function stainLayers(seed: number, strength: number, mirror = false): string[] {
  const random = rnd(seed + 29)
  const x = 18 + random() * 62
  const y = 18 + random() * 58
  const width = 8 + random() * 11
  const height = 7 + random() * 10
  return [
    blot(x, y, width * 1.35, height * 1.35, '138,104,54', 0.10 * strength, mirror),
    blot(x, y, width, height, '126,92,46', 0.16 * strength, mirror),
    blot(x + width * 0.25, y + height * 0.2, width * 0.45, height * 0.45, '112,80,38', 0.12 * strength, mirror),
  ]
}

export function smudgeLayers(seed: number, strength: number, mirror = false): string[] {
  const random = rnd(seed + 41)
  const x = 22 + random() * 54
  const y = 24 + random() * 52
  return [
    blot(x, y, 14 + random() * 9, 5 + random() * 4, '72,66,58', 0.14 * strength, mirror),
    blot(x + 4, y + 2, 8, 3, '62,56,50', 0.10 * strength, mirror),
  ]
}

export function creaseTex(seed: number, mirror: boolean): string {
  return texURL(`cr${seed}${mirror ? '_m' : ''}`, 320, 320, (g, w, h) => {
    const random = rnd(seed)
    if (mirror) {
      g.translate(w, 0)
      g.scale(-1, 1)
    }
    const ay = h * (0.25 + random() * 0.5)
    const bx = w * (0.42 + random() * 0.45)
    const by = ay + (random() - 0.5) * h * 0.3
    const N = 70
    const point = (i: number): [number, number] => {
      const t = i / N
      const x = bx * t
      const y = ay + (by - ay) * t
      const dx = bx
      const dy = by - ay
      const length = Math.hypot(dx, dy) || 1
      return [
        x - dy / length * Math.sin(t * 2.3) * 6,
        y + dx / length * Math.sin(t * 2.3) * 6,
      ]
    }

    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < N; i += 1) {
        const [x1, y1] = point(i)
        const [x2, y2] = point(i + 1)
        const alpha = Math.max(0, 1 - i / N) ** 0.8 * (pass ? 0.26 : 0.44)
        g.strokeStyle = pass
          ? `rgba(96,76,42,${alpha.toFixed(3)})`
          : `rgba(255,254,247,${alpha.toFixed(3)})`
        g.lineWidth = pass ? 2 : 1.3
        g.beginPath()
        g.moveTo(x1, y1 + (pass ? 1.2 : -1))
        g.lineTo(x2, y2 + (pass ? 1.2 : -1))
        g.stroke()
      }
    }
  })
}

const surfaceCache = new Map<string, string>()

export function surface(condition: PaperCondition, options?: { mirror?: boolean }): string {
  const mirror = !!options?.mirror
  const events = condition.events || {}
  const key = [
    condition.seed,
    condition.tone,
    condition.grime,
    condition.edge,
    condition.foxing,
    condition.humid,
    condition.fibre,
    events.crease || 0,
    events.smudge || 0,
    events.stain || 0,
  ].map(value => (+value || 0).toFixed(5)).join('|') + (mirror ? '|m' : '')

  let cached = surfaceCache.get(key)
  if (cached === undefined) {
    cached = surfaceRaw(condition, mirror)
    surfaceCache.set(key, cached)
  }
  return cached
}

export function surfaceRaw(condition: PaperCondition, mirror = false): string {
  const events = condition.events || {}
  const layers: string[] = []

  if (events.crease) {
    layers.push(layer(creaseTex(condition.seed + 5, mirror), '46% 40%', `${mirror ? '0%' : '100%'} 100%`))
  }
  if (events.smudge) layers.push(...smudgeLayers(condition.seed, events.smudge, mirror))
  if (events.stain) layers.push(...stainLayers(condition.seed, events.stain, mirror))
  layers.push(...grimeLayers(condition.seed, condition.grime, mirror))
  if (condition.foxing > 0.05) {
    layers.push(tile(foxingTex(condition.seed + 13, clamp01(condition.foxing), mirror), '100% 100%'))
  }
  layers.push(...humidLayers(condition.seed, condition.humid, mirror))
  layers.push(...edgeLayers(condition.edge, EDGE_OX, mirror))
  layers.push(...drift(condition.seed + 2, condition.tone, mirror))
  layers.push(tile(fibreTile(STOCK.seed, STOCK.fibre * condition.fibre), '150px 150px'))

  const tone = clamp01(STOCK.oxidation * 0.5 + condition.tone * 0.35)
  const base = STOCK.base.map((value, index) => Math.round(lerp(value, STOCK.warm[index]!, tone)))
  layers.push(`linear-gradient(168deg, rgb(${base.join(',')}), rgb(${base.map(value => value - 6).join(',')}))`)
  return layers.join(', ')
}

export const PaperSurface = {
  texURL,
  layer,
  tile,
  blot: (x: number, y: number, width: number, height: number, rgb: string, alpha: number) =>
    blot(x, y, width, height, rgb, alpha, false),
  fibreTile,
  drift,
  foxingTex,
  grimeLayers,
  edgeLayers,
  humidLayers,
  stainLayers,
  smudgeLayers,
  creaseTex,
  surface,
  surfaceRaw,
} as const
