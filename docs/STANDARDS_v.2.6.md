# DevKernelPulse (DKP) Kernel v2.6-PURE-SQL — Technical Architecture Standard & Tech Manifesto

> *"Engineered for performance, built for developers, powered by passion."*

---

## 1. La Visione: L'Evoluzione da v2.5-GOLD a Kernel v2.6-PURE-SQL

DevKernelPulse nasce con una missione chiara e con la massima dedizione ingegneristica: creare l'ecosistema definitivo per sviluppatori, ingegneri AI ed appassionati di tecnologia, unendo in un'unica piattaforma ad altissime prestazioni **Notizie Tech Real-time**, **Developer API Marketplace**, **Community Nodes (`n/`)**, **Proof-of-Code Vault** e l'infrastruttura **DKP Ads & Sponsorship Network**.

Con il passaggio dalla milestone **v2.5-GOLD** al nuovo **Kernel v2.6-PURE-SQL**, l'architettura è stata re-ingegnerizzata per eliminare ogni collo di bottiglia ed offrire un'esperienza di sviluppo e fruizione senza compromessi:
* **Zero Overhead Monolitico:** Transizione completa a query SQL dirette ed altamente ottimizzate su database PostgreSQL Serverless (Neon DB).
* **Velocità Sub-Millisecondo:** Edge caching aggressivo tramite Nitro Server Engine e reattività nativa guidata da Nuxt 4.
* **Design System Cosmico Unificato:** Abolizione totale di stili CSS legacy o blocchi `<style scoped>` a favore di un'interfaccia 100% Tailwind CSS nativa, visivamente d'impatto ed accessibile (WCAG 2.1 AA).

---

## 2. Lo Stack Tecnologico Core

L'infrastruttura DKP Kernel v2.6 è fondata sui migliori standard dell'ingegneria software moderna:

| Layer | Tecnologia | Descrizione & Ruolo Architetturale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Nuxt 4** (`compatibilityVersion: 4`) | SPA/SSR ibrido con Vue 3 Composition API, reattività granulare ed auto-import modulare. |
| **Server Engine** | **Nitro Engine** | Middleware serverless ad altissima efficienza per la gestione delle API REST, Webhooks e Cron Jobs. |
| **Database & ORM** | **Neon DB + Drizzle ORM** | Database PostgreSQL Serverless con connessioni distribuite su container ed esecuzione query **Pure-SQL**. |
| **UI & Styling** | **Tailwind CSS 3.4+** | Dark Cosmic Design System nativo con palette Cyber-Emerald (`#00dc82`), Deep Sky (`#38bdf8`) e Slate Dark (`#020420`). |
| **Compiler & Runtime** | **TypeScript 5+ & Rolldown/Vite** | Digitazione rigorosa senza compromessi, isolamento dei tipi e bundling di produzione ottimizzato. |
| **Email & Delivery** | **Brevo API v3** | Infrastruttura duale: SMTP API per email transazionali e Contacts API per Double Opt-In marketing. |
| **Security & Audit** | **Sanitizer & Gitleaks CI/CD** | Protection Anti-XSS con `sanitize-html` (v2.13.1+), DKP Captcha equazionale e Secret Scanning pipeline. |

---

## 3. Struttura del Filesystem & Backend Server (Nitro Engine)

### 3.1 Layout Strutturale su Filesystem
In Nuxt 4 (`compatibilityVersion: 4`), la cartella `server/` risiede obbligatoriamente nella **root di progetto** (`/server/`), mai all'interno della directory `app/`.

```text
DKP-ROOT/
├── app/                        # Layouts, Pages, Components, Composables
├── server/                     # Nitro Engine API & Webhooks (Root level)
│   ├── api/
│   │   ├── admin/              # Dashboard API (Cron, Ingestion, Node management)
│   │   └── webhooks/           # Webhook Handlers (Brevo, Stripe, PayPal)
│   └── utils/                  # Helper server-side (Brevo Service, Pure SQL Client)
├── DOCS/                       # Documentazione e Standard v2.6
│   └── STANDARDS_v2.6.md
├── nuxt.config.ts              # Configurazione Kernel
└── package.json
```

### 3.2 Isolamento & Caching delle Rotte API
Tutti gli endpoint amministrativi sotto `/api/admin/**` devono disabilitare esplicitamente il caching lato client/CDN nel file `nuxt.config.ts` per evitare disallineamenti di stato:

```ts
routeRules: {
  '/api/admin/**': { cache: false, cors: true },
  '/api/news': { 
    headers: { 
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400' 
    } 
  }
}
```

---

## 4. Standard Frontend & Single File Components (SFC)

### 4.1 Gestione dei Tipi e Interfacce in `<script setup>`
Per garantire la totale compatibilità con il compilatore SFC di Vue (`@vue/compiler-sfc`), Rolldown e Vite durante le build di produzione (`pnpm build` / GCP Cloud Run):
* **NON** utilizzare mai il prefisso `export` sulle interfacce o i tipi definiti all'interno di un blocco `<script setup>`.
* Le interfacce globali o condivise devono risiedere in file `.ts` dedicati all'interno della directory `types/` o `utils/`.

```ts
// ❌ ERRATO (Causa errori di sintassi durante pnpm build nel compilatore SFC)
export interface ShopItem {
  id: string
  title: string
}

// ✅ CORRETTO
interface ShopItem {
  id: string
  title: string
}
```

