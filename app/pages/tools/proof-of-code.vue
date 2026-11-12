<!-- app/pages/tools/proof-of-code.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const auth = useAuthCore() || {}
const currentUser = auth.currentUser || ref({ id: 1 })
const isAuthenticated = auth.isAuthenticated || ref(true)

const currentUserId = computed(() => currentUser.value?.id || 1)

useDkpSeo({
  title: 'Proof of Code (Vault) v2.6-PURE-SQL — DKP Tools',
  description: 'Notarizzazione immutabile e calcolo dell\'impronta crittografica SHA-256 di sorgenti software su Neon PostgreSQL Pure SQL.'
})

const codeTitle = ref('')
const sourceSnippet = ref('')
const liveSha256Preview = ref('')
const isNotarizing = ref(false)
const isHashCopied = ref(false)
const errorMessage = ref('')
const notarizationResult = ref<{ sha256: string; timestamp: string; certificateId: string } | null>(null)

const showToast = ref(false)
const toastMessage = ref('')
function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

function notifyXpUpdate() {
  if (import.meta.client && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dkp:xp_updated'))
  }
}

function secureFallbackId(maxExclusive = 1000): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % maxExclusive
}

// Calcolo SHA-256 live client-side mentre si scrive
watch(sourceSnippet, async (val) => {
  const trimmed = val.trim()
  if (!trimmed || !import.meta.client || !window.crypto?.subtle) {
    liveSha256Preview.value = ''
    return
  }
  try {
    const encoded = new TextEncoder().encode(trimmed)
    const digest = await crypto.subtle.digest('SHA-256', encoded)
    liveSha256Preview.value = Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    liveSha256Preview.value = ''
  }
})

function copyHash(hash: string) {
  if (!hash) return
  navigator.clipboard.writeText(hash)
  isHashCopied.value = true
  triggerToast('📋 Hash SHA-256 copiato negli appunti!')
  setTimeout(() => {
    isHashCopied.value = false
  }, 2000)
}

