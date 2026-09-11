import manifest from './notebook-assets.manifest.json'

export type NotebookAsset = (typeof manifest)['assets'][number]
export type NotebookLayer = {
  asset: string
  opacity: number
  mirror?: boolean
  repeat?: boolean
}

export type NotebookRecipe = {
  id: string
  label: string
  note: string
  substrate: string
  edgeMask: string
  layers: NotebookLayer[]
}

export const NOTEBOOK_ASSETS = manifest.assets as NotebookAsset[]

export function notebookAsset(id: string) {
  const found = NOTEBOOK_ASSETS.find(item => item.id === id)
  if (!found) throw new Error(`Unknown notebook asset: ${id}`)
  return found
}