### 4.2 Accessibility & Form Submission (WCAG 2.1 AA)
* Ogni form gestisce l'evento tramite `@submit.prevent`.
* Tutti i pulsanti specificano esplicitamente l'attributo `type="button"`, tranne quando svolgono azione esplicita di invio form (`type="submit"`).
* Collegamento algebrico e visivo tra gli input ed i relativi messaggi d'errore tramite attributi `aria-describedby` e `aria-invalid`.
* **Zero Navigazione Client su API:** Evitare tassativamente l'uso di `navigateTo()` o `<NuxtLink>` verso endpoint `/api/**`. Le chiamate al server Nitro si eseguono unicamente tramite `$fetch`.

---

## 5. Servizi dell'Ecosistema DKP v2.6

### 🚀 5.1 DKP Ingestion & Crawler Engine
Un motore euristico parallelo che interroga continuativamente i provider tech mondiali (HackerNews, Dev.to, GitHub Trending, GitLab, ProductHunt, RemoteOK), normalizza i dati ed esegue l'upsert su Neon DB con deduplicazione atomica.

### 💬 5.2 DKP Nodes (`n/` & `n/n/`)
L'hub di discussione decentralizzato per sviluppatori. Organizzato in nodi tematici (`n/dev`, `n/ai`, `n/security`), supporta gerarchie multilivello, conteggio karma, votazioni e l'audit notarile del **Proof-of-Code Vault**.

### 🔑 5.3 Developer API Gateway & Marketplace
Un portale SaaS per la monetizzazione e l'erogazione self-service di API ad alte prestazioni (Crawler Engine, Tech Jobs Feed, Mail & Webhooks) con autenticazione via Bearer Token, rate-limiting e monitoraggio delle metriche.

### 📢 5.4 DKP Ads & Sponsorship Network (Beta)
Il marketplace pubblicitario dedicato ai brand tech ed alle aziende in cerca di talenti. Gestisce la prenotazione automatizzata di banner sidebar nei Nodi, post evidenziati nel Tech Jobs Hub e header dedicati nel digest della Newsletter.

### 🏆 5.5 Gamification & Active Bounties
Sistema integrato di reputazione per incoraggiare il contributo open-source: ricompense in XP, livelli sviluppatore, Proof-of-Code badges e widget bounties riutilizzabile su tutto l'ecosistema.

---

## 6. Infrastruttura Mail & Newsletter (Integrazione Brevo v3)

L'invio delle comunicazioni è strutturato in due canali nettamente separati gestiti via server Nitro:

1. **Email Transazionali:** Gestite tramite l'API SMTP di Brevo (`POST /v3/smtp/email`) con template versionati e tracciamento dell'header custom `X-Mailin-custom` per garantire l'idempotenza degli invii.
2. **Newsletter & Marketing:** Flusso Double Opt-In nativo tramite l'API Contacts di Brevo (`POST /v3/contacts/doubleOptinConfirmation`), con registrazione obbligatoria degli attributi GDPR di consenso (`CONSENT_DATE`, `CONSENT_SOURCE`).
3. **Webhooks & Event-Driven Delivery:** Endpoint dedicato `/api/webhooks/brevo` con verifica della firma secret per l'elaborazione idempotente di hard/soft bounce, reclami spam e disiscrizioni automatiche.

---

## 7. Sicurezza, Privacy & Gitleaks Compliance

1. **Zero Secret Policy:** Nessun token API reale o simulato (es. prefissi `_sk_`, `sk_live_`) o chiave privata deve essere committato nei file del repository. Compliance totale alle scansioni automatiche della pipeline CI/CD tramite **Gitleaks**.
2. **Sanitizzazione Input (Anti-XSS):** Ogni contenuto dinamico renderizzato con `v-html` passa obbligatoriamente dal modulo `utils/sanitizer.ts` (basato su `sanitize-html` v2.13.1+), impostato con opzioni stringenti ed enforcement per i link esterni (`rel="noopener noreferrer"`).
3. **Protezione Form Dual-Layer:** I form pubblici (Contact, Submit, Newsletter) adottano due livelli simultanei di protezione anti-bot:
   * **DKP Kernel Captcha:** Quesito matematico dinamico generato lato client e verificato lato server.
   * **Honeypot:** Campo di input nascosto privo di `tabindex` per trappolare i crawler bot.

---

## 8. SEO Engine & Sitemap Dinamica

* **Sitemap Real-time:** La rotta `/sitemap.xml` viene generata dinamicamente dal server Nitro estraendo i dati aggiornati da Neon DB con timestamp `<lastmod>` formattato in ISO 8601.
* **Robots & Privacy:** Esclusione stringente delle rotte amministrative `/admin/` e degli endpoint API `/api/` nel file `public/robots.txt`.

---

## 9. Il Futuro: Continua Innovazione

Kernel v2.6-PURE-SQL è il punto di partenza per una nuova era di DevKernelPulse. Lavoriamo con passione, rigore architetturale ed orgoglio per offrire alla community globale di sviluppatori uno strumento solido, ultra-veloce e straordinario da usare ogni giorno.

*DevKernelPulse Engineering Team — Code with Pride.*