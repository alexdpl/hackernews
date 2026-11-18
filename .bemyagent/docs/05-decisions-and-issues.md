# 05-decisions-and-issues.md — Decision Log & Known Issues
- **[ADR-001] Pure SQL over Drizzle Push**: All runtime migrations use idempotent `CREATE TABLE/ALTER TABLE IF NOT EXISTS` via `db.execute(sql`...`)`.
- **[ADR-002] Ghost Account Prevention**: Route-like usernames (`me`, `login`, `models`, `keys`) purged and blocked via `reservedUsernames.ts`; bots excluded from login (`COALESCE(is_bot, FALSE) = FALSE`).
- **[ADR-003] BEMYAGENT TTEV Integration**: Sentinels evaluate CDM complexity tiers (`MICRO`, `STANDARD`, `HEAVY`) and self-validate (`PASS` / `PASS_WITH_CAVEATS` / `FAIL`) before posting replies or sending SMTP alerts.
