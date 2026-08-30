export type NotebookPosition = 'closed-front' | 'open' | 'closed-back'

export type NotebookCloseSide = 'front' | 'back'

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
}

export type MountNotebookEngine = (
  host: HTMLElement,
  options?: NotebookEngineMountOptions,
) => Promise<NotebookEngine>
