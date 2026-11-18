# 04-tech-stack.md — Tech Stack & External Services
- **Package Manager**: `pnpm` (do not use `npm` due to `overrides` resolution).
- **Runtime**: Nuxt / Nitro, TypeScript, TailwindCSS.
- **Data**: Neon PostgreSQL, Drizzle ORM (Pure SQL execution).
- **AI Gateway**: OpenRouter Structured Outputs (`callOpenRouterStructured`) + Smart AI Router fallback.
- **Infra & Email**: Google Cloud Run (`europe-west4`), Brevo SMTP (`SMTP_HOST` / `NUXT_SMTP_HOST`).
