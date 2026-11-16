<!-- app/components/dashboard/DkpAdManager.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  username?: string
  email?: string
}>()

const emit = defineEmits<{
  (e: 'campaign-created', campaign?: any): void
  (e: 'toast', message: string): void
}>()

const isLoading = ref(false)
const message = ref<{ text: string; type: 'success' | 'error' } | null>(null)

const form = ref({
  buyerName: props.username || 'alexdpl',
  buyerEmail: props.email || '',
  title: '',
  tagline: '',
  categoryTag: 'LIBRI AMAZON',
  ctaText: 'Vedi su Amazon',
  targetUrl: '',
  placement: 'global' as 'nodeTalks' | 'feedInline' | 'blogSidebar' | 'global',
  billingModel: 'CLICKS' as 'CLICKS' | 'IMPRESSIONS' | 'HYBRID',
  maxClicks: 100,
  maxImpressions: 10000,
  accentColor: 'amber' as 'emerald' | 'sky' | 'purple' | 'amber'
})

watch(
  () => [props.username, props.email],
  ([nextUser, nextEmail]) => {
    if (nextUser) form.value.buyerName = nextUser
    if (nextEmail && !form.value.buyerEmail) form.value.buyerEmail = nextEmail
  },
  { immediate: true }
)

const quotaSummary = computed(() => {
  if (form.value.billingModel === 'CLICKS') {
    return `${form.value.maxClicks} Click Garantiti`
  }
  if (form.value.billingModel === 'IMPRESSIONS') {
    return `${form.value.maxImpressions.toLocaleString('it-IT')} Impressioni`
  }
  return `${form.value.maxClicks} Click + ${form.value.maxImpressions.toLocaleString('it-IT')} Imp`
})

