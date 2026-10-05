# 🏛️ Architettura di Sistema DKP (v2.4-GOLD)

Questo documento illustra l'architettura tecnica dell'applicazione **DevKernelPulse (DKP)**.

---

## 🛠️ Tech Stack & Moduli Core

- **Framework Frontend/Backend:** Nuxt 3/4 + Nitro Engine
- **Gestore Pacchetti:** PNPM
- **Language:** TypeScript (Strict Mode)
- **Middleware Guard:** `server/middleware/sentinelAI.ts`
- **Testing Engine:** Vitest (Unit/Nuxt) + Playwright (E2E)
- **Infrastruttura:** Google Cloud Platform (GCP VM), Nginx, PM2

---

## 🔒 Sentinel AI & Gestione Sottodomini

Il middleware `sentinelAI.ts` gestisce il traffico e la sicurezza dei sottodomini:
- **`devkernelpulse.org`**: Applicazione Web Principale
- **`api.devkernelpulse.org`**: Gateway API Pubblico con verifica `x-api-key`
- **`mail.devkernelpulse.org`**: Engine di invio mail e notifiche

---

## 📂 Struttura delle Cartelle

```text
├── app/                  <-- Pagine Nuxt, componenti e asset UI
├── docs/                 <-- Documentazione tecnica e architetturale
├── server/
│   ├── api/
│   │   └── tools/        <-- Endpoints dei tool (AI Scanner, ecc.)
│   └── middleware/       <-- Sentinel AI & CORS Router
├── tests/
│   ├── unit/             <-- Test di unità con Vitest
│   ├── nuxt/             <-- Test di componenti Nuxt con Vitest
│   └── playwright/       <-- Test End-to-End browser
├── CONTRIBUTING.md
└── nuxt.config.ts