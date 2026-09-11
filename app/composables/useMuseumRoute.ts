import { computed } from 'vue'

export function useMuseumRoute() {
  const route = useRoute()
  const { pathFor } = useSiteLocale()

  const localizedParts = computed(() => {
    if (!route.path.startsWith('/en')) return []
    return route.path.split('/').filter(Boolean).slice(1)
  })

  const isNotebook = computed(() => {
    if (route.path === '/notebook' || route.path.startsWith('/notebook/')) return true
    return localizedParts.value[0] === 'notebook'
  })

  const notebookTarget = computed(() => {
    if (!isNotebook.value) return undefined

    const parts = route.path.startsWith('/notebook')
      ? route.path.split('/').filter(Boolean).slice(1)
      : localizedParts.value.slice(1)

    return parts.length ? parts.join('/') : undefined
  })

  async function goToDesk() {
    return navigateTo(pathFor('/'))
  }

  return {
    isNotebook,
    notebookTarget,
    goToDesk,
  }
}
