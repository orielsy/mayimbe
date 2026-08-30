import { destinationToPath, type MuseumDestination } from '~~/core/museum'
import { getMuseumApplicationRuntime } from '~/runtime/museumRuntime'

export function useMuseumNavigator() {
  const app = useNuxtApp()
  const { state } = useMuseum()
  const { navigator } = getMuseumApplicationRuntime(app, state)

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
