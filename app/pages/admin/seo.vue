<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

const config = ref({
  siteTitle: 'DevKernelPulse — Tech Intelligence, AI Sentinel & Developer Nodes',
  metaDescription: 'Piattaforma developer con feed tech curati, audit SAST AI, forum tecnici e notarizzazione Vault.',
  ogImage: 'https://devkernelpulse.org/og-cover.png',
  robotsPolicy: 'index, follow',
  canonicalBase: 'https://devkernelpulse.org'
})

const isSaving = ref(false)
const feedbackMsg = ref('')

async function loadSeo() {
  const res: any = await $fetch(`/api/admin/seo?_t=${Date.now()}`).catch(() => null)
  if (res?.config) {
    config.value = { ...config.value, ...res.config }
  }
}

async function saveSeo() {
  isSaving.value = true
  try {
    const res: any = await $fetch('/api/admin/seo', { method: 'POST', body: config.value })
    if (res?.success) feedbackMsg.value = res.message
  } finally {
    isSaving.value = false
  }
}

onMounted(loadSeo)
</script>

<template>
  <DkpAdminShell
    title="SEO, OpenGraph & Sitemap Control"
    subtitle="Gestione meta tag globali, policy robots, canonical URL e anteprima SERP su Neon Pure SQL."
    badge="SEO ENGINE v2.6"
    seo-title="SEO Control Center — DKP Admin v2.6"
  >
    <template #actions>
      <a href="/sitemap.xml" target="_blank" class="px-3.5 py-2.5 rounded-xl bg-dkp-bg border border-dkp-border text-cyan-300 font-bold no-underline">
        Sitemap.xml &nearr;
      </a>
      <button type="button" :disabled="isSaving" @click="saveSeo" class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer">
        {{ isSaving ? 'Salvataggio...' : 'Salva Impostazioni SEO' }}
      </button>
    </template>

    <div v-if="feedbackMsg" class="bg-emerald-500/15 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold px-4 py-3 rounded-xl">
       {{ feedbackMsg }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
      <form @submit.prevent="saveSeo" class="lg:col-span-7 bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 card-glow space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-slate-300 font-bold uppercase">Default Site Title</label>
          <input v-model="config.siteTitle" type="text" class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-cyan-400 box-border" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-slate-300 font-bold uppercase">Meta Description Globale</label>
          <textarea v-model="config.metaDescription" rows="3" class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-cyan-400 box-border"></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-slate-300 font-bold uppercase">Canonical Base URL</label>
            <input v-model="config.canonicalBase" type="url" class="bg-dkp-bg border border-dkp-border text-cyan-300 px-3.5 py-2.5 rounded-xl outline-none box-border" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-slate-300 font-bold uppercase">Robots Policy</label>
            <select v-model="config.robotsPolicy" class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl">
              <option value="index, follow">index, follow</option>
              <option value="noindex, follow">noindex, follow</option>
              <option value="noindex, nofollow">noindex, nofollow</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-slate-300 font-bold uppercase">OpenGraph Social Image URL</label>
          <input v-model="config.ogImage" type="url" class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none box-border" />
        </div>
      </form>

      <!-- Anteprima SERP Google -->
      <aside class="lg:col-span-5 bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 card-glow space-y-3">
        <span class="text-[10px] text-cyan-400 font-extrabold uppercase">Anteprima Live Google SERP</span>
        <div class="bg-dkp-bg border border-dkp-border rounded-xl p-4 space-y-1.5 font-sans">
          <div class="text-xs text-slate-400 font-mono truncate">{{ config.canonicalBase }}</div>
          <div class="text-base font-bold text-sky-400 leading-snug">{{ config.siteTitle }}</div>
          <p class="text-xs text-slate-300 leading-relaxed m-0">{{ config.metaDescription }}</p>
        </div>
      </aside>
    </div>
  </DkpAdminShell>
</template>