// server/api/translator/sync.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import {
  ensureKernelSecurityTables,
  evaluateKernelSecurityContext,
  logSentinelSecurityEvent,
  sha256Hex
} from '../../utils/kernelSecurityPolicy'

const ALLOWED_LANGS = new Set(['IT', 'EN', 'ES', 'FR', 'DE', 'JA', 'ZH', 'PT', 'PL'])

const LANG_NAMES: Record<string, string> = {
  IT: 'Italian',
  EN: 'English',
  ES: 'Spanish',
  FR: 'French',
  DE: 'German',
  JA: 'Japanese',
  ZH: 'Simplified Chinese',
  PT: 'Portuguese',
  PL: 'Polish'
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => ({}))) as Record<string, any>
  const targetLang = String(body?.targetLang || 'EN').toUpperCase().trim()
  const sourceLang = String(body?.sourceLang || 'AUTO').toUpperCase().trim()
  const rawText = String(body?.text || '').trim()

  if (!ALLOWED_LANGS.has(targetLang)) {
    throw createError({ statusCode: 400, statusMessage: 'Lingua di destinazione non supportata' })
  }

  if (!rawText) {
    return { success: true, translatedText: '', cached: true, provider: 'empty' }
  }

  if (rawText.length > 4000) {
    throw createError({ statusCode: 413, statusMessage: 'Testo superiore al limite di 4000 caratteri' })
  }

  const db = await getDb()
  const sec = await evaluateKernelSecurityContext(event)

  if (sec.agentMode === 'blocked_policy') {
    if (db) {
      await logSentinelSecurityEvent(db, {
        module: 'dkp-translator',
        eventType: 'policy_blocked',
        severity: 'block',
        ipHash: sec.ipHash,
        agentMode: sec.agentMode,
        riskScore: sec.riskScore
      })
    }
    throw createError({ statusCode: 403, statusMessage: 'Sentinel Network: accesso bloccato da BEMYAGENT.md' })
  }

  // Guardia anti-injection / XSS sul payload testuale
  if (/<script\b|javascript:|on\w+\s*=|ignore previous instructions/i.test(rawText)) {
    if (db) {
      await logSentinelSecurityEvent(db, {
        module: 'dkp-translator',
        eventType: 'malicious_payload_blocked',
        severity: 'block',
        ipHash: sec.ipHash,
        agentMode: sec.agentMode,
        riskScore: 92
      })
    }
    throw createError({ statusCode: 400, statusMessage: 'Payload non consentito da Sentinel Network' })
  }

  const sourceSha256 = sha256Hex(`${sourceLang}:${rawText}`)

  // 1. Lookup cache Pure SQL 2.6
  if (db) {
    await ensureKernelSecurityTables(db)
    const hitRes: any = await db.execute(sql`
      UPDATE dkp_translation_cache
      SET hit_count = hit_count + 1, last_accessed_at = NOW()
      WHERE source_sha256 = ${sourceSha256} AND target_lang = ${targetLang}
      RETURNING translated_text AS "translatedText", provider, hit_count AS "hitCount"
    `).catch(() => [])

    const hitRow = (Array.isArray(hitRes) ? hitRes : (hitRes?.rows || []))[0]
    if (hitRow?.translatedText) {
      return {
        success: true,
        translatedText: hitRow.translatedText,
        cached: true,
        provider: hitRow.provider,
        hitCount: Number(hitRow.hitCount || 1),
        sentinel: { riskScore: sec.riskScore, agentMode: sec.agentMode }
      }
    }
  }

  // 2. Traduzione neurale (se GEMINI_API_KEY presente) o fallback deterministico
  let translatedText = rawText
  let provider = 'dkp-pure-sql-passthrough'

  const geminiKey = (process.env.GEMINI_API_KEY || process.env.NUXT_GEMINI_API_KEY || '').trim()
  if (geminiKey) {
    try {
      const targetName = LANG_NAMES[targetLang] || targetLang
      const prompt = `Translate the following software engineering UI or technical forum text into ${targetName}. Preserve markdown, code blocks, URLs, and DKP technical terms (Pure SQL, Vault, Sentinel, Nodes). Output ONLY the translated text without quotes or explanations:\n\n${rawText}`
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
          })
        }
      )
      if (res.ok) {
        const json: any = await res.json()
        const candidate = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (candidate) {
          translatedText = candidate
          provider = 'gemini-2.0-flash+pure-sql'
        }
      }
    } catch {
      // Fallback silenzioso su passthrough
    }
  }

  // 3. Persistenza atomica nella cache Pure SQL 2.6
  if (db) {
    await db.execute(sql`
      INSERT INTO dkp_translation_cache (source_sha256, source_lang, target_lang, source_text, translated_text, provider)
      VALUES (${sourceSha256}, ${sourceLang}, ${targetLang}, ${rawText}, ${translatedText}, ${provider})
      ON CONFLICT (source_sha256, target_lang) DO UPDATE
      SET hit_count = dkp_translation_cache.hit_count + 1, last_accessed_at = NOW()
    `).catch(() => null)
  }

  return {
    success: true,
    translatedText,
    cached: false,
    provider,
    sentinel: { riskScore: sec.riskScore, agentMode: sec.agentMode }
  }
})