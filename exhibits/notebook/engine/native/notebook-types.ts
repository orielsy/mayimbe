import type { PerfProfileInput } from '../../perf/profile'
import type { BakedTextures } from '../../perf/baked'

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

export type NativeNotebookFallback = 'auto' | 'css'

export interface NativeNotebookMountOptions {
  pages: NativeNotebookPage[]
  sectionToPage?: Record<string, number>
  title?: string
  dedication?: NativeNotebookDedication
  signal?: AbortSignal
  /** performance budget: 'auto' (default), a preset name, or overrides.
   *  'desktop' reproduces the frozen lab values exactly. Orthogonal to the
   *  physical profile, which owns pagination/stage framing. */
  perf?: PerfProfileInput
  /** skip on-device foreignObject rasterisation and use baked images */
  baked?: BakedTextures
  /** 'css' forces the WebGL-free flip; by default it is only used when a
   *  WebGL context cannot be created at all */
  fallback?: NativeNotebookFallback
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
  /** offline use only: rasterise every face and return a baked manifest */
  bake?(opts?: { type?: string; quality?: number; dpr?: number }): Promise<BakedTextures>
  dispose(): void
}
