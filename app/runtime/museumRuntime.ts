import type { Ref } from 'vue'
import { ExhibitRegistry, MuseumNavigator, type MuseumRuntimeState } from '~~/core/museum'
import { NotebookAdapter } from '~~/exhibits/notebook/adapter'
import { PlaceholderExhibit } from '~~/exhibits/placeholder'

export interface MuseumApplicationRuntime {
  navigator: MuseumNavigator
  notebook: NotebookAdapter
}

const runtimes = new WeakMap<object, MuseumApplicationRuntime>()

export function getMuseumApplicationRuntime(
  app: object,
  state: Ref<MuseumRuntimeState>,
): MuseumApplicationRuntime {
  const existing = runtimes.get(app)
  if (existing) {
    return existing
  }

  const registry = new ExhibitRegistry()
  const notebook = new NotebookAdapter()

  registry.register(notebook)
  registry.register(new PlaceholderExhibit('listening'))
  registry.register(new PlaceholderExhibit('albums'))
  registry.register(new PlaceholderExhibit('photos'))

  const navigator = new MuseumNavigator(registry, (settled) => {
    state.value = {
      ...state.value,
      previousDestination: state.value.destination,
      destination: settled,
      activeExhibit: settled.kind === 'exhibit' ? settled.exhibit : null,
    }
  })

  const runtime = { navigator, notebook }
  runtimes.set(app, runtime)
  return runtime
}
