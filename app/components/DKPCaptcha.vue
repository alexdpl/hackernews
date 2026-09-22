<!-- app/components/DkpCaptcha.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits(['verify'])

const question = ref('')
const userAnswer = ref('')
const isVerified = ref(false)
const errorMessage = ref('')

// Domande tecniche / logiche casuali per il DKP Captcha
const challenges = [
  { q: 'Quanto fa 7 + 5?', a: '12' },
  { q: 'Qual è la radice quadrata di 81?', a: '9' },
  { q: 'Quanti bit ci sono in un byte?', a: '8' },
  { q: 'Quanto fa 15 - 6?', a: '9' },
  { q: 'Digita il numero binario per dieci (in decimale):', a: '10' }
]

let correctAnswer = ''

function generateChallenge() {
  const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)]
  question.value = randomChallenge.q
  correctAnswer = randomChallenge.a
  userAnswer.value = ''
  isVerified.value = false
  errorMessage.value = ''
  emit('verify', false)
}

function checkAnswer() {
  if (userAnswer.value.trim() === correctAnswer) {
    isVerified.value = true
    errorMessage.value = ''
    emit('verify', true)
  } else {
    isVerified.value = false
    errorMessage.value = 'Risposta errata. Riprova.'
    emit('verify', false)
  }
}

onMounted(() => {
  generateChallenge()
})
</script>

<template>
  <div class="dkp-captcha-box">
    <div class="captcha-header">
      <span class="captcha-badge">DKP Security</span>
      <span class="captcha-title">Verifica Antispam Nativa</span>
    </div>
    
    <div class="captcha-body">
      <p class="captcha-question">❓ Risolvi per confermare: <strong>{{ question }}</strong></p>
      
      <div class="captcha-input-group">
        <input 
          v-model="userAnswer" 
          type="text" 
          placeholder="Tua risposta..." 
          @input="checkAnswer"
          :disabled="isVerified"
          class="captcha-input"
        />
        <button type="button" @click="generateChallenge" class="refresh-btn" title="Cambia domanda">🔄</button>
      </div>

      <p v-if="isVerified" class="success-text">✅ Verifica superata con successo!</p>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.dkp-captcha-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.captcha-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.captcha-badge {
  background: #020420;
  color: #00dc82;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.captcha-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.captcha-question {
  font-size: 0.9rem;
  color: #020420;
  margin-bottom: 0.5rem;
}

.captcha-input-group {
  display: flex;
  gap: 0.5rem;
}

.captcha-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
}

.refresh-btn {
  background: #e2e8f0;
  border: none;
  border-radius: 4px;
  padding: 0 0.75rem;
  cursor: pointer;
}

.refresh-btn:hover {
  background: #cbd5e1;
}

.success-text {
  color: #059669;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.4rem;
}

.error-text {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.4rem;
}
</style>