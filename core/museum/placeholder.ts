import type { MuseumExhibit } from './exhibit'

/**
 * Lightweight lifecycle participant used while an exhibit renderer is not yet
 * integrated. It keeps semantic museum navigation working without coupling the
 * museum core to a placeholder UI or renderer implementation.
 */
export class PlaceholderExhibit implements MuseumExhibit<unknown, { target?: unknown }> {
  private target?: unknown

  constructor(public readonly id: string) {}

  canPresent(): boolean {
    return true
  }

  async preload(): Promise<void> {}

  async activate(target?: unknown): Promise<void> {
    this.target = target
  }

  async navigate(target: unknown): Promise<void> {
    this.target = target
  }

  async suspend(): Promise<void> {}

  getState() {
    return { target: this.target }
  }

  async restore(state: { target?: unknown }): Promise<void> {
    this.target = state.target
  }
}
