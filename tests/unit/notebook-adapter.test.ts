import { describe, expect, it } from 'vitest'
import { NotebookAdapter } from '../../exhibits/notebook/adapter'
import type { NotebookEngine, NotebookEngineState } from '../../exhibits/notebook/engine/contract'

class FakeNotebookEngine implements NotebookEngine {
  calls: string[] = []
  state: NotebookEngineState = { position: 'closed-front', turned: 0 }

  async open() { this.calls.push('open') }
  async close(side = 'front') { this.calls.push(`close:${side}`) }
  async goToPage(page: number) { this.calls.push(`page:${page}`) }
  async goToSection(section: string) { this.calls.push(`section:${section}`) }
  async next() { this.calls.push('next') }
  async previous() { this.calls.push('previous') }
  suspend() { this.calls.push('suspend') }
  resume() { this.calls.push('resume') }
  getState() { return { ...this.state } }
  async restore(state: NotebookEngineState) {
    this.state = { ...state }
    this.calls.push(`restore:${state.position}:${state.turned}`)
  }
  dispose() { this.calls.push('dispose') }
}

describe('NotebookAdapter', () => {
  it('queues a semantic destination until the native engine attaches', async () => {
    const adapter = new NotebookAdapter()
    const engine = new FakeNotebookEngine()

    await adapter.activate('early-years')
    expect(engine.calls).toEqual([])

    await adapter.attachEngine(engine)
    expect(engine.calls).toEqual(['section:early-years', 'resume'])
  })

  it('translates semantic targets without exposing physical turn mechanics', async () => {
    const adapter = new NotebookAdapter()
    const engine = new FakeNotebookEngine()
    await adapter.attachEngine(engine)

    await adapter.activate()
    await adapter.navigate({ page: 7 })
    await adapter.navigate({ section: 'early-years' })

    expect(engine.calls).toEqual(['resume', 'page:7', 'section:early-years'])
  })

  it('captures physical rest state when the exhibit is detached', async () => {
    const adapter = new NotebookAdapter()
    const engine = new FakeNotebookEngine()
    engine.state = { position: 'open', turned: 3, target: 'early-years' }

    await adapter.attachEngine(engine)
    adapter.detachEngine(engine)

    expect(adapter.getState().engine).toEqual({
      position: 'open',
      turned: 3,
      target: 'early-years',
    })
    expect(engine.calls).toEqual(['suspend'])
  })
})
