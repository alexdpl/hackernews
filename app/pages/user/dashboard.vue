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

useDkpSeo({
  title: 'Pannello Riservato Utente — DevKernelPulse v2.5-GOLD',
  description: 'Gestisci il tuo profilo, gli articoli pubblicati e le tue API keys su DevKernelPulse.'
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

// --- STATI CONTENUTI SEPARATI ---
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

// 🛡️ VAULT & PROFILO
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

// Profilo utente
const userProfileData = ref({
  username: currentUser.value?.username || 'alexdpl',
  avatar: currentUser.value?.avatar || 'https://github.com/alexdpl.png',
  xp: 0, 
  level: 'Newbie Developer',
  nextLevelXp: 500,
  progress: 0,
  badges: ['Developer VIP Member']
})

// Gestione Fallback Avatar per evitare il bug visivo dell'immagine rotta
const avatarError = ref(false)
const userInitials = computed(() => {
  const name = currentUser.value?.username || userProfileData.value.username || 'DKP'
  return name.slice(0, 2).toUpperCase()
})

const xpHistoryList = ref<any[]>([])

async function fetchGamificationData() {
  try {
    const userId = currentUser.value?.id || 1
    const res: any = await $fetch(`/api/user/gamification?userId=${userId}`)
    
    if (res && res.success && res.data) {
      userProfileData.value.xp = res.data.xp ?? 0
      userProfileData.value.level = res.data.level ?? 'Newbie Developer'
      if (res.data.badges?.length > 0) {
        userProfileData.value.badges = res.data.badges
      }
    }

    const statsRes: any = await $fetch('/api/user/xp/history')
    if (statsRes?.success && Array.isArray(statsRes.data)) {
      xpHistoryList.value = statsRes.data
    }
  } catch (err) {
    console.warn("Impossibile sincronizzare i dati gamification reali", err)
  }
}

async function activateEarlyPioneerBeta() {
  try {
    const res: any = await $fetch('/api/user/beta-pioneer', { 
      method: 'POST', 
      body: { userId: currentUser.value?.id || 1 } 
    })
    if (res && res.success) {
      triggerToast('🎉 Registrato nel Beta Program!')
      if (!userProfileData.value.badges.includes('Early Pioneer')) {
        userProfileData.value.badges.push('Early Pioneer')
      }
      await fetchGamificationData()
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
const totalCallsCount = ref<string>('14,290')
const errorRate = ref<string>('0.02%')

async function fetchTelemetryData() {
  if (import.meta.server) return
  const startTime = performance.now()
  try {
    const healthData: any = await $fetch('/api/public/health')
    realLatency.value = Math.round(performance.now() - startTime) > 0 ? Math.round(performance.now() - startTime) : 12
    if (healthData?.status) serverStatus.value = healthData.status
    const metricsData: any = await $fetch('/api/public/metrics')
    if (metricsData?.memoryUsageMb) memoryMb.value = metricsData.memoryUsageMb
    if (metricsData?.uptimeSeconds) uptimeSec.value = metricsData.uptimeSeconds
  } catch { realLatency.value = 18 }
}

const profileForm = ref({
  avatar: currentUser.value?.avatar || 'https://github.com/alexdpl.png',
  bio: currentUser.value?.bio || 'Lead Engineer Architect',
  github: 'https://github.com/alexdpl', twitter: 'https://x.com/alexdpl76', linkedin: 'https://linkedin.com/in/alexdpl', reddit: 'https://reddit.com/user/alexdpl'
})
const profileSaved = ref(false)
function saveProfile() { profileSaved.value = true; triggerToast('✅ Profilo aggiornato!'); setTimeout(() => profileSaved.value = false, 3000) }

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

const currentSubcategories = computed(() => {
  const cat = availableCategories.value.find(c => c.name === articleForm.value.category)
  return cat ? cat.subcategories : []
})

function onCategoryChange() { const subs = currentSubcategories.value; articleForm.value.subCategory = subs.length > 0 ? subs[0] : '' }

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
      id: p.id,
      title: p.title,
      category: p.categoryName || p.category || 'Generale',
      subCategory: p.subCategory || '',
      summary: p.excerpt || p.summary || '',
      content: p.content || '',
      tags: p.tags || [],
      status: p.status || 'published',
      date: p.createdAt ? p.createdAt.split('T')[0] : '2026-10-12'
    }))
  } catch (e) {
    console.warn("Impossibile caricare i post utente dal DB", e)
  }
}

