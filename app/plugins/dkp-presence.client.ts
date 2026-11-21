export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const router = useRouter()

  const sendPing = (path?: string) => {
    try {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      const targetPath = path || router.currentRoute.value.fullPath || '/'
      const payload = JSON.stringify({ path: targetPath })

      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        window.fetch('/api/telemetry/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
          credentials: 'same-origin'
        }).catch(() => {})
      }
    } catch {
      // Ignora abort di navigazione / HMR
    }
  }

  setTimeout(() => sendPing(), 400)

  router.afterEach((to) => {
    sendPing(to.fullPath)
  })

  const intervalId = window.setInterval(() => {
    sendPing()
  }, 30000)

  window.addEventListener('beforeunload', () => {
    window.clearInterval(intervalId)
  })
})