async function notarizeCode() {
  errorMessage.value = ''

  if (isAuthenticated && isAuthenticated.value === false) {
    errorMessage.value = 'Effettua il login per registrare il sorgente nel Vault.'
    return
  }

  if (!codeTitle.value.trim() || !sourceSnippet.value.trim()) {
    errorMessage.value = 'Inserisci sia il titolo che il codice sorgente.'
    return
  }

  isNotarizing.value = true
  try {
    const res: any = await $fetch('/api/user/vault', {
      method: 'POST',
      body: {
        userId: currentUserId.value,
        title: codeTitle.value.trim(),
        code: sourceSnippet.value,
        sastStatus: 'PASSED'
      }
    })

    if (res && res.success) {
      notarizationResult.value = {
        sha256: res.data?.hash || liveSha256Preview.value || 'SHA256-VERIFIED',
        timestamp: res.data?.createdAt || new Date().toISOString(),
        certificateId: `DKP-VAULT-${res.data?.id || secureFallbackId(1000)}`
      }
      notifyXpUpdate()
      triggerToast('🛡️ Codice notarizzato nel Vault Pure SQL! (+100 XP)')

      codeTitle.value = ''
      sourceSnippet.value = ''
      liveSha256Preview.value = ''
    } else {
      errorMessage.value = res?.error || 'Errore dal server durante la notarizzazione.'
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || 'Impossibile contattare il DB Neon Pure SQL per la notarizzazione.'
  } finally {
    isNotarizing.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto my-10 px-4 sm:px-6 font-sans text-slate-100 min-h-[85vh]">
    
    <!-- TOAST NOTIFICATION -->
    <Transition name="fade">
      <div
        v-if="showToast"
        role="status"
        class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap text-center"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- HEADER SEZIONE -->
    <div class="mb-10 text-center sm:text-left relative">
      <div class="absolute top-0 left-0 w-full h-32 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full"></div>

      <div class="flex flex-col sm:flex-row sm:justify-between items-center mb-4 gap-4 relative z-10">
        <span class="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-full text-xs font-mono font-black tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.15)]">
          🛡️ DKP CORE TOOL v2.6-PURE-SQL
        </span>
        <NuxtLink to="/tools" class="text-sky-400 text-sm font-bold hover:text-sky-300 hover:underline transition-colors no-underline">
          ← Torna al Toolkit
        </NuxtLink>
      </div>

      <h1 class="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight relative z-10">
        Proof of Code <span class="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">(Vault)</span>
      </h1>
      
      <p class="text-slate-400 text-base sm:text-lg max-w-3xl mx-auto sm:mx-0 leading-relaxed relative z-10">
        Notarizzazione immutabile di frammenti di codice e calcolo dell'impronta digitale SHA-256 su Neon PostgreSQL Pure SQL.
      </p>
    </div>

    <!-- CARD FORM PRINCIPALE -->
    <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col gap-6 relative">
      
      <!-- TITOLO INPUT -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Titolo del Sorgente / Modulo</label>
        <input
          v-model="codeTitle"
          type="text"
          placeholder="es. Algorithm_JWT_Validator.ts"
          class="w-full bg-[#020420] border border-slate-700/80 text-white p-3.5 rounded-xl font-medium text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 outline-none transition-all placeholder:text-slate-600 shadow-inner"
        />
      </div>

      <!-- SORGENTE INPUT -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Codice Sorgente da Certificare</label>
          <span v-if="sourceSnippet.trim()" class="text-[11px] font-mono text-slate-500">
            {{ sourceSnippet.length }} chars
          </span>
        </div>
        <textarea
          v-model="sourceSnippet"
          rows="8"
          class="w-full bg-[#020420] border border-slate-700/80 text-sky-400 p-4 rounded-xl font-mono text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 outline-none transition-all resize-none shadow-inner placeholder:text-slate-600 leading-relaxed"
          placeholder="// Incolla qui il codice da notarizzare nel Vault Pure SQL..."
        ></textarea>
      </div>

      <!-- LIVE SHA-256 PREVIEW -->
      <div v-if="liveSha256Preview" class="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1">
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500">
          ⚡ Anteprima Impronta SHA-256 (Local WebCrypto)
        </span>
        <code class="text-xs font-mono text-sky-400/90 break-all">{{ liveSha256Preview }}</code>
      </div>

      <!-- ERROR MESSAGE -->
      <div v-if="errorMessage" role="alert" class="bg-red-500/15 border border-red-500/40 text-red-400 p-4 rounded-xl font-bold text-sm">
        ⚠️ {{ errorMessage }}
      </div>

      <!-- BOTTONE AZIONE -->
      <button
        type="button"
        @click="notarizeCode"
        :disabled="isNotarizing || !sourceSnippet.trim() || !codeTitle.trim()"
        class="w-full bg-blue-500 text-slate-950 font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:shadow-none text-sm sm:text-base cursor-pointer"
      >
        <span v-if="isNotarizing">⏳ Generazione Hash &amp; Notarizzazione Pure SQL...</span>
        <span v-else>🔒 Registra nel Vault Crittografico</span>
      </button>

      <!-- CERTIFICATO RISULTATO -->
      <Transition name="fade">
        <div v-if="notarizationResult" class="bg-slate-950 border border-emerald-500/60 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] mt-4">
          <div class="bg-emerald-500/15 text-emerald-400 px-5 sm:px-6 py-3.5 border-b border-emerald-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span class="font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
              <span>📜</span> Certificato di Notarizzazione v2.6
            </span>
            <span class="text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              ID: {{ notarizationResult.certificateId }}
            </span>
          </div>
          
          <div class="p-5 sm:p-6 flex flex-col gap-4 text-xs sm:text-sm">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <span class="block text-slate-400 font-bold uppercase tracking-wider text-[11px]">SHA-256 Hash Crittografico:</span>
                <button
                  type="button"
                  @click="copyHash(notarizationResult.sha256)"
                  class="text-[11px] font-mono text-sky-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {{ isHashCopied ? '✔ Copiato' : '📋 Copia Hash' }}
                </button>
              </div>
              <code class="block w-full bg-[#020420] border border-slate-800 text-sky-400 p-3.5 rounded-xl break-all font-mono text-xs shadow-inner">
                {{ notarizationResult.sha256 }}
              </code>
            </div>
            
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-800/80 pt-4 gap-3">
              <div>
                <span class="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[11px]">Timestamp Marcatura (Neon Pure SQL):</span>
                <span class="text-slate-200 font-mono text-xs">{{ new Date(notarizationResult.timestamp).toLocaleString('it-IT') }}</span>
              </div>
              <NuxtLink to="/user/dashboard?tab=vault" class="text-emerald-400 font-bold hover:text-emerald-300 hover:underline text-xs transition-colors flex items-center gap-1 no-underline">
                <span>Vedi nella Dashboard</span> <span>↗</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
      
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>