// server/api/blog/submit.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import crypto from 'node:crypto'
import { generateObject } from 'ai'
import { z } from 'zod'
import { AI_MODELS } from '~~/server/utils/ai'

// --- 1. PULSE SENTINEL SAST: Regole di Sicurezza Statiche (Euristiche Locali) ---
const SECURITY_RULES = [
  {
    id: 'SEC-001',
    name: 'Hardcoded Secret / API Key',
    pattern: /(?:AIza[0-9a-zA-Z\-_]{35}|AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36}|sk-or-v1-[a-zA-Z0-9]{64})/,
    severity: 'CRITICAL' as const,
    description: 'Possibile chiave API (Google, AWS, OpenAI, GitHub, OpenRouter) rilevata nel codice in chiaro.'
  },
  {
    id: 'SEC-002',
    name: 'Dangerous Execution (eval/exec)',
    pattern: /\b(eval|exec|system|passthru|shell_exec)\s*\(/,
    severity: 'WARNING' as const,
    description: 'Rilevato utilizzo di funzioni di esecuzione dinamica potenzialmente pericolose.'
  },
  {
    id: 'SEC-003',
    name: 'Exposed Database Credentials',
    pattern: /postgres:\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_]+@.*?:[0-9]{4}\/[a-zA-Z0-9_]+/,
    severity: 'CRITICAL' as const,
    description: 'Possibile stringa di connessione a database con password in chiaro.'
  }
]

// --- 2. SCHEMA ZOD PER L'AUDIT AI VIA OPENROUTER ---
const BlogVaultAuditSchema = z.object({
  authenticityScore: z.number().min(0).max(100).describe("Score di autenticità e valore tecnico dell'articolo (0-100)"),
  securityScore: z.number().min(0).max(100).describe("Score di sicurezza generale del codice e del contenuto (0-100)"),
  plagiarismRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe("Rischio di contenuto copiato o generato in modo generico da AI"),
  sastCheck: z.enum(['PASSED', 'WARNING', 'CRITICAL']).describe("Esito globale della sicurezza del codice"),
  summary: z.string().describe("Breve sintesi dell'audit in lingua italiana per il report Vault")
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, content } = body

  if (!title || !content) {
    throw createError({ statusCode: 400, statusMessage: 'Titolo e contenuto sono obbligatori per l\'analisi.' })
  }

  // A. ESTRAZIONE FRAMMENTI DI CODICE (Code Extraction Engine)
  const codeBlockRegex = /```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null;
  const extractedSnippets: Array<{ language: string; code: string }> = []

  while ((match = codeBlockRegex.exec(content)) !== null) {
    extractedSnippets.push({
      language: match[1].trim() || 'unknown',
      code: match[2].trim()
    })
  }

  // B. ANALISI SAST STATICA LOCALE (Regex Check)
  let staticSastStatus: 'PASSED' | 'WARNING' | 'CRITICAL' = 'PASSED'
  let totalIssues = 0
  const analysisReport: any[] = []

  extractedSnippets.forEach((snippet, index) => {
    const issuesFound: any[] = []

    SECURITY_RULES.forEach(rule => {
      if (rule.pattern.test(snippet.code)) {
        issuesFound.push({
          ruleId: rule.id,
          name: rule.name,
          severity: rule.severity,
          message: rule.description
        })

        if (rule.severity === 'CRITICAL') staticSastStatus = 'CRITICAL'
        else if (rule.severity === 'WARNING' && staticSastStatus !== 'CRITICAL') staticSastStatus = 'WARNING'
        totalIssues++
      }
    })

    analysisReport.push({
      snippetIndex: index + 1,
      language: snippet.language,
      issuesFound,
      status: issuesFound.length === 0 ? 'CLEAN' : 'VULNERABILITIES_DETECTED'
    })
  })

  // C. ANALISI SEMANTICA AI CON OPENROUTER (Vercel AI SDK)
  let aiReport = {
    authenticityScore: staticSastStatus === 'CRITICAL' ? 10 : (staticSastStatus === 'WARNING' ? 65 : 95),
    securityScore: staticSastStatus === 'CRITICAL' ? 5 : (staticSastStatus === 'WARNING' ? 70 : 100),
    plagiarismRisk: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
    sastCheck: staticSastStatus,
    summary: 'Analisi statica locale completata con successo.'
  }

  try {
    const { object: llmResult } = await generateObject({
      model: AI_MODELS.BALANCED, // Provider OpenRouter centralizzato
      schema: BlogVaultAuditSchema,
      system: `Sei DKP Vault Audit Engine. Valuti la sicurezza, l'autenticità e il rischio di plagio degli articoli per DevKernelPulse.
Se sono presenti credenziali esposte o vulnerabilità critiche, forza il punteggio di sicurezza a livelli bassi.`,
      prompt: `Titolo: "${title}"
Estratto Contenuto:
"""
${content.substring(0, 3000)}
"""

Snippet di codice estratti (${extractedSnippets.length}):
${extractedSnippets.map((s, idx) => `Snippet #${idx + 1} (${s.language}):\n${s.code.substring(0, 500)}`).join('\n---\n')}

Risultato scansione statica locale: ${staticSastStatus} (Problemi trovati: ${totalIssues})`
    })

    // Se l'analisi statica locale ha rilevato criticità reali, prevale la gravità maggiore
    const finalSastCheck = staticSastStatus === 'CRITICAL' 
      ? 'CRITICAL' 
      : (llmResult.sastCheck === 'CRITICAL' ? 'CRITICAL' : (staticSastStatus === 'WARNING' || llmResult.sastCheck === 'WARNING' ? 'WARNING' : 'PASSED'))

    const finalSecurityScore = staticSastStatus === 'CRITICAL' 
      ? Math.min(15, llmResult.securityScore) 
      : llmResult.securityScore

    aiReport = {
      authenticityScore: llmResult.authenticityScore,
      securityScore: finalSecurityScore,
      plagiarismRisk: llmResult.plagiarismRisk,
      sastCheck: finalSastCheck,
      summary: llmResult.summary
    }
  } catch (llmError) {
    console.warn('⚠️ [BLOG VAULT OPENROUTER FALLBACK]:', llmError)
  }

  // D. GENERAZIONE HASH CRITTOGRAFICO SHA-256 VAULT (Proof-of-Code)
  const rawDataForHashing = extractedSnippets.length > 0 
    ? extractedSnippets.map(s => s.code).join('|||') 
    : content

  const vaultHash = crypto
    .createHash('sha256')
    .update(`DKP_BLOG_VAULT::${title}::${rawDataForHashing}::${Date.now()}`)
    .digest('hex')

  // E. RISPOSTA STRUTTURATA PER L'ADMIN PANEL
  return {
    success: true,
    message: 'Analisi Pulse Sentinel & DKP Vault completata.',
    vaultData: {
      totalSnippetsAnalyzed: extractedSnippets.length,
      sastCheck: aiReport.sastCheck,
      totalIssuesFound: totalIssues,
      authenticityScore: aiReport.authenticityScore,
      securityScore: aiReport.securityScore,
      plagiarismRisk: aiReport.plagiarismRisk,
      summary: aiReport.summary,
      vaultHashPreview: vaultHash,
      detailedReport: analysisReport
    }
  }
})