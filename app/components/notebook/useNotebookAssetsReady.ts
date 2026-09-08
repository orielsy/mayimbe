import { onBeforeUnmount, onMounted, ref } from 'vue'
import { NOTEBOOK_ASSETS } from './notebookAssets'
import { NOTEBOOK_PAGES } from './notebookPages'
import { notebookSheetWear } from './notebookWear'

const decoded = new Set<string>()

function warm(path: string): Promise<void> {
  if (decoded.has(path)) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const image = new Image()
    const done = () => {
      decoded.add(path)
      resolve()
    }

    image.onload = () => {
      if (image.decode) void image.decode().then(done, done)
      else done()
    }
    image.onerror = done
    image.src = path
  })
}

export function notebookCriticalPaths(total = NOTEBOOK_PAGES.length) {
  const first = notebookSheetWear(1, total)
  const ids = [
    'cover-brick-front',
    'cover-brick-inside',
    first.substrate,
    first.edgeMask,
    ...first.layers.map(layer => layer.asset),
  ]

  return [...new Set(ids)]
    .map(id => NOTEBOOK_ASSETS.find(item => item.id === id)?.path)
    .filter((path): path is string => Boolean(path))
}

function gatePaths() {
  return ['cover-brick-front', 'cover-brick-inside']
    .map(id => NOTEBOOK_ASSETS.find(item => item.id === id)?.path)
    .filter((path): path is string => Boolean(path))
}

function warmAll() {
  const gate = gatePaths()
  const gatePromise = Promise.all(gate.map(warm))
  notebookCriticalPaths().forEach(path => void warm(path))
  NOTEBOOK_ASSETS.forEach(item => void warm(item.path))
  return gatePromise
}

const initialGate = typeof window === 'undefined' ? null : warmAll()

export function useNotebookAssetsReady() {
  const ready = ref(false)
  let alive = false
  let bailout: ReturnType<typeof setTimeout> | null = null

  onMounted(() => {
    alive = true
    void (initialGate ?? warmAll()).then(() => {
      if (alive) ready.value = true
    })

    bailout = window.setTimeout(() => {
      if (alive) ready.value = true
    }, 2000)
  })

  onBeforeUnmount(() => {
    alive = false
    if (bailout !== null) window.clearTimeout(bailout)
  })

  return ready
}
