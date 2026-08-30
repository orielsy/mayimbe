import { getMuseumApplicationRuntime } from '~/runtime/museumRuntime'

export function useNotebookRuntime() {
  const app = useNuxtApp()
  const { state } = useMuseum()
  return getMuseumApplicationRuntime(app, state).notebook
}
