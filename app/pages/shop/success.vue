<!-- app/pages/shop/success.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

useDkpSeo({
  title: 'Ordine Confermato - DKP Ecosystem v2.6',
  description: 'Pagamento confermato su DevKernelPulse. Accedi a Sentinel Scan, OpenUI Studio, Vault Ledger e API Console.',
  type: 'website',
  canonicalPath: '/shop/success'
})

const route = useRoute()
const sessionId = ref('')
const provider = ref('stripe')

onMounted(() => {
  sessionId.value = String(route.query.session_id || route.query.token || '')
  provider.value = String(route.query.provider || 'stripe')
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-14 px-4 sm:px-6 font-sans flex items-center justify-center">
    <div class="max-w-xl w-full bg-[#090d16] border border-emerald-500/40 rounded-2xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
      <span class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-extrabold uppercase">
        DKP v2.6-PURE-SQL CHECKOUT
      </span>

      <h1 class="text-2xl sm:text-3xl font-black text-white m-0">
        Pagamento Registrato!
      </h1>

      <p class="text-xs sm:text-sm text-slate-400 leading-relaxed m-0">
        Il webhook <strong class="text-white">{{ provider.toUpperCase() }}</strong> aggiorna lo stato dell'ordine e abilita la licenza/chiave <code class="text-emerald-400 font-mono">dkp_live_...</code> per <strong class="text-white">Sentinel Scan</strong>, <strong class="text-white">OpenUI Studio + BEMYAGENT.md</strong> e <strong class="text-white">Proof of Safety</strong>.
      </p>

      <div v-if="sessionId" class="bg-[#020420] border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-cyan-300 break-all">
        Session / Order ID: {{ sessionId }}
      </div>

      <div class="flex flex-wrap justify-center gap-3 font-mono text-xs pt-2">
        <NuxtLink to="/user/dashboard?tab=api" class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black no-underline">
          Gestisci Chiavi API
        </NuxtLink>
        <NuxtLink to="/tools/sentinel-scan" class="px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold no-underline">
          Sentinel Scan
        </NuxtLink>
        <NuxtLink to="/tools/openui-studio" class="px-4 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold no-underline">
          OpenUI Studio
        </NuxtLink>
        <NuxtLink to="/nodes/n/blockchain-vault" class="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold no-underline">
          Vault Ledger
        </NuxtLink>
      </div>
    </div>
  </div>
</template>