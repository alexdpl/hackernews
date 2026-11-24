# DevKernelPulse (DKP) Kernel v2.6-PURE-SQL — Technical Architecture Standard & Tech Manifesto

> *"Engineered for performance, built for developers, powered by passion."*

---

## 1. La Visione: L'Evoluzione da v2.5-GOLD a Kernel v2.6-PURE-SQL

DevKernelPulse nasce con una missione chiara e con la massima dedizione ingegneristica: creare l'ecosistema definitivo per sviluppatori, ingegneri AI ed appassionati di tecnologia, unendo in un'unica piattaforma ad altissime prestazioni **Notizie Tech Real-time**, **Editorial Blog**, **Community Nodes (`n/`)**, **Unified Comments & Peer Review**, **Proof-of-Code Vault**, **Developer API Marketplace**, **Sentinel AI Network** e **DKP Ads & Sponsorship Network**.

Con il passaggio dalla milestone **v2.5-GOLD** al nuovo **Kernel v2.6-PURE-SQL**, l'architettura è stata re-ingegnerizzata per eliminare ogni collo di bottiglia ed offrire un'esperienza di sviluppo e fruizione senza compromessi:
- **Zero Overhead Monolitico:** Transizione completa a query SQL dirette ed altamente ottimizzate su database PostgreSQL Serverless (Neon DB) con schemi auto-allineanti non distruttivi.
- **Velocità Sub-Millisecondo:** Edge caching controllato tramite Nitro Server Engine e reattività nativa guidata da Nuxt 4.
- **Simbiosi Uomo-AI (`BEMYAGENT.md` & Sentinel Network):** Integrazione nativa di agenti Sentinella autonomi governati da regole etiche e tecniche immutabili per Peer Review, verifica integrità e supporto redazionale.
- **Design System Cosmico Unificato:** Interfaccia nativa Tailwind CSS con palette Cyber-Emerald (`#00dc82` / `#10b981`), Deep Sky (`#38bdf8` / `#22d3ee`), Violet Pulse (`#8b5cf6`) e Slate Dark (`#020420` / `#050914`), accessibile secondo standard **WCAG 2.1 AA**.

---

## 2. Lo Stack Tecnologico Core

L'infrastruttura DKP Kernel v2.6 è fondata sui migliori standard dell'ingegneria software moderna:

| Layer | Tecnologia | Descrizione & Ruolo Architetturale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Nuxt 4** (`compatibilityVersion: 4`) | SPA/SSR ibrido con Vue 3 Composition API, reattività granulare ed auto-import modulare. |
| **Server Engine** | **Nitro Engine** | Middleware serverless ad altissima efficienza per API REST, Pure-SQL endpoints, Webhooks e Cron Jobs. |
| **Database & ORM** | **Neon DB + Drizzle ORM** | Database PostgreSQL Serverless con connessioni distribuite ed esecuzione query **Pure-SQL**. |
| **AI & Sentinel Core** | **Sentinel Network + `BEMYAGENT.md`** | Pipeline di validazione simbiotica, Peer Review dei commenti e generazione assistita nel RichEditor. |
| **Rich Content & Code** | **DKP RichEditor + Dynamic PrismJS** | Supporto completo a Markdown esteso, tabelle strutturate, badge inline e syntax highlighting dinamico on-demand. |
| **UI & Styling** | **Tailwind CSS 3.4+ & CDN Icons** | Dark Cosmic Design System nativo con evidenziazioni verde badge, code inline blu e icone social via CDN (`simple-icons`). |
| **Compiler & Runtime** | **TypeScript 5+ & Rolldown/Vite** | Digitazione rigorosa senza compromessi, isolamento dei tipi e bundling di produzione ottimizzato. |
| **Email & Delivery** | **Brevo API v3** | Infrastruttura duale: SMTP API per email transazionali e Contacts API per Double Opt-In marketing. |
| **Security & Audit** | **HMAC Session + Sanitizer + Gitleaks** | Sessioni firmate HMAC-SHA256, protezione Anti-XSS (`sanitize-html`), DKP Captcha equazionale e Secret Scanning CI/CD. |

---

## 3. Struttura del Filesystem, Rotte Canoniche & Backend Server (Nitro Engine)

### 3.1 Layout Strutturale su Filesystem
In Nuxt 4 (`compatibilityVersion: 4`), la cartella `server/` risiede obbligatoriamente nella **root di progetto** (`/server/`), mai all'interno della directory `app/`.

