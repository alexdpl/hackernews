<!-- app/pages/blog/[id].vue -->
<script setup lang="ts">
import { computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBlog } from '~/composables/useBlog'

const route = useRoute()
const postIdOrSlug = route.params.id as string

// 1. Inizializziamo il nostro super-composable v2.5-GOLD
const { likePost, incrementView, getAuthorRank, sharePost } = useBlog()

// 2. Fetch diretto dall'API Neon 
const { data: apiResponse, pending, error } = await useFetch(`/api/blog/posts/${postIdOrSlug}`)
const post = computed(() => (apiResponse.value as any)?.data)

// 3. Calcolo dinamico del Rank dell'autore (Gamification)
const authorRank = computed(() => {
  // Passiamo gli XP dell'autore (se l'API non li restituisce, passiamo 0)
  return getAuthorRank(post.value?.authorXp || 0)
})

useDkpSeo({
  title: post.value ? `${post.value.title} - DevKernelPulse` : 'Articolo DKP',
  description: post.value?.excerpt || 'Approfondimento tecnico dall ecosistema DKP.'
})

onMounted(() => {
  if (post.value?.id) {
    incrementView(String(post.value.id))
  }
})

// === DYNAMIC PRISM HIGHLIGHT ===
const applyPrism = () => {
  if (typeof window !== 'undefined' && (window as any).Prism) {
    (window as any).Prism.highlightAll();
  }
};

watch(post, async () => {
  await nextTick();
  applyPrism();
});

onMounted(() => {
  setTimeout(applyPrism, 100);
});
// =================================

function handleLike() {
  if (post.value?.id) {
    likePost(String(post.value.id))
    // Aggiornamento ottimistico dell'UI
    post.value.likes = (post.value.likes || 0) + 1
  }
}

const currentUrl = computed(() => {
  if (typeof window !== 'undefined') return window.location.href
  return `https://devkernelpulse.com/blog/${postIdOrSlug}`
})
</script>

