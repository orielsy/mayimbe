export interface MuseumExhibit<TTarget = unknown, TState = unknown> {
  id: string
  canPresent(target: unknown): boolean
  preload(target?: TTarget): Promise<void>
  activate(target?: TTarget): Promise<void>
  navigate(target: TTarget): Promise<void>
  suspend(): Promise<void>
  getState(): TState
  restore(state: TState): Promise<void>
  dispose?(): Promise<void>
}
