<!-- app/components/DkpCaptcha.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits(['verify'])
const num1 = ref(0)
const num2 = ref(0)
const userAnswer = ref('')
const isVerified = ref(false)
const errorMessage = ref('')

function generateChallenge() {
  num1.value = Math.floor(Math.random() * 10) + 1
  num2.value = Math.floor(Math.random() * 10) + 1
  userAnswer.value = ''
  isVerified.value = false
  errorMessage.value = ''
  emit('verify', false)
}

function checkAnswer() {
  if (parseInt(userAnswer.value, 10) === num1.value + num2.value) {
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
  <div class="kernel-captcha">
    <div class="captcha-box">
      <span class="captcha-title">🔒 Kernel Captcha Sicurezza</span>
      <p class="captcha-text">Risolvi l'equazione: <strong>{{ num1 }} + {{ num2 }} = ?</strong></p>
      <div class="captcha-input-group">
        <input 
          v-model="userAnswer" 
          type="number" 
          placeholder="Risultato" 
          @input="checkAnswer"
          class="captcha-input"
        />
        <button type="button" @click="generateChallenge" class="refresh-btn" title="Nuova sfida">🔄</button>
      </div>
      <p v-if="isVerified" class="success-msg">✅ Verificato con successo</p>
      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.kernel-captcha {
  margin: 1rem 0;
  font-family: inherit;
}
.captcha-box {
  background: #0f172a;
  border: 1px solid #1e293b;
  padding: 1rem;
  border-radius: 8px;
  color: #ffffff;
  max-width: 320px;
}
.captcha-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.captcha-text {
  font-size: 0.9rem;
  margin: 0.5rem 0;
  color: #cbd5e1;
}
.captcha-input-group {
  display: flex;
  gap: 0.5rem;
}
.captcha-input {
  background: #020420;
  border: 1px solid #334155;
  color: #fff;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  width: 100px;
  font-size: 0.9rem;
}
.captcha-input:focus {
  outline: none;
  border-color: #00dc82;
}
.refresh-btn {
  background: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
}
.refresh-btn:hover {
  background: #1e293b;
}
.success-msg {
  color: #00dc82;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  font-weight: 600;
}
.error-msg {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
</style>