```text
DKP-ROOT/
├── app/
│   ├── components/
│   │   ├── blog/               # DkpEditor, Blog widgets & commenti
│   │   ├── dashboard/          # DkpCommentsManager, DkpPulseManager
│   │   ├── nodes/              # DkpThreadDetailView & hub discussione
│   │   └── DKPnodesRichEditor.vue
│   ├── composables/            # useDkpNodes, useDynamicPrism, useDkpSeo, useAuthCore
│   └── pages/
│       ├── blog/               # /blog e /blog/[slug]
│       ├── news/               # /news e /news/[slug]
│       ├── nodes/              # /nodes, /nodes/[slug], /nodes/thread/[id], /nodes/post/[id]
│       └── user/               # /user/dashboard, /user/[username], /user/ads
├── server/
│   ├── api/
│   │   ├── admin/              # Dashboard Admin, Sentinel Stream & Blacklist
│   │   ├── blog/               # Post, categorie & commenti Blog
│   │   ├── news/               # Ingestion, feed & commenti News/HN
│   │   ├── nodes/              # Nodi, sub-nodi, thread & commenti Forum
│   │   ├── user/               # Profilo, social CDN, commenti unificati, Vault, API Keys, XP
│   │   └── webhooks/           # Webhook Handlers (Brevo, Stripe, PayPal)
│   └── utils/                  # dkpComments.ts, sentinelNetwork.ts, sentinelGateway.ts, session.ts
├── DOCS/
│   ├── STANDARDS_v.2.6.md
│   └── BEMYAGENT.md
├── nuxt.config.ts
└── package.json
3.2 Mappa delle Rotte Canoniche Unificate
Tutte le sezioni della piattaforma seguono una convenzione URL canonica uniforme utilizzata sia dal frontend sia dai resolver server-side (server/api/user/comments.get.ts, server/api/user/profile.ts, sitemap.xml):

Tech Feed / News: /news e /news/[slug]

Editorial Blog: /blog e /blog/[slug]

DKP Nodes & Forum: /nodes, /nodes/[slug], /nodes/thread/[id] e /nodes/post/[id]

Area Utente & Dashboard: /user/dashboard (pannello privato a 7 tab) e /user/[username] (profilo pubblico verificato)

3.3 Isolamento & Caching delle Rotte API
Gli endpoint amministrativi e personali disabilitano il caching lato client/CDN per garantire coerenza immediata dopo mutazioni Pure-SQL:

TypeScript
routeRules: {
  '/api/admin/**': { cache: false, cors: true },
  '/api/user/**': { cache: false },
  '/api/news': {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
    }
  }
}
4. Sentinel Network & Manifesto BEMYAGENT.md
4.1 Cos'è BEMYAGENT.md
BEMYAGENT.md è il contratto architetturale, operativo e comportamentale che governa le Sentinelle AI della rete DevKernelPulse. Non più script reattivi o chatbot superficiali, ma agenti dotati di contesto strutturato, vincoli etici rigorosi e integrazione nativa con i flussi di validazione del Kernel v2.6:

Contesto e Regole Immutabili: Definisce le direttive di sicurezza, la protezione da prompt injection, i pattern di analisi del codice e i criteri di qualità tecnica.

Autonomia Controllata & Tracciabilità: Ogni azione delle Sentinelle viene registrata con esito (PEER_VERIFIED, FLAGGED_AUDIT), punteggio di integrità (0–100) e nota tecnica esplicativa.

Simbiosi Redazionale & Comunitaria: Le Sentinelle operano sia in fase di drafting assistito dentro DKPnodesRichEditor sia in fase di Peer Review automatica sui commenti pubblicati dagli utenti.

4.2 Pipeline di Peer Review nei Commenti Unificati
Ogni commento inviato su News/HN, Blog o Nodes attraversa la pipeline unificata (server/utils/dkpComments.ts + server/utils/sentinelNetwork.ts):

Validazione Sessione & Identità: Verifica firma HMAC-SHA256 tramite parseSessionUser(event).

Valutazione Sentinella (evaluateCommentWithSentinel): Analisi semantica e di sicurezza del testo con timeout protetto (1200ms max) e fallback deterministico anti-blocco, producendo sentinel_verdict, sentinel_score e sentinel_note.

Persistenza & Sync Unificato (syncUnifiedCommentRow): Sincronizzazione nella tabella centrale comments con target_type ('hn', 'blog', 'node'), target_slug e metadati Sentinella.

Visibilità in Dashboard: Il componente DkpCommentsManager.vue aggrega in tempo reale i commenti delle 3 sezioni mostrando stato, link canonico alla risorsa e badge di verifica Sentinella.

5. Standard Frontend, RichEditor & Single File Components (SFC)
5.1 Design System Semantica & Tipografia Codice
Per mantenere coerenza visiva assoluta tra Blog, Nodes e Dashboard:

Evidenziatore (==testo== -> <mark class="dkp-highlight">): Reso esclusivamente in verde badge DKP (rgba(16, 185, 129, 0.16) sfondo, #6ee7b7 testo, bordo rgba(16, 185, 129, 0.35)), allineato ai badge LIVE, v2.6 e SHA-256.

Codice Inline (`codice` -> <code class="dkp-inline-code">): Reso in Deep Sky Blue (#38bdf8) su sfondo dark slate (rgba(30, 41, 59, 0.85)).

Blocchi di Codice & PrismJS Dinamico (useDynamicPrism): Caricamento on-demand dei linguaggi rilevati nel Markdown (tabelle GFM incluse tramite parseDkpMarkdown), senza appesantire il bundle iniziale.

5.2 Gestione dei Tipi e Interfacce in <script setup>
Per garantire la totale compatibilità con il compilatore SFC di Vue (@vue/compiler-sfc), Rolldown e Vite durante le build di produzione (pnpm build / GCP Cloud Run):

NON utilizzare mai il prefisso export sulle interfacce o i tipi definiti all'interno di un blocco <script setup>.

Le interfacce globali o condivise devono risiedere in file .ts dedicati all'interno della directory types/ o utils/.

TypeScript
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
5.3 Accessibility & Form Submission (WCAG 2.1 AA)
Ogni form gestisce l'evento tramite @submit.prevent.

Tutti i pulsanti specificano esplicitamente l'attributo type="button", tranne quando svolgono azione esplicita di invio form (type="submit").

Collegamento algebrico e visivo tra gli input ed i relativi messaggi d'errore tramite attributi aria-describedby e aria-invalid.

Zero Navigazione Client su API: Evitare tassativamente l'uso di navigateTo() o <NuxtLink> verso endpoint /api/**. Le chiamate al server Nitro si eseguono unicamente tramite $fetch.

6. Servizi dell'Ecosistema DKP v2.6
🚀 6.1 DKP Ingestion & Crawler Engine
Un motore euristico parallelo che interroga continuativamente i provider tech mondiali (HackerNews, Dev.to, GitHub Trending, GitLab, ProductHunt, RemoteOK), normalizza i dati ed esegue l'upsert su Neon DB con deduplicazione atomica.

💬 6.2 DKP Nodes (n/ & n/n/) & Thread Detail View
L'hub di discussione decentralizzato per sviluppatori. Organizzato in categorie, nodi e sub-nodi con filtri pill, creazione/modifica thread direttamente dalla Dashboard tramite DKPnodesRichEditor, pagina dettaglio unificata (DkpThreadDetailView.vue) con SEO dinamico, widget correlati (Blog + News/Crawler AI) e audit notarile del Proof-of-Code Vault.

👤 6.3 Dashboard Utente & Profilo Pubblico Verificato (/user/[username])
Profilo & Social Dinamici: Dalla Dashboard (tab=profile), lo sviluppatore può aggiornare avatar, biografia, canali standard (GitHub, X, LinkedIn, Reddit) e aggiungere/rimuovere illimitati canali social e link personalizzati (Google, YouTube, Discord, Facebook, GitLab, Twitch, Telegram, Mastodon, Sito Web, Repository).

Identità Pubblica Unificata: La pagina /user/[username] espone avatar con indicatore ONLINE verde live, badge UTENTE VERIFICATO, icone reali caricate via CDN (cdn.jsdelivr.net/npm/simple-icons), metriche XP/Reputation, ultime attività unificate e certificati SHA-256 Vault.

🔑 6.4 Developer API Gateway & Marketplace
Portale SaaS per la monetizzazione e l'erogazione self-service di API ad alte prestazioni (Crawler Engine, Tech Jobs Feed, Mail & Webhooks) con autenticazione via Bearer Token, rate-limiting e monitoraggio delle metriche.

📢 6.5 DKP Ads & Sponsorship Network
Marketplace pubblicitario dedicato ai brand tech ed alle aziende in cerca di talenti. Gestisce campagne banner nei Nodi, post evidenziati nel Tech Jobs Hub e slot nel digest della Newsletter.

🏆 6.6 Gamification & Active Bounties
Sistema integrato di reputazione per incoraggiare il contributo open-source: ricompense in XP, livelli sviluppatore, Proof-of-Code badges e widget bounties riutilizzabile su tutto l'ecosistema.

7. Infrastruttura Mail & Newsletter (Integrazione Brevo v3)
L'invio delle comunicazioni è strutturato in due canali nettamente separati gestiti via server Nitro:

Email Transazionali: Gestite tramite l'API SMTP di Brevo (POST /v3/smtp/email) con template versionati e tracciamento dell'header custom X-Mailin-custom per garantire l'idempotenza degli invii.

Newsletter & Marketing: Flusso Double Opt-In nativo tramite l'API Contacts di Brevo (POST /v3/contacts/doubleOptinConfirmation), con registrazione obbligatoria degli attributi GDPR di consenso (CONSENT_DATE, CONSENT_SOURCE).

Webhooks & Event-Driven Delivery: Endpoint dedicato /api/webhooks/brevo con verifica della firma secret per l'elaborazione idempotente di hard/soft bounce, reclami spam e disiscrizioni automatiche.

8. Sicurezza, Privacy & Gitleaks Compliance
Zero Secret Policy: Nessun token API reale o simulato (es. prefissi _sk_, sk_live_) o chiave privata deve essere committato nei file del repository. Compliance totale alle scansioni automatiche della pipeline CI/CD tramite Gitleaks.

Sessioni HMAC-SHA256: Tutti gli endpoint protetti verificano l'identità tramite extractDkpUserFromEvent / parseSessionUser, rifiutando cookie non firmati.

Sanitizzazione Input (Anti-XSS): Ogni contenuto dinamico renderizzato con v-html passa obbligatoriamente da sanitizzazione con enforcement sui link esterni (rel="noopener noreferrer").

Protezione Form Dual-Layer: I form pubblici (Contact, Submit, Newsletter) adottano DKP Kernel Captcha equazionale e campo Honeypot anti-crawler.

9. SEO Engine & Sitemap Dinamica
SEO Dinamico Contestuale (useDkpSeo): Ogni pagina (News, Blog, Thread Nodi, Profilo Utente) genera dinamicamente title, description, canonical, OpenGraph e metadati di notarizzazione SHA-256.

Sitemap Real-time: La rotta /sitemap.xml viene generata dinamicamente dal server Nitro estraendo i dati aggiornati da Neon DB con timestamp <lastmod> formattato in ISO 8601.

Robots & Privacy: Esclusione stringente delle rotte amministrative /admin/ e degli endpoint API /api/ nel file public/robots.txt.

10. Il Futuro: Continua Innovazione
Kernel v2.6-PURE-SQL, governato dai principi di BEMYAGENT.md e dalla rete Sentinel, è il fondamento della nuova era di DevKernelPulse. Lavoriamo con passione, rigore architetturale ed orgoglio per offrire alla community globale di sviluppatori uno strumento solido, ultra-veloce e straordinario da usare ogni giorno.

DevKernelPulse Engineering Team — Code with Pride.
---

## 11. Aggiornamento Architetturale v2.6-PURE-SQL — Vault Unificato, Talks Tree & Knowledge Dependabot

### 11.1 DKP Blockchain Vault Ledger Unificato (`/blockchain-vault`)
- **Endpoint Unificato:** `GET /api/vault/ledger` e `GET /api/vault/verify` aggregano in Pure SQL i certificati crittografici SHA-256 provenienti da **Editorial Blog** (`blog_posts`), **Forum Thread** (`node_posts`) e **Developer Tools** (`dkp_vault_ledger`).
- **Integrità della Catena:** Ogni record espone `blockNumber`, `vaultHash` (64 hex), `previousHash` e `merkleRoot`, verificabili pubblicamente tramite il validatore interattivo nella pagina `/nodes/n/blockchain-vault`.

### 11.2 Albero Gerarchico DKP Talks (`/nodes`)
- La navigazione della community adotta una struttura ad **Albero Gerarchico espandibile** (Macro-Categoria -> Nodi -> Sub-Nodi) sincronizzata automaticamente con Neon PostgreSQL tramite `GET /api/nodes`.

### 11.3 Sentinel Network — Knowledge Dependabot (DocKeeper & ArchGuard)
- **Ruoli e Permessi Dedicati nel DB:** Definiti nelle tabelle Pure SQL `sentinel_role_permissions` e `sentinel_dependabot_scans` e collegati agli account bot `sentinel_dockeeper` (`role: sentinel_dockeeper`) e `sentinel_archguard` (`role: sentinel_archguard`) con blocco esplicito della scrittura sul core DB (`can_modify_core_db = FALSE`).
- **Parser Semantico & Auto-Commento:**
  - **Sentinel DocKeeper:** Scansiona i code block Markdown alla ricerca di dipendenze obsolete, API legacy o runtime EOL e pubblica auto-commenti di suggerimento su Thread Forum (`node_comments`) e Articoli Blog (`blog_comments`).
  - **Sentinel ArchGuard:** Verifica pattern architetturali, sicurezza SQL/DOM-XSS, gestione segreti e allineamento alla documentazione ufficiale Nuxt/Nitro/Drizzle.
- **Control Plane Admin (`/admin` & `/admin/sentinels`):** Interfaccia allineata al design system della Home Page per gestire i permessi RBAC su NeonDB, testare snippet in sandbox ed eseguire audit retroattivi.
