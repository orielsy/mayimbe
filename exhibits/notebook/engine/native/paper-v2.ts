export interface PaperCondition extends Record<string, any> {
  geo?: unknown
  humid: number
  foxing: number
  grime?: number
  tone?: number
  edge?: number
  fibre?: number
  exposure: number
  mix?: number
  events: Record<string, number>
  sheetIndex?: number
}

export interface PaperStackPaperApi {
  PRODUCTION_LIMITS: {
    geometricIntensity: number
    frayChipping?: number
  }
  M2_EDGE: {
    rec: number
    corner: number
    cockle: number
    notch: number
    inset: number
  }
  NOTEBOOK_EDGE: Record<string, any> & {
    recession: number
    cornerWear: number
    cockle: number
  }
  condition(input: Record<string, any>): PaperCondition
  clamp01(value: number): number
  h2(a: number, b: number): number
  rnd(seed: number): () => number
}

export interface PaperSurfaceApi {
  surface(condition: PaperCondition, options?: { mirror?: boolean }): string
  texURL(
    key: string,
    width: number,
    height: number,
    draw: (context: CanvasRenderingContext2D, width: number, height: number) => void,
  ): string
  blot(x: number, y: number, width: number, height: number, rgb: string, alpha: number): string
  layer(image: string, size: string, position: string): string
}

export interface PaperV2Dependencies {
  paperStack: PaperStackPaperApi
  paperSurface: PaperSurfaceApi
}

export const PAPER_V2_AGE = 0.88
export const PAPER_V2_HUMID_PEAK_AT = 0.32
export const PAPER_V2_HUMID_RADIUS = 0.34

export const PAPER_V2_PAGE_ONE = {
  humid: 0.18,
  foxing: 0.32,
  grime: 0.95,
  tone: 0.62,
  edge: 0.92,
  fibre: 1.0,
  stain: 0.92,
  smudge: 0.20,
} as const

const TRAUMA_ECHO = [1, 0.30, 0.15] as const

export interface PaperV2Provider {
  readonly age: number
  readonly pageOne: typeof PAPER_V2_PAGE_ONE
  sheet(index: number, sheets: number): PaperCondition
  faceSurfaceCondition(pageIndex: number, condition: PaperCondition): PaperCondition
  skin(pageIndex: number, mirror: boolean, totalPages: number): string
}

/**
 * Production extraction of the selected Lab-Native PAPERV2 paper history.
 *
 * The algorithms are preserved from /notebook-lab-native. Dependencies are
 * ordinary module inputs instead of window.PaperStack/window.PaperSurface, and
 * cache ownership is local to one provider instance.
 */
