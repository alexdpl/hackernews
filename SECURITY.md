# Security Policy — DevKernelPulse (DKP Kernel v2.6-PURE-SQL)

## CI/CD Security Controls
- **Gitleaks**: Secret scanning configured via \.gitleaks.toml\.
- **CodeQL**: \security-extended\ analysis for \javascript-typescript\ via \.github/codeql-config.yml\.
- **Dependency Audit**: \pnpm audit --prod --audit-level=high\ enforces zero High/Critical runtime vulnerabilities (legacy packages \update\, \defaults-deep\, \set-value\, \yargs-parser\ removed; residual dev-only transitive advisories in \drizzle-kit\/\	ailwindcss\/\	est-utils\ accepted with local patch in \patches/braces@3.0.3.patch\).

## Responsible Disclosure
Report security issues privately to **security@devkernelpulse.org**.