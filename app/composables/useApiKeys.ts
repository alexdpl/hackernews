// app/composables/useApiKeys.ts
import { ref } from 'vue'

export function useApiKeys() {
  const apiKeys = ref<any[]>([])
  const loading = ref(false)

  async function fetchKeys() {
    loading.value = true
    try {
      const res: any = await $fetch('/api/user/keys')
      apiKeys.value = res.data || []
    } catch (err) {
      console.error('Errore durante il recupero delle API Keys:', err)
    } finally {
      loading.value = false
    }
  }

  async function generateKey(name: string) {
    const res: any = await $fetch('/api/user/keys', {
      method: 'POST',
      body: { name }
    })
    if (res.success) {
      apiKeys.value.push(res.keyRecord)
    }
    return res // Contiene res.rawToken per la visualizzazione unica
  }

  async function revokeKey(id: string) {
    await $fetch('/api/user/keys', {
      method: 'DELETE',
      query: { id }
    })
    apiKeys.value = apiKeys.value.filter(k => k.id !== id)
  }

  return {
    apiKeys,
    loading,
    fetchKeys,
    generateKey,
    revokeKey
  }
}