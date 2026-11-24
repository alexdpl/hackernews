# 🛠️ Tech Stack & Moduli Core

- Frontend & SSR: Nuxt 4 `(compatibilityVersion: 4`), Vue 3 Composition API, Tailwind CSS, PrismJS dinamico
- **Server Engine**: Nitro Engine (`node-server`) su Node.js 20/22
- **Database Layer**: Neon PostgreSQL Serverless in modalità ==Pure SQL== (query parametrizzate dirette + Drizzle schemaless, zero endpoint `/api/v2.5/`)
- **Official SDK**: `@devkernelpulse/sdk@1.1.0` (`sdk/`) pubblicato su **npm** (ESM + TypeScript)
- **Gestore Pacchetti**: PNPM (==v12+==) con workspace monorepo (==root + sdk==)
- **Language**: TypeScript (`Strict Mode`)
- **AI & Sentinel Network**: `server/utils/sentinelNetwork.ts`, `useSentinelGrammar.ts`, ==RBAC== *bots* (**DocKeeper** & **ArchGuard**) e `BEMYAGENT.md`
- **Testing Engine**: ==Vitest== (`Unit/Nuxt`) + ==Playwright== (`E2E`)

- **Infrastruttura & CI/CD**: Google Cloud Run (`europe-west4`), Cloud Build, GitHub Actions (`Vitest`, `CodeQL`, `Gitleaks`, `pnpm audit`)

# 🔒 Sentinel AI, Sicurezza & Sottodomini

devkernelpulse.org: Applicazione Web Principale (News, Editorial Blog, Community Nodes, Vault, Shop)

- **api.devkernelpulse.org**: Gateway API Pubblico con autenticazione **Bearer** `dkp_live_...`/`x-api-key`
- **mail.devkernelpulse.org**: Mail Nexus & Brevo v3 (**SMTP transazionale** + **Double Opt-In** + **Webhooks**)
- **Sicurezza Runtime**: Sessioni firmate `HMAC-SHA256`, sanitizzazione **HTML/URL** (`safeUrl`), rate limiting e blocco scrittura **DB** per i *bot* **Sentinel** (`can_modify_core_db = FALSE`)

# 📂 Struttura delle Cartelle

```schema
Plaintext
├── .github/              <-- Workflows CI/CD (CodeQL, Gitleaks, npm-audit, CI)
├── app/                  <-- Pagine Nuxt 4, componenti (DkpEditor, Nodes), composables
├── docs/                 <-- Documentazione tecnica (STANDARDS_v.2.6.md, API-SPEC.md, ecc.)
├── drizzle/              <-- Migrazioni e schema SQL di riferimento
├── patches/              <-- Patch dipendenze (braces@3.0.3.patch)
├── sdk/                  <-- Pacchetto ufficiale @devkernelpulse/sdk (v1.1.0)
├── server/
│   ├── api/              <-- Endpoints Pure SQL (admin, blog, news, nodes, tools, user, vault)
│   ├── middleware/       <-- Security headers, sessioni HMAC & routing
│   └── utils/            <-- db.ts (Pure SQL), sentinelNetwork.ts, dkpComments.ts
├── tests/
│   ├── unit/             <-- Test unitari Vitest
│   ├── nuxt/             <-- Test componenti Nuxt Vitest
│   └── playwright/       <-- Test End-to-End browser
├── CONTRIBUTING.md
├── SECURITY.md
├── nuxt.config.ts
└── package.json
```