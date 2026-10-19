// server/api/tools/ai-scan.ts
import { defineEventHandler, readBody } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  let body: any = {}
  try {
    body = await readBody(event)
  } catch {
    if (event.node?.req) {
      const buffers: any[] = []
      for await (const chunk of event.node.req) { buffers.push(chunk) }
      const raw = Buffer.concat(buffers).toString('utf-8')
      try { body = JSON.parse(raw) } catch {}
    }
  }

  const targetUrl = body?.url || ''
  const targetUserId = body?.userId ? Number(body.userId) : 1

  // sostituire la validazione e la derivazione di repoPath con questo
let repoPath = ''
try {
  // Normalizza input vuoto o non stringa
  const rawUrl = String(targetUrl || '').trim()
  const parsedUrl = new URL(rawUrl)

  // Protocollo consentito
  const isHttp = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  if (!isHttp) {
    return { success: false, error: 'Inserisci un URL GitHub valido.' }
  }

  // Host consentito (solo github.com e www.github.com)
  const host = parsedUrl.hostname.toLowerCase()
  const isGithubHost = host === 'github.com' || host === 'www.github.com'
  if (!isGithubHost) {
    return { success: false, error: 'Inserisci un URL GitHub valido.' }
  }

  // Estrai owner e repo dai segmenti del pathname
  const segments = parsedUrl.pathname.split('/').filter(Boolean) // rimuove segmenti vuoti
  // ci aspettiamo almeno [owner, repo]
  if (segments.length < 2) {
    return { success: false, error: 'Inserisci un URL GitHub valido.' }
  }

  // rimuovi eventuale .git dal repo
  const owner = segments[0]
  const repo = segments[1].replace(/\.git$/i, '')
  repoPath = `${owner}/${repo}`
} catch (e) {
  // URL non valido o parsing fallito
  return { success: false, error: 'Inserisci un URL GitHub valido.' }
}

    // 2. Recupera l'albero completo dei file
    const response: any = await $fetch(`https://api.github.com/repos/${repoPath}/git/trees/${defaultBranch}?recursive=1`, {
      headers: { 'User-Agent': 'DKP-AI-Repo-Scanner-v2.5' }
    })

    const tree = response?.tree || []
    const paths = tree.map((item: any) => item.path.toLowerCase())

    // 3. ANALISI DINAMICA DEL TECH STACK
    const detectedStack = []
    if (paths.some((p: string) => p.includes('nuxt.config'))) detectedStack.push('Nuxt')
    else if (paths.some((p: string) => p.includes('next.config'))) detectedStack.push('Next.js')
    else if (paths.some((p: string) => p.includes('vue'))) detectedStack.push('Vue.js')
    else if (paths.some((p: string) => p.includes('react'))) detectedStack.push('React')
    
    if (paths.some((p: string) => p.includes('tailwind.config'))) detectedStack.push('TailwindCSS')
    if (paths.some((p: string) => p.endsWith('.ts') || p.endsWith('.tsx'))) detectedStack.push('TypeScript')
    if (paths.some((p: string) => p.includes('drizzle.config') || p.includes('schema.ts'))) detectedStack.push('Drizzle ORM')
    if (paths.some((p: string) => p === 'package.json')) detectedStack.push('Node.js')
    if (paths.some((p: string) => p === 'requirements.txt' || p === 'pyproject.toml')) detectedStack.push('Python')
    if (paths.some((p: string) => p === 'cargo.toml')) detectedStack.push('Rust')
    if (paths.some((p: string) => p === 'go.mod')) detectedStack.push('Go')
    if (paths.some((p: string) => p.includes('dockerfile'))) detectedStack.push('Docker')
    
    if (detectedStack.length === 0) detectedStack.push('Vanilla / Custom Stack')

    // 4. Verifiche di presenza file per Audit
    const hasTests = paths.some((p: string) => p.startsWith('tests/') || p.startsWith('test/') || p.includes('.test.') || p.includes('.spec.'))
    const hasGithubActions = paths.some((p: string) => p.startsWith('.github/workflows/'))
    const hasContributing = paths.some((p: string) => p.includes('contributing.md'))
    const hasDocs = paths.some((p: string) => p.startsWith('docs/') || p.includes('readme.md'))

    // 5. Calcolo Punteggio Dinamico
    let score = 55 // Base score
    if (hasTests) score += 20
    if (hasGithubActions) score += 10
    if (hasContributing) score += 5
    if (hasDocs) score += 10
    if (detectedStack.includes('TypeScript') || detectedStack.includes('Rust') || detectedStack.includes('Go')) score += 5 // Bonus linguaggi tipizzati

    if (score > 100) score = 100
    const docCoverageScore = (hasContributing ? 50 : 10) + (hasDocs ? 50 : 20)
    const earnedXp = Math.round(score / 2)

    // 6. GENERAZIONE PIANO D'AZIONE DINAMICO
    const dynamicActionPlan = []
    
    if (!hasTests) {
      dynamicActionPlan.push({ priority: 'ALTA', task: `La repo ${repoPath.split('/')[1]} non ha una suite di test (es. Vitest/Jest). Aggiungila per evitare regressioni.`, xpGain: '+60 XP', done: false, color: 'text-red-400 border-red-400/30 bg-red-400/10' })
    } else {
      dynamicActionPlan.push({ priority: 'BASSA', task: 'Test rilevati! Ottimo lavoro, mantieni alta la code coverage.', xpGain: '+10 XP', done: true, color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' })
    }

    if (!hasGithubActions) {
      dynamicActionPlan.push({ priority: 'MEDIA', task: 'Manca una pipeline CI/CD. Configura GitHub Actions in .github/workflows per i deploy automatici.', xpGain: '+40 XP', done: false, color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' })
    } else {
      dynamicActionPlan.push({ priority: 'BASSA', task: 'Pipeline CI/CD configurate correttamente tramite GitHub Actions.', xpGain: '+15 XP', done: true, color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' })
    }

    if (!hasContributing) {
      dynamicActionPlan.push({ priority: 'BASSA', task: 'Aggiungi un file CONTRIBUTING.md per aiutare i developer open-source a contribuire.', xpGain: '+20 XP', done: false, color: 'text-sky-400 border-sky-400/30 bg-sky-400/10' })
    }

    // 7. SINTESI AI DINAMICA
    let aiSummary = `L'agente ha analizzato ${repoPath.split('/')[1]}. Stack primario basato su ${detectedStack.slice(0, 2).join(' e ')}. `
    if (score >= 90) aiSummary += `Architettura eccezionale, il codice rispetta in pieno gli standard DKP v2.5-GOLD.`
    else if (score >= 70) aiSummary += `Repository solida, ma mancano alcune pratiche core (vedi roadmap) per raggiungere il tier S.`
    else aiSummary += `La struttura è basilare. È necessario implementare test e documentazione per garantire scalabilità.`

    // 8. GAMIFICATION (Registrazione su DB Neon)
    try {
      const db = await getDb()
      await db.update(users).set({ xp: sql`COALESCE(xp, 0) + ${earnedXp}` }).where(eq(users.id, targetUserId))
      await db.insert(xpTransactions).values({
        userId: targetUserId,
        action: `Audit Repo GitHub: ${repoPath.substring(0, 25)}`,
        points: earnedXp
      })
    } catch (dbErr) {
      console.warn('[GAMIFICATION DB ERROR]', dbErr)
    }

    // 9. Ritorno dei dati formattati
    return {
      success: true,
      data: {
        url: targetUrl,
        repoName: repoPath,
        overallScore: score,
        rankTier: score >= 90 ? 'S-TIER GOLD' : (score >= 75 ? 'A-TIER SILVER' : 'B-TIER BRONZE'),
        reputationXpBonus: `+${earnedXp} DKP XP`,
        developerLevel: score >= 90 ? 'Senior Systems Architect' : 'Full-Stack Developer',
        securityStatus: score >= 80 ? '🔒 SICURO (Vulnerabilità Critiche Assenti)' : '⚠️ ATTENZIONE (Misure di sicurezza base assenti)',
        detectedStack: detectedStack,
        aiSummary: aiSummary,
        rankMetrics: [
          { label: 'Qualità & Pulizia Codice', score: Math.min(100, score + 5), color: 'text-emerald-400', bg: 'bg-emerald-500' },
          { label: 'Sicurezza & CI/CD', score: hasGithubActions ? 95 : 45, color: hasGithubActions ? 'text-emerald-400' : 'text-yellow-400', bg: hasGithubActions ? 'bg-emerald-500' : 'bg-yellow-500' },
          { label: 'Solidità & Testing', score: hasTests ? 98 : 35, color: hasTests ? 'text-emerald-400' : 'text-red-400', bg: hasTests ? 'bg-emerald-500' : 'bg-red-500' },
          { label: 'Documentazione', score: docCoverageScore, color: docCoverageScore >= 90 ? 'text-emerald-400' : 'text-yellow-400', bg: docCoverageScore >= 90 ? 'bg-emerald-500' : 'bg-yellow-500' }
        ],
        improvementActionPlan: dynamicActionPlan
      }
    }
  } catch (err: any) {
    console.error('❌ Errore ai-scan GitHub:', err)
    return { success: false, error: err?.status === 403 ? 'Rate limit API GitHub raggiunto. Attendi un minuto.' : 'Impossibile analizzare il repository.' }
  }
})