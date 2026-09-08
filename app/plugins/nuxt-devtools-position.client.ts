// Nuxt DevTools owns the draggable toolbar position in its reactive frame state.
// Set its development-time starting position without styling shadow-DOM internals.
type DevToolsFrameState = {
  position: 'top' | 'right' | 'bottom' | 'left'
  left: number
  top: number
}

function placeNuxtDevToolsBottomLeft() {
  const host = (window as any).__NUXT_DEVTOOLS_HOST__
  const frameState = host?.app?.frameState?.value as DevToolsFrameState | undefined

  if (!frameState) return false

  // DevTools applies its own safe-area/margin clamping around this anchor.
  frameState.position = 'bottom'
  frameState.left = 0
  frameState.top = 100
  return true
}

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.dev) return

  if (placeNuxtDevToolsBottomLeft()) return

  // The DevTools view client is loaded asynchronously. Its container is added
  // after frame state is exposed, so body mutation is a stable time to retry.
  const observer = new MutationObserver(() => {
    if (placeNuxtDevToolsBottomLeft()) observer.disconnect()
  })

  if (document.body) observer.observe(document.body, { childList: true })

  nuxtApp.hook('app:mounted', () => {
    if (placeNuxtDevToolsBottomLeft()) observer.disconnect()
  })
})
