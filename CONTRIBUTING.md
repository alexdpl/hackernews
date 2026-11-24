# Guida alla Contribuzione — DevKernelPulse (DKP Kernel v2.6-PURE-SQL)

1. **Setup Locale**: clona `https://github.com/alexdpl/devkernelpulse`, esegui `pnpm install` e avvia `pnpm dev`.
2. **Standard Architetturali**: usa TypeScript strict, query Pure SQL parametrizzate su Neon PostgreSQL (zero endpoint `/api/v2.5/`) e Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
3. **Quality Gates prima della PR**:
   - `pnpm run build`
   - `pnpm run build:sdk`
   - `pnpm exec vitest run --passWithNoTests`
   - `pnpm audit --prod --audit-level=high`