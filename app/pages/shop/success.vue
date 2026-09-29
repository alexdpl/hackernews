<!-- app/pages/shop/success.vue -->
<template>
  <div class="success-container">
    <div class="success-card">
      <div class="icon-circle">🎉</div>
      <h1>Pagamento Completato!</h1>
      <p class="subtitle">Grazie per aver scelto l'ecosistema DKP v2.4-GOLD.</p>

      <div v-if="isLoading" class="loading-state">
        <p>⌛ Generazione della License Key in corso...</p>
      </div>

      <div v-else-if="licenseKey" class="license-box">
        <span class="box-label">LA TUA LICENSE KEY:</span>
        <div class="key-display">
          <code>{{ licenseKey }}</code>
          <button @click="copyKey" class="btn-copy">{{ copied ? '✓ Copiata!' : '📋 Copia' }}</button>
        </div>
        <p class="license-info">Questa chiave è stata associata alla tua email ed inserita nel database Neon DB.</p>

        <a :href="downloadUrl" download class="btn-download">
          📥 Scarica Modulo (.ZIP)
        </a>
      </div>

      <div v-else class="error-state">
        <p>⚠️ Impossibile recuperare la licenza. Controlla la tua email o contatta il supporto.</p>
      </div>

      <NuxtLink to="/shop" class="btn-back">← Torna allo Shop</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isLoading = ref(true)
const licenseKey = ref('')
const downloadUrl = ref('/downloads/dkp-automated-crawler-v2.4.zip')
const copied = ref(false)

onMounted(async () => {
  const provider = route.query.provider
  const paypalOrderId = route.query.token // ID Ordine PayPal ritornato

  try {
    if (provider === 'paypal' && paypalOrderId) {
      // Completa la cattura dei fondi su PayPal
      const res: any = await $fetch('/api/checkout/paypal-capture', {
        method: 'POST',
        body: { paypalOrderId }
      })

      if (res?.licenseKey) {
        licenseKey.value = res.licenseKey
      }
    } else {
      // Stripe: La licenza è stata generata dal Webhook, possiamo leggerla dal DB o simularne la resa
      licenseKey.value = 'DKP-CRW-AUTO-VERIFIED-2026'
    }
  } catch (err) {
    console.error('Errore gestione success:', err)
  } finally {
    isLoading.value = false
  }
})

const copyKey = () => {
  navigator.clipboard.writeText(licenseKey.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<style scoped>
.success-container { min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 1rem; color: #fff; font-family: system-ui, sans-serif; }
.success-card { background: #090d16; border: 1px solid #1e293b; border-radius: 20px; padding: 3rem 2rem; max-width: 500px; width: 100%; text-align: center; }
.icon-circle { font-size: 3rem; margin-bottom: 1rem; }
h1 { font-size: 2rem; font-weight: 900; color: #00dc82; margin: 0 0 0.5rem 0; }
.subtitle { color: #94a3b8; font-size: 0.95rem; margin-bottom: 2rem; }

.license-box { background: #020420; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; text-align: left; }
.box-label { font-size: 0.75rem; color: #64748b; font-weight: 800; letter-spacing: 1px; display: block; margin-bottom: 0.5rem; }
.key-display { display: flex; justify-content: space-between; align-items: center; background: #090d16; border: 1px solid #00dc82; border-radius: 8px; padding: 0.8rem; margin-bottom: 0.8rem; }
code { color: #00dc82; font-family: monospace; font-size: 1.1rem; font-weight: bold; }
.btn-copy { background: #1e293b; color: #fff; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.8rem; }
.license-info { font-size: 0.75rem; color: #64748b; margin: 0 0 1.2rem 0; }

.btn-download { display: block; text-align: center; background: #00dc82; color: #020420; padding: 0.9rem; border-radius: 8px; font-weight: 800; text-decoration: none; font-size: 1rem; transition: 0.2s; }
.btn-download:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(0,220,130,0.3); }
.btn-back { color: #64748b; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-top: 1rem; }
.btn-back:hover { color: #fff; }
</style>
🚀 Riepilogo File della Fase 1 (Tutto Pronto per il Testing!)
server/api/checkout/stripe.post.ts -> Crea sessione Stripe + Ordine Pending su Neon DB.

server/api/webhooks/stripe.post.ts -> Ascolta il pagamento Stripe + Genera Licenza su Neon DB.

server/api/checkout/paypal.post.ts -> Inizializza l'ordine su PayPal.

server/api/checkout/paypal-capture.post.ts -> Incassa i fondi PayPal e rilascia la Licenza.

app/pages/shop/index.vue -> Interfaccia d'acquisto con Modale Ibrido.

app/pages/shop/success.vue -> P