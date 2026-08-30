import type { Ref } from 'vue'
import { ExhibitRegistry, MuseumNavigator, destinationToPath, type MuseumDestination, type MuseumRuntimeState } from '~~/core/museum'
import { NotebookAdapter } from '~~/exhibits/notebook/adapter'
import { PlaceholderExhibit } from '~~/exhibits/placeholder'

const navigators = new WeakMap<object, MuseumNavigator>()

function createRegistry() {
  const registry = new ExhibitRegistry()
  registry.register(new NotebookAdapter())
  registry.register(new PlaceholderExhibit('listening'))
  registry.register(new PlaceholderExhibit('albums'))
  registry.register(new PlaceholderExhibit('photos'))
  return registry
}

function getNavigator(app: object, state: Ref<MuseumRuntimeState>): MuseumNavigator {
  const existing = navigators.get(app)
  if (existing) {
    return existing
  }

  const navigator = new MuseumNavigator(createRegistry(), (settled) => {
    state.value = {
      ...state.value,
      previousDestination: state.value.destination,
      destination: settled,
      activeExhibit: settled.kind === 'exhibit' ? settled.exhibit : null,
    }
  })

  navigators.set(app, navigator)
  return navigator
}

export function useMuseumNavigator() {
  const app = useNuxtApp()
  const { state } = useMuseum()
  const navigator = getNavigator(app, state)

  async function syncDestination(destination: MuseumDestination) {
    await navigator.navigate(destination)
  }

  async function go(destination: MuseumDestination) {
    return navigateTo(destinationToPath(destination))
  }

  return {
    go,
    syncDestination,
  }
}
