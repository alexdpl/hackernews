<!-- app/pages/admin/jobs.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'admin-only' })

const jobOffers = ref([
  { id: 1, title: 'Senior Nuxt 4 & Vue Architect', company: 'DevKernelPulse Core', location: 'Remoto (EU)', salary: '€65,000 - €85,000', status: 'Approved' },
  { id: 2, title: 'Fullstack Rust & Postgres Engineer', company: 'Neural Tech Labs', location: 'Milano / Hybrid', salary: '€50,000 - €70,000', status: 'Pending' }
])

function toggleStatus(id: number) {
  const job = jobOffers.value.find(j => j.id === id)
  if (job) {
    job.status = job.status === 'Approved' ? 'Pending' : 'Approved'
  }
}
</script>

<template>
  <div class="admin-page-container">
  <!-- TOP BAR DI NAVIGAZIONE ADMIN -->
<div class="admin-top-bar">
  <div class="admin-breadcrumb">
    <span class="status-dot green"></span>
    <span class="breadcrumb-text">ADMIN CONTROL CENTER</span>
  </div>

  <NuxtLink to="/admin" class="btn-back-dashboard">
    📊 Torna alla Dashboard
  </NuxtLink>
</div>
    <div class="header-section">
      <div class="badge">DKP JOB HUB ADMIN</div>
      <h1>Gestione <span class="highlight">Job Board Meritocratica</span></h1>
      <p class="subtitle">Modera le offerte di lavoro per sviluppatori con veridicità Proof of Code.</p>
    </div>

    <div class="card">
      <h3>💼 Offerte di Lavoro per Sviluppatori</h3>
      <table class="dkp-table">
        <thead>
          <tr>
            <th>Posizione</th>
            <th>Azienda</th>
            <th>Sede</th>
            <th>RAL / Salario</th>
            <th>Stato Moderazione</th>
            <th>Azione</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in jobOffers" :key="job.id">
            <td class="font-bold">{{ job.title }}</td>
            <td>{{ job.company }}</td>
            <td>📍 {{ job.location }}</td>
            <td class="salary-text">{{ job.salary }}</td>
            <td>
              <span :class="job.status === 'Approved' ? 'status-approved' : 'status-pending'">
                {{ job.status }}
              </span>
            </td>
            <td>
              <button @click="toggleStatus(job.id)" class="btn-action">
                {{ job.status === 'Approved' ? 'Sospendi' : 'Approva' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>


/* ==========================================================================
   TOP BAR NAVIGAZIONE ADMIN (TORNA ALLA DASHBOARD)
   ========================================================================== */
.admin-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.admin-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
}

.breadcrumb-text {
  font-size: 0.75rem;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-dot.green {
  background: #00dc82;
  box-shadow: 0 0 8px #00dc82;
}

/* BOTTONE NEON TORNA ALLA DASHBOARD */
.btn-back-dashboard {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-back-dashboard:hover {
  border-color: #00dc82;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.08);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.2);
  transform: translateY(-1px);
}

.admin-page-container { padding: 2rem; background: #020420; min-height: 90vh; color: #f8fafc; }
.header-section { margin-bottom: 2rem; }
.badge { display: inline-block; background: rgba(250, 204, 21, 0.15); color: #fde047; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(250, 204, 21, 0.3); margin-bottom: 0.5rem; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; }
.card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
.dkp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; margin-top: 1rem; }
.dkp-table th, .dkp-table td { padding: 0.75rem; border-bottom: 1px solid #1e293b; }
.salary-text { color: #00dc82; font-weight: 700; }
.status-approved { background: rgba(0, 220, 130, 0.15); color: #00dc82; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem; }
.status-pending { background: rgba(250, 204, 21, 0.15); color: #fde047; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem; }
.btn-action { background: #020420; border: 1px solid #1e293b; color: #f8fafc; padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.78rem; }
.btn-action:hover { border-color: #00dc82; color: #00dc82; }
</style>
