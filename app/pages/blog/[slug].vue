<!-- app/pages/blog/[slug].vue -->
<script setup lang="ts">
import { computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SocialShare from '~/components/blog/SocialShare.vue'

const route = useRoute()
const slug = route.params.slug as string

// 🔥 FIX: Fetch reattiva del post dal DB tramite lo slug con il nuovo URL corretto
const { data: res, pending, error } = await useFetch(`/api/blog/posts/${slug}`)
const post = computed(() => (res.value as any)?.data)

useDkpSeo({
  title: post.value ? `${post.value.title} - DevKernelPulse` : 'Articolo DKP',
  description: post.value?.excerpt || 'Approfondimento tecnico dall ecosistema DKP.'
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
</script>

<template>
  <div class="blog-post-container max-w-6xl mx-auto px-4 py-12">
    <div v-if="pending" class="text-center py-20 text-emerald-400">
      <span class="text-3xl animate-pulse inline-block mb-4">⚡</span>
      <p>Caricamento Vault in corso...</p>
    </div>
    
    <div v-else-if="error || !post" class="text-center py-20 text-red-400">
      <h2 class="text-2xl mb-4">⚠️ Articolo non trovato</h2>
      <p>L'articolo richiesto non esiste o è stato rimosso dal Vault.</p>
      <NuxtLink to="/blog" class="mt-6 inline-block text-emerald-400 hover:underline">← Torna alla NewsRoom</NuxtLink>
    </div>
    
    <!-- LAYOUT A GRIGLIA: Sidebar (Social) + Contenuto Centrale -->
    <div v-else class="flex flex-col lg:flex-row gap-8 relative">
      
      <!-- 📱 SOCIAL STICKY SIDEBAR (Desktop) -->
      <aside class="hidden lg:block w-16 flex-shrink-0">
        <div class="sticky top-32 flex flex-col items-center gap-4">
           <!-- Qui renderizziamo i pulsanti social in verticale -->
           <SocialShare :title="post.title" :vertical="true" />
        </div>
      </aside>

      <!-- 📝 CONTENUTO ARTICOLO -->
      <article class="flex-1 glass-panel p-6 sm:p-10 rounded-2xl border border-slate-800 bg-[#0b0f19] shadow-2xl relative overflow-hidden">
        
        <!-- Breadcrumb & Badge -->
        <div class="flex justify-between items-start mb-8 relative z-10">
          <NuxtLink to="/blog" class="text-emerald-400 hover:text-emerald-300 text-sm font-bold flex items-center gap-2 transition-colors">
            <span>←</span> Torna all'Hub
          </NuxtLink>
          <div class="flex items-center gap-3">
             <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
               {{ post.categoryName || post.category || 'Generale' }}
             </span>
             <span v-if="post.isVerified" class="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
               <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
               DKP Verified
             </span>
          </div>
        </div>

        <h1 class="text-3xl md:text-5xl font-extrabold text-white mb-8 leading-tight relative z-10">{{ post.title }}</h1>
        
        <!-- 🧑‍💻 BLOCCO AUTORE PREMIUM -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#020420] border border-slate-800 mb-10 relative z-10">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              {{ (post.authorName || 'D')[0].toUpperCase() }}
            </div>
            <div>
              <div class="text-slate-200 font-bold flex items-center gap-2">
                {{ post.authorName || 'DevKernelPulse Team' }}
                <span class="text-[0.65rem] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded uppercase tracking-wider">Gold Author</span>
              </div>
              <div class="text-xs text-slate-400 flex items-center gap-3 mt-1">
                <span>📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : (post.date || 'Recente') }}</span>
                <span>👁️ {{ post.views || 0 }} visualizzazioni</span>
                <span class="text-sky-400 font-mono">⚡ 1500 DKP Rep</span>
              </div>
            </div>
          </div>
          <button class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors border border-slate-700">
            Vedi Profilo ↗
          </button>
        </div>

        <!-- Estratto -->
        <p v-if="post.excerpt" class="text-sky-400 font-semibold text-lg leading-relaxed mb-8 border-l-4 border-sky-400 pl-4 relative z-10">
          {{ post.excerpt }}
        </p>

        <!-- 🚀 Render Html Parsato -->
        <div class="prose prose-invert max-w-none text-slate-200 mb-12 dkp-preview-content relative z-10" v-html="post.content"></div>

        <!-- Tags dell'articolo -->
        <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-10 relative z-10">
          <span v-for="tag in post.tags" :key="tag" class="bg-[#020420] text-sky-400 border border-slate-700 px-2 py-1 rounded text-xs font-mono transition-colors hover:border-sky-500 cursor-pointer">
            #{{ tag }}
          </span>
        </div>

        <!-- 🛡️ DKP VAULT CERTIFICATE SECTION -->
        <div v-if="post.isVerified && post.vaultCertificateId" class="mt-12 bg-[#020420] border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)] z-10">
          <div class="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <div>
                <h3 class="text-emerald-400 font-bold text-lg tracking-wide uppercase">Vault Notarization Certificate</h3>
                <p class="text-xs text-slate-400 mt-0.5">Proof of Code & Security Scan by Pulse Sentinel AI</p>
              </div>
            </div>
            <!-- Pulsante Verifica Interattiva -->
            <button class="hidden sm:flex items-center gap-2 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1.5 rounded transition-colors">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Verifica Integrità
            </button>
          </div>

          <div class="bg-[#090d16] border border-slate-800 rounded-lg p-4 font-mono text-[11px] sm:text-xs text-slate-300 relative z-10">
            <div class="flex flex-col sm:flex-row sm:justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <span class="text-slate-500 font-semibold">CERTIFICATE_ID:</span>
              <span class="text-emerald-400 font-bold select-all">{{ post.vaultCertificateId }}</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
              <span class="text-slate-500 font-semibold">TIMESTAMP:</span>
              <span class="text-slate-300">{{ new Date(post.updatedAt || post.createdAt).toISOString() }}</span>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-slate-500 font-semibold">SHA-256 SECURE CHECKSUM:</span>
              <span class="text-sky-400 select-all break-all bg-[#020420] p-2 rounded border border-slate-800">{{ post.vaultHash }}</span>
            </div>
          </div>
        </div>

        <!-- 📱 Barra Social Mobile (nascosta su desktop) -->
        <div class="lg:hidden border-t border-slate-800 pt-8 mt-8 relative z-10">
          <SocialShare :title="post.title" />
        </div>
      </article>
    </div>
  </div>
</template>
<style scoped>
.glass-panel {
  backdrop-filter: blur(12px);
}

/* Stili DKP Pro Editor per renderizzare esattamente come nell'anteprima */
:deep(.dkp-inline-code) { 
  background-color: rgba(30, 41, 59, 0.8); 
  color: #e2e8f0; 
  padding: 0.2rem 0.4rem; 
  border-radius: 6px; 
  font-family: 'Fira Code', Consolas, monospace; 
  font-size: 0.85rem; 
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.dkp-preview-content ul), :deep(.dkp-preview-content ol) { 
  padding-left: 1.5rem; 
  margin: 0.8rem 0; 
  color: #cbd5e1;
}
:deep(.dkp-preview-content ul) { list-style-type: none; }
:deep(.dkp-preview-content ol) { list-style-type: decimal; }

:deep(.dkp-li-main) { 
  margin-bottom: 0.4rem; 
  position: relative;
}
:deep(ul > .dkp-li-main::before) {
  content: '○';
  color: #38bdf8;
  position: absolute;
  left: -1.2rem;
  top: 0;
  font-weight: bold;
}

:deep(.dkp-li-nested) { 
  margin-left: 1.5rem; 
  margin-bottom: 0.3rem; 
  color: #94a3b8; 
  position: relative;
}
:deep(ul > .dkp-li-nested:not(.dkp-li-num)::before) {
  content: '▪'; 
  color: #00dc82;
  position: absolute;
  left: -1.2rem;
  top: 0;
}

:deep(.dkp-code-wrapper) {
  background: #0d1117; 
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
  margin: 1.2rem 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

:deep(.dkp-code-header) {
  background: #161b22;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
  font-family: sans-serif;
  font-size: 0.8rem;
  font-weight: bold;
  color: #8b949e;
  text-transform: capitalize;
}

:deep(.dkp-code-block) { 
  padding: 1rem; 
  margin: 0;
  overflow-x: auto; 
}

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