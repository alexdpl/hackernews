# 🧪 Guida al Testing: Vitest & Playwright (DKP Kernel v2.6-PURE-SQL)
In **DevKernelPulse** (==DKP Kernel v2.6-PURE-SQL==) le suite di test unitarie, di componente ed **End-to-End** sono *isolate* e *integrat*e nei **Quality Gates CI/CD**.

## ⚡ 1. Unit & Component Tests (Vitest)
La configurazione **Vitest** gestisce sia i test unitari trasversali (`tests/unit/`) sia i componenti **Nuxt** (`tests/nuxt/`).

- Esecuzione completa:
```bash
pnpm exec vitest run --passWithNoTests
```
- Esecuzione in watch mode durante lo sviluppo:
```bash
pnpm exec vitest
```
## 🎭 2. End-to-End Browser Tests (Playwright)
I test **E2E** verificano i flussi critici (navigazione feed, rendering Markdown/code blocks, Nodes e form WCAG 2.1 AA) in `tests/playwright/`.

Esecuzione suite E2E:
```bash
pnpm exec playwright test
```
## 🛡️ 3. Quality Gates Pre-Deploy

Prima di ogni **push** su **main** o *deploy* su ==Google Cloud Run== (`europe-west4`):
```bash
pnpm run build:sdk
pnpm run build
pnpm exec vitest run --passWithNoTests
pnpm audit --prod --audit-level=high
```
