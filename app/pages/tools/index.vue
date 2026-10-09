<!-- app/pages/tools.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
const currentYear = new Date().getFullYear()
const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

useDkpSeo({
  title: 'Toolkit & Developer Tools v2.5-BETA - DevKernelPulse',
  description: 'Suite ufficiale di strumenti professionali DKP: Neural Playground, AI Repo Scanner, Code Vault, CLI Toolkit e API Management.'
})

interface DkpTool {
  id: string
  title: string
  category: string
  version: string
  status: 'active' | 'beta' | 'enterprise'
  icon: string
  description: string
  features: string[]
  badgeText: string
  linkText: string
  route: string
  isExternal?: boolean
}

// Qui ho ricostruito l'elenco ESATTO partendo dal tuo menu a tendina + le nuove aggiunte
const toolsList = ref<DkpTool[]>([
  {
    id: 'ai-repo-scanner',
    title: 'AI Repository Scanner',
    category: 'Code Quality & AI',
    version: 'v2.4-GOLD',
    status: 'active',
    icon: '🤖',
    description: 'Analizza repository GitHub con intelligenza artificiale. Estrae lo stack tecnologico e calcola il Reputation Score (S-Tier).',
    features: [
      'Audit automatico dello stack tecnologico',
      'Calcolo Reputation Score (fino a 100/100)',
      'Sistema di reward XP per gli sviluppatori'
    ],
    badgeText: 'S-TIER RANK',
    linkText: 'Analizza Repository',
    route: '/ai-repo-scanner'
  },
  {
    id: 'neural-playground',
    title: 'Neural Playground',
    category: 'Code Quality & AI',
    version: 'v2.3',
    status: 'active',
    icon: '🧠',
    description: 'Ambiente di testing avanzato per Prompt Engineering e interazione diretta con i Modelli IA (LLM) configurati nel sistema.',
    features: [
      'Interfaccia chat multi-modello',
      'Tuning dei parametri (Temperature, Top-P)',
      'Salvataggio storico prompt'
    ],
    badgeText: 'AI TESTING',
    linkText: 'Apri Playground',
    route: '/tools/neural-playground' // Adegua questa rotta se diversa
  },
  {
    id: 'terminal-web-shell',
    title: 'Terminal Web Shell',
    category: 'DevOps & CLI',
    version: 'v2.3',
    status: 'active',
    icon: '💻',
    description: 'Shell CLI direttamente in-browser per gestire i servizi, avviare task e testare l\'SDK DKP senza uscire dalla piattaforma.',
    features: [
      'Esecuzione comandi DKP CLI nativi',
      'Integrazione diretta con l\'SDK',
      'Output colorato e persistenza sessione'
    ],
    badgeText: 'IN-BROWSER',
    linkText: 'Avvia Terminale',
    route: '/tools/terminal' // Adegua questa rotta se diversa
  },
  {
    id: 'ai-code-scanner',
    title: 'AI Code Scanner Pro',
    category: 'Security & Monitoring',
    version: 'v2.3 Pro',
    status: 'enterprise',
    icon: '🔍',
    description: 'Audit statico e analisi delle vulnerabilità assistita da IA. Trova bug, leak di token e pattern insicuri nel codice sorgente.',
    features: [
      'Analisi statica SAST (Static Application Security Testing)',
      'Identificazione API Key esposte',
      'Suggerimenti di fix generati dall\'IA'
    ],
    badgeText: 'PRO SECURITY',
    linkText: 'Scansiona Codice',
    route: '/tools/ai-scanner' // Adegua questa rotta se diversa
  },
  {
    id: 'proof-of-code',
    title: 'Proof of Code (Vault)',
    category: 'Security & Monitoring',
    version: 'v2.3',
    status: 'active',
    icon: '🛡️',
    description: 'Sistema di notarizzazione per snippet di codice. Genera un hash crittografico per dimostrare la paternità e l\'integrità del tuo lavoro.',
    features: [
      'Hashing SHA-256 degli snippet sorgente',
      'Timestamp inalterabile di registrazione',
      'Certificato di validità condivisibile'
    ],
    badgeText: 'CRYPTO VAULT',
    linkText: 'Apri Vault',
    route: '/tools/proof-of-code' // Adegua questa rotta se diversa
  },
  {
    id: 'code-vault-editor',
    title: 'Code Vault Blog Editor',
    category: 'Content Creation',
    version: 'v2.5-BETA',
    status: 'active',
    icon: '✍️',
    description: 'Il nuovo Editor Markdown professionale (aggiornato v2.5) con supporto per tabelle HTML, toolbar stile Docs e Zen Mode Fullscreen.',
    features: [
      'Zen Mode a tutto schermo per scrittura',
      'Mini-parser avanzato tabelle/HTML',
      'Integrazione Sentinel AI per l\'approvazione'
    ],
    badgeText: 'NEW EDITOR',
    linkText: 'Scrivi Articolo',
    route: '/user/dashboard?tab=content'
  },
  {
    id: 'api-management',
    title: 'API Key Management',
    category: 'Developer Services',
    version: 'v2.4-Gold',
    status: 'enterprise',
    icon: '🔑',
    description: 'Gestione granulare delle chiavi API personali con Rate Limiting Nitro integrato. Crea e revoca token in modo sicuro.',
    features: [
      'Generazione token crittografati',
      'Rate Limiting configurabile',
      'Statistiche e metriche d\'uso'
    ],
    badgeText: 'NITRO ENGINE',
    linkText: 'Gestisci API Keys',
    route: '/user/dashboard?tab=api' // Rotta esatta verso il pannello utente
  },
  {
    id: 'dkp-cli-toolkit',
    title: 'DKP CLI Toolkit',
    category: 'DevOps & CLI',
    version: 'v2.4-Gold',
    status: 'active',
    icon: '⚡',
    description: 'Strumento a riga di comando per gestire il deploy rapido, la migrazione dei DB Neon e la pulizia della cache di PM2 direttamente da terminale.',
    features: [
      'Velocizzare i processi DevOps e CI/CD',
      'Fornisce agli sviluppatori comandi diretti ',
      'Semplifica migrazione dei DB Neon (es. db:push) ' 
    ],
    badgeText: 'CLI TOOLKIT',
    linkText: 'Apri CLI Toolkit',
    route: '/tools/cli-toolkit'
  }
])