<template>
  <div class="blog-post-container max-w-6xl mx-auto px-4 py-12">
    <!-- State: Loading -->
    <div v-if="pending" class="text-center py-20 text-emerald-400">
      <span class="text-3xl animate-pulse inline-block mb-4">⚡</span>
      <p>Caricamento Vault in corso...</p>
    </div>
    
    <!-- State: Error/Not Found -->
    <div v-else-if="error || !post" class="text-center py-20 text-red-400">
      <h2 class="text-2xl mb-4">⚠️ Articolo non trovato</h2>
      <p>L'articolo richiesto non esiste o è stato rimosso dal Vault.</p>
      <NuxtLink to="/blog" class="mt-6 inline-block text-emerald-400 hover:underline">← Torna alla NewsRoom</NuxtLink>
    </div>
    
    <!-- State: Post Trovato -->
    <div v-else class="flex flex-col lg:flex-row gap-8 relative">
      
      <!-- 📱 SOCIAL STICKY SIDEBAR (Desktop) - Ora usa le funzioni native di useBlog -->
      <aside class="hidden lg:block w-16 flex-shrink-0">
        <div class="sticky top-32 flex flex-col items-center gap-4 bg-[#020420] p-3 rounded-2xl border border-slate-800 shadow-xl">
           <button @click="sharePost('twitter', currentUrl, post.title)" class="social-btn text-slate-300 hover:text-[#1DA1F2]" title="Condividi su X">𝕏</button>
           <button @click="sharePost('linkedin', currentUrl, post.title)" class="social-btn text-slate-300 hover:text-[#0077b5]" title="Condividi su LinkedIn">in</button>
           <button @click="sharePost('reddit', currentUrl, post.title)" class="social-btn text-slate-300 hover:text-[#FF4500]" title="Condividi su Reddit">👽</button>
           <div class="w-8 h-px bg-slate-700 my-2"></div>
           <button @click="handleLike" class="social-btn text-slate-300 hover:text-rose-500" title="Lascia Karma">❤️</button>
           <span class="text-xs font-bold text-emerald-400">{{ post.likes || 0 }}</span>
        </div>
      </aside>

      <!-- 📝 CONTENUTO ARTICOLO -->
      <article class="flex-1 glass-panel p-6 sm:p-10 rounded-2xl border border-slate-800 bg-[#0b0f19] shadow-2xl relative overflow-hidden">
        
        <!-- Breadcrumb & Badge -->
        <div class="flex justify-between items-start mb-8 relative z-10">
          <NuxtLink to="/blog" class="text-emerald-400 hover:text-emerald-300 text-sm font-bold flex items-center gap-2 transition-colors">
            <span>←</span> Torna all'Hub
          </NuxtLink>
          <div class="flex items-center gap-3 flex-wrap justify-end">
             <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
               {{ post.categoryName || post.category || 'Generale' }}
             </span>
             <span v-if="post.isVerified" class="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
               DKP Verified
             </span>
          </div>
        </div>

        <h1 class="text-3xl md:text-5xl font-extrabold text-white mb-8 leading-tight relative z-10">{{ post.title }}</h1>
        
        <!-- 🧑‍💻 BLOCCO AUTORE PREMIUM CON GAMIFICATION DINAMICA -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#020420] border mb-10 relative z-10 transition-colors"
             :style="{ borderColor: `${authorRank.color}40`, boxShadow: `0 4px 20px ${authorRank.color}10` }">
          <div class="flex items-center gap-4">
            <!-- Avatar dell'autore -->
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2"
                 :style="{ background: `linear-gradient(135deg, ${authorRank.color}, #0f172a)`, borderColor: authorRank.color }">
              {{ (post.authorName || 'D')[0].toUpperCase() }}
            </div>
            <div>
              <div class="text-slate-200 font-bold flex items-center gap-2">
                {{ post.authorName || 'DevKernelPulse Team' }}
                <!-- Badge Gamification -->
                <span class="text-[0.65rem] px-2 py-0.5 rounded uppercase tracking-wider border font-bold flex items-center gap-1"
                      :style="{ backgroundColor: `${authorRank.color}15`, color: authorRank.color, borderColor: `${authorRank.color}40` }">
                  <span>{{ authorRank.badge }}</span> Lvl. {{ authorRank.level }} - {{ authorRank.title }}
                </span>
              </div>
              <div class="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                <span>📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : (post.date || 'Recente') }}</span>
                <span>👁️ {{ post.views || 0 }} visualizzazioni</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Estratto -->
        <p v-if="post.excerpt || post.summary" class="text-sky-400 font-semibold text-lg leading-relaxed mb-8 border-l-4 border-sky-400 pl-4 relative z-10">
          {{ post.excerpt || post.summary }}
        </p>

        <!-- 🚀 Render Html Parsato -->
        <div class="prose prose-invert max-w-none text-slate-200 mb-12 dkp-preview-content relative z-10" v-html="post.content || post.description || 'Nessun contenuto esteso disponibile.'"></div>

        <!-- Tags dell'articolo -->
        <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-10 relative z-10">
          <span v-for="tag in post.tags" :key="tag" class="bg-[#020420] text-sky-400 border border-slate-700 px-2 py-1 rounded text-xs font-mono transition-colors hover:border-sky-500 cursor-pointer">
            #{{ tag }}
          </span>
        </div>

        <!-- 🛡️ DKP VAULT CERTIFICATE SECTION -->
        <div v-if="post.isVerified && post.vaultCertificateId" class="mt-12 mb-12 bg-[#020420] border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)] z-10">
          <div class="flex items-center gap-3 mb-4">
            <div class="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
              <span class="text-emerald-400 text-xl">🛡️</span>
            </div>
            <div>
              <h3 class="text-emerald-400 font-bold text-lg tracking-wide uppercase">Vault Notarization Certificate</h3>
              <p class="text-xs text-slate-400 mt-0.5">Proof of Code & Security Scan by Pulse Sentinel AI</p>
            </div>
          </div>
          <div class="bg-[#090d16] border border-slate-800 rounded-lg p-4 font-mono text-[11px] sm:text-xs text-slate-300 relative z-10">
            <div class="flex flex-col gap-2 border-b border-slate-800 pb-3 mb-3">
              <span class="text-slate-500 font-semibold">CERTIFICATE_ID:</span>
              <span class="text-emerald-400 font-bold select-all">{{ post.vaultCertificateId }}</span>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-slate-500 font-semibold">SHA-256 SECURE CHECKSUM:</span>
              <span class="text-sky-400 select-all break-all bg-[#020420] p-2 rounded border border-slate-800">{{ post.vaultHash }}</span>
            </div>
          </div>
        </div>

        <!-- Sezione Karma Likes & Social Share -->
        <div class="article-actions-footer bg-[#020420] border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 mt-8">
          <div class="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
            <button @click="handleLike" class="bg-emerald-500 hover:bg-emerald-400 text-slate-900 border-none px-6 py-3 rounded-lg font-bold text-lg cursor-pointer flex items-center gap-2 transition-all transform hover:-translate-y-1 shadow-lg">
              🔥 Accendi Kernel <span class="bg-[#020420] text-emerald-400 px-3 py-1 rounded text-sm">{{ post.likes || 0 }}</span>
            </button>
            <span class="text-slate-400 text-xs">Premi per premiare questo articolo con Karma!</span>
          </div>

          <!-- 📱 Barra Social Mobile / Tablet -->
          <div class="flex flex-col gap-3 items-center md:items-end lg:hidden">
            <span class="text-slate-400 text-sm font-semibold">Condividi con il network:</span>
            <div class="flex gap-4">
              <button @click="sharePost('twitter', currentUrl, post.title)" class="social-btn text-slate-300 hover:text-[#1DA1F2]">𝕏</button>
              <button @click="sharePost('linkedin', currentUrl, post.title)" class="social-btn text-slate-300 hover:text-[#0077b5]">in</button>
              <button @click="sharePost('reddit', currentUrl, post.title)" class="social-btn text-slate-300 hover:text-[#FF4500]">👽</button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.glass-panel { backdrop-filter: blur(12px); }

