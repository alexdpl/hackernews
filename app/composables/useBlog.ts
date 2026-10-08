// app/composables/useBlog.ts
import { useState } from '#imports'

export interface BlogSubcategory {
  id: string | number
  name: string
  slug?: string
}

export interface BlogCategory {
  id: string | number
  name: string
  slug?: string
  icon?: string
  color?: string
  description?: string
  subcategories?: BlogSubcategory[]
}

export interface BlogPost {
  id: string | number
  title: string
  slug: string
  category: string
  subCategory?: string
  excerpt: string
  content?: string
  author?: string
  date: string
  readTime?: string
  views: number
  likes: number
  tags?: string[]
  status?: 'published' | 'draft'
}

export function useBlog() {
  const categories = useState<BlogCategory[]>('blog_categories', () => [
    {
      id: 'cat-1',
      name: 'AI, LLM & Machine Learning',
      slug: 'ai-llm-machine-learning',
      icon: '🤖',
      color: '#00dc82',
      subcategories: [
        { id: 'sub-101', name: 'LLM Architecture', slug: 'llm-architecture' },
        { id: 'sub-102', name: 'Local AI & Ollama', slug: 'local-ai-ollama' },
        { id: 'sub-103', name: 'AI Agents', slug: 'ai-agents' },
        { id: 'sub-104', name: 'Prompt Engineering', slug: 'prompt-engineering' }
      ]
    },
    {
      id: 'cat-2',
      name: 'Cloud Native & DevOps',
      slug: 'cloud-native-devops',
      icon: '☁️️',
      color: '#38bdf8',
      subcategories: [
        { id: 'sub-201', name: 'Kubernetes', slug: 'kubernetes' },
        { id: 'sub-202', name: 'GCP Architecture', slug: 'gcp-architecture' },
        { id: 'sub-203', name: 'Docker & Containers', slug: 'docker-containers' },
        { id: 'sub-204', name: 'CI/CD Pipelines', slug: 'cicd-pipelines' }
      ]
    },
    {
      id: 'cat-3',
      name: 'Cybersecurity & Vault',
      slug: 'cybersecurity-vault',
      icon: '🛡️',
      color: '#8b5cf6',
      subcategories: [
        { id: 'sub-301', name: 'Penetration Testing', slug: 'penetration-testing' },
        { id: 'sub-302', name: 'Vault & Hashing', slug: 'vault-hashing' },
        { id: 'sub-303', name: 'Zero Trust', slug: 'zero-trust' }
      ]
    }
  ])

  const posts = useState<BlogPost[]>('blog_posts', () => [ ]
  )

  const isLoading = useState<boolean>('blog_loading', () => false)

  async function loadFromApi() {
    isLoading.value = true
    try {
      const [catRes, postRes]: [any, any] = await Promise.all([
        $fetch('/api/blog/categories').catch(() => null),$fetch('/api/blog/posts').catch(() => null)
      ])

      if (catRes && (catRes.data || Array.isArray(catRes))) {
        categories.value = catRes.data || catRes
      }
      if (postRes && (postRes.data || Array.isArray(postRes))) {
        posts.value = postRes.data || postRes
      }
    } finally {
      isLoading.value = false
    }
  }

  function addCategory(name: string, icon = '🏷️', color = '#00dc82', subcategories: string[] = []) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    const existing = categories.value.find(c => c.slug === slug || c.name.toLowerCase() === name.toLowerCase())
    
    if (!existing) {
      const newCat: BlogCategory = {
        id: `cat_${Date.now()}`,
        name,
        slug,
        icon,
        color,
        subcategories: subcategories.map((sub, i) => ({
          id: `sub_${Date.now()}_${i}`,
          name: sub,
          slug: sub.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
        }))
      }
      categories.value.push(newCat)
    }
  }

  function addPost(post: Omit<BlogPost, 'id' | 'date' | 'likes' | 'views'>) {
    const slug = post.slug || post.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    const newPost: BlogPost = {
      ...post,
      id: Date.now().toString(),
      slug,
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      views: 1,
      status: post.status || 'draft'
    }
    posts.value.unshift(newPost)
  }

  function updatePost(id: string | number, updatedData: Partial<BlogPost>) {
    const index = posts.value.findIndex(p => String(p.id) === String(id))
    if (index !== -1) {
      posts.value[index] = { ...posts.value[index], ...updatedData }
    }
  }

  function deletePost(id: string | number) {
    posts.value = posts.value.filter(p => String(p.id) !== String(id))
  }

  function likePost(id: string | number) {
    const post = posts.value.find(p => String(p.id) === String(id))
    if (post) {
      post.likes++
    }
  }

  function incrementView(id: string | number) {
    const post = posts.value.find(p => String(p.id) === String(id))
    if (post) {
      post.views++
    }
  }

  return {
    categories,
    posts,
    isLoading,
    loadFromApi,
    addCategory,
    addPost,
    updatePost,
    deletePost,
    likePost,
    incrementView
  }
}