<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

// FIX 1: Utilizzo del composable nativo Nuxt useHead per evitare ReferenceError su useDkpSeo
useHead({
  title: 'DevKernelPulse — The Developer Ecosystem & AI Tech Stream',
  meta: [
    {
      name: 'description',
      content: 'Infrastruttura per sviluppatori, strumenti di sicurezza notarizzati e newsroom AI in tempo reale da Hacker News.'
    }
  ]
})

// Recupero dinamico articoli in evidenza dal Vault
const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts')
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    featuredArticles.value = raw.slice(0, 2)
  } catch (err) {
    console.error('Errore recupero articoli Vault:', err)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-12 relative overflow-hidden">
    
    <!-- BACKGROUND GLOWS GLOBALI -->
    <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-[100%] pointer-events-none"></div>

    <div class="max-w-6xl mx-auto flex flex-col gap-12 sm:gap-16 relative z-10">
      
      <!-- HERO SECTION PRINCIPALE -->
      <section class="relative py-8 sm:py-16 text-center flex flex-col items-center gap-6 overflow-hidden">
        <div class="inline-flex items-center gap-2 bg-[#090d16] border border-emerald-500/30 px-5 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span class="text-[11px] font-mono font-black text-emerald-400 uppercase tracking-widest">
            DevKernelPulse v2.5 Ecosystem
          </span>
        </div>

        <h1 class="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          La Piattaforma per <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400">Sviluppatori &amp; Sentinel AI</span>
        </h1>

        <p class="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Notarizzazione del codice, strumenti di sicurezza e aggregatore Hacker News arricchito in tempo reale da Trinity AI.
        </p>

        <!-- Pulsanti Hero (FIX 2: Rotta corretta /news invece di /feed) -->
        <div class="flex flex-wrap gap-4 justify-center mt-2">
          <NuxtLink to="/news" class="px-6 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-bold text-sm rounded-xl hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            🌍 Esplora DKP Tech Feed
          </NuxtLink>
          <NuxtLink to="/tools" class="px-6 py-3 bg-[#090d16] border border-slate-700 hover:border-slate-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg">
            🛠️ Developer Tools
          </NuxtLink>
        </div>
      </section>

      <!-- WIDGET NOTIZIE HACKER NEWS (DKP NODES LIVE STREAM) -->
      <DkpNodesHomeWidget />

      <!-- METRICS GRID -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 shadow-xl hover:border-emerald-500/30 transition-colors">
          <span class="text-4xl mb-2">🛡️</span>
          <h3 class="text-3xl font-black text-white font-mono">1.2M+</h3>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Linee Codice Notarizzate</p>
        </div>
        <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 shadow-xl hover:border-sky-500/30 transition-colors">
          <span class="text-4xl mb-2">🚀</span>
          <h3 class="text-3xl font-black text-white font-mono">48K+</h3>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Bounties Risolte ($PULSE)</p>
        </div>
        <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 shadow-xl hover:border-purple-500/30 transition-colors">
          <span class="text-4xl mb-2">📡</span>
          <h3 class="text-3xl font-black text-white font-mono">Live</h3>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Threat Stream Attivo</p>
        </div>
      </section>

      <!-- SEZIONE VAULT DEL BLOG -->
      <div v-if="featuredArticles.length > 0" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h3 class="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
          <span>🔗</span> Approfondimenti dal Vault
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink 
            v-for="art in featuredArticles" 
            :key="art.id" 
            :to="`/blog/${art.slug || art.id}`"
            class="bg-[#020420] border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-md group text-left"
          >
            <div>
              <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {{ art.categoryName || art.category || 'Tech' }}
              </span>
              <h4 class="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors mt-1 leading-snug">
                {{ art.title }}
              </h4>
            </div>
            <span class="text-xs font-mono font-bold text-sky-400 group-hover:underline mt-4">
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