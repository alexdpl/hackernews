// server/api/tools/ai-code-scan.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { code, userId } = body

  if (!code || typeof code !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Codice sorgente mancante.' })
  }

  const targetUserId = userId ? Number(userId) : 1
  const issues: Array<{ type: 'danger' | 'warning' | 'info'; title: string; desc: string }> = []
  let secretsFound = 0

  // 1. MOTORE DI ANALISI EURISTICA SERVER-SIDE
  // Check 1: Hardcoded Secrets
  if (/api[_-]?key|secret|password|token/i.test(code) && /=['"`][a-zA-Z0-9_\-]{8,}['"`]/.test(code)) {
    issues.push({
      type: 'danger',
      title: '🔑 Secret / Credenziale Hardcoded',
      desc: 'Trovata una chiave o token di accesso nel codice sorgente. Sposta questo valore nelle variabili d\'ambiente (.env).'
    })
    secretsFound++
  }

  // Check 2: Potential Injection / Dangerous Eval
  if (/eval\(|exec\(|innerHTML\s*=/.test(code)) {
    issues.push({
      type: 'danger',
      title: '⚠️ Rischio Injection / Esecuzione Arbitraria',
      desc: 'Trovata l\'istruzione eval() o innerHTML diretto. Espone il codice a vulnerabilità XSS o RCE.'
    })
  }
  
  // Check 3: SQL Injection Risk
  if (/SELECT.*FROM.*WHERE.*=/i.test(code) && /\+/.test(code)) {
     issues.push({
      type: 'danger',
      title: '💉 Possibile SQL Injection',
      desc: 'Rilevata concatenazione di stringhe in una query SQL. Usa query parametrizzate (es. Drizzle ORM o Prepared Statements).'
    })
  }

  // Check 4: Console statements
  if (/console\.log\(/.test(code)) {
    issues.push({
      type: 'info',
      title: '🧹 Residui di Debug (console.log)',
      desc: 'Presenza di log in chiaro nel codice. Rimuovili per non esporre dati sensibili in console utente.'
    })
  }

  // 2. CALCOLO METRICHE
  const baseScore = Math.max(10, 100 - (issues.filter(i => i.type === 'danger').length * 25) - (issues.filter(i => i.type !== 'danger').length * 10))
  let securityLevel: 'A+' | 'B' | 'C' | 'F' = 'A+'
  if (baseScore < 50) securityLevel = 'F'
  else if (baseScore < 75) securityLevel = 'C'
  else if (baseScore < 95) securityLevel = 'B'

  // 3. GAMIFICATION: Assegna +30 XP per aver scansionato lo snippet
  try {
    const db = await getDb()
    await db.update(users)
      .set({ xp: sql`COALESCE(xp, 0) + 30` })
      .where(eq(users.id, targetUserId))

    await db.insert(xpTransactions).values({
      userId: targetUserId,
      action: `AI Code Scan (Score: ${baseScore}/100)`,
      points: 30
    })
  } catch (dbErr) {
    console.warn('[AI-CODE-SCAN GAMIFICATION ERROR]', dbErr)
  }

  return {
    success: true,
    data: {
      score: baseScore,
      securityLevel,
      issues,
      metrics: {
        techDebtHours: issues.length * 1.5,
        secretLeaks: secretsFound,
        performanceScore: Math.min(100, baseScore + 5)
      }
    }
  }
})