export function createPaperV2({ paperStack: PS, paperSurface: SF }: PaperV2Dependencies): PaperV2Provider {
  const {
    condition,
    PRODUCTION_LIMITS,
    M2_EDGE,
    NOTEBOOK_EDGE,
    clamp01,
    h2,
    rnd,
  } = PS

  const m2EdgeSpec = {
    ...NOTEBOOK_EDGE,
    recession: NOTEBOOK_EDGE.recession * M2_EDGE.rec,
    cornerWear: NOTEBOOK_EDGE.cornerWear * M2_EDGE.corner,
    cockle: NOTEBOOK_EDGE.cockle * M2_EDGE.cockle,
  }

  function episode(t: number): number {
    const distance = Math.abs(t - PAPER_V2_HUMID_PEAK_AT) / PAPER_V2_HUMID_RADIUS
    if (distance >= 1) {
      return 0
    }
    const x = 1 - distance
    return x * x * (3 - 2 * x)
  }

  const cache = new Map<string, PaperCondition>()

  function sheet(index: number, sheets: number): PaperCondition {
    const count = Math.max(1, sheets || 6)
    const key = `${index}/${count}`
    const cached = cache.get(key)
    if (cached) {
      return cached
    }

    const t = count === 1 ? 0 : Math.min(1, Math.max(0, index / (count - 1)))
    const familyMix = clamp01((t - 0.42) / 0.34)
    const exposure = clamp01(1 - Math.pow(t, 0.72) * 0.86)

    const event = episode(t)
    const jitter = (h2(index + 3, 91) - 0.5) * 0.12
    const humid = clamp01(event * 0.9 + jitter * event)
    const foxing = clamp01(humid * 0.8)
    const bloom = clamp01(humid * 0.55)

    const roll = h2(index + 11, 47)
    const events: Record<string, number> = {}
    if (roll > 0.86) events.crease = 0.7 + h2(index, 5) * 0.3
    else if (roll > 0.78) events.stain = 0.5 + h2(index, 6) * 0.35
    else if (roll > 0.73) events.smudge = 0.5 + h2(index, 7) * 0.4

    const vary = index === 0 ? 1 : 0.78 + h2(index, 23) * 0.22
    events.notch = M2_EDGE.notch * vary

    const result = condition({
      seed: 300 + index * 17,
      familyMix,
      exposure,
      notebookAge: PAPER_V2_AGE,
      familyEdgeInfluence: 0.7,
      notebookEdge: m2EdgeSpec,
      geoIntensity: PRODUCTION_LIMITS.geometricIntensity * vary,
      limits: PRODUCTION_LIMITS,
      foreInset: M2_EDGE.inset * vary,
      neighborhood: {
        humid,
        foxing,
        bloom,
        compress: clamp01(0.18 + t * 0.30),
        cockle: event * 0.5,
        phase: PAPER_V2_HUMID_PEAK_AT * 6.28 + index * 0.55,
      },
      events,
    })

    result.sheetIndex = index
    cache.set(key, result)
    return result
  }

  function echoStrength(pageIndex: number): number {
    return TRAUMA_ECHO[pageIndex as 0 | 1 | 2] ?? 0
  }

  function faceSurfaceCondition(pageIndex: number, source: PaperCondition): PaperCondition {
    const strength = echoStrength(pageIndex)
    if (!strength) {
      return source
    }

    const raiseToward = (base = 0, target: number) => base + Math.max(0, target - base) * strength

    // Surface-only twin: spread/geometry objects remain shared by reference.
    return {
      ...source,
      humid: raiseToward(source.humid, PAPER_V2_PAGE_ONE.humid),
      foxing: raiseToward(source.foxing, PAPER_V2_PAGE_ONE.foxing),
      grime: raiseToward(source.grime, PAPER_V2_PAGE_ONE.grime),
      tone: raiseToward(source.tone, PAPER_V2_PAGE_ONE.tone),
      edge: raiseToward(source.edge, PAPER_V2_PAGE_ONE.edge),
      fibre: raiseToward(source.fibre, PAPER_V2_PAGE_ONE.fibre),
      events: {
        ...source.events,
        stain: raiseToward(source.events?.stain, PAPER_V2_PAGE_ONE.stain),
        smudge: raiseToward(source.events?.smudge, PAPER_V2_PAGE_ONE.smudge),
      },
    }
  }

  function pageOneTideTexture(mirror: boolean, strength = 1): string {
    return SF.texURL(`p1tide_v2${mirror ? '_m' : ''}_k${Math.round(strength * 100)}`, 420, 560, (g, w, h) => {
      g.globalAlpha = strength
      const random = rnd(1207)
      const fronts = [
        { base: 0.53, amp: 0.028, alpha: 0.035, crest: 0.11 },
        { base: 0.70, amp: 0.055, alpha: 0.07, crest: 0.17 },
        { base: 0.86, amp: 0.035, alpha: 0.05, crest: 0.13 },
      ]

      for (const front of fronts) {
        const yAt = (x: number) => {
          const t = x / w
          return h * (
            front.base
            + Math.sin(t * 5.4 + front.base * 9) * front.amp
            + Math.sin(t * 13.7 + 1.3) * front.amp * 0.42
            + Math.sin(t * 27.1 + 2.7) * front.amp * 0.16
          )
        }

        const gradient = g.createLinearGradient(0, h * (front.base - 0.02), 0, h)
        gradient.addColorStop(0, `rgba(152,116,64,${(front.alpha * 0.55).toFixed(3)})`)
        gradient.addColorStop(1, `rgba(138,102,52,${(front.alpha * 0.30).toFixed(3)})`)
        g.save()
        g.beginPath()
        g.moveTo(0, h)
        for (let x = 0; x <= w; x += 4) g.lineTo(x, yAt(x))
        g.lineTo(w, h)
        g.closePath()
        g.clip()
        g.fillStyle = gradient
        g.fillRect(0, 0, w, h)
        g.restore()

        for (let pass = 0; pass < 3; pass += 1) {
          g.beginPath()
          for (let x = 0; x <= w; x += 3) {
            const y = yAt(x) + (pass === 0 ? -1.8 : pass === 1 ? 0 : 3.2)
            if (x === 0) g.moveTo(x, y)
            else g.lineTo(x, y)
          }
          g.strokeStyle = pass === 0
            ? `rgba(244,224,178,${(front.crest * 0.25).toFixed(3)})`
            : pass === 1
              ? `rgba(104,68,28,${front.crest.toFixed(3)})`
              : `rgba(132,90,38,${(front.crest * 0.36).toFixed(3)})`
          g.lineWidth = pass === 0 ? 2.2 : pass === 1 ? 2.8 : 7
          g.stroke()
        }
      }

      const bloomX = mirror ? w * 0.14 : w * 0.86
      const bloom = g.createRadialGradient(bloomX, h * 0.78, 4, bloomX, h * 0.78, w * 0.42)
      bloom.addColorStop(0, 'rgba(146,108,56,0.012)')
      bloom.addColorStop(0.62, 'rgba(150,114,62,0.006)')
      bloom.addColorStop(1, 'rgba(150,114,62,0)')
      g.fillStyle = bloom
      g.beginPath()
      g.arc(bloomX, h * 0.78, w * 0.42, 0, 7)
      g.fill()

      // Preserve deterministic texture generation even though this particular
      // texture's current recipe does not consume an additional random draw.
      void random
    })
  }

  function pageOneStainTexture(mirror: boolean, strength = 1): string {
    return SF.texURL(`p1stain${mirror ? '_m' : ''}_k${Math.round(strength * 100)}`, 300, 300, (g, w, h) => {
      g.globalAlpha = strength
      const cx = w / 2
      const cy = h / 2
      const radius = w * 0.40
      const body = g.createRadialGradient(cx, cy, 0, cx, cy, radius)
      body.addColorStop(0, 'rgba(148,110,56,0.14)')
      body.addColorStop(0.72, 'rgba(140,102,50,0.20)')
      body.addColorStop(0.93, 'rgba(120,84,38,0.34)')
      body.addColorStop(1, 'rgba(120,84,38,0)')
      g.fillStyle = body
      g.beginPath()
      g.arc(cx, cy, radius, 0, 7)
      g.fill()

      const random = rnd(mirror ? 733 : 732)
      g.beginPath()
      for (let i = 0; i <= 72; i += 1) {
        const angle = (i / 72) * Math.PI * 2
        const ringRadius = radius * (
          0.90
          + Math.sin(angle * 3 + 0.7) * 0.05
          + Math.sin(angle * 7 + 2.1) * 0.03
          + random() * 0.02
        )
        const x = cx + Math.cos(angle) * ringRadius
        const y = cy + Math.sin(angle) * ringRadius * 0.92
        if (i === 0) g.moveTo(x, y)
        else g.lineTo(x, y)
      }
      g.closePath()
      g.strokeStyle = 'rgba(112,76,32,0.40)'
      g.lineWidth = 3.2
      g.stroke()
      g.strokeStyle = 'rgba(96,64,26,0.26)'
      g.lineWidth = 1.2
      g.stroke()
    })
  }

  function pageOneSmudgeTexture(mirror: boolean, strength = 1): string {
    return SF.texURL(`p1smudge${mirror ? '_m' : ''}_k${Math.round(strength * 100)}`, 360, 200, (g, w, h) => {
      g.globalAlpha = strength
      const random = rnd(911)
      if (mirror) {
        g.translate(w, 0)
        g.scale(-1, 1)
      }

      for (let i = 0; i < 26; i += 1) {
        const y = h * (0.18 + random() * 0.64)
        const x0 = w * (0.05 + random() * 0.25)
        const length = w * (0.28 + random() * 0.6)
        const alpha = 0.008 + random() * 0.018
        g.strokeStyle = `rgba(${random() < 0.6 ? '68,62,54' : '86,78,66'},${alpha.toFixed(3)})`
        g.lineWidth = 2 + random() * 9
        g.beginPath()
        g.moveTo(x0, y)
        g.bezierCurveTo(
          x0 + length * 0.35,
          y - 6 + random() * 12,
          x0 + length * 0.7,
          y - 4 + random() * 10,
          x0 + length,
          y + (random() - 0.5) * 10,
        )
        g.stroke()
      }

      const heel = g.createRadialGradient(w * 0.28, h * 0.5, 2, w * 0.28, h * 0.5, w * 0.3)
      heel.addColorStop(0, 'rgba(60,54,46,0.04)')
      heel.addColorStop(1, 'rgba(60,54,46,0)')
      g.fillStyle = heel
      g.beginPath()
      g.arc(w * 0.28, h * 0.5, w * 0.3, 0, 7)
      g.fill()
    })
  }

  function pageOneExtras(condition: PaperCondition, mirror: boolean, strength = 1): string[] {
    const blot = (x: number, y: number, w: number, h: number, rgb: string, alpha: number) =>
      SF.blot(mirror ? 100 - x : x, y, w, h, rgb, alpha * strength)

    const layers: string[] = []
    if (strength > 0.5) {
      layers.push(SF.layer(pageOneSmudgeTexture(mirror, strength), '46% 17%', `${mirror ? 22 : 78}% 70%`))
    }
    layers.push(SF.layer(pageOneStainTexture(mirror, strength), strength < 1 ? '33% 24%' : '30% 22%', `${mirror ? 62 : 38}% 34%`))
    layers.push(SF.layer(pageOneStainTexture(!mirror, strength), '17% 13%', `${mirror ? 22 : 78}% 86%`))
    layers.push(SF.layer(pageOneTideTexture(mirror, strength * (strength < 1 ? 0.8 : 1)), '100% 100%', '0 0'))
    layers.push(blot(97, 60, 13, 26, '96,78,50', 0.20))
    layers.push(blot(94, 92, 17, 14, '90,72,46', 0.17))
    layers.push(blot(90, 20, 14, 16, '98,80,52', 0.10))
    layers.push(`linear-gradient(0deg, rgba(146,112,62,${(0.06 * strength).toFixed(3)}) 0%, rgba(156,124,74,${(0.03 * strength).toFixed(3)}) 16%, rgba(156,124,74,0) 42%)`)

    void condition
    return layers
  }

  function skin(pageIndex: number, mirror: boolean, totalPages: number): string {
    const physicalSheets = Math.max(1, Math.ceil((totalPages || 12) / 2))
    const physical = sheet(Math.floor(pageIndex / 2), physicalSheets)
    const surfaceCondition = faceSurfaceCondition(pageIndex, physical)
    const base = SF.surface(surfaceCondition, { mirror })
    const strength = echoStrength(pageIndex)
    if (!strength) {
      return base
    }
    return `${pageOneExtras(surfaceCondition, mirror, strength).join(', ')}, ${base}`
  }

  return {
    age: PAPER_V2_AGE,
    pageOne: PAPER_V2_PAGE_ONE,
    sheet,
    faceSurfaceCondition,
    skin,
  }
}
