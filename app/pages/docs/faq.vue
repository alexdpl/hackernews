<!-- pages/docs/faq.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Domande Frequenti (FAQ) — DKP v2.5-GOLD',
  meta: [
    { name: 'description', content: 'Tutte le risposte sull\'ecosistema DevKernelPulse: Open Source, API Gateway, Gamification, Vault e Sicurezza.' }
  ]
})

const activeId = ref<string | null>(null)

function toggleFaq(id: string) {
  activeId.value = activeId.value === id ? null : id
}

interface FaqItem {
  id: string
  question: string
  answer: string
}

interface FaqCategory {
  title: string
  icon: string
  colorClass: string
  items: FaqItem[]
}

const faqData: FaqCategory[] = [
  {
    title: '🌐 Ecosistema & Open Source',
    icon: '🚀',
    colorClass: 'cyan',
    items: [
      {
        id: 'eco-1',
        question: 'Cos\'è esattamente DevKernelPulse (DKP)?',
        answer: 'DevKernelPulse è un ecosistema ibrido per sviluppatori. Unisce una piattaforma di blogging tecnico open-source, un API Gateway commerciale ad alte prestazioni, un sistema di notarizzazione del codice (Vault) e un motore di sicurezza AI. È pensato per fornire strumenti enterprise gratuitamente o tramite gamification.'
      },
      {
        id: 'eco-2',
        question: 'Il progetto è interamente Open Source?',
        answer: 'Sì! Il core della piattaforma è open source. Promuoviamo la collaborazione della community e abbiamo un sistema "Bounty Board": se contribuisci risolvendo issue su GitHub, vieni ricompensato in token nativi $PULSE.'
      }
    ]
  },
  {
    title: '🏆 Blog & Gamification',
    icon: '🎮',
    colorClass: 'emerald',
    items: [
      {
        id: 'gam-1',
        question: 'Come funziona il sistema di Gamification (XP)?',
        answer: 'Eseguendo azioni virtuose (pubblicando articoli di qualità, notarizzando codice nel Vault, ricevendo upvote), guadagni Punti XP. Più XP accumuli, più sale il tuo "Rank" da sviluppatore.'
      },
      {
        id: 'gam-2',
        question: 'Qual è il vantaggio di salire di Livello?',
        answer: 'Salendo di livello, sblocchi automaticamente quote API più elevate e gratuite (ad esempio, passando da 1.000 chiamate/mese del tier FREE alle 50.000 chiamate/mese del tier PRO) e ottieni badge esclusivi sul tuo profilo.'
      },
      {
        id: 'gam-3',
        question: 'Come pubblico un articolo e cos\'è la Coda di Moderazione?',
        answer: 'Puoi scrivere i tuoi articoli utilizzando il nostro editor Markdown avanzato dalla tua Dashboard. Una volta salvati come "Pubblicati", entrano in una Coda di Moderazione (gestita dagli admin) per garantire alta qualità e pertinenza prima di apparire nel feed pubblico.'
      }
    ]
  },
  {
    title: '🔑 API Gateway & Limiti',
    icon: '🔌',
    colorClass: 'purple',
    items: [
      {
        id: 'api-1',
        question: 'Come posso generare una chiave API?',
        answer: 'Vai nella tua Dashboard Utente e apri il tab "DKP API Console". Puoi generare una nuova chiave API istantaneamente. Per motivi di sicurezza, la chiave verrà mostrata in chiaro una sola volta: assicurati di copiarla subito.'
      },
      {
        id: 'api-2',
        question: 'Quali sono i Rate Limit e le quote mensili?',
        answer: 'Il gateway applica limiti dinamici in base al tuo Tier: FREE (1.000 req/mese), PRO (50.000 req/mese), ENTERPRISE (1.000.000 req/mese). A ogni chiamata HTTP riceverai negli header (X-RateLimit-Remaining) il conteggio aggiornato in tempo reale dal nostro DB Neon.'
      },
      {
        id: 'api-3',
        question: 'Posso revocare una chiave API se viene compromessa?',
        answer: 'Assolutamente sì. Dalla tua Dashboard puoi cliccare su "Revoca". La chiave verrà istantaneamente invalidata su tutto il cluster e non potrà più effettuare chiamate al gateway.'
      }
    ]
  },
  {
    title: '🛡️ Proof of Code Vault',
    icon: '🔐',
    colorClass: 'gold',
    items: [
      {
        id: 'vlt-1',
        question: 'Cos\'è il Proof of Code Vault?',
        answer: 'È un motore di notarizzazione crittografica. Incollando il tuo codice sorgente o smart contract, DKP calcola un hash SHA-256 univoco, esegue una scansione di sicurezza (SAST) e genera un certificato immutabile salvato nel database. Serve a dimostrare la paternità e l\'integrità del tuo codice a una data certa.'
      },
      {
        id: 'vlt-2',
        question: 'Il codice sorgente che notarizzo è al sicuro?',
        answer: 'Sì. Una volta calcolato l\'hash crittografico (SHA-256), il nostro sistema non ha bisogno di mantenere il codice sorgente in chiaro per validare il certificato in futuro. È un sistema "zero-knowledge friendly".'
      }
    ]
  },
  {
    title: '🤖 Pulse Sentinel AI & Cloud',
    icon: '⚡',
    colorClass: 'rose',
    items: [
      {
        id: 'sec-1',
        question: 'Come è protetta la piattaforma?',
        answer: 'Utilizziamo "Pulse Sentinel AI v2.5", il nostro Firewall Web Application (WAF) euristico, integrato con Google Cloud Armor in europe-west4. Blocca proattivamente attacchi DDoS, bot malevoli, iniezioni SQL e XSS in tempo reale.'
      },
      {
        id: 'sec-2',
        question: 'Cosa succede se il mio IP viene bloccato?',
        answer: 'Se il tuo traffico viene identificato come anomalo, il tuo IP finirà nella "Blacklist Automatica" di Sentinel. Se ritieni sia un falso positivo, puoi contattarci su GitHub o Discord per richiedere lo sblocco manuale agli Admin.'
      }
    ]
  }
]
</script>

