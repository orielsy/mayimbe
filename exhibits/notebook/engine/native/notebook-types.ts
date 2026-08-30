export type NativeNotebookPageKind = 'text' | 'sketch' | 'photo' | 'clipping'

export interface NativeNotebookPage {
  title: string
  body: string
  kind?: NativeNotebookPageKind
}

export interface NativeNotebookDedication {
  imageSrc?: string
  imageAlt?: string
  lines?: string[]
}

export type NativeNotebookStateName = 'CLOSED_FRONT' | 'OPEN' | 'CLOSED_BACK'
export type NativeNotebookCloseSide = 'front' | 'back'

export interface NativeNotebookSnapshot {
  state: NativeNotebookStateName
  turned: number
  page: number
}

export interface NativeNotebookMountOptions {
  pages: NativeNotebookPage[]
  sectionToPage?: Record<string, number>
  title?: string
  dedication?: NativeNotebookDedication
  signal?: AbortSignal
}

export interface NativeNotebookEngine {
  readonly root: HTMLElement
  open(): Promise<void>
  close(side?: NativeNotebookCloseSide): Promise<void>
  goToPage(page: number): Promise<void>
  goToSection(section: string): Promise<void>
  next(): Promise<void>
  previous(): Promise<void>
  suspend(): void
  resume(): void
  getState(): NativeNotebookSnapshot
  restore(state: Partial<NativeNotebookSnapshot>): Promise<void>
  dispose(): void
}