const searchQuery = ref('')
const selectedCategory = ref('all')

const filteredTools = computed(() => {
  return toolsList.value.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || tool.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})
</script>

<template>
  <div class="tools-page-container">
    
    <!-- HERO HEADER -->
    <header class="tools-hero">
      <div class="hero-badge">
        <span class="badge-status gold">🛠️ DKP DEVELOPER ECOSYSTEM SUITE</span>
      </div>
      <h1>Strumenti Professionali & <span class="highlight">Utility v2.5-BETA</span></h1>
      <p class="subtitle">
        Una suite integrata di strumenti avanzati per l'audit del codice, AI testing, gestione API e creazione contenuti.
      </p>

      <!-- SEARCH & FILTER BAR -->
      <div class="tools-search-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cerca uno strumento (es. Scanner, Playground, CLI...)" 
          class="search-input"
        />
        <select v-model="selectedCategory" class="category-select">
          <option value="all">Tutte le Categorie</option>
          <option value="Security & Monitoring">🔒 Security & Monitoring</option>
          <option value="Developer Services">🔑 Developer Services</option>
          <option value="Code Quality & AI">🧠 Code Quality & AI</option>
          <option value="Content Creation">✍️ Content Creation</option>
          <option value="DevOps & CLI">⚡ DevOps & CLI</option>
        </select>
      </div>
    </header>

    <!-- GRID DEI TOOLS -->
    <div class="tools-grid">
      <div v-for="tool in filteredTools" :key="tool.id" class="tool-card">
        
        <div class="tool-card-header">
          <div class="tool-icon-box">
            <span class="tool-emoji">{{ tool.icon }}</span>
          </div>
          <div class="tool-meta">
            <span class="tool-category">{{ tool.category }}</span>
            <span class="tool-version-tag">{{ tool.version }}</span>
          </div>
          <div class="tool-badge-status" :class="tool.status">
            {{ tool.badgeText }}
          </div>
        </div>

        <h2 class="tool-title">{{ tool.title }}</h2>
        <p class="tool-desc">{{ tool.description }}</p>

        <div class="tool-features">
          <h4>🔥 Funzionalità Chiave:</h4>
          <ul>
            <li v-for="(feat, idx) in tool.features" :key="idx">
              <span class="feat-dot">▸</span> {{ feat }}
            </li>
          </ul>
        </div>

        <div class="tool-card-footer">
          <NuxtLink :to="tool.route" class="tool-action-btn">
            {{ tool.linkText }} ➔
          </NuxtLink>
        </div>

      </div>
    </div>

    <!-- EMPTY STATE -->
    <div v-if="filteredTools.length === 0" class="empty-state">
      <p>Nessuno strumento trovato corrispondente alla ricerca.</p>
    </div>

  </div>
</template>

<style scoped>
.tools-page-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

.tools-hero {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  text-align: center;
  margin-bottom: 2.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.hero-badge { margin-bottom: 0.85rem; }

.badge-status.gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid #00dc82;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.2);
}

.tools-hero h1 {
  font-size: 2.4rem;
  font-weight: 900;
  margin: 0 0 0.8rem 0;
  color: #ffffff;
}

.highlight {
  color: #00dc82;
  text-shadow: 0 0 20px rgba(0, 220, 130, 0.3);
}

.subtitle {
  color: #94a3b8;
  max-width: 700px;
  margin: 0 auto 2rem auto;
  font-size: 1rem;
  line-height: 1.6;
}

.tools-search-bar {
  display: flex;
  gap: 1rem;
  max-width: 700px;
  margin: 0 auto;
  flex-wrap: wrap;
  justify-content: center;
}

.search-input {
  flex: 1;
  min-width: 280px;
  background: #020420;
  border: 1px solid #1e293b;
  color: #ffffff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: #00dc82; }

.category-select {
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
}
.category-select:focus { border-color: #00dc82; }

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: all 0.25s ease;
}

.tool-card:hover {
  border-color: #00dc82;
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(0, 220, 130, 0.15);
}

.tool-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.tool-icon-box {
  width: 45px;
  height: 45px;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.tool-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.tool-category {
  font-size: 0.72rem;
  font-weight: 800;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tool-version-tag {
  font-size: 0.7rem;
  color: #64748b;
  font-family: monospace;
}

.tool-badge-status {
  font-size: 0.68rem;
  font-weight: 900;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  letter-spacing: 0.04em;
}
.tool-badge-status.enterprise {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.3);
}

.tool-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 0.6rem 0;
}

.tool-desc {
  color: #94a3b8;
  font-size: 0.88rem;
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

.tool-features {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.tool-features h4 {
  margin: 0 0 0.5rem 0;
  color: #cbd5e1;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tool-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.tool-features li {
  font-size: 0.82rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.feat-dot {
  color: #00dc82;
  font-weight: bold;
}

.tool-card-footer {
  display: flex;
  justify-content: flex-end;
}

.tool-action-btn {
  background: rgba(0, 220, 130, 0.1);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.2s ease;
}

.tool-action-btn:hover {
  background: #00dc82;
  color: #020420;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.4);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 1rem;
}
</style>