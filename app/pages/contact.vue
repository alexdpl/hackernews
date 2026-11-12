<!-- app/pages/contact.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'

useDkpSeo({
  title: 'Contatti & Supporto Tecnico — DevKernelPulse v2.6-PURE-SQL',
  description: 'Mettiti in contatto con il team di DevKernelPulse o con Alessandro De Paola per proposte, partnership, bug report e supporto API.'
})

interface ContactFormState {
  name: string
  email: string
  subject: string
  message: string
  captchaAnswer: string
  websiteHoneypot: string
  gdprConsent: boolean
}

const subjects = [
  'Informazioni sulla Community',
  'Proposta Sponsor / Partnership',
  'Segnalazione Bug / Supporto',
  'Supporto API Gateway / Vault',
  'Altro'
]

const form = reactive<ContactFormState>({
  name: '',
  email: '',
  subject: 'Informazioni sulla Community',
  message: '',
  captchaAnswer: '',
  websiteHoneypot: '',
  gdprConsent: false
})

const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)
const responseMessage = ref('')
const isError = ref(false)

// DKP Kernel Captcha System (Anti-Bot Equazionale Dinamico)
const captchaNum1 = ref(0)
const captchaNum2 = ref(0)
const captchaExpectedAnswer = ref(0)

function generateCaptcha() {
  captchaNum1.value = Math.floor(Math.random() * 12) + 1
  captchaNum2.value = Math.floor(Math.random() * 10) + 1
  captchaExpectedAnswer.value = captchaNum1.value + captchaNum2.value
  form.captchaAnswer = ''
}

// Validazione Client-Side rigorosa conforme WCAG 2.1 AA
function validateForm(): boolean {
  Object.keys(errors).forEach(key => delete errors[key])

  if (!form.name.trim()) {
    errors.name = 'Il tuo nome è obbligatorio.'
  } else if (form.name.trim().length < 2) {
    errors.name = 'Inserisci un nome valido di almeno 2 caratteri.'
  }

  if (!form.email.trim()) {
    errors.email = 'L\'indirizzo email è obbligatorio.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Inserisci un indirizzo email valido.'
  }

  if (!form.message.trim()) {
    errors.message = 'Il messaggio non può essere vuoto.'
  } else if (form.message.trim().length < 10) {
    errors.message = 'Il messaggio deve contenere almeno 10 caratteri.'
  }

  if (parseInt(form.captchaAnswer, 10) !== captchaExpectedAnswer.value) {
    errors.captchaAnswer = 'Risposta al DKP Kernel Captcha errata.'
  }

  if (!form.gdprConsent) {
    errors.gdprConsent = 'Devi accettare l\'Informativa sulla Privacy (GDPR) per inviare il messaggio.'
  }

  const hasErrors = Object.keys(errors).length > 0
  if (hasErrors) {
    nextTick(() => {
      const firstErrorKey = Object.keys(errors)[0]
      const el = document.getElementById(`contact-${firstErrorKey}`)
      el?.focus()
    })
  }

  return !hasErrors
}