<template>
  <div class="faq-page">
    <div class="faq-container">
      
      <!-- HERO SECTION -->
      <header class="faq-hero">
        <span class="badge-version">DOCUMENTAZIONE UFFICIALE v2.5-GOLD</span>
        <h1 class="hero-title">Domande Frequenti (FAQ)</h1>
        <p class="hero-subtitle">
          Tutto ciò che devi sapere sull'ecosistema <strong>DevKernelPulse</strong>. Dalle licenze open source all'utilizzo del Vault crittografico e dell'API Gateway.
        </p>
      </header>

      <!-- FAQ CATEGORIES LIST -->
      <div class="faq-content">
        <section v-for="category in faqData" :key="category.title" class="faq-category">
          <h2 class="category-title" :class="category.colorClass">
            <span class="cat-icon">{{ category.icon }}</span>
            {{ category.title }}
          </h2>
          
          <div class="accordion-group">
            <div 
              v-for="item in category.items" 
              :key="item.id" 
              class="accordion-item"
              :class="{ 'is-active': activeId === item.id }"
            >
              <button class="accordion-trigger" @click="toggleFaq(item.id)">
                <span class="question-text">{{ item.question }}</span>
                <span class="chevron" :class="{ 'rotated': activeId === item.id }">▼</span>
              </button>
              
              <!-- TRANSITION BODY -->
              <div class="accordion-body" :style="{ maxHeight: activeId === item.id ? '300px' : '0' }">
                <div class="answer-content">
                  {{ item.answer }}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- FOOTER CALL TO ACTION -->
      <div class="faq-cta-box">
        <div class="cta-content">
          <h3>Non hai trovato quello che cercavi?</h3>
          <p>La nostra community è sempre pronta ad aiutarti. Apri una issue pubblica, fai una domanda o contribuisci al nostro repository open source.</p>
        </div>
        <div class="cta-actions">
          <a href="https://github.com/alexdpl/hackernews" target="_blank" class="dkp-btn-outline">🐙 GitHub Repository</a>
          <NuxtLink to="/bounties" class="dkp-btn-solid">🎯 Esplora Bounty Board</NuxtLink>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.faq-page {
  background: #020420;
  min-height: 100vh;
  padding: 4rem 1.5rem 6rem;
  color: #f8fafc;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.faq-container {
  max-width: 850px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3.5rem;
}

