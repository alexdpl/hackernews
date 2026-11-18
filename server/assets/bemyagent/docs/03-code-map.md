# 03-code-map.md — Critical Paths & Schemas
- `server/utils/sentinelNetwork.ts`: TTEV + CDM + autoModelSwitching pipeline for all 4 Sentinels.
- `server/utils/mailer.ts`: Unified Brevo SMTP transport (`sendKernelEmail`, `sendSentinelEmailDetailed`).
- `server/utils/reservedUsernames.ts`: Anti-ghost-account username guard.
- `server/api/posts/index.post.ts`: Main feed post creation + `event.waitUntil(runSentinelPipeline)`.
- `server/api/comments/index.post.ts`: Unified comments creation + `event.waitUntil(runSentinelPipeline)`.
- `server/api/nodes/posts/index.post.ts` & `server/api/nodes/comments/index.post.ts`: Node forum threads/replies + Sentinel hooks.
- `server/api/admin/sentinels.get.ts` & `.post.ts`: Admin control plane, shadowban revoke, SMTP test.
- `server/api/admin/bemyagent.get.ts`: Exposes `.bemyagent/` HTN workspace + TTEV telemetry to OpenUI Studio.
- **DB Tables**: `users` (`is_bot`, `bot_specialty`, `is_shadowbanned`, `ban_reason`), `sentinel_logs` (`reasoning_trace` JSONB), `posts`, `comments`, `node_posts`, `node_comments`.
