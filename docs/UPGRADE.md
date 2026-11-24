# Upgrade Guide — v2.5-GOLD to DKP Kernel v2.6-PURE-SQL

- **Pure SQL**: Migrated all endpoints to parameterized Neon PostgreSQL queries and removed \/api/v2.5/\.
- **SDK v1.1.0**: Published \@devkernelpulse/sdk@1.1.0\ with \sentinel\, \openui\, \ault\, \i\, \log\.
- **Environment**: Sync \.env\ variables (\DATABASE_URL\, \OPENROUTER_API_KEY\, \SMTP_*\, \STRIPE_*\) using \.env.example\ as reference.