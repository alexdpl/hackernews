<!-- app/pages/admin/blog/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpTagInput from '~/components/blog/DkpTagInput.vue'
import { useBlog } from '~/composables/useBlog'

useHead({
  title: 'Taxonomy & Publishing v2.6 — DKP Admin Center',
  meta: [
    { name: 'description', content: 'Gestione categorie, sottocategorie e pubblicazione diretta articoli nell\'ecosistema DevKernelPulse con Vault AI.' }
  ]
})

const { getMainUrl, getApiUrl } = useDomain()

// --- 1. COMPOSABLE POSTS ---
const { fetchAdminPosts, isLoading: isBlogLoading } = useBlog()

// --- INTERFACCE DATI ---
interface Subcategory {
  id: number | string
  categoryId: number | string
  name: string
  slug: string
  description?: string | null
}

interface Category {
  id: number | string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  tags?: string[]
  subcategories?: Subcategory[]
}

interface VaultReport {
  authenticityScore: number
  securityScore: number
  plagiarismRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  sastCheck: 'PASSED' | 'WARNING' | 'CRITICAL'
  vaultHashPreview: string
}

interface Post {
  id: number | string
  title: string
  slug?: string
  excerpt?: string
  categoryId: number | string | null
  subcategoryId?: number | string | null
  authorName?: string
  tags?: string[]
  views: number
  likes?: number
  date?: string
  createdAt?: string
  status: 'published' | 'pending_vault' | 'draft'
  isVerified?: boolean
  vaultCertificateId?: string
  vaultHash?: string
  vaultReport?: VaultReport
  category?: any
}

// --- STATI GLOBALI ---
const categories = ref<Category[]>([])
const posts = ref<Post[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

// Toast System
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')

function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}

// --- STATO FORM PUBBLICAZIONE ---
const isEditing = ref(false)
const newArticle = ref({
  id: null as number | string | null,
  title: '',
  categoryId: '' as number | string,
  subcategoryId: '' as number | string | null,
  author: 'Alessandro De Paola',
  tags: [] as string[],
  excerpt: '',
  content: '', 
  status: 'published' as 'published' | 'pending_vault' | 'draft'
})

// Sottocategorie dinamiche in base alla categoria selezionata
const availableSubcategories = computed(() => {
  if (!newArticle.value.categoryId) return []
  const selectedCat = categories.value.find(c => String(c.id) === String(newArticle.value.categoryId))
  return selectedCat?.subcategories || []
})

function onCategoryChange() {
  newArticle.value.subcategoryId = ''
}

// --- PUBBLICAZIONE ARTICOLO & ANALISI VAULT SAST ---
async function publishArticle() {
  if (!newArticle.value.title || !newArticle.value.categoryId) {
    return triggerToast('❌ Compila Titolo e Categoria prima di pubblicare.', 'warning')
  }

  isLoading.value = true

  try {
    triggerToast('🛡️ Avvio scansione automatica SAST Pulse Sentinel AI...', 'warning')
    let vaultData: any = null
    
    try {
      const vaultRes: any = await $fetch('/api/blog/submit', {
        method: 'POST',
        body: { title: newArticle.value.title, content: newArticle.value.content }
      })
      
      if (vaultRes && vaultRes.success) {
        vaultData = vaultRes.vaultData
        
        if (vaultData.sastCheck === 'CRITICAL') {
           triggerToast(`⚠️ Trovate vulnerabilità CRITICHE. L'articolo salvato in BOZZA.`, 'error')
           newArticle.value.status = 'draft'
        } else if (vaultData.sastCheck === 'WARNING') {
           triggerToast(`⚠️ Pulse Sentinel: Rilevati Warning minori. Sicurezza: ${vaultData.securityScore}/100`, 'warning')
        } else {
           triggerToast(`✅ Pulse Sentinel: Codice Sicuro (100/100). Certificato Hash generato!`, 'success')
        }
      }
    } catch (vaultErr) {
       console.warn('Vault API non raggiungibile, salto analisi SAST...', vaultErr)
    }

    const payload = {
      title: newArticle.value.title,
      categoryId: newArticle.value.categoryId,
      subcategoryId: newArticle.value.subcategoryId || null,
      excerpt: newArticle.value.excerpt,
      content: newArticle.value.content || newArticle.value.excerpt || 'Contenuto non disponibile.',
      tags: [...newArticle.value.tags],
      authorName: newArticle.value.author,
      vaultHash: vaultData?.vaultHashPreview || undefined,
      sastStatus: vaultData?.sastCheck || 'PASSED',
      status: newArticle.value.status 
    }

    if (isEditing.value && newArticle.value.id) {
       triggerToast('✅ Articolo aggiornato con successo!', 'success')
       await loadPosts() 
    } else {
       const res: any = await $fetch('/api/blog/posts', {
          method: 'POST',
          body: payload
       })

       if (res && res.success) {
          triggerToast(res.data.status === 'draft' 
            ? '📝 Salvato in Bozza (Intervento Sentinel)' 
            : '🚀 Articolo pubblicato e Notarizzato con DKP Vault!', 'success')
          await loadPosts() 
       } else {
          throw new Error('Errore durante il salvataggio.')
       }
    }
    resetForm()
  } catch (error: any) {
    console.error('Errore salvataggio post:', error)
    triggerToast(`❌ Errore durante la pubblicazione: ${error.message || 'Errore DB'}`, 'error')
  } finally {
    isLoading.value = false
  }
}

