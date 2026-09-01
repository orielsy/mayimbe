import type { NotebookPhysicalProfile } from './profiles'
import type { PerfProfileInput } from './perf/profile'
import type { BakedTextures } from './perf/baked'

export type { NotebookPhysicalProfile } from './profiles'
export type { PerfProfileInput } from './perf/profile'
export type { BakedTextures } from './perf/baked'

export type NotebookPosition = 'closed-front' | 'open' | 'closed-back'

export type NotebookCloseSide = 'front' | 'back'

export type NotebookFallback = 'auto' | 'css'

export type NotebookTarget =
  | string
  | {
      section?: string
      page?: number
    }

export interface NotebookEngineState {
  position: NotebookPosition
  /** Number of physical sheets that have been turned to the left. */
  turned: number
  /** 1-based authored page, used to preserve meaning across physical profiles. */
  page?: number
  /** Last meaningful semantic target, if one was used to reach this state. */
  target?: NotebookTarget
}

/**
 * Framework-independent production boundary around the physical notebook.
 *
 * Implementations own their DOM/WebGL mechanics. Consumers issue semantic
 * commands only; mid-animation progress is deliberately not exposed.
 */
export interface NotebookEngine {
  open(): Promise<void>
  close(side?: NotebookCloseSide): Promise<void>
  goToPage(page: number): Promise<void>
  goToSection(section: string): Promise<void>
  next(): Promise<void>
  previous(): Promise<void>
  suspend(): void
  resume(): void
  getState(): NotebookEngineState
  restore(state: NotebookEngineState): Promise<void>
  dispose(): void
}

export interface NotebookEngineMountOptions {
  /** Abort work if the owning exhibit is disposed while the heavy engine loads. */
  signal?: AbortSignal
  /**
   * Pagination/presentation profile selected from the exhibit's available space.
   * It does not redefine the native renderer's canonical physical geometry.
   */
  profile?: NotebookPhysicalProfile
  /**
   * Performance budget: 'auto' (default), a preset name, or overrides.
   * Orthogonal to `profile`: a pocket notebook on a phone composes as
   * `pocket` + `mobile`; the same pocket notebook on a desktop is
   * `pocket` + `desktop`. 'desktop' reproduces the frozen lab values exactly.
   */
  perf?: PerfProfileInput
  /** Pre-rendered textures produced offline by the bake tool. Missing entries
   *  fall back to live rasterisation, so a partial/absent manifest is safe. */
  baked?: BakedTextures
  /** 'css' forces the WebGL-free flip; 'auto' (default) only uses it when a
   *  WebGL context cannot be created at all. */
  fallback?: NotebookFallback
}

export type MountNotebookEngine = (
  host: HTMLElement,
  options?: NotebookEngineMountOptions,
) => Promise<NotebookEngine>
