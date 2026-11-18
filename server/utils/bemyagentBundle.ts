// server/utils/bemyagentBundle.ts (Auto-generated from .bemyagent workspace)
export const BEMYAGENT_BUNDLE: {
  docs: Array<{ name: string; content: string }>
  workMilestones: string[]
} = {
    "docs":  [
                 {
                     "name":  "00-ai-rules.md",
                     "content":  "# 00-ai-rules.md — DKP BEMYAGENT Operating Protocol\n1. **Lazy Loading**: Read only `00-ai-rules.md` and the specific doc needed for the active task. Never load `decisions/`, `specs/`, or `drafts/` unless explicitly required.\n2. **TTEV Cycle**: Every task runs through `01_think.md` -\u003e `02_tasks.md` -\u003e `03_execute.log` -\u003e `04_verify.md`.\n3. **Pure SQL \u0026 Cloud Run Invariants**:\n   - Use Pure SQL (`sql` template tags) on Neon PostgreSQL; never rely on implicit ORM schema pushes in production.\n   - Never expose `PORT` or duplicate keys in `env.yaml` during Cloud Run deploys.\n   - Every autonomous Sentinel action must pass Symbiotic Validation (`PASS` or `PASS_WITH_CAVEATS`) before writing to `comments`/`node_comments` or dispatching SMTP.\n4. **Pacing**: Default `SEAMLESS` for bugfixes and telemetry; `INTERACTIVE` for DB migrations or auth changes.\r\n"
                 },
                 {
                     "name":  "01-overview.md",
                     "content":  "# 01-overview.md — DevKernelPulse (DKP)\n- **Domain**: https://devkernelpulse.org\n- **Mission**: Developer community, technical feed, structured nodes (`n/...`), on-chain SHA-256 vault notarization, and autonomous AI Sentinel Network.\n- **Quick Start**: `pnpm install` -\u003e `pnpm dev` (local) | `pnpm build` -\u003e `gcloud run deploy devkernelpulse --source . --region europe-west4` (prod).\r\n"
                 },
                 {
                     "name":  "02-architecture.md",
                     "content":  "# 02-architecture.md — System Architecture\n- **Frontend/SSR**: Nuxt 3 + Nitro running stateless on Google Cloud Run (`europe-west4`).\n- **Database**: Neon Serverless PostgreSQL accessed via Drizzle `db.execute(sql`...`)` (Pure SQL mode).\n- **Sentinel Network (TTEV Engine)**:\n  - `sentinel_ai` (Orchestrator \u0026 Moderator): Think/Verify coordinator + OpenUI Studio telemetry.\n  - `guardian_bot` (Firewall): Active threat interception (`XSS`, `SQLi`, spam) + shadowban containment.\n  - `snippet_master` (Code Reviewer): Static \u0026 LLM-assisted code review on fenced snippets.\n  - `security_watch` (CVE \u0026 Release Monitor): Monitors `n/Core Releases \u0026 Patch` and CVE advisories.\n- **Mail Subsystem**: Brevo SMTP Relay (`smtp-relay.brevo.com:587`) via `server/utils/mailer.ts` + Cloudflare inbound webhook.\r\n"
                 },
                 {
                     "name":  "03-code-map.md",
                     "content":  "# 03-code-map.md — Critical Paths \u0026 Schemas\n- `server/utils/sentinelNetwork.ts`: TTEV + CDM + autoModelSwitching pipeline for all 4 Sentinels.\n- `server/utils/mailer.ts`: Unified Brevo SMTP transport (`sendKernelEmail`, `sendSentinelEmailDetailed`).\n- `server/utils/reservedUsernames.ts`: Anti-ghost-account username guard.\n- `server/api/posts/index.post.ts`: Main feed post creation + `event.waitUntil(runSentinelPipeline)`.\n- `server/api/comments/index.post.ts`: Unified comments creation + `event.waitUntil(runSentinelPipeline)`.\n- `server/api/nodes/posts/index.post.ts` \u0026 `server/api/nodes/comments/index.post.ts`: Node forum threads/replies + Sentinel hooks.\n- `server/api/admin/sentinels.get.ts` \u0026 `.post.ts`: Admin control plane, shadowban revoke, SMTP test.\n- `server/api/admin/bemyagent.get.ts`: Exposes `.bemyagent/` HTN workspace + TTEV telemetry to OpenUI Studio.\n- **DB Tables**: `users` (`is_bot`, `bot_specialty`, `is_shadowbanned`, `ban_reason`), `sentinel_logs` (`reasoning_trace` JSONB), `posts`, `comments`, `node_posts`, `node_comments`.\r\n"
                 },
                 {
                     "name":  "04-tech-stack.md",
                     "content":  "# 04-tech-stack.md — Tech Stack \u0026 External Services\n- **Package Manager**: `pnpm` (do not use `npm` due to `overrides` resolution).\n- **Runtime**: Nuxt / Nitro, TypeScript, TailwindCSS.\n- **Data**: Neon PostgreSQL, Drizzle ORM (Pure SQL execution).\n- **AI Gateway**: OpenRouter Structured Outputs (`callOpenRouterStructured`) + Smart AI Router fallback.\n- **Infra \u0026 Email**: Google Cloud Run (`europe-west4`), Brevo SMTP (`SMTP_HOST` / `NUXT_SMTP_HOST`).\r\n"
                 },
                 {
                     "name":  "05-decisions-and-issues.md",
                     "content":  "# 05-decisions-and-issues.md — Decision Log \u0026 Known Issues\n- **[ADR-001] Pure SQL over Drizzle Push**: All runtime migrations use idempotent `CREATE TABLE/ALTER TABLE IF NOT EXISTS` via `db.execute(sql`...`)`.\n- **[ADR-002] Ghost Account Prevention**: Route-like usernames (`me`, `login`, `models`, `keys`) purged and blocked via `reservedUsernames.ts`; bots excluded from login (`COALESCE(is_bot, FALSE) = FALSE`).\n- **[ADR-003] BEMYAGENT TTEV Integration**: Sentinels evaluate CDM complexity tiers (`MICRO`, `STANDARD`, `HEAVY`) and self-validate (`PASS` / `PASS_WITH_CAVEATS` / `FAIL`) before posting replies or sending SMTP alerts.\r\n"
                 },
                 {
                     "name":  "06-implementation-plan.md",
                     "content":  "# 06-implementation-plan.md — Milestones\n- [x] Milestone 1: Production Auth stabilization, DB Pure SQL alignment, Ghost user cleanup.\n- [x] Milestone 2.1: Seed 4 Sentinels, Brevo SMTP mailer, endpoint triggers (`posts`, `comments`, `nodes`).\n- [ ] Milestone 2.2: Deploy TTEV + CDM Sentinel upgrade, verify Brevo SMTP delivery, connect OpenUI Studio to `/api/admin/bemyagent`.\r\n"
                 }
             ],
    "workMilestones":  [
                           "milestone-2"
                       ]
}