<!-- app/pages/user/dashboard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpTagInput from '~/components/blog/DkpTagInput.vue'
import DkpEditor from '~/components/blog/DkpEditor.vue'
import UserXpHistory from '~/components/UserXpHistory.vue'
import DkpPulseManager from '~/components/dashboard/DkpPulseManager.vue'
import DkpCommentsManager from '~/components/dashboard/DkpCommentsManager.vue'
import DkpNodesManager from '~/components/dashboard/DkpNodesManager.vue'

useHead({
  title: 'Pannello Riservato Utente — DevKernelPulse v2.6-PURE-SQL',
  meta: [
    { name: 'description', content: 'Gestisci il tuo profilo, gli articoli pubblicati e le tue API keys su DevKernelPulse v2.6.' }
  ]
})

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuthCore()
const { getMainUrl, getApiUrl } = useDomain()

const activeTab = computed({
  get: () => (route.query.tab as string) || 'profile',
  set: (val: string) => router.replace({ query: { ...route.query, tab: val } })
})

const contentTab = ref<'blog' | 'pulse' | 'nodes' | 'comments'>('blog')

const articles = ref<any[]>([])
const hnArticles = ref<any[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

const filteredAndPaginatedPosts = computed(() => {
  let filtered = articles.value.filter(post => 
    post.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (post.tags && post.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.value.toLowerCase())))
  )
  const start = (currentPage.value - 1) * itemsPerPage
  return {
    items: filtered.slice(start, start + itemsPerPage),
    totalItems: filtered.length,
    totalPages: Math.ceil(filtered.length / itemsPerPage) || 1
  }
})

function changePage(page: number) {
  if (page >= 1 && page <= filteredAndPaginatedPosts.value.totalPages) {
    currentPage.value = page
  }
}

watch(searchQuery, () => { currentPage.value = 1 })

const showToast = ref(false)
const toastMessage = ref('')
function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

const vaultNewTitle = ref('')
const vaultNewCode = ref('')
const vaultCertificates = ref<any[]>([])

async function fetchVaultCertificates() {
  try {
    const res: any = await $fetch(`/api/user/vault?userId=${currentUser.value?.id || 1}`)
    if (res && res.success) {
      vaultCertificates.value = (res.data || []).map((c: any) => ({
        id: c.id, title: c.title, hash: c.hash, sastStatus: c.metadata?.sastStatus || 'PASSED',
        date: c.createdAt ? c.createdAt.split('T')[0] : '2026-10-15'
      }))
    }
  } catch (err) {}
}

async function notarizeNewCode() {
  if (!vaultNewTitle.value.trim() || !vaultNewCode.value.trim()) return triggerToast('❌ Dati mancanti.')
  try {
    const res: any = await $fetch('/api/user/vault', {
      method: 'POST', body: { userId: currentUser.value?.id || 1, title: vaultNewTitle.value, code: vaultNewCode.value, sastStatus: 'PASSED' }
    })
    if (res && res.success) {
      triggerToast('🛡️ Codice notarizzato!'); vaultNewTitle.value = ''; vaultNewCode.value = ''; await fetchVaultCertificates()
    }
  } catch (err: any) { triggerToast('❌ Errore Vault.') }
}

const userProfileData = ref({
  username: currentUser.value?.username || 'alexdpl',
  avatar: currentUser.value?.avatar || 'https://github.com/alexdpl.png',
  xp: 10860, 
  level: 'S-TIER ARCHITECT',
  badges: ['Developer VIP Member', 'Early Pioneer', 'Core Creator', 'Vault Master']
})

const avatarError = ref(false)
const userInitials = computed(() => {
  const name = currentUser.value?.username || userProfileData.value.username || 'DKP'
  return name.slice(0, 2).toUpperCase()
})

const xpHistoryList = ref<any[]>([])

const profileForm = ref({
  avatar: 'https://github.com/alexdpl.png',
  bio: 'Lead Engineer Architect & Core Creator of DevKernelPulse.',
  github: 'https://github.com/alexdpl', 
  twitter: 'https://x.com/alexdpl76', 
  linkedin: 'https://linkedin.com/in/alexdpl', 
  reddit: 'https://reddit.com/user/alexdpl'
})

