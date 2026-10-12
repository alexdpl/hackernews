// composables/useBlog.ts
import { ref } from 'vue'

export function useBlog() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Stato globale per i post caricati
  const posts = ref<any[]>([])
  const currentPost = ref<any>(null)

  // ==========================================
  // 1. FETCH ARTICOLI (Pubblico & Admin)
  // ==========================================
  
  // Scarica solo gli articoli PUBBLICATI per il Blog Pubblico
  const fetchPosts = async (params?: { category?: string, limit?: number }) => {
    isLoading.value = true
    error.value = null
    try {
      const query = new URLSearchParams()
      if (params?.category) query.append('category', params.category)
      if (params?.limit) query.append('limit', params.limit.toString())
      query.append('status', 'published') // Solo i pubblicati!

      const res: any = await $fetch(`/api/blog/posts?${query.toString()}`)
      posts.value = res.data || res || []
      return posts.value
    } catch (err: any) {
      error.value = err.message || 'Errore nel caricamento degli articoli'
      console.error('[useBlog] fetchPosts error:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Scarica TUTTI gli articoli (Bozze incluse) per la gestione Admin
  const fetchAdminPosts = async () => {
    isLoading.value = true
    try {
      const res: any = await $fetch('/api/admin/blog/posts')
      return res.data || res || []
    } catch (err: any) {
      console.error('[useBlog] fetchAdminPosts error:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Scarica il SINGOLO articolo per la pagina Dettaglio (/blog/[id])
  const fetchPostById = async (idOrSlug: string | number) => {
    isLoading.value = true
    error.value = null
    try {
      const res: any = await $fetch(`/api/blog/posts/${idOrSlug}`)
      currentPost.value = res.data || res
      return currentPost.value
    } catch (err: any) {
      error.value = 'Articolo non trovato o rimosso.'
      console.error('[useBlog] fetchPostById error:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // ==========================================
  // 2. INTERAZIONI E METRICHE
  // ==========================================

  const incrementView = async (postId: string | number) => {
    try {
      await $fetch(`/api/blog/posts/${postId}/view`, { method: 'POST' })
    } catch (err: any) {
      console.warn(`Impossibile incrementare le view per l'articolo ${postId}:`, err.message)
    }
  }

  const likePost = async (postId: string | number) => {
    try {
      await $fetch(`/api/blog/posts/${postId}/like`, { method: 'POST' })
      // Aggiornamento ottimistico locale se il post è aperto
      if (currentPost.value && currentPost.value.id === postId) {
        currentPost.value.likes = (currentPost.value.likes || 0) + 1
      }
    } catch (err: any) {
      console.error(`Errore durante l'assegnazione del like all'articolo ${postId}:`, err.message)
    }
  }

  const submitToVault = async (articlePayload: any) => {
    isLoading.value = true
    error.value = null
    try {
      return await $fetch('/api/blog/submit', {
        method: 'POST',
        body: articlePayload
      })
    } catch (err: any) {
      error.value = err.message || 'Errore durante l\'analisi del Vault.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ==========================================
  // 3. UTILITY CONDIVISIONE E GAMIFICATION
  // ==========================================

  // Apre i popup nativi per la condivisione dell'articolo
  const sharePost = (network: 'twitter' | 'linkedin' | 'reddit', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)
    let shareUrl = ''

    if (network === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    if (network === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    if (network === 'reddit') shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=no,resizable=no')
    }
  }

  // Helper RPG: Calcola Grado, Badge e Colore per il box Autore partendo dagli XP dell'autore salvati nel DB
  const getAuthorRank = (authorXp: number = 0) => {
    const lvl = Math.floor(Math.sqrt(Math.max(0, authorXp) / 100)) + 1
    
    if (lvl >= 30) return { title: 'DKP Sentinel Master', badge: '👑', color: '#ffd700', level: lvl }
    if (lvl >= 20) return { title: 'Nexus Vanguard', badge: '🌌', color: '#f43f5e', level: lvl }
    if (lvl >= 10) return { title: 'Cyber Architect', badge: '🔮', color: '#c084fc', level: lvl }
    if (lvl >= 5)  return { title: 'Code Craftsman', badge: '⚡', color: '#38bdf8', level: lvl }
    
    return { title: 'Kernel Initiate', badge: '🟢', color: '#00dc82', level: lvl }
  }

  return {
    isLoading,
    error,
    posts,
    currentPost,
    fetchPosts,
    fetchAdminPosts,
    fetchPostById,
    incrementView,
    likePost,
    submitToVault,
    sharePost,
    getAuthorRank
  }
}