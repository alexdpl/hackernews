# 🤝 Guida alla Contribuzione - DKP HackerNews

Benvenuto a bordo! Apprezziamo il tuo interesse nel migliorare l'ecosistema DKP v2.4-GOLD. Per mantenere il codice pulito e l'architettura stabile, ti chiediamo di seguire queste linee guida.

## 🚀 Setup Locale
1. Clona il repository: `git clone git@github.com:alexdpl/hackernews.git`
2. Installa le dipendenze: `pnpm install`
3. Avvia l'ambiente dev: `pnpm dev`

## 💻 Setup Locale del Progetto 

1. **Clona il repository via SSH:**
   'bash'
   git clone git@github.com:alexdpl/hackernews.git
   cd hackernews

## 🌿 Regole per i Branch
Crea sempre un branch separato partendo da `main`:
- Nuove feature: `feat/nome-feature` (es. `feat/ai-scanner`)
- Bug fix: `fix/nome-bug` (es. `fix/session-cookie`)
- Documentazione: `docs/nome-doc`

## 💬 Convenzioni per i Commit (Conventional Commits)
Usa messaggi chiari e descrittivi:
- `feat(modulo): aggiunta nuova funzionalità`
- `fix(auth): risolto problema di login`
- `chore: aggiornamento dipendenze`

## 🧪 Esecuzione dei Test
Prima di inviare una Pull Request, assicurati che tutti i test passino con successo:
- **Unit & Nuxt Tests:** `pnpm exec vitest run`
- **End-to-End Tests:** `pnpm exec playwright test`

## 🔄 Regole per la Pull Request (PR)
1. Assicurati che il codice passi la validazione della CI (GitHub Actions).
2. Non includere file `.env` o chiavi API.
3. Compila la descrizione della PR spiegando *cosa* hai fatto e *perché*.
4. Richiedi la review a un Core Maintainer (@alexdpl).

## 📐 Standard di Codice
- Utilizza TypeScript Strict.
- Segui la convenzione Conventional Commits per i messaggi di commit (`feat:`, `fix:`, `docs:`).

### 🛠️ Esegui il commit e spingi su GitHub

Esegui questi comandi nel terminale locale per aggiungere il file ed elevare subito lo score di documentazione:

```bash
git add CONTRIBUTING.md
git commit -m "docs: add comprehensive CONTRIBUTING.md guidelines"
git push origin main

Grazie per il tuo contributo all'Ecosistema DKP! 🔥