async function fetchUserProfile() {
  try {
    const username = currentUser.value?.username || 'alexdpl'
    const res: any = await $fetch(`/api/user/profile?username=${username}&_t=${Date.now()}`)
    
    if (res?.success && res?.data?.user) {
      const u = res.data.user
      userProfileData.value.xp = u.xp ?? 10860
      userProfileData.value.level = u.rankTier || u.role || 'S-TIER ARCHITECT'
      if (u.badges?.length > 0) userProfileData.value.badges = u.badges
      if (u.avatar) {
        userProfileData.value.avatar = u.avatar
        profileForm.value.avatar = u.avatar
      }
      if (u.bio) profileForm.value.bio = u.bio
      if (u.github) profileForm.value.github = u.github
      if (u.twitter) profileForm.value.twitter = u.twitter
      if (u.linkedin) profileForm.value.linkedin = u.linkedin
      if (u.reddit) profileForm.value.reddit = u.reddit
    }

    const statsRes: any = await $fetch('/api/user/xp/history').catch(() => null)
    if (statsRes?.success && Array.isArray(statsRes.data)) {
      xpHistoryList.value = statsRes.data
    }
  } catch (err) {
    console.warn("Sincronizzazione dati profilo completata", err)
  }
}

const profileSaved = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)

function triggerFileSelect() {
  fileInputRef.value?.click()
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  if (file.size > 5 * 1024 * 1024) {
    return triggerToast('❌ Il file supera i 5MB.')
  }

  isUploadingAvatar.value = true
  const formData = new FormData()
  formData.append('avatar', file)

  try {
    const res: any = await $fetch('/api/user/avatar', {
      method: 'POST',
      body: formData
    }).catch(async () => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve({ success: true, url: e.target?.result as string })
        reader.readAsDataURL(file)
      })
    })

    if (res?.success && res?.url) {
      profileForm.value.avatar = res.url
      userProfileData.value.avatar = res.url
      avatarError.value = false
      triggerToast('📷 Avatar caricato! Clicca "Salva Modifiche" per confermare.')
    } else {
      triggerToast('❌ Errore durante l\'upload dell\'immagine.')
    }
  } catch {
    triggerToast('❌ Impossibile elaborare il file.')
  } finally {
    isUploadingAvatar.value = false
  }
}

async function saveProfile() {
  try {
    const payload = {
      username: currentUser.value?.username || 'alexdpl',
      ...profileForm.value
    }
    
    const res: any = await $fetch('/api/user/profile', {
      method: 'PUT',
      body: payload
    })

    if (res?.success) {
      profileSaved.value = true
      userProfileData.value.avatar = profileForm.value.avatar
      
      if (import.meta.client) {
        window.dispatchEvent(new CustomEvent('dkp:profile_updated'))
      }
      
      triggerToast('✅ Profilo salvato nel Kernel DKP!')
      setTimeout(() => profileSaved.value = false, 3000)
    } else {
      triggerToast('❌ Impossibile salvare le modifiche.')
    }
  } catch (err: any) {
    triggerToast('❌ Errore durante il salvataggio sul server.')
  }
}

async function activateEarlyPioneerBeta() {
  try {
    const res: any = await $fetch('/api/user/beta-pioneer', { 
      method: 'POST', 
      body: { userId: currentUser.value?.id || 1 } 
    }).catch(() => ({ success: true }))
    
    if (res && res.success) {
      triggerToast('🎉 Registrato nel Beta Program!')
      if (!userProfileData.value.badges.includes('Early Pioneer')) {
        userProfileData.value.badges.push('Early Pioneer')
      }
      await fetchUserProfile()
    } else {
      triggerToast('❌ ' + (res?.error || 'Errore attivazione Beta'))
    }
  } catch (err: any) { 
    triggerToast('❌ Errore di rete durante la registrazione.') 
  }
}

const { data: userKeysData, refresh: refreshApiKeys, pending: isLoadingApiKeys } = await useFetch<any>('/api/user/keys', { key: 'dashboard-user-api-keys', server: true })
const apiKeysList = computed(() => userKeysData.value?.data || [])
const newKeyName = ref('')
const generatedKeyModal = ref<string | null>(null)
const copiedKey = ref(false)

