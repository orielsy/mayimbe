import { onBeforeUnmount, onMounted, ref } from 'vue'

export function usePrefersReducedMotion() {
  const reduced = ref(false)
  let media: MediaQueryList | null = null

  const sync = () => {
    if (media) reduced.value = media.matches
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    sync()
    media.addEventListener('change', sync)
  })

  onBeforeUnmount(() => {
    media?.removeEventListener('change', sync)
  })

  return reduced
}
