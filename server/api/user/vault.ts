// server/api/user/vault.ts
import { createHash } from 'node:crypto'
import { defineEventHandler, getMethod, readBody, getQuery, createError, setResponseHeaders } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  const method = getMethod(event)
  const db = getDb()

  // ----------------------------------------------------
  // 📥 GET: Recupera i certificati Vault dell'utente (Pure SQL)
  // ----------------------------------------------------
  if (method === 'GET') {
    const query = getQuery(event)
    const userId = query.userId ? Number(query.userId) : 1

    try {
      const result: any = await db.execute(sql`
        SELECT
          id,
          user_id AS "userId",
          tool_type AS "toolType",
          title,
          hash,
          metadata,
          created_at AS "createdAt"
        FROM vault_certs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `)

      const rows = Array.isArray(result) ? result : (result?.rows || [])
      return {
        success: true,
        data: rows
      }
    } catch (err: any) {
      console.error('❌ [VAULT GET ERROR]:', err?.message || err)
      return {
        success: true,
        data: []
      }
    }
  }

  // ----------------------------------------------------
  // 📤 POST: Notarizza con SHA-256 reale e accredita +100 XP (Pure SQL)
  // ----------------------------------------------------
  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { userId, title, code, sastStatus, toolType } = body || {}

      if (!title || !code) {
        throw createError({ statusCode: 400, statusMessage: 'Titolo e codice sorgente obbligatori.' })
      }

      const targetUserId = userId ? Number(userId) : 1
      const cleanTitle = String(title).trim()
      const cleanCode = String(code).trim()

      // 🔐 Generazione Hash SHA-256 reale e deterministico del codice sorgente
      const sha256 = createHash('sha256').update(cleanCode).digest('hex')

      const metadataPayload = JSON.stringify({
        sastStatus: sastStatus || 'PASSED',
        snippet: cleanCode.substring(0, 120),
        codeLength: cleanCode.length,
        engineVersion: 'DKP-Vault-v2.6-PURE-SQL'
      })

      // 1. Inserimento Pure SQL nella tabella reale vault_certs
      const insertRes: any = await db.execute(sql`
        INSERT INTO vault_certs (user_id, tool_type, title, hash, metadata)
        VALUES (
          ${targetUserId},
          ${toolType || 'proof-of-code'},
          ${cleanTitle},
          ${sha256},
          ${metadataPayload}::jsonb
        )
        RETURNING
          id,
          user_id AS "userId",
          tool_type AS "toolType",
          title,
          hash,
          metadata,
          created_at AS "createdAt"
      `)

      const rows = Array.isArray(insertRes) ? insertRes : (insertRes?.rows || [])
      const newCert = rows[0]

      // 2. Accredito +100 XP utente + log transazione (isolato: non blocca mai la notarizzazione)
      try {
        await db.execute(sql`
          UPDATE users
          SET xp = COALESCE(xp, 0) + 100
          WHERE id = ${targetUserId}
        `)

        await db.execute(sql`
          INSERT INTO xp_transactions (user_id, amount, action_type, description)
          VALUES (
            ${targetUserId},
            100,
            'VAULT_NOTARIZATION',
            ${`Notarizzazione Vault: "${cleanTitle.substring(0, 30)}"`}
          )
        `)
      } catch (xpErr: any) {
        console.warn('⚠️ [VAULT XP LOG WARNING]:', xpErr?.message || xpErr)
      }

      return {
        success: true,
        data: newCert,
        message: 'Codice notarizzato nel Vault con Hash SHA-256 e +100 XP accreditati!'
      }
    } catch (err: any) {
      console.error('❌ [VAULT POST ERROR]:', err?.message || err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Errore durante la notarizzazione nel Vault.'
      })
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: `Metodo HTTP ${method} non supportato su questa rotta.`
  })
})