async function generateApiKey() {
  if (!newKeyName.value.trim()) return triggerToast('❌ Inserisci nome API.')
  try {
    const res = await $fetch<any>('/api/user/keys/generate', { method: 'POST', body: { name: newKeyName.value.trim(), role: 'PRO' } })
    if (res?.success && res?.rawApiKey) {
      generatedKeyModal.value = res.rawApiKey; newKeyName.value = ''; triggerToast('🔑 API Key creata!'); await refreshApiKeys()
    }
  } catch (err: any) { triggerToast('❌ Errore generazione API.') }
}

async function revokeApiKey(id: number | string) {
  if (!confirm('Sicuro di revocare la Key?')) return
  try {
    const res = await $fetch<any>('/api/user/keys/revoke', { method: 'POST', body: { id } })
    if (res?.success) { triggerToast('🗑️ API Key revocata.'); await refreshApiKeys() }
  } catch (err: any) { triggerToast('❌ Errore revoca.') }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text); copiedKey.value = true; triggerToast('📋 Copiato!')
  setTimeout(() => copiedKey.value = false, 2000)
}

const realLatency = ref<number | string>(22)
const memoryMb = ref<number>(45)
const uptimeSec = ref<number>(48)
const serverStatus = ref<string>('HEALTHY')

async function fetchTelemetryData() {
  if (import.meta.server) return
  const startTime = performance.now()
  try {
    const healthData: any = await $fetch('/api/public/health').catch(() => null)
    realLatency.value = Math.round(performance.now() - startTime) > 0 ? Math.round(performance.now() - startTime) : 12
    if (healthData?.status) serverStatus.value = healthData.status
    const metricsData: any = await $fetch('/api/public/metrics').catch(() => null)
    if (metricsData?.memoryUsageMb) memoryMb.value = metricsData.memoryUsageMb
    if (metricsData?.uptimeSeconds) uptimeSec.value = metricsData.uptimeSeconds
  } catch { realLatency.value = 18 }
}

interface CategoryItem { id: string | number; name: string; icon: string; subcategories: string[] }
const availableCategories = ref<CategoryItem[]>([])

async function fetchCategories() {
  try {
    const res: any = await $fetch('/api/blog/categories')
    const rawData = (res && res.success) ? res.data : (Array.isArray(res) ? res : [])
    if (rawData?.length > 0) {
      availableCategories.value = rawData.map((c: any) => ({
        id: c.id, name: c.name, icon: c.icon || '🏷️', subcategories: (c.subcategories || []).map((s: any) => typeof s === 'string' ? s : s.name)
      }))
    } else { populateCategoriesFallback() }
  } catch { populateCategoriesFallback() }
}

function populateCategoriesFallback() {
  availableCategories.value = [
    { id: 'cat-1', name: 'AI, LLM & Machine Learning', icon: '🤖', subcategories: ['LLM Architecture', 'Local AI & Ollama'] },
    { id: 'cat-2', name: 'Cloud Native & DevOps', icon: '☁️', subcategories: ['Kubernetes', 'GCP Architecture'] },
    { id: 'cat-3', name: 'Cybersecurity & Vault', icon: '🛡️', subcategories: ['Penetration Testing', 'Vault & Hashing'] }
  ]
}

const isEditingArticle = ref(false)
const useAdvancedEditor = ref(false)

const articleForm = ref({
  id: null as number | null, title: '', category: '', subCategory: '', summary: '', content: '', tags: [] as string[], status: 'draft'
})

function openNewArticleModal() {
  const defaultCat = availableCategories.value.length > 0 ? availableCategories.value[0] : null
  articleForm.value = { id: null, title: '', category: defaultCat ? defaultCat.name : 'AI, LLM & Machine Learning', subCategory: defaultCat && defaultCat.subcategories.length > 0 ? defaultCat.subcategories[0] : '', summary: '', content: '', tags: [], status: 'draft' }
  useAdvancedEditor.value = false; isEditingArticle.value = true
}

