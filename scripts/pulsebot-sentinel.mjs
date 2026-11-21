#!/usr/bin/env node
// scripts/pulsebot-sentinel.mjs
// Sentinella Guardiana Pulsebot (BEMYAGENT.md) — Audit Ecosistema, Sicurezza, Warning & Dipendenze
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const shouldNotify = process.argv.includes('--notify')

function walkFiles(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.nuxt', '.output', '.git', 'test-results', 'playwright-report'].includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(full, exts, out)
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      out.push(full)
    }
  }
  return out
}

function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  }
}

loadEnvLocal()

const findings = []
function addFinding(level, area, message, file = '') {
  findings.push({ level, area, message, file: file ? path.relative(ROOT, file) : '' })
}

// 1. Verifica file architetturali chiave DKP v2.6
const requiredFiles = [
  'app/composables/useSentinelGrammar.ts',
  'app/composables/useDkpNodes.ts',
  'server/utils/mailNexus.ts',
  'server/api/webhooks/brevo.post.ts',
  'server/routes/sitemap.xml.ts'
]
for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    addFinding('ERROR', 'Architecture', `Modulo core mancante: ${rel}`, rel)
  }
}

// 2. Security Hygiene: nessun segreto lato client o endpoint legacy /api/v2.5/
const clientFiles = walkFiles(path.join(ROOT, 'app'), ['.vue', '.ts', '.js'])
const secretTokens = ['RESEND_API_KEY', 'BREVO_API_KEY', 'DATABASE_URL', 'STRIPE_SECRET_KEY', 'NUXT_ADMIN_SECRET', 'SMTP_PASS']

for (const file of clientFiles) {
  const content = fs.readFileSync(file, 'utf8')
  for (const secret of secretTokens) {
    if (content.includes(secret)) {
      addFinding('CRITICAL', 'Security', `Riferimento a segreto server (${secret}) nel codice client`, file)
    }
  }
  if (/\/api\/v2\.5\//.test(content)) {
    addFinding('WARN', 'Pure-SQL Parity', 'Endpoint legacy /api/v2.5/ rilevato nel frontend', file)
  }
  if (/\b(AI Studio|AI Copilot)\b/.test(content)) {
    addFinding('WARN', 'Branding', 'Etichetta obsoleta AI Studio / AI Copilot rilevata (usare DKP Ai Nexus©)', file)
  }
}

// 3. Audit Configurazione PostCSS / Nuxt Warning
const pkgPath = path.join(ROOT, 'package.json')
const nuxtCfgPath = path.join(ROOT, 'nuxt.config.ts')
if (fs.existsSync(pkgPath) && fs.existsSync(nuxtCfgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  const nuxtCfg = fs.readFileSync(nuxtCfgPath, 'utf8')

  if (nuxtCfg.includes('tailwindcss/nesting')) {
    addFinding('WARN', 'Build Hygiene', 'Plugin PostCSS tailwindcss/nesting presente in nuxt.config.ts (genera NUXT_B7027)', 'nuxt.config.ts')
  }
  if (nuxtCfg.includes('cssnano') && !allDeps.cssnano) {
    addFinding('WARN', 'Build Hygiene', 'Plugin cssnano referenziato ma non installato in package.json (genera NUXT_B7007)', 'nuxt.config.ts')
  }
}

// 4. Report CLI
console.log('\n==============================================================')
console.log(' PULSEBOT (BEMYAGENT.md) — DKP v2.6 ECOSYSTEM GUARDIAN REPORT')
console.log('==============================================================')

const criticals = findings.filter((f) => f.level === 'CRITICAL' || f.level === 'ERROR')
const warns = findings.filter((f) => f.level === 'WARN')

if (findings.length === 0) {
  console.log(' [OK] Zero vulnerabilita, zero endpoint legacy, zero warning rilevati.')
} else {
  for (const f of findings) {
    console.log(` [${f.level}] (${f.area}) ${f.message}${f.file ? ` -> ${f.file}` : ''}`)
  }
}
console.log(`\n Riepilogo: ${criticals.length} critici/errori, ${warns.length} warning.\n`)

// 5. Notifica opzionale via Resend API (DKP Mail Nexus© Sentinel Channel)
async function notifyAdminIfRequested() {
  if (!shouldNotify || criticals.length === 0) return
  const resendKey = process.env.RESEND_API_KEY
  const adminTo = process.env.ADMIN_ALERT_EMAIL || 'alex@devkernelpulse.org'
  const fromAddr = process.env.SMTP_FROM || '"Pulsebot Sentinel" <sentinel@devkernelpulse.org>'
  if (!resendKey) return

  const listHtml = criticals.map((c) => `<li><strong>[${c.area}]</strong> ${c.message} (${c.file})</li>`).join('')
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddr,
      to: [adminTo],
      subject: `[Pulsebot Alert] Rilevate ${criticals.length} anomalie critiche su DKP v2.6`,
      html: `<h3>Pulsebot Ecosystem Guardian Report</h3><ul>${listHtml}</ul>`
    })
  }).catch(() => null)
}

await notifyAdminIfRequested()
process.exit(criticals.length > 0 ? 1 : 0)