<!-- app/pages/submit.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

useSeoMeta({
  title: 'Invia Contenuto - DevKernelPulse v2.5-GOLD',
  description: 'Pubblica notizie, domande Ask, Showcase progetti o annunci Job nel Kernel DKP.'
})

const router = useRouter()
const { currentUser, isAuthenticated } = useAuthCore()

// Opzioni Menù a Tendina Sezioni DKP
const sections = [
  { id: 'news', name: '📰 News Feed', description: 'Notizie tech, articoli ed ecosistema', targetRoute: '/feed' },
  { id: 'ask', name: '💬 Ask Community', description: 'Domande tecniche, supporto e dibattiti', targetRoute: '/ask' },
  { id: 'show', name: '⚡ Show DKP', description: 'Showcase e demo di progetti personali', targetRoute: '/show' },
  { id: 'job', name: '💼 Tech Jobs', description: 'Offerte di lavoro e posizioni aperte', targetRoute: '/jobs' },
  { id: 'blog', name: '✍️ DKP Blog', description: 'Usa l\'editor avanzato nella Dashboard', targetRoute: '/user/dashboard?tab=content' }
]

const form = ref({
  type: 'news',
  title: '',
  url: '',
  content: ''
})

const isBlogSelected = computed(() => form.value.type === 'blog')

// DKP Kernel Captcha System (Anti-Bot Engine)
const captchaNum1 = ref(0)
const captchaNum2 = ref(0)
const captchaUserAnswer = ref('')
const captchaExpectedAnswer = ref(0)

