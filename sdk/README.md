# @devkernelpulse/sdk (v1.1.0)

Official TypeScript / ESM SDK for **DevKernelPulse (DKP Kernel v2.6-PURE-SQL)** — programmatic access to **Sentinel SAST/AI**, **OpenUI Streaming Studio**, **SHA-256 Proof-of-Safety Vault**, **AI Nexus**, and **Blog APIs**.

## Installazione
```bash
npm install @devkernelpulse/sdk@1.1.0
pnpm add @devkernelpulse/sdk@1.1.0
yarn add @devkernelpulse/sdk@1.1.0
```

## Inizializzazione
```ts
import { DKPClient } from '@devkernelpulse/sdk';

const dkp = new DKPClient({
  apiKey: process.env.DKP_API_KEY!, // dkp_live_...
  environment: 'production'
});
```

## Panoramica Moduli
- **Sentinel** (\dkp.sentinel\): \scan()\, \scanCode()\, \uditContent()\ — Audit statico SAST + AI su codice e contenuti.
- **OpenUI Studio** (\dkp.openui\): \generate()\, \
otarizeProof()\, \emyAgentWorkspace()\ — Generazione UI Tailwind in streaming e Proof-of-Safety SHA-256.
- **Vault** (\dkp.vault\): \
otarize()\, \erify()\, \erifySafetyProof()\, \getLedger()\ — Notarizzazione e verifica prove SHA-256.
- **AI Nexus** (\dkp.ai\): \chat()\ — Streaming AsyncGenerator sui modelli \dkp-coder\, \dkp-flash\, \dkp-pro\.
- **Blog** (\dkp.blog\): \getPost()\, \createPost()\, \getRelated()\, \incrementView()\.

## Esempi d'Uso
```ts
// 1. Invocare Sentinel SAST + AI
const scan = await dkp.sentinel.scan({
  code: 'export const q = (id: string) => sql\SELECT * FROM users WHERE id = \\',
  language: 'typescript',
  filename: 'users.repo.ts',
  useAi: true
});

// 2. Notarizzare un post nel Vault SHA-256
const proof = await dkp.vault.notarize({
  title: 'DKP Kernel v2.6-PURE-SQL',
  content: '# Release Notes',
  author: 'alexdpl',
  category: 'Core Releases'
});
const check = await dkp.vault.verifySafetyProof(proof.vaultHash);

// 3. OpenUI Streaming & Proof-of-Safety
let html = '';
for await (const chunk of await dkp.openui.generate({ model: 'dkp-coder', prompt: 'Status card Tailwind' })) {
  html += chunk.text;
}
const cert = await dkp.openui.notarizeProof({ title: 'Status Card', prompt: 'Status card', html, model: 'dkp-coder' });
```

## Changelog
- **v1.1.0**: Aggiunto modulo \openui\ (\generate\, \
otarizeProof\, \emyAgentWorkspace\), potenziato \sentinel\ e aggiunti \ault.verifySafetyProof()\ / \ault.getLedger()\.
- **v1.0.0**: Release iniziale (\i\, \log\, \ault\, \sentinel\).