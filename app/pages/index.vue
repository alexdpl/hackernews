<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

useHead({
  title: 'DevKernelPulse — The Developer Ecosystem & AI Tech Stream v2.6',
  meta: [
    {
      name: 'description',
      content: 'Infrastruttura per sviluppatori, strumenti di sicurezza notarizzati e newsroom AI in tempo reale da Hacker News.'
    }
  ]
})

// Recupero dinamico di 4 articoli in evidenza dal Vault
const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts').catch(() => null)
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    if (raw && raw.length > 0) {
      featuredArticles.value = raw.slice(0, 4)
    } else {
      populateFallbackArticles()
    }
  } catch (err) {
    console.error('Errore recupero articoli Vault:', err)
    populateFallbackArticles()
  }
})

function populateFallbackArticles() {
  featuredArticles.value = [
    { id: 1, title: 'Guida all\'Architettura Nuxt 4 & Rolldown', category: 'Cloud Native & DevOps', categoryName: 'DevOps', slug: 'nuxt-4-rolldown' },
    { id: 2, title: 'Integrazione Ollama e LLM Locali in Vue 3', category: 'AI & Machine Learning', categoryName: 'AI / LLM', slug: 'ollama-vue3' },
    { id: 3, title: 'Notarizzazione Codice & Hashing SHA-256', category: 'Cybersecurity & Vault', categoryName: 'Security', slug: 'vault-sha256' },
    { id: 4, title: 'Telemetria SSE Live & Worker Nitro v2.6', category: 'Backend Architecture', categoryName: 'Backend', slug: 'sse-nitro-v26' }
  ]
}
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-kernel)] text-[var(--text-main)] font-sans px-4 sm:px-6 py-12 relative overflow-hidden transition-colors duration-500">
    
    <!-- BACKGROUND GLOWS GLOBALI -->
    <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--accent-emerald)]/10 blur-[120px] rounded-[100%] pointer-events-none"></div>

    <div class="max-w-6xl mx-auto flex flex-col gap-12 sm:gap-16 relative z-10">
      
      <!-- HERO SECTION PRINCIPALE -->
      <section class="relative py-8 sm:py-16 text-center flex flex-col items-center gap-6 overflow-hidden">
        
        <!-- BADGE ECOSYSTEM V2.6 -->
        <div class="inline-flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--accent-emerald)]/30 px-5 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-colors duration-500">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-emerald)] opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent-emerald)]"></span>
          </span>
          <span class="text-[11px] font-mono font-black text-[var(--accent-emerald)] uppercase tracking-widest">
            DevKernelPulse v2.6 Ecosystem
          </span>
        </div>

        <h1 class="text-4xl sm:text-6xl font-black text-[var(--text-main)] tracking-tight leading-tight max-w-4xl mx-auto">
          La Piattaforma per <span class="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-emerald)] via-[var(--accent-cyan)] to-purple-400">Sviluppatori &amp; Sentinel AI</span>
        </h1>

        <p class="text-[var(--text-muted)] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
          Notarizzazione del codice, strumenti di sicurezza e aggregatore Hacker News arricchito in tempo reale da Trinity AI.
        </p>

        <!-- PULSANTI PRINCIPALI DELL'ECOSISTEMA (4 PILASTRI v2.6-PURE-SQL) -->
        <div class="flex flex-wrap gap-3 justify-center mb-8 relative z-10 font-mono">
          <NuxtLink
            to="/news"
            active-class="!bg-[var(--accent-emerald)] !text-[var(--bg-kernel)] !border-[var(--accent-emerald)] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            class="px-5 py-2.5 bg-[var(--bg-kernel)] border border-[var(--border-color)] hover:border-[var(--accent-emerald)] text-[var(--accent-emerald)] font-extrabold text-xs rounded-xl transition-all shadow-lg"
          >
            🌍 DKP Tech Feed
          </NuxtLink>

          <NuxtLink
            to="/nodes"
            active-class="!bg-purple-500 !text-[var(--bg-kernel)] !border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            class="px-5 py-2.5 bg-[var(--bg-kernel)] border border-[var(--border-color)] hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all shadow-lg"
          >
            💬 DKP Talks Hub
          </NuxtLink>

          <NuxtLink
            to="/tools"
            active-class="!bg-[var(--accent-cyan)] !text-[var(--bg-kernel)] !border-[var(--accent-cyan)] shadow-[0_0_20px_rgba(56,189,248,0.3)]"
            class="px-5 py-2.5 bg-[var(--bg-kernel)] border border-[var(--border-color)] hover:border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-extrabold text-xs rounded-xl transition-all shadow-lg"
          >
            🛠️ Developer Tools
          </NuxtLink>

          <NuxtLink
            to="/blog"
            active-class="!bg-[var(--accent-emerald)] !text-[var(--bg-kernel)] !border-[var(--accent-emerald)] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            class="px-5 py-2.5 bg-[var(--bg-kernel)] border border-[var(--border-color)] hover:border-[var(--accent-emerald)] text-[var(--accent-emerald)] font-extrabold text-xs rounded-xl transition-all shadow-lg"
          >
            ✍️ DKP Editorial Hub
          </NuxtLink>
        </div>
      </section>

      <!-- WIDGET NOTIZIE HACKER NEWS (DKP NODES LIVE STREAM) -->
      <DkpNodesHomeWidget />

      <!-- METRICS GRID -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 shadow-xl hover:border-[var(--accent-emerald)]/30 transition-colors duration-500">
          <span class="text-4xl mb-2">🛡️</span>
          <h3 class="text-3xl font-black text-[var(--text-main)] font-mono">1.2M+</h3>
          <p class="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest font-mono">Linee Codice Notarizzate</p>
        </div>
        <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 shadow-xl hover:border-[var(--accent-cyan)]/30 transition-colors duration-500">
          <span class="text-4xl mb-2">🚀</span>
          <h3 class="text-3xl font-black text-[var(--text-main)] font-mono">48K+</h3>
          <p class="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest font-mono">Bounties Risolte ($PULSE)</p>
        </div>
        <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 shadow-xl hover:border-purple-500/30 transition-colors duration-500">
          <span class="text-4xl mb-2">📡</span>
          <h3 class="text-3xl font-black text-[var(--text-main)] font-mono">Live</h3>
          <p class="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest font-mono">Threat Stream Attivo</p>
        </div>
      </section>

      <!-- SEZIONE VAULT DEL BLOG (4 SCHEDE GRID) -->
      <div v-if="featuredArticles.length > 0" class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-2xl transition-colors duration-500">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-extrabold text-[var(--text-main)] flex items-center gap-2 font-sans">
            <span>🔗</span> Approfondimenti dal Vault
          </h3>
          <NuxtLink to="/blog" class="text-xs font-mono font-bold text-[var(--accent-emerald)] hover:underline">
            Vedi tutti gli articoli ➔
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink 
            v-for="art in featuredArticles" 
            :key="art.id" 
            :to="`/blog/${art.slug || art.id}`"
            class="bg-[var(--bg-kernel)] border border-[var(--border-color)] hover:border-[var(--accent-emerald)]/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md group text-left min-h-[160px]"
          >
            <div>
              <span class="text-[10px] font-mono font-bold text-[var(--accent-emerald)] uppercase tracking-wider block mb-1">
                {{ art.categoryName || art.category || 'Tech' }}
              </span>
              <h4 class="text-xs sm:text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--accent-emerald)] transition-colors leading-snug font-sans">
                {{ art.title }}
              </h4>
            </div>
            <span class="text-[11px] font-mono font-bold text-[var(--accent-cyan)] group-hover:underline mt-4 flex items-center gap-1">
              Leggi articolo ➔
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- BANNER AD SPONSORED ECOSYSTEM -->
      <div class="mt-2 mb-6">
        <DkpAdStrip categoryTag="DKP ECOSYSTEM HOME SPONSORED" />
      </div>

    </div>
  </div>
</template>