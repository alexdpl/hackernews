// app/composables/useBlog.ts
import { useState } from '#imports'

export interface BlogPost {
  id: string
  title: string
  category: string
  excerpt: string
  content: string
  author: string
  date: string
}

export interface BlogCategory {
  id: string
  name: string
}

export function useBlog() {
  const categories = useState<BlogCategory[]>('blog_categories', () => [
    { id: 'tech', name: 'Tech & Kernel' },
    { id: 'ai', name: 'AI & Neural' },
    { id: 'releases', name: 'Release Ufficiali' },
    { id: 'community', name: 'Community & Karma' }
  ])

  const posts = useState<BlogPost[]>('blog_posts', () => [
    {
      id: '1',
      title: 'Lancio ufficiale di DevKernelPulse: L\'ecosistema definitivo è online',
      category: 'Release Ufficiali',
      excerpt: 'Oggi segna una svolta epocale nello sviluppo software: rilasciamo ufficialmente il kernel di DKP con Proof of Code e AI Scanner.',
      content: 'DevKernelPulse nasce per ridefinire gli standard della collaborazione e dell\'analisi tecnologica. Grazie a strumenti nativi come AI Scanner, DKP Terminal e Neural Playground, gli sviluppatori di tutto il mondo possono finalmente contare su un ecosistema blindato, veloce e senza compromessi.',
      author: 'Alessandro De Paola',
      date: '2026-06-06'
    }
  ])

  function addCategory(name: string) {
    const id = name.toLowerCase().replace(/\s+/g, '-')
    if (!categories.value.some(c => c.id === id)) {
      categories.value.push({ id, name })
    }
  }

  function addPost(post: Omit<BlogPost, 'id' | 'date'>) {
    const newPost: BlogPost = {
      ...post,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0]
    }
    posts.value.unshift(newPost)
  }

  return {
    categories,
    posts,
    addCategory,
    addPost
  }
}