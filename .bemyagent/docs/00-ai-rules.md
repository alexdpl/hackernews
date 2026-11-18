# 00-ai-rules.md — DKP BEMYAGENT Operating Protocol
1. **Lazy Loading**: Read only `00-ai-rules.md` and the specific doc needed for the active task. Never load `decisions/`, `specs/`, or `drafts/` unless explicitly required.
2. **TTEV Cycle**: Every task runs through `01_think.md` -> `02_tasks.md` -> `03_execute.log` -> `04_verify.md`.
3. **Pure SQL & Cloud Run Invariants**:
   - Use Pure SQL (`sql` template tags) on Neon PostgreSQL; never rely on implicit ORM schema pushes in production.
   - Never expose `PORT` or duplicate keys in `env.yaml` during Cloud Run deploys.
   - Every autonomous Sentinel action must pass Symbiotic Validation (`PASS` or `PASS_WITH_CAVEATS`) before writing to `comments`/`node_comments` or dispatching SMTP.
4. **Pacing**: Default `SEAMLESS` for bugfixes and telemetry; `INTERACTIVE` for DB migrations or auth changes.
