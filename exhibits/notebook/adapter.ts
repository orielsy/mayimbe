import type { MuseumExhibit } from '../../core/museum'
import type { NotebookEngine, NotebookEngineState, NotebookTarget } from './engine/contract'

export type { NotebookTarget } from './engine/contract'

export interface NotebookState {
  target?: NotebookTarget
  status: 'idle' | 'active' | 'suspended'
  engine?: NotebookEngineState
}

function isNotebookTarget(target: unknown): target is NotebookTarget {
  if (typeof target === 'string') {
    return target.length > 0
  }

  if (!target || typeof target !== 'object') {
    return false
  }

  const candidate = target as { section?: unknown; page?: unknown }
  const hasSection = candidate.section !== undefined
  const hasPage = candidate.page !== undefined

  if (!hasSection && !hasPage) {
    return true
  }

  return (!hasSection || (typeof candidate.section === 'string' && candidate.section.length > 0))
    && (!hasPage || (Number.isInteger(candidate.page) && Number(candidate.page) > 0))
}

/**
 * Museum-facing adapter for the physical notebook.
 *
 * Navigation can arrive before the heavy NotebookEngine is mounted. The
 * semantic target is retained here and replayed when the engine attaches.
 */
export class NotebookAdapter implements MuseumExhibit<NotebookTarget, NotebookState> {
  readonly id = 'notebook'

  private engine: NotebookEngine | null = null
  private state: NotebookState = {
    status: 'idle',
  }

  canPresent(target: unknown): boolean {
    return target === undefined || isNotebookTarget(target)
  }

  async preload(): Promise<void> {
    // Engine code/assets are lazy-loaded by the exhibit host. The Navigator
    // intentionally does not need to know how the renderer is packaged.
  }

  async activate(target?: NotebookTarget): Promise<void> {
    this.state = {
      ...this.state,
      status: 'active',
      ...(target === undefined ? {} : { target }),
    }

    this.engine?.resume()

    if (target !== undefined) {
      await this.applyTarget(target)
    }
  }

  async navigate(target: NotebookTarget): Promise<void> {
    this.state = { ...this.state, target }
    await this.applyTarget(target)
  }

  async suspend(): Promise<void> {
    if (this.engine) {
      this.state = { ...this.state, engine: this.engine.getState() }
      this.engine.suspend()
    }
    this.state = { ...this.state, status: 'suspended' }
  }

  getState(): NotebookState {
    return {
      ...this.state,
      ...(this.engine ? { engine: this.engine.getState() } : {}),
    }
  }

  async restore(state: NotebookState): Promise<void> {
    this.state = { ...state }

    if (!this.engine) {
      return
    }

    if (state.engine) {
      await this.engine.restore(state.engine)
    } else if (state.target !== undefined) {
      await this.applyTarget(state.target)
    }

    if (state.status === 'suspended') {
      this.engine.suspend()
    } else if (state.status === 'active') {
      this.engine.resume()
    }
  }

  async attachEngine(engine: NotebookEngine): Promise<void> {
    if (this.engine && this.engine !== engine) {
      throw new Error('A NotebookEngine is already attached to this adapter')
    }

    this.engine = engine

    if (this.state.engine) {
      await engine.restore(this.state.engine)
    } else if (this.state.target !== undefined) {
      await this.applyTarget(this.state.target)
    }

    if (this.state.status === 'suspended') {
      engine.suspend()
    } else if (this.state.status === 'active') {
      engine.resume()
    }
  }

  detachEngine(engine: NotebookEngine): void {
    if (this.engine !== engine) {
      return
    }

    this.state = { ...this.state, engine: engine.getState() }
    engine.suspend()
    this.engine = null
  }

  private async applyTarget(target: NotebookTarget): Promise<void> {
    if (!this.engine) {
      return
    }

    if (typeof target === 'string') {
      await this.engine.goToSection(target)
      return
    }

    if (target.section) {
      await this.engine.goToSection(target.section)
      return
    }

    if (target.page !== undefined) {
      await this.engine.goToPage(target.page)
      return
    }

    await this.engine.open()
  }
}