async function handleSubmit() {
  // Anti-Spam Check 1: Honeypot silenzioso
  if (form.websiteHoneypot) {
    return
  }

  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  responseMessage.value = ''
  isError.value = false

  // Tracciamento Timestamp Consenso GDPR (ISO 8601 UTC)
  const gdprAcceptedAt = new Date().toISOString()

  try {
    const res: any = await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
        captchaAnswer: form.captchaAnswer,
        captchaExpected: captchaExpectedAnswer.value,
        gdprConsent: form.gdprConsent,
        gdprAcceptedAt
      }
    })

    if (res?.success) {
      responseMessage.value = res.message || 'Messaggio inviato con successo! Il team ti risponderà a breve.'
      form.name = ''
      form.email = ''
      form.subject = 'Informazioni sulla Community'
      form.message = ''
      form.gdprConsent = false
      generateCaptcha()
    } else {
      isError.value = true
      responseMessage.value = res?.error || res?.message || 'Errore durante l\'invio del messaggio.'
      generateCaptcha()
    }
  } catch (err: any) {
    isError.value = true
    responseMessage.value = err?.data?.statusMessage || err?.data?.message || err?.data?.error || 'Errore di connessione al server Sentinel.'
    generateCaptcha()
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  generateCaptcha()
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-10 px-4 sm:px-6 pb-20 font-sans">
    <div class="max-w-6xl mx-auto flex flex-col gap-8">

      <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink
          to="/news"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          🌍 DKP Tech Feed
        </NuxtLink>

        <NuxtLink
          to="/nodes"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          💬 DKP Talks Hub
        </NuxtLink>

        <NuxtLink
          to="/tools"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          🛠️ Developer Tools
        </NuxtLink>

        <NuxtLink
          to="/blog"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          ✍️ DKP Editorial Hub
        </NuxtLink>
      </nav>

      <!-- HERO BANNER V2.6-PURE-SQL -->
      <header class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div class="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 font-mono relative z-10">
          <span class="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,220,130,0.25)]">
            DKP KERNEL DISPATCH v2.6-PURE-SQL
          </span>
          <span class="text-xs text-slate-400">
            Firewall: <strong class="text-purple-400">Pulse Sentinel AI Active</strong>
          </span>
        </div>

        <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2 relative z-10">
          📩 Contatta il Team • <span class="text-emerald-400">DevKernelPulse</span>
        </h1>
        <p class="text-slate-400 text-xs sm:text-sm leading-relaxed m-0 max-w-3xl relative z-10">
          Hai domande sull'ecosistema, proposte di partnership tecnologica, vuoi segnalare un bug o richiedere supporto per API Pass e Vault? Compila il modulo protetto sottostante.
        </p>
      </header>

      <!-- GRID LAYOUT -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        <!-- FORM PRINCIPALE -->
        <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <form @submit.prevent="handleSubmit" class="flex flex-col gap-5 font-mono text-xs" novalidate>

            <!-- Campo Honeypot Nascosto Anti-Bot -->
            <input
              type="text"
              v-model="form.websiteHoneypot"
              name="website_url"
              tabindex="-1"
              aria-hidden="true"
              class="hidden"
              autocomplete="off"
            />

            <!-- NOME & EMAIL -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="contact-name" class="text-slate-300 font-bold uppercase tracking-wider">
                  Il tuo Nome *
                </label>
                <input
                  id="contact-name"
                  v-model="form.name"
                  type="text"
                  placeholder="es. Linus Torvalds"
                  :aria-invalid="!!errors.name"
                  aria-describedby="err-name"
                  class="bg-[#040814] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs font-sans"
                  :class="errors.name ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-emerald-500'"
                />
                <span v-if="errors.name" id="err-name" class="text-rose-400 text-[11px] font-bold">
                  ⚠️ {{ errors.name }}
                </span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="contact-email" class="text-slate-300 font-bold uppercase tracking-wider">
                  La tua Email *
                </label>
                <input
                  id="contact-email"
                  v-model="form.email"
                  type="email"
                  placeholder="es. linus@kernel.org"
                  :aria-invalid="!!errors.email"
                  aria-describedby="err-email"
                  class="bg-[#040814] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs font-sans"
                  :class="errors.email ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-emerald-500'"
                />
                <span v-if="errors.email" id="err-email" class="text-rose-400 text-[11px] font-bold">
                  ⚠️ {{ errors.email }}
                </span>
              </div>
            </div>

            <!-- OGGETTO -->
            <div class="flex flex-col gap-1.5">
              <label for="contact-subject" class="text-slate-300 font-bold uppercase tracking-wider">
                🎯 Oggetto della Richiesta *
              </label>
              <select
                id="contact-subject"
                v-model="form.subject"
                class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer text-xs font-bold"
              >
                <option v-for="subj in subjects" :key="subj" :value="subj">
                  {{ subj }}
                </option>
              </select>
            </div>

            <!-- MESSAGGIO -->
            <div class="flex flex-col gap-1.5">
              <label for="contact-message" class="text-slate-300 font-bold uppercase tracking-wider">
                Messaggio *
              </label>
              <textarea
                id="contact-message"
                v-model="form.message"
                rows="5"
                placeholder="Descrivi la tua richiesta, proposta o segnalazione tecnica..."
                :aria-invalid="!!errors.message"
                aria-describedby="err-message"
                class="bg-[#040814] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs font-sans resize-y min-h-[130px]"
                :class="errors.message ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-emerald-500'"
              ></textarea>
              <span v-if="errors.message" id="err-message" class="text-rose-400 text-[11px] font-bold">
                ⚠️ {{ errors.message }}
              </span>
            </div>

            <!-- DKP KERNEL CAPTCHA ENGINE -->
            <div class="bg-[#040814] border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="text-sky-400 font-black text-xs tracking-wider uppercase">
                  🛡️ DKP KERNEL CAPTCHA
                </span>
                <button
                  type="button"
                  @click="generateCaptcha"
                  class="text-slate-400 hover:text-emerald-400 font-bold text-[11px] transition-colors cursor-pointer"
                  title="Genera nuovo quesito"
                >
                  🔄 Rigenera
                </button>
              </div>

              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label for="contact-captchaAnswer" class="text-slate-300 text-xs">
                  Risolvi l'equazione di sicurezza:
                  <strong class="text-emerald-400 text-sm font-bold ml-1">{{ captchaNum1 }} + {{ captchaNum2 }} = ?</strong>
                </label>
                <input
                  id="contact-captchaAnswer"
                  v-model="form.captchaAnswer"
                  type="number"
                  placeholder="Risultato"
                  :aria-invalid="!!errors.captchaAnswer"
                  aria-describedby="err-captcha"
                  class="w-28 bg-[#080d1a] border text-center text-emerald-400 font-bold py-2 rounded-lg outline-none transition-all text-xs"
                  :class="errors.captchaAnswer ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'"
                />
              </div>
              <span v-if="errors.captchaAnswer" id="err-captcha" class="text-rose-400 text-[11px] font-bold">
                ⚠️ {{ errors.captchaAnswer }}
              </span>
            </div>

            <!-- CHECKBOX OBBLIGATORIO CONSENSO PRIVACY GDPR CON TIMESTAMP -->
            <div class="flex flex-col gap-1.5">
              <label
                for="contact-gdprConsent"
                class="flex items-start gap-3 p-3.5 rounded-xl bg-[#040814] border transition-colors cursor-pointer select-none"
                :class="errors.gdprConsent ? 'border-rose-500' : 'border-slate-800 hover:border-slate-700'"
              >
                <input
                  id="contact-gdprConsent"
                  v-model="form.gdprConsent"
                  type="checkbox"
                  :aria-invalid="!!errors.gdprConsent"
                  aria-describedby="err-gdpr"
                  class="mt-0.5 w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
                <span class="text-[11px] font-sans text-slate-300 leading-relaxed">
                  Dichiaro di aver letto l'<NuxtLink to="/legal/privacy" class="text-emerald-400 hover:text-emerald-300 underline font-semibold">Informativa sulla Privacy (GDPR)</NuxtLink> e acconsento al trattamento dei miei dati personali (con registrazione del timestamp di consenso) esclusivamente per rispondere alla presente richiesta. *
                </span>
              </label>
              <span v-if="errors.gdprConsent" id="err-gdpr" class="text-rose-400 text-[11px] font-bold">
                ⚠️ {{ errors.gdprConsent }}
              </span>
            </div>

            <!-- BANNER MESSAGGI DI ERRORE O SUCCESSO -->
            <div
              v-if="responseMessage"
              :role="isError ? 'alert' : 'status'"
              class="p-3.5 rounded-xl text-xs font-mono border flex items-center gap-2"
              :class="isError
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'"
            >
              <span>{{ isError ? '⚠️' : '⚡' }}</span>
              <span>{{ responseMessage }}</span>
            </div>

            <!-- SUBMIT BUTTON -->
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full mt-1 py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(0,220,130,0.25)] cursor-pointer disabled:opacity-50"
            >
              <span v-if="isSubmitting">Trasmissione sicura al Kernel... ⚡</span>
              <span v-else>🚀 Invia Messaggio</span>
            </button>

          </form>
        </div>

        <!-- SIDEBAR INFO & DIRECT DISPATCH -->
        <aside class="flex flex-col gap-5">
          <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <h2 class="text-lg font-extrabold text-white mb-1.5">⚡ Direct Kernel Dispatch</h2>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed mb-5">
              Preferisci un contatto diretto o hai un'emergenza infrastrutturale su API o Vault?
            </p>

            <div class="flex flex-col divide-y divide-slate-800">
              <div class="flex items-start gap-3 py-3.5">
                <span class="text-xl">📧</span>
                <div>
                  <span class="block text-[11px] font-mono text-slate-500 uppercase font-extrabold">Email Ufficiale</span>
                  <a href="mailto:support@devkernelpulse.org" class="text-xs sm:text-sm text-white hover:text-emerald-400 font-semibold transition-colors no-underline">
                    support@devkernelpulse.org
                  </a>
                </div>
              </div>

              <div class="flex items-start gap-3 py-3.5">
                <span class="text-xl">👨‍💻</span>
                <div>
                  <span class="block text-[11px] font-mono text-slate-500 uppercase font-extrabold">Lead Engineer Architect</span>
                  <span class="text-xs sm:text-sm text-white font-semibold">Alessandro De Paola (@alexdpl)</span>
                </div>
              </div>

              <div class="flex items-start gap-3 py-3.5">
                <span class="text-xl">🐙</span>
                <div>
                  <span class="block text-[11px] font-mono text-slate-500 uppercase font-extrabold">Issue &amp; Open Source</span>
                  <a href="https://github.com/alexdpl/hackernews" target="_blank" rel="noopener noreferrer" class="text-xs sm:text-sm text-sky-400 hover:text-emerald-400 font-semibold transition-colors no-underline">
                    github.com/alexdpl/hackernews ↗
                  </a>
                </div>
              </div>

              <div class="flex items-start gap-3 pt-3.5">
                <span class="text-xl">⏱️</span>
                <div>
                  <span class="block text-[11px] font-mono text-slate-500 uppercase font-extrabold">SLA Risposta Media</span>
                  <span class="text-xs sm:text-sm text-emerald-400 font-mono font-bold">&lt; 2 ore (Sentinel Active)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-[#080d1a] to-purple-500/10 border border-purple-500/35 rounded-3xl p-6 shadow-xl">
            <span class="inline-block text-[11px] font-mono font-extrabold text-purple-300 bg-purple-500/15 border border-purple-500/40 px-2.5 py-1 rounded-md mb-3">
              🛡️ GCP ARMOR &amp; SENTINEL v2.6
            </span>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed m-0">
              Tutti i messaggi inviati tramite questo modulo sono validati con tracciamento consenso GDPR e protetti dal firewall euristico <strong class="text-white">Pulse Sentinel AI v2.6-PURE-SQL</strong>.
            </p>
          </div>
        </aside>

      </div>

    </div>
  </div>
</template>