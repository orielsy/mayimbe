import { ExhibitRegistry, MuseumNavigator, destinationToPath, type MuseumDestination } from '~~/core/museum'
import { NotebookAdapter } from '~~/exhibits/notebook/adapter'
import { PlaceholderExhibit } from '~~/exhibits/placeholder'

function createRegistry() {
  const registry = new ExhibitRegistry()
  registry.register(new NotebookAdapter())
  registry.register(new PlaceholderExhibit('listening'))
  registry.register(new PlaceholderExhibit('albums'))
  registry.register(new PlaceholderExhibit('photos'))
  return registry
}

export function useMuseumNavigator() {
  const { state } = useMuseum()

  async function syncDestination(destination: MuseumDestination) {
    const navigator = new MuseumNavigator(createRegistry(), (settled) => {
      state.value = {
        ...state.value,
        previousDestination: state.value.destination,
        destination: settled,
        activeExhibit: settled.kind === 'exhibit' ? settled.exhibit : null,
      }
    })

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