function generateCaptcha() {
  captchaNum1.value = Math.floor(Math.random() * 12) + 1
  captchaNum2.value = Math.floor(Math.random() * 10) + 1
  captchaExpectedAnswer.value = captchaNum1.value + captchaNum2.value
  captchaUserAnswer.value = ''
}

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit() {
  if (isBlogSelected.value) {
    router.push('/user/dashboard?tab=content')
    return
  }

  if (!form.value.title.trim()) {
    errorMessage.value = 'Il titolo del contenuto è obbligatorio.'
    return
  }

  if (parseInt(captchaUserAnswer.value) !== captchaExpectedAnswer.value) {
    errorMessage.value = '🛡️ Risposta al DKP Kernel Captcha errata. Riprova.'
    generateCaptcha()
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const res = await $fetch<{ success: boolean; message: string }>('/api/pulse/submit', {
      method: 'POST',
      body: {
        type: form.value.type,
        title: form.value.title,
        url: form.value.url,
        content: form.value.content,
        author: currentUser.value?.username || 'alexdpl',
        authorId: currentUser.value?.id || 1
      }
    })

    if (res.success) {
      successMessage.value = res.message || 'Contenuto pubblicato nel Kernel con successo!'
      setTimeout(() => {
        const selectedSec = sections.find(s => s.id === form.value.type)
        router.push(selectedSec ? selectedSec.targetRoute : '/')
      }, 1200)
    } else {
      throw new Error(res.message)
    }
  } catch (err: any) {
    errorMessage.value = err.data?.message || err.message || 'Errore durante la pubblicazione. Verifica i dati.'
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
  <div class="submit-page-container">
    <div class="submit-card">
      
      <!-- BADGE HEADER -->
      <div class="card-header-badge">
        <span class="badge-tag">DKP KERNEL SUBMIT v2.5-GOLD</span>
        <ClientOnly>
          <span v-if="isAuthenticated" class="user-identity">
            Autore: <strong class="user-highlight">@{{ currentUser?.username }}</strong>
          </span>
        </ClientOnly>
      </div>

      <h1>Condividi nel <span class="highlight">Kernel DKP</span></h1>
      <p class="subtitle">Scegli la sezione, compila i dati e pubblica all'istante nell'ecosistema.</p>

      <form @submit.prevent="handleSubmit" class="submit-form">
        
        <!-- 1. MENÙ A TENDINA SEZIONI KERNEL -->
        <div class="form-group">
          <label class="label-with-icon">
            <span>🎯 Sezione Destinazione *</span>
          </label>
          <select v-model="form.type" class="dkp-select">
            <option v-for="sec in sections" :key="sec.id" :value="sec.id">
              {{ sec.name }} — {{ sec.description }}
            </option>
          </select>
        </div>

        <div v-if="isBlogSelected" class="blog-redirect-alert">
          💡 <strong>Nota:</strong> Gli articoli del Blog richiedono l'Editor Avanzato per tag, formattazione Markdown e categorie. Verrai reindirizzato alla Dashboard per creare il tuo articolo.
        </div>

        <template v-else>
          <!-- 2. TITOLO DEL CONTENUTO -->
          <div class="form-group">
            <label>Titolo del Contenuto *</label>
            <input 
              v-model="form.title" 
              type="text" 
              placeholder="Es. Rilasciato Nuxt 4: ecco le novità..." 
              required 
              class="dkp-input"
            />
          </div>

          <!-- 3. URL ESTERNO -->
          <div class="form-group">
            <label>URL / Link Esterno (Consigliato per News, Show e Jobs)</label>
            <input 
              v-model="form.url" 
              type="url" 
              placeholder="https://github.com/tuo-progetto o https://articolo..." 
              class="dkp-input"
            />
          </div>

          <!-- 4. TESTO / DESCRIZIONE BREVE -->
          <div class="form-group">
            <label>Testo / Descrizione (Richiesto per Ask Community)</label>
            <textarea 
              v-model="form.content" 
              rows="4" 
              placeholder="Inserisci qui il contesto, il codice o i dettagli della discussione..."
              class="dkp-textarea"
            ></textarea>
          </div>

          <!-- 5. DKP KERNEL CAPTCHA ENGINE -->
          <div class="captcha-box">
            <div class="captcha-header">
              <span class="captcha-title">🛡️ DKP KERNEL CAPTCHA</span>
              <button type="button" @click="generateCaptcha" class="btn-captcha-refresh" title="Genera nuovo codice">
                🔄 Rigenera
              </button>
            </div>
            <div class="captcha-challenge">
              <p class="challenge-text">
                Risolvi l'equazione di sicurezza:
                <strong class="math-eq">{{ captchaNum1 }} + {{ captchaNum2 }} = ?</strong>
              </p>
              <input 
                v-model="captchaUserAnswer" 
                type="number" 
                placeholder="Risultato" 
                required
                class="captcha-input"
              />
            </div>
          </div>
        </template>

        <!-- MESSAGGI DI ERRORE O SUCCESSO -->
        <div v-if="errorMessage" class="error-banner">
          ⚠️ {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="success-banner">
          {{ successMessage }}
        </div>

        <!-- SUBMIT BUTTON -->
        <button type="submit" class="btn-submit" :disabled="isSubmitting">
          <span v-if="isSubmitting">Elaborazione nel Kernel... ⚡</span>
          <span v-else-if="isBlogSelected">Vai all'Editor Blog ➔</span>
          <span v-else>🚀 Pubblica Contenuto</span>
        </button>

      </form>

      <!-- INFO DASHBOARD UTENTE -->
      <div class="user-panel-info">
        <span>📊 Nota: Potrai gestire i tuoi post dal nuovo Control Center della tua </span>
        <NuxtLink to="/user/dashboard?tab=content">Dashboard Personale ➔</NuxtLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.submit-page-container { max-width: 720px; margin: 3rem auto; padding: 0 1.5rem; color: #f8fafc; font-family: system-ui, sans-serif; }
.submit-card { background: #090d16; border: 1px solid #1e293b; border-radius: 16px; padding: 2.25rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.card-header-badge { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.badge-tag { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); }
.user-identity { font-size: 0.82rem; color: #94a3b8; }
.user-highlight { color: #00dc82; }

.submit-card h1 { font-size: 2rem; font-weight: 900; margin: 0.25rem 0; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; margin-bottom: 2rem; }

.submit-form { display: flex; flex-direction: column; gap: 1.25rem; }

.form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.4rem; }
.dkp-select, .dkp-input, .dkp-textarea { width: 100%; background: #020420; border: 1px solid #1e293b; color: #ffffff; padding: 0.75rem 1rem; border-radius: 8px; outline: none; font-size: 0.95rem; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
.dkp-select:focus, .dkp-input:focus, .dkp-textarea:focus { border-color: #00dc82; box-shadow: 0 0 10px rgba(0, 220, 130, 0.15); }

.blog-redirect-alert { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; padding: 1rem; border-radius: 8px; font-size: 0.85rem; line-height: 1.5; }

.captcha-box { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 1rem 1.25rem; margin-top: 0.5rem; }
.captcha-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.captcha-title { font-size: 0.75rem; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px; }
.btn-captcha-refresh { background: transparent; border: none; color: #64748b; font-size: 0.75rem; cursor: pointer; font-weight: 700; }
.btn-captcha-refresh:hover { color: #00dc82; }

.captcha-challenge { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.challenge-text { margin: 0; font-size: 0.88rem; color: #cbd5e1; }
.math-eq { color: #00dc82; font-size: 1.1rem; margin-left: 0.4rem; }
.captcha-input { width: 120px; background: #090d16; border: 1px solid #1e293b; color: #00dc82; font-weight: 800; padding: 0.5rem; border-radius: 6px; text-align: center; outline: none; }
.captcha-input:focus { border-color: #00dc82; }

.error-banner { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; }
.success-banner { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; }

.btn-submit { background: #00dc82; color: #020420; font-weight: 800; font-size: 0.98rem; padding: 0.85rem; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s, transform 0.1s; margin-top: 0.5rem; }
.btn-submit:hover:not(:disabled) { background: #00bf71; transform: translateY(-1px); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

.user-panel-info { margin-top: 1.75rem; padding-top: 1rem; border-top: 1px solid #1e293b; font-size: 0.82rem; color: #64748b; text-align: center; }
.user-panel-info a { color: #38bdf8; text-decoration: none; font-weight: 700; transition: color 0.2s; }
.user-panel-info a:hover { color: #00dc82; text-decoration: underline; }
</style>