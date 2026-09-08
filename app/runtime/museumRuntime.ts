import type { Ref } from 'vue'
import {
  ExhibitRegistry,
  MuseumNavigator,
  PlaceholderExhibit,
  type MuseumRuntimeState,
} from '~~/core/museum'

export interface MuseumApplicationRuntime {
  navigator: MuseumNavigator
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

  // The notebook destination remains live while the winning Page Turner Lab
  // implementation is ported into app/components/notebook. The museum runtime
  // intentionally does not depend on a renderer during that integration.
  registry.register(new PlaceholderExhibit('notebook'))

  const navigator = new MuseumNavigator(registry, (settled) => {
    state.value = {
      ...state.value,
      previousDestination: state.value.destination,
      destination: settled,
      activeExhibit: settled.kind === 'exhibit' ? settled.exhibit : null,
    }
  })

  const runtime = { navigator }
  runtimes.set(app, runtime)
  return runtime
}
