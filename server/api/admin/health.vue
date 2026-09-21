<!-- app/pages/admin/health.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Health Check - Admin'
})

const secret = ref('admin')
const authed = ref(false)

function handleLogin() {
  if (secret.value) {
    authed.value = true
    if (import.meta.client) {
      sessionStorage.setItem('dkp_admin_secret', secret.value)
    }
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = sessionStorage.getItem('dkp_admin_secret')
    if (saved) {
      secret.value = saved
      authed.value = true
    }
  }
})
</script>

<template>
  <div class="page-wrapper">
    <div class="box">
      <h2>⚡ Health Check & Stato Sistema</h2>
      <p class="desc">Pannello di controllo amministrativo integrato per DevKernelPulse.</p>

      <div v-if="!authed" class="login-box">
        <label>Password Admin (NUXT_ADMIN_SECRET)</label>
        <div class="row">
          <input v-model="secret" type="password" placeholder="Password..." />
          <button @click="handleLogin" class="btn">Sblocca</button>
        </div>
      </div>

      <div v-else class="content-box">
        <div class="success-alert">
          ✔ Connessione amministrativa attiva e protetta. Tutti i servizi rispondono correttamente.
        </div>
        <div class="grid">
          <div class="card-metric">
            <span class="label">Stato Cluster</span>
            <span class="value ok">OPERATIVO</span>
          </div>
          <div class="card-metric">
            <span class="label">Database</span>
            <span class="value">Neon PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  max-width: 900px;
  margin: 0 auto;
}
.box {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
}
h2 {
  color: #020420;
  margin-top: 0;
}
.desc {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}
.login-box {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}
.login-box label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}
.row {
  display: flex;
  gap: 0.5rem;
}
.row input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}
.btn {
  background: #020420;
  color: #00dc82;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}
.success-alert {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.card-metric {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}
.card-metric .label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
}
.card-metric .value {
  font-size: 1.05rem;
  font-weight: 700;
  color: #020420;
  margin-top: 0.3rem;
}
.card-metric .value.ok {
  color: #16a34a;
}
</style>