/* HERO SECTION */
.faq-hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.badge-version {
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.3rem 0.8rem;
  border-radius: 99px;
  letter-spacing: 0.05em;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
}

.hero-subtitle {
  color: #94a3b8;
  font-size: 1.1rem;
  max-width: 650px;
  line-height: 1.6;
  margin: 0;
}
.hero-subtitle strong { color: #f8fafc; }

/* CATEGORIES */
.faq-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.category-title {
  font-size: 1.25rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #1e293b;
}

.category-title.cyan { color: #38bdf8; border-bottom-color: rgba(56, 189, 248, 0.2); }
.category-title.emerald { color: #00dc82; border-bottom-color: rgba(0, 220, 130, 0.2); }
.category-title.purple { color: #a855f7; border-bottom-color: rgba(168, 85, 247, 0.2); }
.category-title.gold { color: #f59e0b; border-bottom-color: rgba(245, 158, 11, 0.2); }
.category-title.rose { color: #f43f5e; border-bottom-color: rgba(244, 63, 94, 0.2); }

/* ACCORDION */
.accordion-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.accordion-item {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.accordion-item.is-active {
  border-color: #00dc82;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.05);
}

.accordion-trigger {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: none;
  padding: 1.1rem 1.25rem;
  color: #f8fafc;
  font-size: 1rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.accordion-trigger:hover {
  background: rgba(255, 255, 255, 0.02);
}

.chevron {
  font-size: 0.7rem;
  color: #64748b;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chevron.rotated {
  transform: rotate(-180deg);
  color: #00dc82;
}

.accordion-body {
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.answer-content {
  padding: 0 1.25rem 1.25rem;
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.6;
  border-top: 1px solid transparent;
}
.is-active .answer-content { border-color: rgba(30, 41, 59, 0.5); padding-top: 1rem; }

/* CTA BOX */
.faq-cta-box {
  background: radial-gradient(circle at top right, rgba(0, 220, 130, 0.08), #090d16 60%);
  border: 1px solid rgba(0, 220, 130, 0.25);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.cta-content h3 {
  font-size: 1.35rem;
  color: #ffffff;
  font-weight: 800;
  margin: 0 0 0.5rem;
}

.cta-content p {
  color: #94a3b8;
  font-size: 0.95rem;
  margin: 0;
  max-width: 500px;
  line-height: 1.5;
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

.dkp-btn-outline {
  background: transparent;
  color: #cbd5e1;
  border: 1px solid #334155;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s;
}

.dkp-btn-outline:hover {
  background: #1e293b;
  color: #ffffff;
  border-color: #475569;
}

.dkp-btn-solid {
  background: #00dc82;
  color: #020420;
  border: 1px solid #00dc82;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.9rem;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(0, 220, 130, 0.2);
  transition: all 0.2s;
}

.dkp-btn-solid:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 220, 130, 0.3);
}

@media (max-width: 600px) {
  .hero-title { font-size: 2rem; }
  .faq-cta-box { padding: 1.5rem; }
  .cta-actions { flex-direction: column; width: 100%; }
  .dkp-btn-outline, .dkp-btn-solid { width: 100%; text-align: center; }
}
</style>