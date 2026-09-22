<!-- app/pages/contact.vue -->
<script setup lang="ts">
import { ref } from 'vue'

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

    if (res.success) {
      responseMessage.value = res.message
      // Reset form
      name.value = ''
      email.value = ''
      message.value = ''
      captchaAnswer.value = ''
    } else {
      isError.value = true
      responseMessage.value = res.error || 'Errore durante l\'invio.'
    }
  } catch (err) {
    isError.value = true
    responseMessage.value = 'Errore di connessione al server.'
  } finally {
    loading.value = false
  }
}

useSeoMeta({
  title: 'Contatti - DevKernelPulse',
  description: 'Mettiti in contatto con il team di DevKernelPulse o con Alessandro De Paola.'
})
</script>

<template>
  <div class="page-container">
    <div class="content-card">
      <h1>Contatta il Team • <span class="brand">DevKernelPulse</span></h1>
      <p class="lead">
        Hai domande sulla community, proposte di collaborazione, vuoi segnalare un bug o altro ancora? Compila il form sottostante.
      </p>

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
          <select v-model="subject" class="form-input">
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

        <!-- Dev Captcha Anti-Bot -->
        <div class="captcha-box">
          <label>🔒 Verifica Anti-Bot (Kernel Security): Quanto fa <strong>4 + 3</strong>?</label>
          <input v-model="captchaAnswer" type="text" required class="form-input captcha-input" placeholder="Risposta numerica" />
        </div>

        <div v-if="responseMessage" :class="['alert-msg', isError ? 'error' : 'success']">
          {{ responseMessage }}
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Invio in corso...' : 'Invia Messaggio 🚀' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 2.5rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #020420;
}
.content-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
h1 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}
.brand {
  color: #00dc82;
  background: #020420;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}
.lead {
  font-size: 1rem;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 2rem;
}
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
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
  gap: 0.4rem;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}
.form-input {
  padding: 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #020420;
  background: #fff;
}
.form-input:focus {
  outline: none;
  border-color: #00dc82;
}
textarea.form-input {
  resize: vertical;
}
.captcha-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 1rem;
  border-radius: 6px;
}
.captcha-input {
  max-width: 200px;
  margin-top: 0.4rem;
}
.alert-msg {
  padding: 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}
.alert-msg.success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
.alert-msg.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.submit-btn {
  background: #020420;
  color: #00dc82;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;
  text-align: center;
}
.submit-btn:hover {
  opacity: 0.9;
}
</style>