.social-btn {
  font-size: 1.2rem;
  font-weight: bold;
  font-family: monospace;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, color 0.2s;
}
.social-btn:hover { transform: scale(1.1); }

/* === GLI STILI DEL TUO EDITOR PRISM/DKP MANTENUTI E AGGIORNATI === */
:deep(.dkp-img) { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; box-shadow: 0 4px 15px rgba(0,0,0,0.4); display: block; }
:deep(.dkp-video-wrapper) { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
:deep(.dkp-video-wrapper iframe) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
:deep(.dkp-highlight) { background-color: rgba(0, 220, 130, 0.25); color: #f8fafc; padding: 0.1rem 0.3rem; border-radius: 4px; }
:deep(.dkp-underline) { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #38bdf8; text-decoration-thickness: 2px; }

:deep(.dkp-inline-code) { background-color: rgba(30, 41, 59, 0.8); color: #e2e8f0; padding: 0.2rem 0.4rem; border-radius: 6px; font-family: 'Fira Code', Consolas, monospace; font-size: 0.85rem; border: 1px solid rgba(255, 255, 255, 0.1); }
:deep(.dkp-preview-content ul), :deep(.dkp-preview-content ol) { padding-left: 1.5rem; margin: 0.8rem 0; color: #cbd5e1; }
:deep(.dkp-preview-content ul) { list-style-type: none; }
:deep(.dkp-preview-content ol) { list-style-type: decimal; }
:deep(.dkp-li-main) { margin-bottom: 0.4rem; position: relative; }
:deep(ul > .dkp-li-main::before) { content: '○'; color: #38bdf8; position: absolute; left: -1.2rem; top: 0; font-weight: bold; }
:deep(.dkp-li-nested) { margin-left: 1.5rem; margin-bottom: 0.3rem; color: #94a3b8; position: relative; }
:deep(ul > .dkp-li-nested:not(.dkp-li-num)::before) { content: '▪'; color: #00dc82; position: absolute; left: -1.2rem; top: 0; }
:deep(.dkp-code-wrapper) { background: #0d1117; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; margin: 1.2rem 0; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
:deep(.dkp-code-header) { background: #161b22; padding: 0.5rem 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; font-family: sans-serif; font-size: 0.8rem; font-weight: bold; color: #8b949e; text-transform: capitalize; }
:deep(.dkp-code-block) { padding: 1rem; margin: 0; overflow-x: auto; }
:deep(.dkp-h1) { font-size: 1.8rem; font-weight: 900; color: #ffffff; margin-top: 1.2rem; margin-bottom: 0.6rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.3rem;}
:deep(.dkp-h2) { font-size: 1.4rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
:deep(.dkp-h3) { font-size: 1.1rem; font-weight: 700; color: #00dc82; margin-top: 0.8rem; margin-bottom: 0.4rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.8rem; color: #94a3b8; font-style: italic; margin: 0.8rem 0; background: rgba(0, 220, 130, 0.05); padding-top: 0.2rem; padding-bottom: 0.2rem;}
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px;}
:deep(.dkp-link:hover) { color: #00dc82;}
:deep(.dkp-table-wrapper) { overflow-x: auto; margin: 1rem 0; border-radius: 8px; border: 1px solid #1e293b; }
:deep(.dkp-table) { width: 100%; border-collapse: collapse; text-align: left; background: #090d16; font-size: 0.85rem;}
:deep(.dkp-table td) { padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
:deep(.dkp-table tr:first-child td) { background: #020420; color: #00dc82; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;}
:deep(.dkp-table tr:last-child td) { border-bottom: none; }
</style>