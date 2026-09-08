import type { NotebookLayer, NotebookRecipe } from './notebookAssets'

export const NOTEBOOK_AGE = 0.88

const HUMID_CENTER = 3.6
const HUMID_SIGMA = 1.35
const HUMID_AMP = 0.95

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function hash(i: number) {
  const x = Math.sin(i * 91.7331 + 17.13) * 43758.5453
  return x - Math.floor(x)
}

export function notebookExposure(n: number, total: number) {
  const t = total > 1 ? (n - 1) / (total - 1) : 0
  return clamp01(1 - Math.pow(t, 0.82) * 0.86)
}

export function notebookHumidity(n: number) {
  const d = (n - HUMID_CENTER) / HUMID_SIGMA
  return clamp01(HUMID_AMP * Math.exp(-0.5 * d * d))
}

export function notebookTrauma(n: number) {
  return hash(n * 31 + 7) < 0.22 ? 0.55 + hash(n * 13) * 0.35 : 0
}

const FRONT_TRAUMA = [1, 0.52, 0.24]

export function notebookFrontTrauma(n: number) {
  return FRONT_TRAUMA[n - 1] ?? 0
}

function pushLayer(
  layers: NotebookLayer[],
  asset: string,
  opacity: number,
  extra?: Partial<NotebookLayer>,
) {
  if (opacity > 0.04) {
    layers.push({ asset, opacity: Math.min(1, opacity), ...extra })
  }
}

/** Resolve a sheet's static-asset material stack from the shared notebook history. */
export function notebookSheetWear(n: number, total: number): NotebookRecipe {
  const age = NOTEBOOK_AGE
  const exposure = notebookExposure(n, total)
  const humid = notebookHumidity(n)
  const trauma = notebookTrauma(n)
  const front = notebookFrontTrauma(n)
  const mirror = n % 2 === 0

  const substrate = humid > 0.55
    ? 'substrate-humidity'
    : exposure > 0.5
      ? 'substrate-carried'
      : 'substrate-protected'

  const edgeMask = exposure > 0.62
    ? 'edge-mask-a'
    : exposure > 0.3
      ? 'edge-mask-b'
      : 'edge-mask-c'

  const layers: NotebookLayer[] = []
  pushLayer(layers, 'fibre-stock', 0.68 + 0.2 * exposure, { repeat: true })
  pushLayer(layers, 'tonal-drift', age * (0.34 + 0.5 * exposure + 0.45 * humid))
  pushLayer(layers, 'humidity-bloom', humid)
  pushLayer(layers, 'water-stain', humid * 0.82, { mirror })
  pushLayer(layers, 'foxing-heavy', age * humid * 0.9)
  pushLayer(layers, 'foxing-light', age * (0.2 + 0.38 * exposure) * (1 - 0.5 * humid), { mirror })
  pushLayer(layers, 'grime-handling', age * (0.12 + 0.82 * exposure) + humid * 0.2)
  pushLayer(layers, 'smudge-abrasion', age * (0.15 + 0.5 * exposure))
  pushLayer(layers, 'edge-oxidation', 0.35 + 0.62 * exposure)
  pushLayer(layers, 'crease', Math.max(trauma, exposure > 0.72 ? 0.55 * exposure : 0), { mirror })

  if (front) {
    pushLayer(layers, 'trauma-tide-lines', 0.9 * front, { mirror })
    pushLayer(layers, 'trauma-ring-stain', front, { mirror: n % 3 === 0 })
    pushLayer(layers, 'trauma-thumb-grime', 0.95 * front)
    pushLayer(layers, 'trauma-hand-smear', 0.85 * front, { mirror })
    pushLayer(layers, 'trauma-corner-fold', 0.8 * front)
  }

  return {
    id: `sheet-${n}`,
    label: front === 1
      ? 'Front of block — trauma'
      : humid > 0.5
        ? 'Humidity affected'
        : exposure > 0.5
          ? 'Carried / handled'
          : 'Protected interior',
    note: `exposure ${exposure.toFixed(2)} · humidity ${humid.toFixed(2)}${trauma ? ' · trauma' : ''}`,
    substrate,
    edgeMask,
    layers,
  }
}
