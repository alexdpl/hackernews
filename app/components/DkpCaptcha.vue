<!-- app/components/DkpCaptcha.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDkpTranslator } from '~/composables/useDkpTranslator'

const { t } = useDkpTranslator()

const emit = defineEmits<{
  (e: 'verify', valid: boolean): void
  (e: 'token', token: string | null): void
}>()

const challengeId = ref('')
const question = ref('')
const difficulty = ref(1)
const userAnswer = ref('')
const hpTrap = ref('')
const challengeLoadedAt = ref(0)

const isLoading = ref(false)
const isVerifying = ref(false)
const isVerified = ref(false)
const errorMessage = ref('')
const sentinelBadge = ref('SENTINEL OK')
const agentMode = ref<'human' | 'verified_agent' | 'unverified_bot' | 'blocked_policy'>('human')
const captchaToken = ref<string | null>(null)

defineExpose({ captchaToken, isVerified, generateChallenge })

async function generateChallenge() {
  isLoading.value = true
  userAnswer.value = ''
  hpTrap.value = ''
  isVerified.value = false
  errorMessage.value = ''
  captchaToken.value = null
  emit('verify', false)
  emit('token', null)

  try {
    const res: any = await $fetch('/api/security/captcha', {
      method: 'POST',
      body: { action: 'challenge' }
    })

    if (res?.success && res?.challengeId) {
      challengeId.value = res.challengeId
      question.value = res.question
      difficulty.value = Number(res.difficulty || 1)
      challengeLoadedAt.value = Date.now()
      agentMode.value = res?.sentinel?.agentMode || 'human'

      const risk = Number(res?.sentinel?.riskScore || 0)
      if (agentMode.value === 'verified_agent') {
        sentinelBadge.value = 'BEMYAGENT VERIFIED'
      } else if (risk >= 55) {
        sentinelBadge.value = `SENTINEL L${difficulty.value} (R:${risk})`
      } else {
        sentinelBadge.value = 'SENTINEL PURE-SQL'
      }
    } else {
      errorMessage.value = t('captchaLoadError')
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || t('captchaLoadError')
  } finally {
    isLoading.value = false
  }
}

async function verifyAnswer() {
  const trimmed = String(userAnswer.value ?? '').trim()
  if (!trimmed || !/^-?\d+$/.test(trimmed) || !challengeId.value || isVerifying.value) {
    return
  }

  isVerifying.value = true
  errorMessage.value = ''

  try {
    const solveMs = challengeLoadedAt.value > 0 ? Date.now() - challengeLoadedAt.value : 1200
    const res: any = await $fetch('/api/security/captcha', {
      method: 'POST',
      body: {
        action: 'verify',
        challengeId: challengeId.value,
        answer: trimmed,
        hpTrap: hpTrap.value,
        solveMs
      }
    })

    if (res?.verified && res?.captchaToken) {
      isVerified.value = true
      captchaToken.value = res.captchaToken
      errorMessage.value = ''
      emit('verify', true)
      emit('token', res.captchaToken)
    } else {
      isVerified.value = false
      captchaToken.value = null
      errorMessage.value = res?.error || t('captchaWrongAnswer')
      emit('verify', false)
      emit('token', null)
      if (res?.expired) {
        await generateChallenge()
      }
    }
  } catch (err: any) {
    isVerified.value = false
    captchaToken.value = null
    errorMessage.value = err?.data?.statusMessage || t('captchaWrongAnswer')
    emit('verify', false)
    emit('token', null)
  } finally {
    isVerifying.value = false
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
        <div class="flex items-center gap-2">
          <span class="captcha-title">🔒 {{ t('captchaTitle') }}</span>
          <span
            class="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border"
            :class="
              agentMode === 'verified_agent'
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            "
          >
            {{ sentinelBadge }}
          </span>
        </div>
        <button
          type="button"
          @click="generateChallenge"
          :disabled="isLoading || isVerifying"
          class="refresh-btn"
          :title="t('captchaRefresh')"
        >
          🔄
        </button>
      </div>

      <!-- Honeypot invisibile anti-bot -->
      <input
        v-model="hpTrap"
        type="text"
        name="dkp_kernel_hp_field"
        tabindex="-1"
        autocomplete="off"
        aria-hidden="true"
        class="sr-only"
      />

      <p v-if="isLoading" class="captcha-text font-mono text-xs text-sky-400 animate-pulse">
        {{ t('captchaSyncing') }}
      </p>
      <p v-else class="captcha-text">
        {{ t('captchaPrompt') }} <strong>{{ question }} = ?</strong>
      </p>

      <div class="captcha-input-group">
        <input
          v-model="userAnswer"
          type="number"
          inputmode="numeric"
          :disabled="isLoading || isVerified"
          :placeholder="t('captchaPlaceholder')"
          @keyup.enter="verifyAnswer"
          class="captcha-input"
        />
        <button
          v-if="!isVerified"
          type="button"
          :disabled="isLoading || isVerifying || String(userAnswer).trim() === ''"
          @click="verifyAnswer"
          class="verify-btn"
        >
          {{ isVerifying ? '...' : t('captchaVerifyBtn') }}
        </button>
      </div>

      <transition name="fade">
        <p v-if="isVerified" class="success-msg">✅ {{ t('captchaVerifiedOk') }}</p>
      </transition>
      <transition name="fade">
        <p v-if="errorMessage && !isVerified" class="error-msg">⚠️ {{ errorMessage }}</p>
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
  padding: 1.15rem;
  border-radius: 12px;
  color: #ffffff;
  max-width: 380px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  transition: all 0.25s ease;
}
.verified-box {
  border-color: #00dc82;
  box-shadow: 0 0 18px rgba(0, 220, 130, 0.2);
}
.captcha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.captcha-title {
  font-size: 0.72rem;
  font-weight: 800;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.captcha-text {
  font-size: 0.88rem;
  margin: 0.5rem 0;
  color: #cbd5e1;
}
.captcha-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.captcha-input {
  background: #020420;
  border: 1px solid #334155;
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  width: 125px;
  font-size: 0.95rem;
  font-weight: 700;
}
.captcha-input:focus {
  outline: none;
  border-color: #00dc82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}
.verify-btn {
  background: #10b981;
  color: #020420;
  border: none;
  padding: 0.52rem 0.9rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}
.verify-btn:hover:not(:disabled) {
  background: #34d399;
}
.verify-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.refresh-btn {
  background: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 0.28rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.refresh-btn:hover:not(:disabled) {
  background: #1e293b;
  color: #38bdf8;
}
.success-msg {
  color: #00dc82;
  font-size: 0.82rem;
  margin-top: 0.7rem;
  font-weight: 600;
}
.error-msg {
  color: #f87171;
  font-size: 0.82rem;
  margin-top: 0.7rem;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>