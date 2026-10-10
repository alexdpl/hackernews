// composables/useBlog.ts
import { ref } from 'vue'

export function useBlog() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Incremeto Visualizzazioni (Chiama l'API per aggiornare il DB)
  const incrementView = async (postId: string | number) => {
    try {
      // Nota: Dovremo creare questo endpoint API (es: /api/blog/posts/[id]/view)
      await $fetch(`/api/blog/posts/${postId}/view`, { method: 'POST' })
    } catch (err: any) {
      console.warn(`Impossibile incrementare le view per l'articolo ${postId}:`, err.message)
    }
  }

  // Aggiunta Like / Karma (Chiama l'API per aggiornare il DB)
  const likePost = async (postId: string | number) => {
    try {
      // Nota: Dovremo creare questo endpoint API (es: /api/blog/posts/[id]/like)
      await $fetch(`/api/blog/posts/${postId}/like`, { method: 'POST' })
    } catch (err: any) {
      console.error(`Errore durante l'assegnazione del like all'articolo ${postId}:`, err.message)
    }
  }

  // (OPZIONALE) Sottomissione al DKP Vault per Analisi SAST
  const submitToVault = async (articlePayload: any) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/blog/submit', {
        method: 'POST',
        body: articlePayload
      })
      return response
    } catch (err: any) {
      error.value = err.message || 'Errore durante l\'analisi del Vault.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    incrementView,
    likePost,
    submitToVault
  }
}