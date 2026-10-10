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
  <div class="blog-post-container max-w-4xl mx-auto px-4 py-12">
    <div v-if="pending" class="text-center py-20 text-emerald-400">
      <span class="text-3xl animate-pulse inline-block mb-4">⚡</span>
      <p>Caricamento Vault in corso...</p>
    </div>
    
    <div v-else-if="error || !post" class="text-center py-20 text-red-400">
      <h2 class="text-2xl mb-4">⚠️ Articolo non trovato</h2>
      <p>L'articolo richiesto non esiste o è stato rimosso dal Vault.</p>
      <NuxtLink to="/blog" class="mt-6 inline-block text-emerald-400 hover:underline">← Torna alla NewsRoom</NuxtLink>
    </div>
    
    <article v-else class="glass-panel p-8 rounded-2xl border border-slate-800 bg-[#0b0f19] shadow-2xl">
      <NuxtLink to="/blog" class="text-emerald-400 hover:text-emerald-300 text-sm font-bold mb-6 inline-block">← Torna al Blog</NuxtLink>
      
      <div class="mb-4">
         <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
           {{ post.categoryName || post.category || 'Generale' }}
         </span>
      </div>

      <h1 class="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">{{ post.title }}</h1>
      
      <div class="flex items-center gap-4 text-sm text-slate-400 mb-10 pb-6 border-b border-slate-800">
        <span>👤 {{ post.authorName || 'DevKernelPulse Team' }}</span>
        <span>📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : (post.date || 'Recente') }}</span>
        <span>👁️ {{ post.views || 0 }} visualizzazioni</span>
      </div>

      <p v-if="post.excerpt" class="text-sky-400 font-semibold text-lg leading-relaxed mb-8 border-l-4 border-sky-400 pl-4">
        {{ post.excerpt }}
      </p>

      <!-- 🚀 Render Html Parsato (Aggiunta classe dkp-preview-content) -->
      <div class="prose prose-invert max-w-none text-slate-200 mb-12 dkp-preview-content" v-html="post.content"></div>

      <!-- Tags dell'articolo -->
      <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-10">
        <span v-for="tag in post.tags" :key="tag" class="bg-[#020420] text-sky-400 border border-slate-700 px-2 py-1 rounded text-xs font-mono">
          #{{ tag }}
        </span>
      </div>

      <!-- 🚀 Barra Social integrata -->
      <div class="border-t border-slate-800 pt-8 mt-8">
        <SocialShare :title="post.title" />
      </div>
    </article>
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