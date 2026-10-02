<!-- app/pages/contact.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useDkpSeo({
  title: 'Contatti & Supporto - DevKernelPulse v2.4-GOLD',
  description: 'Mettiti in contatto con il team di DevKernelPulse o con Alessandro De Paola per proposte, supporto e bug report.'
})

const name = ref('')
const email = ref('')
const subject = ref('Informazioni sulla Community')
const message = ref('')
const captchaAnswer = ref('')
const loading = ref(false)
const responseMessage = ref('')
const isError = ref(false)

async function handleSubmit() {
  loading.value = true
  responseMessage.value = ''
  isError.value = false

  try {
    const res: any = await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        subject: subject.value,
        message: message.value,
        captchaAnswer: captchaAnswer.value
      }
    })

    if (res?.success) {
      responseMessage.value = res.message || 'Messaggio inviato con successo! Il team ti risponderà a breve.'
      // Reset form
      name.value = ''
      email.value = ''
      message.value = ''
      captchaAnswer.value = ''
    } else {
      isError.value = true
      responseMessage.value = res?.error || 'Errore durante l\'invio del messaggio.'
    }
  } catch (err) {
    isError.value = true
    responseMessage.value = 'Errore di connessione al server Sentinel.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="contact-container">
    <!-- HERO BANNER V2.4-GOLD -->
    <div class="contact-hero">
      <div class="hero-header">
        <h1>📩 Contatta il Team • <span class="brand">DevKernelPulse</span></h1>
        <span class="badge-gold">v2.4-GOLD</span>
      </div>
      <p class="lead">
        Hai domande sulla community, proposte di collaborazione, vuoi segnalare un bug o richiedere supporto? Compila il modulo sottostante.
      </p>
    </div>

    <div class="contact-grid">
      <!-- FORM PRINCIPALE -->
      <div class="content-card">
        <form @submit.prevent="handleSubmit" class="contact-form">
          <div class="form-row">
            <div class="form-group">
              <label>Il tuo Nome</label>
              <input v-model="name" type="text" required class="form-input" placeholder="es. Linus Torvalds" />
            </div>
            <div class="form-group">
              <label>La tua Email</label>
              <input v-model="email" type="email" required class="form-input" placeholder="es. linus@kernel.org" />
            </div>
          </div>

          <div class="form-group">
            <label>Oggetto</label>
            <select v-model="subject" class="form-input form-select">
              <option value="Informazioni sulla Community">Informazioni sulla Community</option>
              <option value="Proposta Sponsor / Partnership">Proposta Sponsor / Partnership</option>
              <option value="Segnalazione Bug / Supporto">Segnalazione Bug / Supporto</option>
              <option value="Altro">Altro</option>
            </select>
          </div>

          <div class="form-group">
            <label>Messaggio</label>
            <textarea v-model="message" rows="5" required class="form-input" placeholder="Scrivi qui il tuo messaggio..."></textarea>
          </div>

          <!-- DEV CAPTCHA ANTI-BOT (KERNEL SECURITY) -->
          <div class="captcha-box">
            <div class="captcha-label">
              <span class="shield-icon">🔒</span>
              <span>Verifica Anti-Bot (Kernel Security): Quanto fa <strong>4 + 3</strong>?</span>
            </div>
            <input v-model="captchaAnswer" type="text" required class="form-input captcha-input" placeholder="Risposta numerica" />
          </div>

          <!-- MESSAGGIO DI RISPOSTA -->
          <Transition name="fade">
            <div v-if="responseMessage" :class="['alert-msg', isError ? 'error' : 'success']">
              <span>{{ isError ? '⚠️' : '✅' }}</span>
              <span>{{ responseMessage }}</span>
            </div>
          </Transition>

          <button type="submit" :disabled="loading" class="submit-btn">
            <span v-if="loading">⚡ Invio in corso...</span>
            <span v-else>Invia Messaggio 🚀</span>
          </button>
        </form>
      </div>

      <!-- SIDEBAR INFO & DIRECT DISPATCH -->
      <div class="side-info">
        <div class="info-card">
          <h3>⚡ Direct Kernel Dispatch</h3>
          <p>Preferisci un contatto diretto o hai un'emergenza infrastrutturale?</p>

          <div class="contact-method">
            <span class="method-icon">📧</span>
            <div>
              <span class="method-label">Email Ufficiale</span>
              <a href="mailto:support@devkernelpulse.io" class="method-val">support@devkernelpulse.io</a>
            </div>
          </div>

          <div class="contact-method">
            <span class="method-icon">👨‍💻</span>
            <div>
              <span class="method-label">Lead Developer</span>
              <span class="method-val">Alessandro De Paola (@alexdpl)</span>
            </div>
          </div>

          <div class="contact-method">
            <span class="method-icon">⏱️</span>
            <div>
              <span class="method-label">SLA Risposta Media</span>
              <span class="method-val green">&lt; 2 ore (Sentinel Active)</span>
            </div>
          </div>
        </div>

        <div class="info-card security-notice">
          <span class="sec-badge">GCP ARMOR PROTECTED</span>
          <p>Tutti i messaggi inviati tramite questo modulo sono protetti e analizzati dal firewall euristico <strong>Pulse Sentinel AI</strong>.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-container {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1rem 4rem;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #f8fafc;
}

/* 1. HERO BANNER */
.contact-hero {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.hero-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.hero-header h1 {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.brand {
  color: #00dc82;
  background: #020420;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.badge-gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid #00dc82;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.2);
}

.lead {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
}

/* 2. GRID LAYOUT */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

/* 3. CONTENT CARD FORM */
.content-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #1e293b;
  border-radius: 8px;
  font-size: 0.92rem;
  color: #f8fafc;
  background: #020420;
  transition: all 0.2s ease;
}

.form-input::placeholder {
  color: #475569;
}

.form-input:focus {
  outline: none;
  border-color: #00dc82;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.2);
  background: #060b18;
}

.form-select {
  cursor: pointer;
}

.form-select option {
  background: #020420;
  color: #f8fafc;
}

textarea.form-input {
  resize: vertical;
  min-height: 120px;
}

/* 4. CAPTCHA BOX */
.captcha-box {
  background: rgba(0, 220, 130, 0.03);
  border: 1px dashed rgba(0, 220, 130, 0.3);
  padding: 1.1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.captcha-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.captcha-label strong {
  color: #00dc82;
  font-size: 1rem;
}

.captcha-input {
  max-width: 220px;
  border-color: rgba(0, 220, 130, 0.3);
}

/* 5. ALERT MESSAGES */
.alert-msg {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.1rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 700;
}

.alert-msg.success {
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  border: 1px solid #00dc82;
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.15);
}

.alert-msg.error {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid #ef4444;
}

/* 6. SUBMIT BUTTON */
.submit-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.85rem 1.75rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 220, 130, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
}

.submit-btn:hover:not(:disabled) {
  background: #00f08f;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 220, 130, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 7. SIDEBAR INFO */
.side-info {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.info-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #ffffff;
  font-weight: 800;
}

.info-card p {
  margin: 0 0 1.25rem;
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.5;
}

.contact-method {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 0.75rem 0;
  border-top: 1px solid #1e293b;
}

.method-icon {
  font-size: 1.2rem;
}

.method-label {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 800;
}

.method-val {
  font-size: 0.88rem;
  color: #f8fafc;
  font-weight: 600;
  text-decoration: none;
}

a.method-val:hover {
  color: #00dc82;
  text-decoration: underline;
}

.method-val.green {
  color: #00dc82;
}

.security-notice {
  background: linear-gradient(135deg, rgba(9, 13, 22, 0.9) 0%, rgba(2, 4, 32, 0.9) 100%);
  border-color: rgba(168, 85, 247, 0.3);
}

.sec-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 900;
  color: #c084fc;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.4);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.6rem;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>