# 02-architecture.md — System Architecture
- **Frontend/SSR**: Nuxt 3 + Nitro running stateless on Google Cloud Run (`europe-west4`).
- **Database**: Neon Serverless PostgreSQL accessed via Drizzle `db.execute(sql`...`)` (Pure SQL mode).
- **Sentinel Network (TTEV Engine)**:
  - `sentinel_ai` (Orchestrator & Moderator): Think/Verify coordinator + OpenUI Studio telemetry.
  - `guardian_bot` (Firewall): Active threat interception (`XSS`, `SQLi`, spam) + shadowban containment.
  - `snippet_master` (Code Reviewer): Static & LLM-assisted code review on fenced snippets.
  - `security_watch` (CVE & Release Monitor): Monitors `n/Core Releases & Patch` and CVE advisories.
- **Mail Subsystem**: Brevo SMTP Relay (`smtp-relay.brevo.com:587`) via `server/utils/mailer.ts` + Cloudflare inbound webhook.
