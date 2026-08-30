import type { MuseumExhibit } from '../../core/museum'

export interface NotebookTarget {
  section?: string
  page?: number
}

export interface NotebookState {
  target?: NotebookTarget | string
  status: 'idle' | 'active' | 'suspended'
}

export class NotebookAdapter implements MuseumExhibit<NotebookTarget | string, NotebookState> {
  readonly id = 'notebook'

  private state: NotebookState = {
    status: 'idle',
  }

  canPresent(target: unknown): boolean {
    return target === undefined || typeof target === 'string' || typeof target === 'object'
  }

  async preload(): Promise<void> {
    // The real Notebook Engine will preload its own assets here later.
  }

  async activate(target?: NotebookTarget | string): Promise<void> {
    this.state = { status: 'active', target }
  }

  async navigate(target: NotebookTarget | string): Promise<void> {
    this.state = { ...this.state, target }
  }

  async suspend(): Promise<void> {
    this.state = { ...this.state, status: 'suspended' }
  }

  getState(): NotebookState {
    return { ...this.state }
  }

  async restore(state: NotebookState): Promise<void> {
    this.state = { ...state }
  }
}
