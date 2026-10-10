// server/api/blog/submit.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import crypto from 'node:crypto'

// --- PULSE SENTINEL AI: Regole di Sicurezza Statiche (SAST Mock) ---
const SECURITY_RULES = [
  {
    id: 'SEC-001',
    name: 'Hardcoded Secret / API Key',
    pattern: /(?:AIza[0-9a-zA-Z\\-_]{35}|AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36})/,
    severity: 'CRITICAL',
    description: 'Possibile chiave API (Google, AWS, OpenAI, GitHub) rilevata nel codice in chiaro.'
  },
  {
    id: 'SEC-002',
    name: 'Dangerous Execution (eval/exec)',
    pattern: /\b(eval|exec|system|passthru|shell_exec)\s*\(/,
    severity: 'WARNING',
    description: 'Rilevato utilizzo di funzioni di esecuzione dinamica pericolose.'
  },
  {
    id: 'SEC-003',
    name: 'Exposed Database Credentials',
    pattern: /postgres:\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_]+@.*?:[0-9]{4}\/[a-zA-Z0-9_]+/,
    severity: 'CRITICAL',
    description: 'Possibile stringa di connessione a database con password in chiaro.'
  }
]

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, content } = body

  if (!title || !content) {
    throw createError({ statusCode: 400, statusMessage: 'Titolo e contenuto sono obbligatori per l\'analisi.' })
  }

  // 1. Estrazione dei Frammenti di Codice (Code Extraction Engine)
  // Trova tutti i blocchi markdown: ```linguaggio\n codice \n```
  const codeBlockRegex = /```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g
  let match;
  const extractedSnippets = [];

  while ((match = codeBlockRegex.exec(content)) !== null) {
    extractedSnippets.push({
      language: match[1].trim() || 'unknown',
      code: match[2].trim()
    });
  }

  // 2. Analisi SAST (Static Application Security Testing)
  let sastStatus: 'PASSED' | 'WARNING' | 'CRITICAL' = 'PASSED';
  let totalIssues = 0;
  const analysisReport: any[] = [];

  extractedSnippets.forEach((snippet, index) => {
    const issuesFound: any[] = [];

    SECURITY_RULES.forEach(rule => {
      if (rule.pattern.test(snippet.code)) {
        issuesFound.push({
          ruleId: rule.id,
          name: rule.name,
          severity: rule.severity,
          message: rule.description
        });

        if (rule.severity === 'CRITICAL') sastStatus = 'CRITICAL';
        else if (rule.severity === 'WARNING' && sastStatus !== 'CRITICAL') sastStatus = 'WARNING';
        totalIssues++;
      }
    });

    analysisReport.push({
      snippetIndex: index + 1,
      language: snippet.language,
      issuesFound,
      status: issuesFound.length === 0 ? 'CLEAN' : 'VULNERABILITIES_DETECTED'
    });
  });

  // 3. Generazione DKP Vault Notarization Hash (Proof of Code)
  const rawDataForHashing = extractedSnippets.map(s => s.code).join('|||');
  const vaultHash = crypto.createHash('sha256').update(rawDataForHashing + Date.now().toString()).digest('hex');
  const authenticityScore = sastStatus === 'CRITICAL' ? 10 : (sastStatus === 'WARNING' ? 65 : 98);
  const securityScore = sastStatus === 'CRITICAL' ? 5 : (sastStatus === 'WARNING' ? 70 : 100);

  return {
    success: true,
    message: 'Analisi Pulse Sentinel completata.',
    vaultData: {
      totalSnippetsAnalyzed: extractedSnippets.length,
      sastCheck: sastStatus,
      totalIssuesFound: totalIssues,
      authenticityScore,
      securityScore,
      vaultHashPreview: vaultHash,
      detailedReport: analysisReport
    }
  }
})