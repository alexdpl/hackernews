<!-- app/components/DkpCaptcha.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDkpTranslator } from '~/composables/useDkpTranslator'

const { t } = useDkpTranslator()

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
  const parsed = parseInt(userAnswer.value, 10)
  if (!isNaN(parsed) && parsed === num1.value + num2.value) {
    isVerified.value = true
    errorMessage.value = ''
    emit('verify', true)
  } else {
    isVerified.value = false
    if (userAnswer.value.length > 0) {
      errorMessage.value = '⚠️ Risposta errata. Riprova.'
    } else {
      errorMessage.value = ''
    }
    emit('verify', false)
  }
}

onMounted(() => {
  generateChallenge()
})
</script>

<template>
  <div class="kernel-captcha">
    <div class="captcha-box" :class="{ 'verified-box': isVerified }">
      <div class="captcha-header">
        <span class="captcha-title">🔒 DKP Kernel Captcha v2.5</span>
        <button type="button" @click="generateChallenge" class="refresh-btn" title="Nuova sfida">🔄</button>
      </div>
      <p class="captcha-text">Risolvi il calcolo di sicurezza: <strong>{{ num1 }} + {{ num2 }} = ?</strong></p>
      
      <div class="captcha-input-group">
        <input 
          v-model="userAnswer" 
          type="number" 
          placeholder="Risultato" 
          @input="checkAnswer"
          class="captcha-input"
        />
      </div>

      <transition name="fade">
        <p v-if="isVerified" class="success-msg">✅ Sistema verificato (Anti-Bot OK)</p>
      </transition>
      <transition name="fade">
        <p v-if="errorMessage && !isVerified" class="error-msg">{{ errorMessage }}</p>
      </transition>
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
  padding: 1.2rem;
  border-radius: 10px;
  color: #ffffff;
  max-width: 340px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}
.verified-box {
  border-color: #00dc82;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.2);
}
.captcha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.captcha-title {
  font-size: 0.75rem;
  font-weight: 800;
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
  margin-top: 0.8rem;
}
.captcha-input {
  background: #020420;
  border: 1px solid #334155;
  color: #fff;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  width: 120px;
  font-size: 0.95rem;
  font-weight: 600;
}
.captcha-input:focus {
  outline: none;
  border-color: #00dc82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}
.refresh-btn {
  background: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.refresh-btn:hover {
  background: #1e293b;
  color: #38bdf8;
}
.success-msg {
  color: #00dc82;
  font-size: 0.85rem;
  margin-top: 0.7rem;
  font-weight: 600;
}
.error-msg {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.7rem;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>