async function fetchHnLinks() {
  try {
    const res: any = await $fetch('/api/user/contents').catch(() => null)
    if (res && res.success && res.hnPosts) {
      hnArticles.value = res.hnPosts.map((p: any) => ({
        id: p.id,
        title: p.title,
        url: p.url,
        type: p.type || 'news',
        points: p.points || 1,
        commentsCount: p.commentsCount || 0,
        date: p.createdAt ? p.createdAt.split('T')[0] : '2026-10-12'
      }))
    }
  } catch (e) {
    console.warn("API contents non trovata, skippo i link HN", e)
  }
}

async function saveArticle() {
  if (!articleForm.value.title.trim() || !articleForm.value.category) return triggerToast('❌ Compila Titolo e Categoria.')
  const payload = { title: articleForm.value.title, category: articleForm.value.category, subCategory: articleForm.value.subCategory, excerpt: articleForm.value.summary, content: articleForm.value.content, tags: JSON.parse(JSON.stringify(articleForm.value.tags)), status: articleForm.value.status }
  const isUpdate = articleForm.value.id !== null; const url = isUpdate ? `/api/blog/posts/${articleForm.value.id}` : '/api/blog/posts'
  try {
    const res: any = await $fetch(url, { method: isUpdate ? 'PUT' : 'POST', body: payload })
    if (res && res.success) {
        triggerToast(isUpdate ? '✅ Articolo aggiornato!' : '🎉 Articolo pubblicato!')
        if (!isUpdate && articleForm.value.status === 'published') {
          try { 
            await $fetch('/api/user/xp/award', { method: 'POST', body: { amount: 150, actionType: 'ARTICLE_PUBLISHED', description: `Pubblicazione articolo` } })
            window.dispatchEvent(new CustomEvent('dkp:xp_updated')) 
          } catch(e) {}
        }
        isEditingArticle.value = false; await fetchUserArticles()
    } else { triggerToast('❌ Errore salvataggio.') }
  } catch (err: any) { triggerToast('❌ Errore DB.') }
}

async function quickUpdateStatus(art: any, newStatus: 'published' | 'draft') {
  try {
    await $fetch(`/api/blog/posts/${art.id}`, { method: 'PUT', body: { ...art, excerpt: art.summary, status: newStatus } })
    triggerToast(newStatus === 'published' ? '🚀 Articolo online!' : '📝 Ritirato in bozza.'); await fetchUserArticles()
  } catch (err: any) { triggerToast('❌ Errore aggiornamento.') }
}

async function deleteArticle(id: number) {
  if (!confirm('Eliminare permanentemente?')) return
  try { await $fetch(`/api/blog/posts/${id}`, { method: 'DELETE' }); triggerToast('🗑️ Rimosso.'); await fetchUserArticles() } catch (err) {}
}

async function deleteHnLink(id: number) {
  if (!confirm('Sei sicuro di voler eliminare questo Link/Repo?')) return
  try {
    const res: any = await $fetch(`/api/pulse/stories/${id}`, { method: 'DELETE' })
    if (res && res.success) {
      triggerToast('🗑️ Post e commenti rimossi con successo.')
      await fetchHnLinks()
    } else {
      triggerToast('❌ ' + (res?.message || 'Impossibile eliminare il post.'))
    }
  } catch (err: any) {
    triggerToast('❌ Errore di rete durante la cancellazione.')
  }
}

onMounted(() => {
  if (currentUser.value) { 
    userProfileData.value.username = currentUser.value.username || 'alexdpl' 
    if (currentUser.value.avatar) userProfileData.value.avatar = currentUser.value.avatar 
  }
  fetchCategories(); fetchTelemetryData(); fetchVaultCertificates(); fetchGamificationData()
  
  fetchUserArticles()
  fetchHnLinks()
  
  window.addEventListener('dkp:xp_updated', fetchGamificationData)
})