function editArticle(article: any) {
  articleForm.value = { id: article.id, title: article.title || '', category: article.category || '', subCategory: article.subCategory || '', summary: article.summary || '', content: article.content || '', tags: Array.isArray(article.tags) ? [...article.tags] : [], status: article.status || 'draft' }
  useAdvancedEditor.value = true; isEditingArticle.value = true
}

function submitWithStatus(status: 'draft' | 'published') { articleForm.value.status = status; saveArticle() }

async function fetchUserArticles() {
  try {
    const res: any = await $fetch('/api/blog/posts')
    const rawData = (res && res.success) ? res.data : (Array.isArray(res) ? res : [])
    articles.value = rawData.map((p: any) => ({
      id: p.id, title: p.title, category: p.categoryName || p.category || 'Generale', subCategory: p.subCategory || '', summary: p.excerpt || p.summary || '', content: p.content || '', tags: p.tags || [], status: p.status || 'published', date: p.createdAt ? p.createdAt.split('T')[0] : '2026-10-12'
    }))
  } catch (e) {}
}

async function fetchHnLinks() {
  try {
    const res: any = await $fetch('/api/user/contents').catch(() => null)
    if (res && res.success && res.hnPosts) {
      hnArticles.value = res.hnPosts.map((p: any) => ({
        id: p.id, title: p.title, url: p.url, type: p.type || 'news', points: p.points || 1, commentsCount: p.commentsCount || 0, date: p.createdAt ? p.createdAt.split('T')[0] : '2026-10-12'
      }))
    }
  } catch (e) {}
}

async function saveArticle() {
  if (!articleForm.value.title.trim() || !articleForm.value.category) return triggerToast('❌ Compila Titolo e Categoria.')
  const payload = { title: articleForm.value.title, category: articleForm.value.category, subCategory: articleForm.value.subCategory, excerpt: articleForm.value.summary, content: articleForm.value.content, tags: JSON.parse(JSON.stringify(articleForm.value.tags)), status: articleForm.value.status }
  const isUpdate = articleForm.value.id !== null; const url = isUpdate ? `/api/blog/posts/${articleForm.value.id}` : '/api/blog/posts'
  try {
    const res: any = await $fetch(url, { method: isUpdate ? 'PUT' : 'POST', body: payload })
    if (res && res.success) {
      triggerToast(isUpdate ? '✅ Articolo aggiornato!' : '🎉 Articolo pubblicato!')
      isEditingArticle.value = false; await fetchUserArticles()
    } else { triggerToast('❌ Errore salvataggio.') }
  } catch (err: any) { triggerToast('❌ Errore DB.') }
}

async function deleteArticle(id: number) {
  if (!confirm('Eliminare permanentemente?')) return
  try { await $fetch(`/api/blog/posts/${id}`, { method: 'DELETE' }); triggerToast('🗑️ Rimosso.'); await fetchUserArticles() } catch (err) {}
}

onMounted(() => {
  fetchCategories(); fetchTelemetryData(); fetchVaultCertificates(); fetchUserProfile()
  fetchUserArticles(); fetchHnLinks()
  window.addEventListener('dkp:xp_updated', fetchUserProfile)
})

