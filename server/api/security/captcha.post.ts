// server/api/security/captcha.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { randomInt, randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import {
  ensureKernelSecurityTables,
  evaluateKernelSecurityContext,
  logSentinelSecurityEvent,
  sha256Hex,
  signKernelPayload
} from '../../utils/kernelSecurityPolicy'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => ({}))) as Record<string, any>
  const action = String(body?.action || 'challenge').toLowerCase()

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Pure SQL Database non disponibile' })
  }

  await ensureKernelSecurityTables(db)
  const sec = await evaluateKernelSecurityContext(event)

  // Blocco immediato se violazione policy BEMYAGENT.md o rischio critico Sentinel
  if (sec.agentMode === 'blocked_policy') {
    await logSentinelSecurityEvent(db, {
      module: 'dkp-captcha',
      eventType: 'policy_blocked',
      severity: 'block',
      ipHash: sec.ipHash,
      agentMode: sec.agentMode,
      riskScore: sec.riskScore,
      details: { action, agentIdentifier: sec.agentIdentifier }
    })
    throw createError({
      statusCode: 403,
      statusMessage: 'Sentinel Network: richiesta bloccata dalla policy BEMYAGENT.md'
    })
  }

  // 1. GENERAZIONE SFIDA PURE SQL ADATTIVA
  if (action === 'challenge') {
    // Pulizia opportunistica challenge scadute
    await db.execute(sql`DELETE FROM dkp_captcha_challenges WHERE expires_at < NOW() - INTERVAL '10 minutes'`).catch(() => null)

    const difficulty = sec.riskScore >= 55 ? 3 : sec.riskScore >= 30 ? 2 : 1
    let question = ''
    let answer = 0

    if (difficulty === 1) {
      const a = randomInt(2, 13)
      const b = randomInt(2, 13)
      question = `${a} + ${b}`
      answer = a + b
    } else if (difficulty === 2) {
      const a = randomInt(10, 26)
      const b = randomInt(3, 15)
      question = `${a} + ${b}`
      answer = a + b
    } else {
      const a = randomInt(4, 12)
      const b = randomInt(2, 6)
      const c = randomInt(1, 10)
      question = `(${a} × ${b}) + ${c}`
      answer = a * b + c
    }

    const challengeId = randomUUID()
    const answerHash = sha256Hex(`${challengeId}:${String(answer)}`)

    await db.execute(sql`
      INSERT INTO dkp_captcha_challenges (
        id, answer_hash, difficulty, risk_score, agent_mode, ip_hash, expires_at
      ) VALUES (
        ${challengeId},
        ${answerHash},
        ${difficulty},
        ${sec.riskScore},
        ${sec.agentMode},
        ${sec.ipHash},
        NOW() + INTERVAL '5 minutes'
      )
    `)

    return {
      success: true,
      challengeId,
      question,
      difficulty,
      expiresInSec: 300,
      sentinel: {
        riskScore: sec.riskScore,
        agentMode: sec.agentMode,
        policyActive: sec.policyRulesLoaded
      }
    }
  }

  // 2. VERIFICA ATOMICA PURE SQL + EMISSIONE TOKEN FIRMATO
  if (action === 'verify') {
    const challengeId = String(body?.challengeId || '').trim()
    const userAnswer = String(body?.answer ?? '').trim()
    const honeypot = String(body?.hpTrap || '').trim()
    const solveMs = Number(body?.solveMs || 0)

    if (honeypot.length > 0) {
      await logSentinelSecurityEvent(db, {
        module: 'dkp-captcha',
        eventType: 'honeypot_triggered',
        severity: 'block',
        ipHash: sec.ipHash,
        agentMode: sec.agentMode,
        riskScore: 95
      })
      return { success: false, verified: false, error: 'Sentinel trap triggered.' }
    }

    if (!challengeId || !userAnswer || !/^-?\d+$/.test(userAnswer)) {
      return { success: false, verified: false, error: 'Parametri sfida non validi.' }
    }

    // Protezione anti-bot istantaneo per sessioni umane (< 450ms)
    if (sec.agentMode === 'human' && solveMs > 0 && solveMs < 450) {
      await logSentinelSecurityEvent(db, {
        module: 'dkp-captcha',
        eventType: 'inhuman_latency',
        severity: 'warn',
        ipHash: sec.ipHash,
        agentMode: sec.agentMode,
        riskScore: Math.max(sec.riskScore, 65),
        details: { solveMs }
      })
      return { success: false, verified: false, error: 'Verifica troppo rapida. Riprova.' }
    }

    const expectedHash = sha256Hex(`${challengeId}:${Number(userAnswer)}`)

    const verifyRes: any = await db.execute(sql`
      UPDATE dkp_captcha_challenges
      SET
        attempts = attempts + 1,
        consumed_at = CASE
          WHEN answer_hash = ${expectedHash}
           AND ip_hash = ${sec.ipHash}
           AND consumed_at IS NULL
           AND expires_at > NOW()
           AND attempts < 5
          THEN NOW()
          ELSE consumed_at
        END
      WHERE id = ${challengeId}
      RETURNING
        id,
        consumed_at AS "consumedAt",
        attempts,
        (expires_at <= NOW()) AS "isExpired"
    `)

    const row = (Array.isArray(verifyRes) ? verifyRes : (verifyRes?.rows || []))[0]
    if (!row) {
      return { success: false, verified: false, error: 'Sfida inesistente o scaduta.' }
    }

    if (row.isExpired) {
      return { success: false, verified: false, expired: true, error: 'Sfida scaduta. Generane una nuova.' }
    }

    if (!row.consumedAt) {
      await logSentinelSecurityEvent(db, {
        module: 'dkp-captcha',
        eventType: 'wrong_answer',
        severity: Number(row.attempts) >= 3 ? 'warn' : 'info',
        ipHash: sec.ipHash,
        agentMode: sec.agentMode,
        riskScore: sec.riskScore,
        details: { challengeId, attempts: row.attempts }
      })
      return {
        success: false,
        verified: false,
        attemptsLeft: Math.max(0, 5 - Number(row.attempts || 1)),
        error: 'Risposta errata. Riprova.'
      }
    }

    const issuedAt = Math.floor(Date.now() / 1000)
    const tokenPayload = `${challengeId}:${sec.ipHash.slice(0, 16)}:${issuedAt}`
    const captchaToken = `${tokenPayload}.${signKernelPayload(tokenPayload)}`

    return {
      success: true,
      verified: true,
      captchaToken,
      sentinel: {
        riskScore: sec.riskScore,
        agentMode: sec.agentMode
      }
    }
  }

  throw createError({ statusCode: 400, statusMessage: 'Azione CAPTCHA non supportata' })
})