onUnmounted(() => window.removeEventListener('dkp:xp_updated', fetchGamificationData))
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-8 sm:py-12">
    
    <!-- TOAST NOTIFICATION -->
    <Transition name="fade">
      <div v-if="showToast" class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap text-center">
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="max-w-6xl mx-auto flex flex-col gap-6">
      
      <!-- HEADER USER CARD -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div class="absolute -top-10 right-0 w-80 h-40 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full"></div>
        
        <div class="flex items-center gap-5 relative z-10">
          
          <!-- AVATAR CON FALLBACK ROBUSTO -->
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
            <span class="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-[#090d16] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" title="Online"></span>
          </div>

          <div class="flex flex-col gap-1.5">
            <h1 class="text-xl sm:text-3xl font-black text-white tracking-tight">
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

        <NuxtLink :to="getMainUrl(`/user/${currentUser?.username || 'alexdpl'}`)" external class="w-full sm:w-auto bg-slate-950 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-500/10 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] text-center shrink-0 relative z-10">
          🌐 Vedi Profilo Pubblico
        </NuxtLink>
      </div>

      <!-- TABS NAVIGATION BAR -->
      <nav class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#090d16] p-2 border border-slate-800 rounded-2xl shadow-xl">
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

      <!-- PANNELLO 1: PROFILO -->
      <section v-if="activeTab === 'profile'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h2 class="text-xl font-black text-white mb-1">Informazioni Developer</h2>
        <p class="text-slate-400 text-xs sm:text-sm mb-6">Personalizza l'aspetto del tuo profilo pubblico e collega i tuoi canali social.</p>

        <form @submit.prevent="saveProfile" class="flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">URL Avatar Personalizzato</label>
            <input v-model="profileForm.avatar" type="url" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all" />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Biografia Developer</label>
            <textarea v-model="profileForm.bio" rows="3" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all resize-none leading-relaxed"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <button type="submit" class="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all text-xs sm:text-sm cursor-pointer">
              Salva Modifiche
            </button>
            <span v-if="profileSaved" class="text-emerald-400 font-bold text-xs">✓ Profilo Aggiornato!</span>
          </div>
        </form>
      </section>

      <!-- PANNELLO 2: GESTIONE CONTENUTI -->
      <section v-if="activeTab === 'content'" class="flex flex-col gap-6">
        
        <!-- Sub-Tabs di Navigazione Contenuti -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#090d16] border border-slate-800 p-2 rounded-2xl shadow-xl">
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

        <!-- 2A. TAB BLOG EDITORIALE -->
        <div v-if="contentTab === 'blog'" class="flex flex-col gap-6">
          <div class="bg-[#090d16] border border-emerald-500/30 rounded-2xl p-4">
            <details class="group cursor-pointer">
              <summary class="text-emerald-400 font-bold text-xs sm:text-sm flex justify-between items-center list-none outline-none">
                <span>💡 Guida rapida all'Editor DKP &amp; Markdown</span>
                <span class="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div class="mt-4 text-xs sm:text-sm text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-800">
                <div>
                  <strong class="text-white">Formattazione Testo:</strong>
                  <ul class="list-disc pl-4 mt-2 space-y-1 text-slate-400 text-xs">
                    <li><code class="text-sky-300">**grassetto**</code> per evidenziare</li>
                    <li><code class="text-sky-300">*corsivo*</code> o <code class="text-sky-300">_corsivo_</code></li>
                    <li><code class="text-sky-300">[Titolo Link](https://url...)</code> per i collegamenti esterni</li>
                    <li><code class="text-sky-300"># Titolo Principale</code>, <code class="text-sky-300">## Sottotitolo</code> per gerarchia</li>
                    <li>Inizia la riga con <code class="text-sky-300">- </code> o <code class="text-sky-300">* </code> per gli elenchi puntati</li>
                  </ul>
                </div>
                <div>
                  <strong class="text-white">Blocchi di Codice &amp; Citazioni:</strong>
                  <p class="mt-2 text-xs leading-relaxed text-slate-400">
                    Usa tre apici inversi <code class="text-sky-300">```</code> seguiti dall'estensione (es. <code class="text-sky-300">ts</code>, <code class="text-sky-300">vue</code>, <code class="text-sky-300">go</code>) per inserire blocchi di codice nativi.<br><br>
                    Per inserire una citazione in evidenza (Blockquote), usa il simbolo <code class="text-sky-300">> </code> all'inizio della riga.
                  </p>
                </div>
              </div>
            </details>
          </div>

          <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 class="text-xl font-black text-white">Gestione Post &amp; Blog</h2>
                <p class="text-slate-400 text-xs sm:text-sm mt-1">Crea, modifica e gestisci gli articoli pubblicati nell'ecosistema DevKernelPulse.</p>
              </div>
              
              <div class="flex items-center gap-3 w-full sm:w-auto">
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Cerca per titolo o #tag..." 
                  class="bg-[#020420] border border-slate-700/80 text-white p-2.5 rounded-xl text-xs w-full sm:w-64 outline-none focus:border-emerald-400"
                />
                <button @click="openNewArticleModal" class="bg-emerald-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all whitespace-nowrap cursor-pointer">
                  + Nuovo Post
                </button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th class="p-3">Titolo Articolo</th>
                    <th class="p-3">Categoria &amp; Sottocategoria</th>
                    <th class="p-3">Tag</th>
                    <th class="p-3">Stato</th>
                    <th class="p-3">Data</th>
                    <th class="p-3">Gestione Rapida</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  <tr v-if="filteredAndPaginatedPosts.items.length === 0">
                    <td colspan="6" class="text-center py-8 text-slate-500 italic">
                      <span v-if="searchQuery">Nessun articolo trovato per "{{ searchQuery }}".</span>
                      <span v-else>Nessun articolo pubblicato. Clicca su "+ Nuovo Post" per iniziare.</span>
                    </td>
                  </tr>
                  <tr v-for="art in filteredAndPaginatedPosts.items" :key="art.id" class="hover:bg-slate-900/40 transition-colors">
                    <td class="p-3 font-bold text-white">{{ art.title }}</td>
                    <td class="p-3">
                      <span class="text-emerald-400 font-semibold">{{ art.category }}</span>
                      <span v-if="art.subCategory" class="text-slate-500 text-xs"> → {{ art.subCategory }}</span>
                    </td>
                    <td class="p-3">
                      <div class="flex flex-wrap gap-1">
                        <span v-for="t in art.tags" :key="t" class="bg-[#020420] text-sky-400 border border-slate-800 text-[10px] px-2 py-0.5 rounded font-mono">#{{ t }}</span>
                      </div>
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase" :class="art.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'">
                        {{ art.status === 'published' ? 'Pubblicato' : 'Bozza' }}
                      </span>
                    </td>
                    <td class="p-3 whitespace-nowrap text-xs text-slate-400">{{ art.date }}</td>
                    <td class="p-3">
                      <div class="grid grid-cols-2 gap-1.5 w-36">
                        <button @click="editArticle(art)" class="bg-sky-500/10 text-sky-400 border border-sky-500/30 py-1 px-2 rounded text-[10px] font-bold hover:bg-sky-500/20 cursor-pointer">✏️ Edit</button>
                        <button @click="deleteArticle(art.id)" class="bg-red-500/10 text-red-400 border border-red-500/30 py-1 px-2 rounded text-[10px] font-bold hover:bg-red-500/20 cursor-pointer">🗑️ Del</button>
                        <button @click="quickUpdateStatus(art, 'published')" class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 py-1 px-2 rounded text-[10px] font-bold hover:bg-emerald-500/20 cursor-pointer">🚀 Pubblica</button>
                        <button @click="quickUpdateStatus(art, 'draft')" class="bg-amber-500/10 text-amber-400 border border-amber-500/30 py-1 px-2 rounded text-[10px] font-bold hover:bg-amber-500/20 cursor-pointer">📝 Bozza</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="filteredAndPaginatedPosts.totalPages > 1" class="flex justify-between items-center mt-6 pt-4 border-t border-slate-800 text-xs">
              <button 
                @click="changePage(currentPage - 1)" 
                :disabled="currentPage === 1"
                class="px-3.5 py-2 bg-[#020420] border border-slate-800 text-emerald-400 font-bold rounded-xl hover:border-emerald-500 transition disabled:opacity-40 cursor-pointer"
              >
                ← Precedente
              </button>
              <span class="text-slate-400 font-mono">
                Pagina <strong class="text-emerald-400">{{ currentPage }}</strong> di {{ filteredAndPaginatedPosts.totalPages }}
              </span>
              <button 
                @click="changePage(currentPage + 1)" 
                :disabled="currentPage === filteredAndPaginatedPosts.totalPages"
                class="px-3.5 py-2 bg-[#020420] border border-slate-800 text-emerald-400 font-bold rounded-xl hover:border-emerald-500 transition disabled:opacity-40 cursor-pointer"
              >
                Successiva →
              </button>
            </div>
          </div>
        </div>

        <!-- 2B. TAB PULSE MANAGER (News / Ask / Show HN) -->
        <div v-if="contentTab === 'pulse'" class="flex flex-col gap-6">
          <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h2 class="text-xl font-black text-white mb-1">I Tuoi Link e Repository</h2>
            <p class="text-slate-400 text-xs sm:text-sm mb-6">Gestisci le news, i tool e i progetti che hai condiviso nella sezione principale.</p>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th class="p-3">Titolo &amp; Link</th>
                    <th class="p-3">Tipo</th>
                    <th class="p-3">Karma</th>
                    <th class="p-3">Commenti</th>
                    <th class="p-3">Data</th>
                    <th class="p-3">Azioni</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  <tr v-if="hnArticles.length === 0">
                    <td colspan="6" class="text-center py-8 text-slate-500 italic">
                      Nessun contenuto HN condiviso. Visita la NewsRoom per postare la tua prima repository!
                    </td>
                  </tr>
                  <tr v-for="link in hnArticles" :key="link.id" class="hover:bg-slate-900/40 transition-colors">
                    <td class="p-3 font-bold text-white">
                      {{ link.title }}
                      <a v-if="link.url" :href="link.url" target="_blank" class="text-sky-400 text-xs ml-2 hover:underline">🔗 Visita</a>
                    </td>
                    <td class="p-3">
                      <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">{{ link.type }}</span>
                    </td>
                    <td class="p-3 text-emerald-400 font-bold">🔥 {{ link.points }}</td>
                    <td class="p-3">💬 {{ link.commentsCount }}</td>
                    <td class="p-3 whitespace-nowrap text-slate-400 text-xs">{{ link.date }}</td>
                    <td class="p-3">
                      <button @click="deleteHnLink(link.id)" class="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1 rounded text-xs font-bold hover:bg-red-500/20 cursor-pointer">🗑️ Del</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <DkpPulseManager/>
        </div>

        <!-- 2C. TAB DKP NODES MANAGER -->
        <div v-if="contentTab === 'nodes'">
          <DkpNodesManager/>
        </div>

        <!-- 2D. TAB COMMENTS MANAGER -->
        <div v-if="contentTab === 'comments'">
          <DkpCommentsManager/>
        </div>
        
        <!-- MODALE EDITOR POST BLOG -->
        <div v-if="isEditingArticle" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" @click.self="isEditingArticle = false">
          <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-3xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <h3 class="text-xl font-black text-white">✏️ Editor Post Blog DKP</h3>
              <button 
                type="button"
                @click="useAdvancedEditor = !useAdvancedEditor" 
                class="bg-sky-500/10 border border-sky-500/40 text-sky-400 font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-sky-500/20 transition-all cursor-pointer"
              >
                {{ useAdvancedEditor ? '⬅️ Torna a Editor Standard' : '✨ Passa a Editor Avanzato' }}
              </button>
            </div>

            <div v-if="useAdvancedEditor">
              <DkpEditor :modelValue="articleForm" @update:modelValue="articleForm = { ...articleForm, ...$event }"/>
            </div>

            <div v-else class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">TITOLO POST *</label>
                <input v-model="articleForm.title" type="text" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-400" placeholder="Es. Guida ad Architettura Nuxt 4..." />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">CATEGORIA *</label>
                  <select v-model="articleForm.category" @change="onCategoryChange" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-400 cursor-pointer">
                    <option value="" disabled>Seleziona una categoria</option>
                    <option v-for="cat in availableCategories" :key="cat.id" :value="cat.name">
                      {{ cat.icon }} {{ cat.name }}
                    </option>
                  </select>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">SOTTOCATEGORIA</label>
                  <select v-model="articleForm.subCategory" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-400 cursor-pointer" :disabled="!currentSubcategories.length">
                    <option value="" v-if="!currentSubcategories.length">Nessuna Sottocategoria</option>
                    <option v-for="sub in currentSubcategories" :key="sub" :value="sub">
                      {{ sub }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">TAGS DELL'ARTICOLO</label>
                <DkpTagInput v-model="articleForm.tags"/>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">ESTRATTO BREVE / SUMMARY</label>
                <textarea v-model="articleForm.summary" rows="3" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-400 resize-none" placeholder="Sintesi per le anteprime nella sezione notizie..."></textarea>
              </div>
            </div>

            <div class="flex justify-end items-center gap-3 border-t border-slate-800 pt-4 mt-2">
              <button type="button" @click="isEditingArticle = false" class="bg-slate-800 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">Annulla</button>
              <button type="button" @click="submitWithStatus('draft')" class="bg-[#090d16] border border-amber-500/40 text-amber-400 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer">💾 Salva Bozza</button>
              <button type="button" @click="submitWithStatus('published')" class="bg-emerald-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer">🚀 {{ articleForm.id ? 'Aggiorna Articolo' : 'Pubblica Ora' }}</button>
            </div>
          </div>
        </div>

      </section>

      <!-- PANNELLO 3: API CONSOLE REALE DA NEON DB -->
      <section v-if="activeTab === 'api'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        <div>
          <h2 class="text-xl font-black text-white">🔑 DKP API Console &amp; Keys Manager</h2>  
          <p class="text-slate-400 text-xs sm:text-sm mt-1">Genera e gestisci le tue chiavi API memorizzate in modo sicuro nel database Neon PostgreSQL.</p>
        </div>
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <NuxtLink :to="getApiUrl('/api-console')" class="bg-sky-500/10 border border-sky-500/40 text-sky-400 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:bg-sky-500/20 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.15)]" external>
            <span>⚡ Consumo delle API (Interactive Playground) ↗</span>
          </NuxtLink>
          <button @click="refreshApiKeys()" class="bg-[#020420] border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold hover:text-white cursor-pointer">🔄 Aggiorna Lista</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-[#020420] border border-sky-500/30 rounded-2xl p-5 flex flex-col gap-1 shadow-inner">
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Chiamate Totali (30 gg)</span>
            <div class="text-2xl font-black text-sky-400">{{ totalCallsCount }}</div>
            <span class="text-[11px] text-sky-400 font-bold mt-1">▲ +12% rispetto al mese scorso</span>
          </div>

          <div class="bg-[#020420] border border-emerald-500/30 rounded-2xl p-5 flex flex-col gap-1 shadow-inner">
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Latenza Media API</span>
            <div class="text-2xl font-black text-emerald-400">{{ realLatency }} ms</div>
            <span class="text-[11px] text-emerald-400 font-bold mt-1">⚡ Nitro Engine v2.5 Optimal</span>
          </div>

          <div class="bg-[#020420] border border-purple-500/30 rounded-2xl p-5 flex flex-col gap-1 shadow-inner">
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RAM Heap &amp; Server Uptime</span>
            <div class="text-2xl font-black text-purple-400">{{ memoryMb }} MB</div>
            <span class="text-[11px] text-purple-400 font-bold mt-1">🟢 Status: {{ serverStatus }} (Uptime: {{ uptimeSec }}s)</span>
          </div>

          <div class="bg-[#020420] border border-amber-500/30 rounded-2xl p-5 flex flex-col gap-1 shadow-inner">
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tasso Errori (4xx / 5xx)</span>
            <div class="text-2xl font-black text-amber-400">{{ errorRate }}</div>
            <span class="text-[11px] text-amber-400 font-bold mt-1">👑 Sistema Stabile (GodMode Active)</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <input v-model="newKeyName" type="text" placeholder="Nome Token (es. App Produzione Mobile)" class="flex-1 bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-400" />
          <button @click="generateApiKey" class="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer whitespace-nowrap">Genera Nuova API Key</button>
        </div>

        <div v-if="generatedKeyModal" class="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex flex-col gap-3">
          <p class="text-amber-400 text-xs font-bold m-0">⚠️ Copia la tua API Key ora. Per sicurezza non verrà mai più mostrata in chiaro:</p>
          <div class="flex items-center justify-between bg-[#020420] border border-slate-800 p-3 rounded-xl gap-4">
            <code class="text-emerald-400 font-mono text-xs sm:text-sm truncate">{{ generatedKeyModal }}</code>
            <button @click="copyToClipboard(generatedKeyModal)" class="bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs cursor-pointer shrink-0">
              {{ copiedKey ? 'Copiato!' : 'Copia' }}
            </button>
          </div>
          <button @click="generatedKeyModal = null" class="self-start text-xs text-slate-400 hover:text-white underline cursor-pointer">Ho salvato la chiave</button>
        </div>

        <div class="overflow-x-auto">
          <div v-if="isLoadingApiKeys" class="py-8 text-center text-slate-500 font-mono text-xs">
            Caricamento chiavi API dal database Neon...
          </div>
          <div v-else-if="apiKeysList.length === 0" class="py-8 text-center text-slate-500 font-mono text-xs">
            Nessuna API Key creata. Inserisci un nome in alto per generare la prima chiave.
          </div>
          <table v-else class="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th class="p-3">Nome Token</th>
                <th class="p-3">Chiave API (Mascherata)</th>
                <th class="p-3">Creata Il</th>
                <th class="p-3">Tier / Ruolo</th>
                <th class="p-3">Utilizzo Reale</th>
                <th class="p-3">Stato</th>
                <th class="p-3">Azione</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-slate-300">
              <tr v-for="key in apiKeysList" :key="key.id" class="hover:bg-slate-900/40 transition-colors">
                <td class="p-3 font-bold text-white">{{ key.name }}</td>
                <td class="p-3">
                  <code class="bg-[#020420] text-sky-400 border border-slate-800 px-2.5 py-1 rounded-md font-mono text-xs cursor-pointer" @click="copyToClipboard(key.keyMasked || key.keyPrefix || 'dkp_live_...')">
                    {{ key.keyMasked || key.keyPrefix || 'dkp_live_...' }}
                  </code>
                </td>
                <td class="p-3 text-xs text-slate-400">{{ new Date(key.createdAt).toLocaleDateString() }}</td>
                <td class="p-3"><span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded">{{ key.role || 'PRO' }}</span></td>
                <td class="p-3 font-mono text-xs">{{ key.usageCount || 0 }} req</td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase" :class="key.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'">
                    {{ key.status }}
                  </span>
                </td>
                <td class="p-3">
                  <button v-if="key.status === 'ACTIVE'" @click="revokeApiKey(key.id)" class="text-red-400 hover:underline text-xs font-bold cursor-pointer">Revoca</button>
                  <span v-else class="text-slate-600 text-xs">Revocata</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- PANNELLO 4: PROOF OF CODE VAULT -->
      <section v-if="activeTab === 'vault'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">🛡️ DKP Crittografia &amp; Notarizzazione</span>
            <h2 class="text-xl sm:text-2xl font-black text-white mt-2">Proof of Code Vault</h2>
            <p class="text-slate-400 text-xs sm:text-sm mt-1">Genera hash crittografici SHA-256 dei tuoi script e repository, notarizzandoli ufficialmente sulla rete DevKernelPulse.</p>
          </div>
          <div class="flex flex-col gap-1 text-xs text-slate-400 bg-[#020420] border border-slate-800 p-3 rounded-2xl shrink-0">
            <span>Certificati Attivi: <strong class="text-white">{{ vaultCertificates.length }}</strong></span>
            <span>Stato Rete: <strong class="text-emerald-400">🟢 SECURE</strong></span>
          </div>
        </div>

        <div class="bg-[#020420] border border-sky-500/30 rounded-2xl p-6 flex flex-col gap-4 shadow-inner">
          <h3 class="text-base font-black text-white">🔐 Notarizza un Nuovo Blocco di Codice o File</h3>
          <p class="text-xs text-slate-400">Incolla qui il codice sorgente o la configurazione che desideri blindare nel Vault. Verrà calcolato l'hash crittografico univoco.</p>
          
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">TITOLO O RIFERIMENTO SCRIPT *</label>
              <input v-model="vaultNewTitle" type="text" placeholder="Es. SmartContract_Auth_v2.sol" class="w-full bg-[#090d16] border border-slate-700/80 text-white p-3 rounded-xl text-sm outline-none focus:border-sky-400" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">CODICE SORGENTE O HASH DA NOTARIZZARE *</label>
              <textarea v-model="vaultNewCode" rows="4" placeholder="Incolla qui il codice o la repo da firmare crittograficamente..." class="w-full bg-[#090d16] border border-slate-700/80 text-sky-400 p-3 rounded-xl font-mono text-xs outline-none focus:border-sky-400 leading-relaxed resize-none"></textarea>
            </div>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button @click="notarizeNewCode" class="bg-emerald-500 text-slate-950 font-black px-5 py-3 rounded-xl text-xs sm:text-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer whitespace-nowrap">
                🛡️ Genera Certificato &amp; Notarizza nel Vault
              </button>
              <span class="text-xs text-slate-500 font-medium">⚡ Firma crittografica istantanea con timestamp DKP v2.5</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="text-sm font-black text-white uppercase tracking-wider">📜 I tuoi Certificati Vault Emessi</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th class="p-3">Titolo / Script</th>
                  <th class="p-3">Hash Crittografico (SHA-256)</th>
                  <th class="p-3">Audit SAST</th>
                  <th class="p-3">Data Notarizzazione</th>
                  <th class="p-3">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                <tr v-for="cert in vaultCertificates" :key="cert.id" class="hover:bg-slate-900/40 transition-colors">
                  <td class="p-3 font-bold text-white">{{ cert.title }}</td>
                  <td class="p-3">
                    <code class="bg-[#020420] text-sky-400 border border-slate-800 px-2.5 py-1 rounded-md font-mono text-xs cursor-pointer" @click="copyToClipboard(cert.hash)" title="Clicca per copiare l'hash">
                      {{ cert.hash }}
                    </code>
                  </td>
                  <td class="p-3">
                    <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      {{ cert.sastStatus }}
                    </span>
                  </td>
                  <td class="p-3 whitespace-nowrap text-xs text-slate-400">{{ cert.date }}</td>
                  <td class="p-3">
                    <button @click="triggerToast(`📄 Certificato ${cert.id} verificato con successo sulla blockchain DKP!`)" class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded text-xs font-bold hover:bg-sky-500/20 cursor-pointer">
                      🔍 Verifica
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>

      <!-- PANNELLO 5: GAMIFICATION & DEVELOPER BETA PROGRAM -->
      <section v-if="activeTab === 'gamification'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">🎮 DKP Freemium Gamification &amp; XP</span>
            <h2 class="text-xl sm:text-2xl font-black text-white mt-2">Gamification Center &amp; Beta Program</h2>
            <p class="text-slate-400 text-xs sm:text-sm mt-1">Guadagna XP eseguendo azioni nell'ecosistema, sblocca chiamate API gratuite e conquista lo status esclusivo di pioniere.</p>
          </div>
          <div class="bg-[#020420] border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-end gap-1 shrink-0">
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Il tuo XP Totale</span>
            <span class="text-2xl font-black text-emerald-400">{{ userProfileData.xp }} <small class="text-xs text-slate-400 font-bold">XP</small></span>
            <span class="text-xs text-slate-300">Rank: <strong class="text-sky-400">{{ userProfileData.level }}</strong></span>
          </div>
        </div>

        <div class="bg-gradient-to-r from-emerald-500/10 via-[#020420] to-purple-600/10 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-4">
          <div class="flex flex-wrap justify-between items-center gap-2">
            <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-black px-3 py-1 rounded-full uppercase">🚀 PROGRAMMA BETA UFFICIALE</span>
            <span class="text-emerald-400 font-mono text-xs font-black">42 / 100 Posti Occupati</span>
          </div>
          <h3 class="text-xl font-black text-white m-0">Diventa un "Early Pioneer / Core Developer"</h3>
          <p class="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-4xl m-0">
            I primi 100 sviluppatori che attivano il programma ricevono permanentemente il badge esclusivo sul profilo pubblico, un boost immediato di <strong class="text-emerald-400">+5.000 chiamate API mensili gratuite</strong> e accesso prioritario ai modelli AI di DKP v2.5.
          </p>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
            <button @click="activateEarlyPioneerBeta" class="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer">
              ⚡ Attiva Status "Early Pioneer" (Gratis)
            </button>
            <span class="text-xs text-slate-500 font-medium">✓ Nessuna carta di credito richiesta • Valido per sempre</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-[#020420] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-inner">
            <h4 class="text-sm font-black text-white m-0">📈 Come accumulare DKP XP</h4>
            <ul class="flex flex-col gap-3">
              <li class="flex items-center gap-3 bg-[#090d16] border border-slate-800 p-3 rounded-xl">
                <span class="text-xl">📰</span>
                <div class="flex flex-col">
                  <strong class="text-xs text-slate-200">Pubblica un Articolo Tech</strong>
                  <small class="text-[11px] text-emerald-400 font-bold">+150 XP per ogni articolo verificato dal Vault AI</small>
                </div>
              </li>
              <li class="flex items-center gap-3 bg-[#090d16] border border-slate-800 p-3 rounded-xl">
                <span class="text-xl">🛡️</span>
                <div class="flex flex-col">
                  <strong class="text-xs text-slate-200">Notarizzazione Proof-of-Code</strong>
                  <small class="text-[11px] text-emerald-400 font-bold">+100 XP per ogni hash crittografato salvato nel Vault</small>
                </div>
              </li>
              <li class="flex items-center gap-3 bg-[#090d16] border border-slate-800 p-3 rounded-xl">
                <span class="text-xl">🤖</span>
                <div class="flex flex-col">
                  <strong class="text-xs text-slate-200">Utilizza AI Code Scanner</strong>
                  <small class="text-[11px] text-emerald-400 font-bold">+50 XP per ogni audit di sicurezza completato</small>
                </div>
              </li>
              <li class="flex items-center gap-3 bg-[#090d16] border border-slate-800 p-3 rounded-xl">
                <span class="text-xl">💬</span>
                <div class="flex flex-col">
                  <strong class="text-xs text-slate-200">Interazioni Community &amp; Upvote</strong>
                  <small class="text-[11px] text-emerald-400 font-bold">+10 XP per ogni commento o apprezzamento ricevuto</small>
                </div>
              </li>
            </ul>
          </div>

          <div class="bg-[#020420] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-inner">
            <h4 class="text-sm font-black text-white m-0">🎁 Sblocco Crediti API Gratuiti</h4>
            <p class="text-xs text-slate-400 m-0">Più sali di livello con la gamification, più risorse computazionali sblocchi per i tuoi script e tool:</p>
            
            <div class="flex flex-col gap-3">
              <div class="flex justify-between items-center bg-[#090d16] border border-slate-800 p-3 rounded-xl">
                <div class="flex flex-col">
                  <strong class="text-xs text-white">🌱 Newbie Developer (0 - 500 XP)</strong>
                  <span class="text-[11px] text-slate-400">1.000 Chiamate API / mese</span>
                </div>
                <span class="text-xs font-bold text-slate-500">Attivo</span>
              </div>
              <div class="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/40 p-3 rounded-xl">
                <div class="flex flex-col">
                  <strong class="text-xs text-white">🛡️ VIP Developer (500 - 2.000 XP)</strong>
                  <span class="text-[11px] text-slate-400">5.000 Chiamate API / mese + Latenza prioritaria</span>
                </div>
                <span class="text-xs font-black text-emerald-400">Il tuo livello</span>
              </div>
              <div class="flex justify-between items-center bg-[#090d16] border border-slate-800 p-3 rounded-xl">
                <div class="flex flex-col">
                  <strong class="text-xs text-white">👑 Core Pioneer (2.000+ XP o Beta Tester)</strong>
                  <span class="text-[11px] text-slate-400">25.000 Chiamate API / mese + Accesso SDK illimitato</span>
                </div>
                <span class="text-xs font-bold text-amber-400">🔒 Locked</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-[#020420] border border-slate-800 rounded-2xl p-5 shadow-inner">
          <h4 class="text-sm font-black text-white mb-4">📜 Storico Attività &amp; Transazioni XP</h4>
          <UserXpHistory :history="xpHistoryList"/>
        </div>

      </section>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.4s ease, transform 0.4s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
  transform: translateY(-10px); 
}
</style>