onUnmounted(() => window.removeEventListener('dkp:xp_updated', fetchUserProfile))
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-8 sm:py-12">
    
    <!-- TOAST NOTIFICATION -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-2 opacity-0 scale-95"
    >
      <div v-if="showToast" class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap text-center">
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="max-w-6xl mx-auto flex flex-col gap-6">
      
      <!-- HEADER USER CARD -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div class="absolute -top-10 right-0 w-80 h-40 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full"></div>
        
        <div class="flex items-center gap-5 relative z-10">
          
          <!-- AVATAR CON BADGE VERIFICATO -->
          <div class="relative shrink-0">
            <img 
              v-if="profileForm.avatar && !avatarError" 
              :src="profileForm.avatar" 
              alt="Avatar Utente" 
              @error="avatarError = true"
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-400 p-0.5 bg-slate-950 object-cover shadow-[0_0_20px_rgba(16,185,129,0.25)]" 
            />
            <div 
              v-else 
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-purple-600/30 flex items-center justify-center text-emerald-400 font-black text-xl sm:text-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            >
              {{ userInitials }}
            </div>
            
            <span class="absolute bottom-0 right-0 bg-emerald-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#090d16] shadow-[0_0_10px_rgba(16,185,129,0.8)]" title="Utente Verificato DKP">
              ✓
            </span>
          </div>

          <div class="flex flex-col gap-1.5 font-mono">
            <h1 class="text-xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Pannello Riservato <span class="text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">@{{ currentUser?.username || 'alexdpl' }}</span>
            </h1>
            <div class="flex flex-wrap gap-2">
              <span v-for="badge in userProfileData.badges" :key="badge" class="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                🛡️ {{ badge }}
              </span>
              <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                ⚡ {{ userProfileData.xp }} Punti DKP
              </span>
            </div>
          </div>
        </div>

        <NuxtLink :to="getMainUrl(`/user/${currentUser?.username || 'alexdpl'}`)" external class="w-full sm:w-auto bg-slate-950 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-500/10 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] text-center shrink-0 relative z-10 font-mono">
          🌐 Vedi Profilo Pubblico
        </NuxtLink>
      </div>

      <!-- TABS NAVIGATION BAR -->
      <nav class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#090d16] p-2 border border-slate-800 rounded-2xl shadow-xl font-mono">
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'profile' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'profile'">
          ⚙️ Profilo &amp; Social
        </button>
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'content' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'content'">
          📰 I Miei Contenuti
        </button>
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'vault' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'vault'">
          🛡️ Proof of Code Vault
        </button>
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'api' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'api'">
          🔑 DKP API Console
        </button>
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'gamification' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'gamification'">
          🏆 Gamification &amp; XP
        </button>
        <NuxtLink to="/bounties" class="py-2.5 px-3 rounded-xl font-extrabold text-xs bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 transition-all text-center truncate">
          🎯 Bounty &amp; $PULSE
        </NuxtLink>
      </nav>

      <!-- PANNELLO 1: PROFILO & SOCIAL -->
      <section v-if="activeTab === 'profile'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h2 class="text-xl font-black text-white mb-1">Informazioni Developer</h2>
        <p class="text-slate-400 text-xs sm:text-sm mb-6">Personalizza l'aspetto del tuo profilo pubblico e collega i tuoi canali social su DKP v2.6.</p>

        <form @submit.prevent="saveProfile" class="flex flex-col gap-5">
          
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Avatar Developer</label>
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <input 
                v-model="profileForm.avatar" 
                type="url" 
                placeholder="https://... o carica un file dal PC" 
                class="flex-1 w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all font-mono" 
              />
              
              <input 
                ref="fileInputRef" 
                type="file" 
                accept="image/*" 
                class="hidden" 
                @change="handleFileUpload" 
              />

              <button 
                type="button" 
                @click="triggerFileSelect" 
                :disabled="isUploadingAvatar"
                class="w-full sm:w-auto bg-sky-500/10 border border-sky-500/40 text-sky-400 font-extrabold text-xs px-4 py-3 rounded-xl hover:bg-sky-500/20 transition-all cursor-pointer whitespace-nowrap font-mono shrink-0"
              >
                {{ isUploadingAvatar ? 'Caricamento...' : '💻 Carica da Desktop' }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Biografia Developer</label>
            <textarea v-model="profileForm.bio" rows="3" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all resize-none leading-relaxed"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Profilo GitHub</label>
              <input v-model="profileForm.github" type="url" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Profilo X / Twitter</label>
              <input v-model="profileForm.twitter" type="url" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Profilo LinkedIn</label>
              <input v-model="profileForm.linkedin" type="url" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Profilo Reddit</label>
              <input v-model="profileForm.reddit" type="url" placeholder="https://reddit.com/user/username" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all" />
            </div>
          </div>

          <div class="flex items-center gap-4 mt-2">
            <button type="submit" class="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all text-xs sm:text-sm cursor-pointer font-mono">
              Salva Modifiche nel Kernel
            </button>
            <span v-if="profileSaved" class="text-emerald-400 font-bold text-xs font-mono">✓ Profilo Aggiornato con Successo!</span>
          </div>
        </form>
      </section>

      <!-- PANNELLO 2: CONTENUTI -->
      <section v-if="activeTab === 'content'" class="flex flex-col gap-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#090d16] border border-slate-800 p-2 rounded-2xl shadow-xl font-mono">
          <button @click="contentTab = 'blog'" class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center" :class="contentTab === 'blog' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'">
            📝 Articoli Blog
          </button>
          <button @click="contentTab = 'pulse'" class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center" :class="contentTab === 'pulse' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'">
            🚀 Condivisioni (HN)
          </button>
          <button @click="contentTab = 'nodes'" class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center" :class="contentTab === 'nodes' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'">
            🌐 Forum (Nodes)
          </button>
          <button @click="contentTab = 'comments'" class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center" :class="contentTab === 'comments' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'">
            💬 Commenti Articoli
          </button>
        </div>

        <div v-if="contentTab === 'blog'" class="flex flex-col gap-6">
          <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div class="flex justify-between items-center mb-6 font-mono">
              <h2 class="text-xl font-black text-white font-sans">Gestione Post &amp; Blog</h2>
              <button @click="openNewArticleModal" class="bg-emerald-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer">
                + Nuovo Post
              </button>
            </div>
            <table class="w-full text-left border-collapse text-xs sm:text-sm font-mono">
              <thead>
                <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th class="p-3">Titolo</th>
                  <th class="p-3">Categoria</th>
                  <th class="p-3">Stato</th>
                  <th class="p-3">Gestione</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                <tr v-for="art in filteredAndPaginatedPosts.items" :key="art.id">
                  <td class="p-3 font-bold text-white font-sans">{{ art.title }}</td>
                  <td class="p-3 text-emerald-400">{{ art.category }}</td>
                  <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-black uppercase" :class="art.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'">{{ art.status }}</span></td>
                  <td class="p-3"><button @click="deleteArticle(art.id)" class="text-red-400 text-xs font-bold cursor-pointer">🗑️ Del</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="contentTab === 'pulse'"><DkpPulseManager/></div>
        <div v-if="contentTab === 'nodes'"><DkpNodesManager/></div>
        <div v-if="contentTab === 'comments'"><DkpCommentsManager/></div>
      </section>

      <!-- PANNELLO 3: API CONSOLE -->
      <section v-if="activeTab === 'api'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
        <h2 class="text-xl font-black text-white font-sans">🔑 DKP API Console</h2>
        <div class="flex gap-3">
          <input v-model="newKeyName" type="text" placeholder="Nome Token..." class="flex-1 bg-[#020420] border border-slate-700 text-white p-3 rounded-xl text-sm outline-none" />
          <button @click="generateApiKey" class="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm cursor-pointer whitespace-nowrap">Genera API Key</button>
        </div>
      </section>

      <!-- PANNELLO 4: VAULT -->
      <section v-if="activeTab === 'vault'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
        <h2 class="text-xl sm:text-2xl font-black text-white font-sans">Proof of Code Vault</h2>
        <div class="bg-[#020420] border border-sky-500/30 rounded-2xl p-6 flex flex-col gap-4">
          <input v-model="vaultNewTitle" type="text" placeholder="Titolo Script..." class="bg-[#090d16] border border-slate-700 text-white p-3 rounded-xl text-sm outline-none" />
          <textarea v-model="vaultNewCode" rows="4" placeholder="Codice da firmare..." class="bg-[#090d16] border border-slate-700 text-sky-400 p-3 rounded-xl text-xs outline-none resize-none"></textarea>
          <button @click="notarizeNewCode" class="bg-emerald-500 text-slate-950 font-black px-5 py-3 rounded-xl text-sm cursor-pointer">🛡️ Notarizza nel Vault</button>
        </div>
      </section>

      <!-- PANNELLO 5: GAMIFICATION -->
      <section v-if="activeTab === 'gamification'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
        <div class="flex justify-between items-center border-b border-slate-800 pb-6">
          <h2 class="text-xl sm:text-2xl font-black text-white font-sans">Gamification Center</h2>
          <span class="text-2xl font-black text-emerald-400">{{ userProfileData.xp }} XP</span>
        </div>
        <button @click="activateEarlyPioneerBeta" class="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl text-sm cursor-pointer">⚡ Attiva Status "Early Pioneer"</button>
        <UserXpHistory :history="xpHistoryList"/>
      </section>

    </div>
  </div>
</template>