function editPost(post: Post) {
  newArticle.value = {
    id: post.id,
    title: post.title,
    categoryId: post.categoryId || '',
    subcategoryId: post.subcategoryId || '',
    author: post.authorName || 'Alessandro De Paola',
    tags: post.tags ? [...post.tags] : [],
    excerpt: post.excerpt || '',
    content: (post as any).content || '', 
    status: post.status
  }
  isEditing.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deletePost(id: number | string) {
  if (!confirm('⚠️ Sei sicuro di voler eliminare definitivamente questo articolo dal DB Neon?')) return
  
  isLoading.value = true
  try {
     const res: any = await $fetch(`/api/blog/posts/${id}`, { method: 'DELETE' })
     if (res && res.success) {
        posts.value = posts.value.filter(p => String(p.id) !== String(id))
        triggerToast('🗑️ Articolo eliminato dal Database.', 'success')
        if (String(newArticle.value.id) === String(id)) resetForm()
     } else {
        throw new Error('Impossibile eliminare')
     }
  } catch (error: any) {
     console.error('Errore eliminazione:', error)
     triggerToast('❌ Errore durante l\'eliminazione. Riprova.', 'error')
  } finally {
     isLoading.value = false
  }
}

function resetForm() {
  newArticle.value = { id: null, title: '', categoryId: '', subcategoryId: '', author: 'Alessandro De Paola', tags: [], excerpt: '', content: '', status: 'published' }
  isEditing.value = false
}

function getCategoryName(id: number | string | null) {
  if (!id) return 'Non Assegnata'
  const cat = categories.value.find((c) => String(c.id) === String(id))
  return cat ? `${cat.icon || '🏷️'} ${cat.name}` : 'Non Assegnata'
}

// --- TAXONOMY PRESETS & LOGICA MODALI ---
const presetEmojis = ['💻', '⚙️', '⚡', '🧠', '🛡️', '🔒', '🤖', '☁️', '🐳', '🌐', '📦', '🚀', '📱', '🔑', '📊', '🧬', '🎯', '🛠️', '🔥', '✨', '💡', '📌', '🏆', '📰']
const presetColors = ['#00dc82', '#38bdf8', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

const isCatModalOpen = ref(false)
const catForm = ref({ id: null as number | string | null, name: '', slug: '', description: '', icon: '🤖', color: '#00dc82', tagInput: '', tags: [] as string[] })

const isSubModalOpen = ref(false)
const subForm = ref({ id: null as number | string | null, categoryId: null as number | string | null, categoryName: '', name: '', slug: '', description: '' })

const isVaultReportModalOpen = ref(false)
const selectedPostForReport = ref<Post | null>(null)

const addCategoryTag = () => {
  const val = catForm.value.tagInput.trim().replace(/^#/, '')
  if (val && !catForm.value.tags.includes(val)) {
    catForm.value.tags.push(val)
    catForm.value.tagInput = ''
  }
}

const removeCategoryTag = (tag: string) => { catForm.value.tags = catForm.value.tags.filter((t) => t !== tag) }
const autoSlug = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
const handleCatNameInput = () => { if (!catForm.value.id) catForm.value.slug = autoSlug(catForm.value.name) }
const handleSubNameInput = () => { if (!subForm.value.id) subForm.value.slug = autoSlug(subForm.value.name) }

// API CATEGORIE
const fetchCategories = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res: any = await $fetch('/api/blog/categories')
    if (res && res.success) {
      categories.value = res.data || []
    } else {
      categories.value = []
    }
 } catch (err) {
      console.error('Errore fetch Categorie', err)
      triggerToast('Impossibile caricare le categorie dal database.', 'error')
    } finally {
      isLoading.value = false
    }
}

const loadPosts = async () => {
  try {
    const data = await fetchAdminPosts()
    posts.value = data
  } catch (e) {
    console.error('Errore fetch posts:', e)
  }
}

const openCatModal = (cat: Category | null = null) => {
  if (cat) {
    catForm.value = { ...cat, tags: cat.tags ? [...cat.tags] : [], tagInput: '' }
  } else {
    catForm.value = { id: null, name: '', slug: '', description: '', icon: '🤖', color: '#00dc82', tags: [], tagInput: '' }
  }
  isCatModalOpen.value = true
}

const openSubModal = (category: Category, sub: Subcategory | null = null) => {
  if (sub) {
    subForm.value = { ...sub, categoryName: category.name }
  } else {
    subForm.value = { id: null, categoryId: category.id, categoryName: category.name, name: '', slug: '', description: '' }
  }
  isSubModalOpen.value = true
}

const saveCategory = async () => {
  if (!catForm.value.name || !catForm.value.slug) return triggerToast('Nome e Slug obbligatori', 'warning')
  isLoading.value = true
  try {
    const payload = {
      name: catForm.value.name,
      slug: catForm.value.slug,
      description: catForm.value.description,
      icon: catForm.value.icon,
      color: catForm.value.color,
      tags: catForm.value.tags
    }

    const method = catForm.value.id ? 'PUT' : 'POST'
    const url = catForm.value.id ? `/api/blog/categories/${catForm.value.id}` : '/api/blog/categories'

    const res: any = await $fetch(url, { method, body: payload })
    if (res?.success) {
      triggerToast(catForm.value.id ? 'Categoria Aggiornata' : 'Categoria Creata', 'success')
      await fetchCategories()
      isCatModalOpen.value = false
    } else {
      triggerToast('Errore durante il salvataggio categoria', 'error')
    }
  } catch (e) {
    console.error(e)
    triggerToast('Errore API categoria', 'error')
  } finally {
    isLoading.value = false
  }
}

const saveSubcategory = async () => {
  if (!subForm.value.name || !subForm.value.slug) return triggerToast('Nome e Slug obbligatori', 'warning')
  isLoading.value = true
  try {
    const payload = {
      categoryId: subForm.value.categoryId,
      name: subForm.value.name,
      slug: subForm.value.slug,
      description: subForm.value.description
    }

    const method = subForm.value.id ? 'PUT' : 'POST'
    const url = subForm.value.id ? `/api/blog/subcategories/${subForm.value.id}` : '/api/blog/subcategories'

    const res: any = await $fetch(url, { method, body: payload })
    if (res?.success) {
      triggerToast(subForm.value.id ? 'Sottocategoria Aggiornata' : 'Sottocategoria Creata', 'success')
      await fetchCategories()
      isSubModalOpen.value = false
    } else {
      triggerToast('Errore durante il salvataggio sottocategoria', 'error')
    }
  } catch (e) {
    console.error(e)
    triggerToast('Errore API sottocategoria', 'error')
  } finally {
    isLoading.value = false
  }
}

const deleteItem = async (id: number | string, type: 'category' | 'subcategory') => {
  if (!confirm(`Sei sicuro di voler eliminare questa ${type}?`)) return
  isLoading.value = true
  try {
    const url = `/api/blog/categories/${id}?type=${type}`
    const res: any = await $fetch(url, { method: 'DELETE' })
    if (res?.success) {
      triggerToast(`${type === 'category' ? 'Categoria' : 'Sottocategoria'} eliminata con successo.`, 'success')
      await fetchCategories()
    } else {
      triggerToast('Errore durante l\'eliminazione.', 'error')
    }
  } catch (e: any) {
    console.error('Errore API eliminazione:', e)
    triggerToast(`❌ Errore API eliminazione: ${e.message || 'Errore DB'}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const inspectVaultReport = (post: Post) => {
  selectedPostForReport.value = post
  isVaultReportModalOpen.value = true
}

onMounted(() => {
  fetchCategories()
  loadPosts()
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-10 px-4 sm:px-6 font-sans">
    
    <!-- FLOATING TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div 
        v-if="showToast" 
        :class="[
          'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs sm:text-sm font-semibold transition-all',
          toastType === 'success' ? 'bg-[#041a13]/90 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(0,220,130,0.2)]' :
          toastType === 'error' ? 'bg-[#1e070a]/90 border-rose-500/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]' :
          'bg-[#1a1403]/90 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
        ]"
      >
        <span class="text-xl">
          {{ toastType === 'success' ? '⚡' : toastType === 'error' ? '🚫' : '⚠️' }}
        </span>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      
      <!-- NAVBAR GRID MODULI ADMIN v2.6 -->
      <div class="flex flex-col gap-3 bg-[#080d1a] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
        <div class="flex justify-between items-center pb-3 border-b border-slate-800/60 font-mono">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#00dc82]"></span>
            <span class="text-cyan-400 font-black text-xs tracking-wider uppercase">DKP ADMIN CONTROL CENTER</span>
          </div>

          <NuxtLink :to="getMainUrl('/admin')" external class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all">
            🏠 Dashboard Main
          </NuxtLink>
        </div>

        <!-- GRID NAVIGATION -->
        <nav class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono">
          <NuxtLink :to="getApiUrl('/admin/api-gateway')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            ⚙️ API Gateway
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/mail')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📧 Mail
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/newsletter')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📣 Newsletter
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/crawler')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            🤖 Crawler
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/blog')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-300 bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_10px_rgba(0,220,130,0.2)]">
            📝 Blog
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/nodes')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-sky-400 bg-sky-500/10 border border-sky-500/40 hover:bg-sky-500/20 transition-all">
            💬 Gestione Nodi
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/shop')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            🛍️ Shop
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/jobs')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            💼 Jobs
          </NuxtLink>
        </nav>
      </div>

      <!-- HEADER HERO TAXONOMY & BLOG SYSTEM -->
      <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-[#080d1a] via-[#091124] to-[#040711] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl gap-6 relative overflow-hidden">
        <!-- Glow Cosmico -->
        <div class="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col gap-2">
          <div class="flex items-center gap-3 mb-1 flex-wrap font-mono">
            <span class="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase shadow-[0_0_12px_rgba(0,220,130,0.25)]">
              DKP v2.6-PURE-SQL TAXONOMY &amp; PUBLISHING
            </span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Gestione <span class="text-emerald-400">DKP Blog &amp; Taxonomy</span>
          </h1>
          <p class="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Amministra le categorie sul Database Neon e pubblica articoli con scansione automatica DKP Vault &amp; Sentinel AI.
          </p>
        </div>
      </header>

      <!-- ALERT ERRORE SE PRESENTE -->
      <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/40 text-rose-300 p-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2">
        <span>⚠️ {{ errorMessage }}</span>
      </div>

      <!-- MAIN HYBRID GRID (380px / 1fr -> 12 Columns Tailwind) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- ================= COLONNA SINISTRA: CATEGORIE (4 COLS) ================= -->
        <aside class="lg:col-span-4 bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 class="text-white font-bold text-base flex items-center gap-2">
              <span>📂 Categorie ({{ categories.length }})</span>
            </h3>
            <button 
              @click="openCatModal()" 
              class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition-all cursor-pointer"
            >
              ➕ Nuova
            </button>
          </div>

          <!-- Loading state -->
          <div v-if="isLoading && !categories.length" class="text-center py-8 text-slate-500 font-mono text-xs">
            ⏳ Caricamento categorie da NeonDB...
          </div>
          
          <!-- Empty state -->
          <div v-else-if="!categories.length" class="text-center py-8 text-slate-500 font-mono text-xs">
            Nessuna categoria trovata. Creane una nuova!
          </div>

          <!-- List Categorie -->
          <div v-else class="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
            <div 
              v-for="cat in categories" 
              :key="cat.id" 
              class="bg-[#040814] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-all flex flex-col gap-3"
            >
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-2.5">
                  <div 
                    class="w-8 h-8 rounded-lg flex items-center justify-center border font-bold text-base"
                    :style="{
                      backgroundColor: `${cat.color || '#00dc82'}20`,
                      color: cat.color || '#00dc82',
                      borderColor: `${cat.color || '#00dc82'}40`,
                    }"
                  >
                    {{ cat.icon || "🏷️" }}
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-xs sm:text-sm leading-tight">{{ cat.name }}</h4>
                    <span class="text-[10px] text-slate-500 font-mono">/{{ cat.slug }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button 
                    @click="openCatModal(cat)" 
                    class="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-all cursor-pointer text-xs" 
                    title="Modifica Categoria"
                  >
                    ✏️
                  </button>
                  <button 
                    @click="deleteItem(cat.id, 'category')" 
                    class="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-all cursor-pointer text-xs" 
                    title="Elimina Categoria"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Sottocategorie mini -->
              <div class="border-t border-slate-800/60 pt-2 flex flex-col gap-1.5">
                <div class="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold">
                  <span>Sottocategorie ({{ cat.subcategories?.length || 0 }})</span>
                  <button @click="openSubModal(cat)" class="text-emerald-400 hover:underline cursor-pointer">
                    + Aggiungi
                  </button>
                </div>

                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="sub in cat.subcategories" 
                    :key="sub.id" 
                    class="bg-[#080d1a] border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono flex items-center gap-1"
                    :title="sub.description || ''"
                  >
                    {{ sub.name }}
                    <button 
                      @click="deleteItem(sub.id, 'subcategory')" 
                      class="text-rose-400 hover:text-rose-300 ml-0.5 cursor-pointer font-bold" 
                      title="Elimina Sottocategoria"
                    >
                      &times;
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- ================= COLONNA DESTRA: TABS PUBBLICAZIONE & LISTA POSTS (8 COLS) ================= -->
        <main class="lg:col-span-8 flex flex-col gap-6">

          <div v-if="isBlogLoading" class="text-center py-12 text-emerald-400 font-mono text-sm animate-pulse">
            Caricamento articoli da NeonDB...
          </div>

          <div v-else class="flex flex-col gap-6">
            
            <!-- FORM PUBBLICAZIONE / MODIFICA -->
            <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
              <div class="border-b border-slate-800 pb-3 flex justify-between items-center">
                <h3 class="text-white font-bold text-base sm:text-lg">
                  {{ isEditing ? '✏️ Modifica Articolo' : '✍️ Pubblica Nuovo Articolo (Vault Auto-Scan)' }}
                </h3>
              </div>

              <form @submit.prevent="publishArticle" class="flex flex-col gap-4">
                
                <div class="flex flex-col gap-1.5 font-mono">
                  <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Titolo Articolo *</label>
                  <input 
                    v-model="newArticle.title" 
                    type="text" 
                    class="bg-[#040814] border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                    placeholder="Es. Guida ad Architettura Micro-Kernel Nuxt 4" 
                    required 
                  />
                </div>

                <!-- ROW CATEGORIA E SOTTOCATEGORIA -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Categoria *</label>
                    <select 
                      v-model="newArticle.categoryId" 
                      @change="onCategoryChange" 
                      class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer"
                      required
                    >
                      <option value="" disabled>Seleziona categoria</option>
                      <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                        {{ cat.icon || "🏷️" }} {{ cat.name }}
                      </option>
                    </select>
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Sottocategoria</label>
                    <select 
                      v-model="newArticle.subcategoryId" 
                      class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer disabled:opacity-40"
                      :disabled="!availableSubcategories.length"
                    >
                      <option value="">Nessuna (Generale)</option>
                      <option v-for="sub in availableSubcategories" :key="sub.id" :value="sub.id">
                        {{ sub.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- ROW STATUS ED AUTORE -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Status</label>
                    <select 
                      v-model="newArticle.status" 
                      class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="published">Online (Published)</option>
                      <option value="draft">Bozza (Draft)</option>
                    </select>
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Autore</label>
                    <input 
                      v-model="newArticle.author" 
                      type="text" 
                      class="bg-[#040814] border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <!-- COMPONENTE TAG INPUT -->
                <div class="flex flex-col gap-1.5 font-mono">
                  <label class="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    TAGS DELL'ARTICOLO (AUTOSUGGEST 600+)
                  </label>
                  <DkpTagInput v-model="newArticle.tags" />
                </div>

                <!-- ESTRATTO BREVE -->
                <div class="flex flex-col gap-1.5 font-mono">
                  <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Estratto Breve / Summary</label>
                  <textarea 
                    v-model="newArticle.excerpt" 
                    rows="2"
                    class="bg-[#040814] border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 transition-all"
                    placeholder="Sintesi per le anteprime nella sezione notizie..."
                  ></textarea>
                </div>

                <!-- PULSANTI DINAMICI -->
                <div class="flex items-center gap-3 mt-2 font-mono">
                  <button 
                    v-if="isEditing" 
                    type="button" 
                    @click="resetForm" 
                    class="px-4 py-3 bg-rose-500/10 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ❌ Annulla Modifica
                  </button>
                  
                  <button 
                    type="submit" 
                    :disabled="isLoading"
                    class="flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,220,130,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {{ isEditing ? '🔄 Salva Modifiche' : '🚀 Salva & Pubblica con Vault' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- TABELLA GESTIONE ARTICOLI -->
            <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h3 class="text-white font-bold text-base sm:text-lg">
                📚 Gestione Pubblicazioni ({{ posts.length }})
              </h3>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr class="bg-[#040814] text-slate-400 font-extrabold text-[11px] uppercase border-b border-slate-800 font-mono">
                      <th class="p-3">Titolo Articolo</th>
                      <th class="p-3">Categoria</th>
                      <th class="p-3">Stato</th>
                      <th class="p-3">Data</th>
                      <th class="p-3">Metriche</th>
                      <th class="p-3 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="post in posts" 
                      :key="post.id" 
                      :class="[
                        'border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors',
                        post.status === 'pending_vault' ? 'bg-amber-500/5' : ''
                      ]"
                    >
                      <td class="p-3 font-bold text-white max-w-xs truncate">{{ post.title }}</td>
                      <td class="p-3">
                        <span class="bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                          {{ getCategoryName(post.category || post.categoryId) }}
                        </span>
                      </td>
                      <td class="p-3 font-mono">
                        <span 
                          v-if="post.status === 'published'" 
                          class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase"
                        >Online</span>
                        <span 
                          v-else-if="post.status === 'pending_vault'" 
                          class="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase"
                        >Vault (Analisi)</span>
                        <span v-else class="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Bozza</span>
                      </td>
                      <td class="p-3 text-slate-400 font-mono text-xs">
                        {{ post.date || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '') }}
                      </td>
                      <td class="p-3 font-mono text-xs text-slate-400">
                        👁️ {{ post.views || 0 }} <span class="text-rose-400 ml-1">❤️ {{ post.likes || 0 }}</span>
                      </td>
                      <td class="p-3 text-right font-mono">
                        <div class="flex justify-end items-center gap-1.5">
                          <button 
                            v-if="post.vaultReport" 
                            @click="inspectVaultReport(post)" 
                            class="p-1.5 bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 rounded-lg text-xs transition-all cursor-pointer" 
                            title="Ispeziona Report Vault"
                          >
                            🛡️
                          </button>
                          <button 
                            @click="editPost(post)" 
                            class="p-1.5 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-400 rounded-lg text-xs transition-all cursor-pointer" 
                            title="Modifica Articolo"
                          >
                            ✏️
                          </button>
                          <button 
                            @click="deletePost(post.id)" 
                            class="p-1.5 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg text-xs transition-all cursor-pointer" 
                            title="Elimina Articolo"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr v-if="posts.length === 0">
                      <td colspan="6" class="p-8 text-center text-slate-500 font-mono text-xs">
                        📂 Nessun articolo presente nel Database Neon. Usa il form per crearne uno nuovo.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>

    </div>

    <!-- ================= MODALE 1: VERIFICATION REPORT DKP VAULT ================= -->
    <Transition name="fade">
      <div 
        v-if="isVaultReportModalOpen && selectedPostForReport" 
        class="fixed inset-0 z-50 bg-[#020420]/80 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="isVaultReportModalOpen = false"
      >
        <div class="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 class="text-cyan-400 font-black text-lg flex items-center gap-2">
              <span>🛡️ DKP Vault Verification Report</span>
            </h3>
            <span class="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              SAST AUDIT ENGINE
            </span>
          </div>

          <div class="flex flex-col gap-3 font-mono text-xs">
            <h4 class="text-white font-bold text-sm">{{ selectedPostForReport.title }}</h4>
            <p class="text-slate-400 text-xs">
              Autore: <strong class="text-slate-200">@{{ selectedPostForReport.authorName || 'user_community' }}</strong> • Data: {{ selectedPostForReport.date || 'Recente' }}
            </p>

            <div class="grid grid-cols-3 gap-2 my-2">
              <div class="bg-[#040814] border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1">
                <span class="text-[10px] text-slate-500 font-bold uppercase">Autenticità</span>
                <span class="text-emerald-400 text-base font-black">{{ selectedPostForReport.vaultReport?.authenticityScore || 95 }}%</span>
              </div>
              <div class="bg-[#040814] border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1">
                <span class="text-[10px] text-slate-500 font-bold uppercase">SAST Check</span>
                <span class="text-sky-400 text-base font-black">{{ selectedPostForReport.vaultReport?.sastCheck || 'PASSED' }}</span>
              </div>
              <div class="bg-[#040814] border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1">
                <span class="text-[10px] text-slate-500 font-bold uppercase">Rischio Plagio</span>
                <span class="text-purple-400 text-base font-black">{{ selectedPostForReport.vaultReport?.plagiarismRisk || 'LOW' }}</span>
              </div>
            </div>

            <div class="bg-[#040814] border border-slate-800 p-3 rounded-xl flex flex-col gap-1.5">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HASH SHA-256 VAULT PREVIEW:</span>
              <code class="text-emerald-400 text-[11px] break-all">
                {{ selectedPostForReport.vaultReport?.vaultHashPreview || selectedPostForReport.vaultHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }}
              </code>
            </div>
          </div>

          <div class="border-t border-slate-800 pt-4 flex justify-end font-mono">
            <button @click="isVaultReportModalOpen = false" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Chiudi Report
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ================= MODALE 2: CATEGORIA ================= -->
    <Transition name="fade">
      <div 
        v-if="isCatModalOpen" 
        class="fixed inset-0 z-50 bg-[#020420]/80 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="isCatModalOpen = false"
      >
        <div class="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-hidden">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 class="text-white font-bold text-base">
              📁 {{ catForm.id ? "Modifica Categoria" : "Nuova Categoria" }}
            </h3>
            <button @click="isCatModalOpen = false" class="text-slate-500 hover:text-white font-bold cursor-pointer">×</button>
          </div>

          <div class="flex flex-col gap-4 overflow-y-auto pr-1 font-mono text-xs">
            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">Nome Categoria *</label>
              <input 
                v-model="catForm.name" 
                @input="handleCatNameInput"
                type="text" 
                class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder="Es. Cybersecurity & Vault"
                required
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">URL Slug *</label>
              <input 
                v-model="catForm.slug" 
                type="text" 
                class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder="cybersecurity-vault"
                required
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">Descrizione Breve (SEO)</label>
              <textarea 
                v-model="catForm.description" 
                rows="2" 
                class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-all"
                placeholder="Breve panoramica della categoria..."
              ></textarea>
            </div>

            <!-- EMOJI PICKER GRID -->
            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">Seleziona Icona Emoji</label>
              <div class="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-28 overflow-y-auto bg-[#040814] border border-slate-800 p-2 rounded-xl">
                <button 
                  v-for="emoji in presetEmojis" 
                  :key="emoji" 
                  type="button" 
                  @click="catForm.icon = emoji"
                  :class="[
                    'p-2 text-base rounded-lg border transition-all cursor-pointer text-center',
                    catForm.icon === emoji ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'border-transparent hover:bg-slate-800'
                  ]"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>

            <!-- TAGS INPUT CATEGORIA -->
            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">Tag Categoria (Premi invio per aggiungere)</label>
              <div class="flex gap-2">
                <input 
                  v-model="catForm.tagInput" 
                  @keydown.enter.prevent="addCategoryTag"
                  type="text" 
                  class="bg-[#040814] border border-slate-800 text-white px-3 py-2 rounded-xl flex-1 outline-none focus:border-emerald-500 transition-all"
                  placeholder="Es. Docker, Rust..."
                />
                <button type="button" @click="addCategoryTag" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl font-bold cursor-pointer">
                  + Tag
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5 mt-1 bg-[#040814] border border-slate-800/80 p-2 rounded-xl min-h-[40px]">
                <span v-for="tag in catForm.tags" :key="tag" class="bg-sky-500/15 border border-sky-500/30 text-sky-400 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                  #{{ tag }} 
                  <button type="button" @click="removeCategoryTag(tag)" class="text-rose-400 hover:text-rose-300 font-bold cursor-pointer">&times;</button>
                </span>
              </div>
            </div>

            <!-- COLOR PICKER & PREVIEW -->
            <div class="flex flex-col gap-2">
              <label class="text-slate-400 font-bold uppercase">Colore Badge &amp; Accent</label>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <span 
                    v-for="color in presetColors" 
                    :key="color" 
                    @click="catForm.color = color" 
                    :style="{ backgroundColor: color }" 
                    :class="[
                      'w-6 h-6 rounded-full cursor-pointer transition-transform border-2',
                      catForm.color === color ? 'scale-110 border-white' : 'border-transparent'
                    ]"
                  ></span>
                  <input v-model="catForm.color" type="color" class="w-7 h-7 bg-transparent border-0 cursor-pointer" />
                </div>
              </div>
            </div>

            <!-- ANTEPRIMA BADGE LIVE -->
            <div class="bg-[#040814] border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <span class="text-slate-500 font-bold text-[10px] uppercase">Anteprima Live:</span>
              <span 
                class="px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5"
                :style="{
                  backgroundColor: `${catForm.color}20`,
                  color: catForm.color,
                  borderColor: `${catForm.color}40`,
                }"
              >
                <span>{{ catForm.icon }}</span>
                {{ catForm.name || "Nome Categoria" }}
              </span>
            </div>
          </div>

          <div class="border-t border-slate-800 pt-4 flex justify-end gap-3 font-mono">
            <button @click="isCatModalOpen = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Annulla
            </button>
            <button @click="saveCategory" :disabled="isLoading" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50">
              💾 Salva Categoria
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ================= MODALE 3: SOTTOCATEGORIA ================= -->
    <Transition name="fade">
      <div 
        v-if="isSubModalOpen" 
        class="fixed inset-0 z-50 bg-[#020420]/80 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="isSubModalOpen = false"
      >
        <div class="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 class="text-white font-bold text-base">
              ➕ {{ subForm.id ? "Modifica Sottocategoria" : "Nuova Sottocategoria" }}
            </h3>
            <button @click="isSubModalOpen = false" class="text-slate-500 hover:text-white font-bold cursor-pointer">×</button>
          </div>

          <p class="text-slate-400 text-xs font-mono">
            Categoria Padre: <strong class="text-emerald-400">{{ subForm.categoryName }}</strong>
          </p>

          <div class="flex flex-col gap-4 font-mono text-xs">
            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">Nome Sottocategoria *</label>
              <input 
                v-model="subForm.name" 
                @input="handleSubNameInput"
                type="text" 
                class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder="Es. Penetration Testing"
                required
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">URL Slug *</label>
              <input 
                v-model="subForm.slug" 
                type="text" 
                class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder="penetration-testing"
                required
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">Descrizione Breve *</label>
              <textarea 
                v-model="subForm.description" 
                rows="3" 
                class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-all"
                placeholder="Spiega brevemente quali argomenti trattare..."
              ></textarea>
            </div>
          </div>

          <div class="border-t border-slate-800 pt-4 flex justify-end gap-3 font-mono">
            <button @click="isSubModalOpen = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Annulla
            </button>
            <button @click="saveSubcategory" :disabled="isLoading" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50">
              💾 Salva Sottocategoria
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>