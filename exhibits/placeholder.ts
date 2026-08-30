import type { MuseumExhibit } from '../core/museum'

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
