export default defineNuxtPlugin(() => {
  const router = useRouter()

  const sendPing = (path?: string) => {
    $fetch('/api/telemetry/ping', {
      method: 'POST',
      body: { path: path || router.currentRoute.value.fullPath || '/' }
    }).catch(() => null)
  }

  if (import.meta.client) {
    sendPing()
    router.afterEach((to) => {
      sendPing(to.fullPath)
    })
    setInterval(() => {
      sendPing()
    }, 30000)
  }
})