const accentPreviewClasses = computed(() => {
  switch (form.value.accentColor) {
    case 'sky':
      return { border: 'border-sky-500/40', badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30', btn: 'bg-sky-500 text-slate-950' }
    case 'purple':
      return { border: 'border-purple-500/40', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30', btn: 'bg-purple-500 text-white' }
    case 'amber':
      return { border: 'border-amber-500/40', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', btn: 'bg-amber-400 text-slate-950' }
    default:
      return { border: 'border-emerald-500/40', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', btn: 'bg-emerald-500 text-slate-950' }
  }
})

async function submitAdCampaign() {
  if (!form.value.title.trim() || !form.value.targetUrl.trim()) {
    message.value = { text: '❌ Inserisci Titolo e URL di destinazione.', type: 'error' }
    return
  }

  isLoading.value = true
  message.value = null

  try {
    const res: any = await $fetch('/api/ads/purchase', {
      method: 'POST',
      body: {
        title: form.value.title.trim(),
        tagline: form.value.tagline.trim() || 'Risorsa consigliata dalla redazione DevKernelPulse.',
        categoryTag: form.value.categoryTag.trim() || 'LIBRI AMAZON',
        badge: 'SPONSORED',
        ctaText: form.value.ctaText.trim() || 'Scopri di più',
        targetUrl: form.value.targetUrl.trim(),
        placement: form.value.placement,
        billingModel: form.value.billingModel,
        maxClicks: Number(form.value.maxClicks || 100),
        maxImpressions: Number(form.value.maxImpressions || 10000),
        accentColor: form.value.accentColor,
        buyerName: form.value.buyerName.trim() || 'alexdpl',
        buyerEmail: form.value.buyerEmail.trim()
      }
    })

    if (res?.success) {
      const successMsg = '🚀 Link inserito in rotazione nel network DKP!'
      message.value = { text: successMsg, type: 'success' }
      emit('toast', successMsg)

      form.value.title = ''
      form.value.tagline = ''
      form.value.targetUrl = ''
      emit('campaign-created', res.campaign)
    } else {
      message.value = { text: '❌ Errore durante il salvataggio.', type: 'error' }
    }
  } catch (err: any) {
    message.value = { text: err?.data?.statusMessage || 'Errore di connessione al circuito DKP Ads.', type: 'error' }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-slate-100">
    <div class="flex justify-between items-start gap-3 border-b border-slate-800 pb-4">
      <div>
        <span class="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">
          CLICKS + IMPRESSIONS ENGINE
        </span>
        <h3 class="text-lg sm:text-xl font-black text-white m-0 mt-0.5">
          📡 Nuovo Link / Campagna
        </h3>
      </div>
      <span class="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-black uppercase shrink-0">
        AFFILIATE &amp; ADS
      </span>
    </div>

    <!-- ANTEPRIMA LIVE -->
    <div :class="['bg-[#020420] border rounded-2xl p-4 flex flex-col gap-2 transition-all', accentPreviewClasses.border]">
      <div class="flex items-center justify-between font-mono text-[10px]">
        <span :class="['px-2 py-0.5 rounded border font-black uppercase', accentPreviewClasses.badge]">
          {{ form.categoryTag || 'SPONSORED' }}
        </span>
        <span class="text-slate-500">{{ quotaSummary }}</span>
      </div>
      <p class="text-white font-bold text-sm m-0 truncate">
        {{ form.title || 'Titolo libro Amazon o risorsa tecnica' }}
      </p>
      <p class="text-slate-400 text-xs m-0 line-clamp-2">
        {{ form.tagline || 'Breve descrizione per gli sviluppatori...' }}
      </p>
      <div class="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/80">
        <span class="text-[11px] font-mono text-sky-400 truncate max-w-[58%]">
          {{ form.targetUrl || 'https://amazon.it/dp/...' }}
        </span>
        <span :class="['px-3 py-1 rounded-lg font-mono font-black text-[11px]', accentPreviewClasses.btn]">
          {{ form.ctaText || 'Scopri di più' }} ➔
        </span>
      </div>
    </div>

    <form @submit.prevent="submitAdCampaign" class="flex flex-col gap-3.5 font-mono text-xs">
      <!-- SELETTORE MODALITÀ QUOTA (CLICK vs IMPRESSION vs IBRIDO) -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-400 uppercase">Modello Rotazione</label>
        <div class="grid grid-cols-3 gap-1.5 bg-[#020420] p-1 border border-slate-800 rounded-xl">
          <button
            type="button"
            @click="form.billingModel = 'CLICKS'"
            :class="[
              'py-2 px-2 rounded-lg text-[11px] font-black cursor-pointer border-none transition-colors',
              form.billingModel === 'CLICKS' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white bg-transparent'
            ]"
          >
            🖱️ A Click
          </button>
          <button
            type="button"
            @click="form.billingModel = 'IMPRESSIONS'"
            :class="[
              'py-2 px-2 rounded-lg text-[11px] font-black cursor-pointer border-none transition-colors',
              form.billingModel === 'IMPRESSIONS' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white bg-transparent'
            ]"
          >
            👁️ Impressioni
          </button>
          <button
            type="button"
            @click="form.billingModel = 'HYBRID'"
            :class="[
              'py-2 px-2 rounded-lg text-[11px] font-black cursor-pointer border-none transition-colors',
              form.billingModel === 'HYBRID' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white bg-transparent'
            ]"
          >
            ⚡ Ibrido
          </button>
        </div>
      </div>

      <!-- QUOTA CLICK / IMPRESSIONI -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div v-if="form.billingModel === 'CLICKS' || form.billingModel === 'HYBRID'" class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase">Target Click</label>
          <select
            v-model.number="form.maxClicks"
            class="bg-[#020420] border border-slate-800 focus:border-emerald-400 text-emerald-400 font-bold p-3 rounded-xl outline-none cursor-pointer"
          >
            <option :value="100">100 Click (Standard Libri)</option>
            <option :value="250">250 Click</option>
            <option :value="500">500 Click</option>
            <option :value="1000">1.000 Click</option>
          </select>
        </div>

        <div v-if="form.billingModel === 'IMPRESSIONS' || form.billingModel === 'HYBRID'" class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase">Target Impressioni</label>
          <select
            v-model.number="form.maxImpressions"
            class="bg-[#020420] border border-slate-800 focus:border-sky-400 text-sky-400 font-bold p-3 rounded-xl outline-none cursor-pointer"
          >
            <option :value="10000">10.000 Impressioni</option>
            <option :value="50000">50.000 Impressioni</option>
            <option :value="200000">200.000 Impressioni</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase">Tag Categoria</label>
          <input
            v-model="form.categoryTag"
            type="text"
            placeholder="es. LIBRI AMAZON"
            class="bg-[#020420] border border-slate-800 focus:border-emerald-400 text-amber-400 font-bold p-3 rounded-xl outline-none"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold text-slate-400 uppercase">Titolo Annuncio / Libro *</label>
        <input
          v-model="form.title"
          type="text"
          maxlength="120"
          placeholder="es. Designing Data-Intensive Applications"
          required
          class="bg-[#020420] border border-slate-800 focus:border-emerald-400 text-white p-3 rounded-xl outline-none"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold text-slate-400 uppercase">Snippet Descrittivo</label>
        <textarea
          v-model="form.tagline"
          rows="2"
          maxlength="240"
          placeholder="Perché ogni developer dovrebbe leggerlo..."
          class="bg-[#020420] border border-slate-800 focus:border-emerald-400 text-white p-3 rounded-xl outline-none resize-none"
        ></textarea>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold text-slate-400 uppercase">URL Destinazione / Link Affiliato *</label>
        <input
          v-model="form.targetUrl"
          type="text"
          placeholder="https://www.amazon.it/dp/..."
          required
          class="bg-[#020420] border border-slate-800 focus:border-emerald-400 text-sky-400 p-3 rounded-xl outline-none"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase">Posizione</label>
          <select
            v-model="form.placement"
            class="bg-[#020420] border border-slate-800 text-white p-2.5 rounded-xl outline-none cursor-pointer"
          >
            <option value="global">Global</option>
            <option value="nodeTalks">Nodi &amp; Forum</option>
            <option value="feedInline">Feed HN</option>
            <option value="blogSidebar">Blog Sidebar</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase">Pulsante CTA</label>
          <input
            v-model="form.ctaText"
            type="text"
            maxlength="32"
            class="bg-[#020420] border border-slate-800 text-white p-2.5 rounded-xl outline-none"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase">Accento</label>
          <select
            v-model="form.accentColor"
            class="bg-[#020420] border border-slate-800 text-white p-2.5 rounded-xl outline-none cursor-pointer"
          >
            <option value="amber">Amber</option>
            <option value="emerald">Emerald</option>
            <option value="sky">Sky</option>
            <option value="purple">Purple</option>
          </select>
        </div>
      </div>

      <div
        v-if="message"
        :class="[
          'p-3 rounded-xl text-xs font-bold text-center border',
          message.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        ]"
      >
        {{ message.text }}
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="mt-1 w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm cursor-pointer border-none transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)]"
      >
        {{ isLoading ? '⏳ Salvataggio sul Vault...' : '🚀 Metti in Rotazione' }}
      </button>
    </form>
  </div>
</template>