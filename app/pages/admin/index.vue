<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
const { posts } = useBlog()
const { settings } = useAdminSettings()
</script>

<template>
  <div class="admin-container">
    <div class="admin-header">
      <span class="badge-tag">DKP Master Control Unit</span>
      <h1>Admin Command Center</h1>
      <p>Pannello di controllo unificato per la gestione totale dell'ecosistema DevKernelPulse.</p>
    </div>

    <!-- Metriche Rapide Globali -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-icon">📰</span>
        <div class="metric-info">
          <h3>{{ posts.length }}</h3>
          <p>Articoli Blog Pubblicati</p>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon">💼</span>
        <div class="metric-info">
          <h3>3</h3>
          <p>Posizioni Jobs Attive</p>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon">🛡️</span>
        <div class="metric-info">
          <h3>{{ settings.maintenanceMode ? 'Manutenzione' : 'Online / Sicuro' }}</h3>
          <p>Stato del Kernel</p>
        </div>
      </div>
    </div>

    <!-- Moduli di Navigazione Admin -->
    <div class="modules-grid">
      <NuxtLink to="/admin/blog" class="module-card">
        <div class="mod-icon">✍️</div>
        <h2>DKP Native Blog & News</h2>
        <p>Gestisci categorie, scrivi articoli con live preview e analizza i Karma Likes.</p>
        <span class="mod-link">Accedi al Modulo ↗</span>
      </NuxtLink>

      <NuxtLink to="/admin/jobs" class="module-card">
        <div class="mod-icon">💼</div>
        <h2>Jobs & Talent Acquisition</h2>
        <p>Pubblica nuove offerte di lavoro e gestisci le candidature tecniche.</p>
        <span class="mod-link">Accedi al Modulo ↗</span>
      </NuxtLink>

      <NuxtLink to="/admin/settings" class="module-card">
        <div class="mod-icon">⚙️</div>
        <h2>Global Configurations & Settings</h2>
        <p>Configura i feature flag, la modalità manutenzione e le chiavi pubbliche.</p>
        <span class="mod-link">Accedi al Modulo ↗</span>
      </NuxtLink>
      
	  <NuxtLink to="/admin/shop" class="module-card">
  <div class="mod-icon">🛒</div>
  <h2>DKP Ecosystem Shop & .ZIP</h2>
  <p>Gestisci il catalogo e-commerce dei plugin nativi e i pacchetti in vendita.</p>
  <span class="mod-link">Accedi al Modulo ↗</span>
</NuxtLink>
   </div>   
  </div>
</template>

<style scoped>
.admin-container { 
  max-width: 1100px; 
  margin: 2rem auto; 
  padding: 0 1rem; 
}

.admin-header { 
  margin-bottom: 2rem; 
  text-align: center; 
}

.badge-tag { 
  background: rgba(0, 220, 130, 0.15); 
  color: #00a862; 
  padding: 0.3rem 0.8rem; 
  border-radius: 20px; 
  font-size: 0.8rem; 
  font-weight: 700; 
  text-transform: uppercase; 
  border: 1px solid rgba(0, 220, 130, 0.3); 
}

.admin-header h1 { 
  font-size: clamp(1.8rem, 4vw, 2.3rem); 
  color: #020420; 
  font-weight: 800; 
  margin-top: 0.75rem; 
}

.admin-header p { 
  color: #64748b; 
  font-size: 0.95rem; 
}

/* Metrics - Mobile First */
.metrics-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 1rem; 
  margin-bottom: 2rem; 
}

@media(min-width: 640px) {
  .metrics-grid { 
    grid-template-columns: repeat(3, 1fr); 
  }
}

.metric-card { 
  background: #020420; 
  border: 1px solid #1e293b; 
  border-radius: 12px; 
  padding: 1.25rem; 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
  color: #ffffff; 
}

.metric-icon { 
  font-size: 2rem; 
}

.metric-info h3 { 
  font-size: 1.3rem; 
  font-weight: 800; 
  color: #00dc82; 
  margin: 0; 
}

.metric-info p { 
  color: #94a3b8; 
  font-size: 0.8rem; 
  margin: 0.2rem 0 0; 
}

/* Modules Grid - Mobile First */
.modules-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 1.25rem; 
}

@media(min-width: 768px) {
  .modules-grid { 
    grid-template-columns: repeat(2, 1fr); 
  }
}

.module-card { 
  background: #020420; 
  border: 1px solid #1e293b; 
  border-radius: 12px; 
  padding: 1.5rem; 
  color: #ffffff; 
  text-decoration: none; 
  display: flex; 
  flex-direction: column; 
  transition: transform 0.2s, border-color 0.2s; 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); 
}

.module-card:hover { 
  transform: translateY(-2px); 
  border-color: #00dc82; 
}

.disabled-card { 
  opacity: 0.6; 
  pointer-events: none; 
  border-style: dashed; 
}

.mod-icon { 
  font-size: 2.2rem; 
  margin-bottom: 0.75rem; 
}

.module-card h2 { 
  font-size: 1.15rem; 
  font-weight: 700; 
  color: #00dc82; 
  margin-bottom: 0.4rem; 
}

.module-card p { 
  color: #94a3b8; 
  font-size: 0.85rem; 
  line-height: 1.5; 
  flex-grow: 1; 
  margin-bottom: 1.25rem; 
}

.mod-link { 
  color: #38bdf8; 
  font-weight: 700; 
  font-size: 0.85rem; 
}
</style>