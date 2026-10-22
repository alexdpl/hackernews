<!-- app/pages/user/ads.vue -->
<script setup lang="ts">
import DkpAdManager from '~/components/dashboard/DkpAdManager.vue'
import { ref, computed } from 'vue'

useDkpSeo({ title: 'Gestione Campagne DKP Ads - DevKernelPulse' })

// 1. Stato della paginazione
const currentPage = ref(1)

// 2. UNICO Fetch reattivo: osserva currentPage e rifà la chiamata quando cambia
const { data: responseData, pending, refresh } = await useFetch('/api/v2.5/ads/manage', {
  query: computed(() => ({ page: currentPage.value, limit: 5 })),
  watch: [currentPage]
})

// 3. Estrazione sicura dei dati
const activeCampaigns = computed(() => responseData.value?.data || [])
const hasMore = computed(() => responseData.value?.pagination?.hasMore || false)

// 4. Funzioni per cambiare pagina
const nextPage = () => {
  if (hasMore.value && !pending.value) currentPage.value++
}
const prevPage = () => {
  if (currentPage.value > 1 && !pending.value) currentPage.value--
}
</script>

<template>
  <div class="user-ads-page">
    <header class="page-header mb-8">
      <h1 class="text-3xl font-extrabold text-white mb-2">📢 Gestione Inserzioni</h1>
      <p class="text-slate-400">Crea campagne, inserisci link affiliati e monitora i click in tempo reale sul DKP Ads Network.</p>
    </header>

    <!-- GRIGLIA DASHBOARD: Form a sinistra, Statistiche a destra -->
    <div class="ads-dashboard-grid">
      
      <!-- COLONNA SINISTRA: Form Creazione -->
      <div class="form-column">
        <!-- Passiamo l'evento @campaign-created per far ricaricare la lista a destra -->
        <DkpAdManager @campaign-created="refresh" />
      </div>

      <!-- COLONNA DESTRA: Statistiche e Click -->
      <div class="stats-column">
        <div class="stats-header">
          <h3 class="text-xl font-bold text-white">📊 Campagne in Rotazione</h3>
          <button @click="refresh" class="refresh-btn">🔄 Aggiorna Dati</button>
        </div>

        <div v-if="pending" class="text-slate-400 animate-pulse mt-4">
          Sincronizzazione col DB Neon in corso...
        </div>

        <div v-else-if="activeCampaigns && activeCampaigns.length > 0" class="mt-4">
          
          <!-- Lista Campagne -->
          <div class="campaigns-list">
            <div v-for="ad in activeCampaigns" :key="ad.id" class="campaign-card">
              <div class="card-top">
                <span class="status-dot"></span>
                <span class="category-tag">{{ ad.categoryTag || 'SPONSOR' }}</span>
              </div>
              
              <h4 class="campaign-title">{{ ad.title }}</h4>
              <a :href="ad.targetUrl" target="_blank" class="campaign-url">🔗 Verifica Link Affiliato</a>
              
              <div class="stats-footer">
                <div class="stat-box">
                  <span class="stat-label">Budget Residuo</span>
                  <span class="stat-value font-mono">{{ ad.budgetCredits }} <small>Click</small></span>
                </div>
                <div class="stat-box right">
                  <span class="stat-label">Stato</span>
                  <span class="stat-value text-emerald-400">{{ ad.status }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 🟢 Controlli Paginazione (5 per pagina) -->
          <div class="flex justify-between items-center mt-6 p-4 border-t border-slate-800">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1 || pending"
              class="px-4 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-emerald-400 font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &lt; Precedenti
            </button>
            
            <span class="text-slate-400 text-sm font-mono font-bold">
              Pagina {{ currentPage }}
            </span>
            
            <button 
              @click="nextPage" 
              :disabled="!hasMore || pending"
              class="px-4 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-emerald-400 font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Successivi &gt;
            </button>
          </div>

        </div>

        <div v-else class="empty-stats mt-4">
          <p>Nessuna campagna attiva al momento.</p>
          <span>Usa il manager a fianco per lanciare il tuo primo annuncio!</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.user-ads-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: system-ui, sans-serif;
}

/* Griglia per dividere le sezioni */
.ads-dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 768px) {
  .ads-dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Stili Colonna Statistiche */
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 0.8rem;
}

.refresh-btn {
  background: transparent;
  color: #38bdf8;
  border: 1px solid #38bdf8;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.refresh-btn:hover {
  background: rgba(56, 189, 248, 0.1);
}

.campaigns-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.campaign-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1.25rem;
  transition: border-color 0.2s;
}
.campaign-card:hover {
  border-color: #00dc82;
  box-shadow: 0 5px 15px rgba(0, 220, 130, 0.05);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.status-dot {
  width: 8px;
  height: 8px;
  background: #00dc82;
  border-radius: 50%;
  box-shadow: 0 0 8px #00dc82;
}
.category-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.campaign-title {
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.campaign-url {
  font-size: 0.8rem;
  color: #94a3b8;
  text-decoration: none;
  display: inline-block;
  margin-bottom: 1rem;
}
.campaign-url:hover {
  color: #00dc82;
  text-decoration: underline;
}

.stats-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px dashed #1e293b;
  padding-top: 0.75rem;
}

.stat-box { display: flex; flex-direction: column; }
.stat-box.right { align-items: flex-end; }

.stat-label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
}
.stat-value {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
}
.stat-value small {
  color: #94a3b8;
  font-size: 0.7rem;
}

.empty-stats {
  background: rgba(15, 23, 42, 0.5);
  border: 1px dashed #334155;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
}
.empty-stats p { margin: 0 0 0.5rem 0; font-weight: 700; color: #cbd5e1; }
.empty-stats span { font-size: 0.85rem; }
</style>