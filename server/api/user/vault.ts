// server/api/user/vault.ts
import { createHash } from 'node:crypto'
import { defineEventHandler, readBody, getQuery, createError } from 'h3'
import { eq, desc, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { vaultCerts, users, xpTransactions } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = getDb()

  // 📥 GET: Recupera i certificati Vault dell'utente
  if (method === 'GET') {
    const query = getQuery(event)
    const userId = query.userId ? Number(query.userId) : 1

    try {
      const certs = await db.select()
        .from(vaultCerts)
        .where(eq(vaultCerts.userId, userId))
        .orderBy(desc(vaultCerts.createdAt))

      return { success: true, data: certs }
    } catch (err: any) {
      console.error('[VAULT GET ERROR]:', err)
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }

  // 📤 POST: Notarizza con SHA-256 reale, salva nel Vault e assegna +100 XP
  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { userId, title, code, sastStatus } = body

      if (!title || !code) {
        throw createError({ statusCode: 400, statusMessage: 'Titolo e codice sorgente obbligatori.' })
      }

      const targetUserId = userId ? Number(userId) : 1

      // 🔐 Generazione Hash SHA-256 reale e deterministico del codice sorgente
      const sha256 = createHash('sha256').update(String(code).trim()).digest('hex')

      const [newCert] = await db.insert(vaultCerts).values({
        userId: targetUserId,
        toolType: 'proof-of-code',
        title: title.trim(),
        hash: sha256,
        metadata: { 
          sastStatus: sastStatus || 'PASSED', 
          snippet: code.substring(0, 120),
          codeLength: String(code).length,
          engineVersion: 'DKP-Vault-v2.5-GOLD'
        }
      }).returning()

      // 🟢 AGGIUNTA XP AUTOMATICI PER LA NOTARIZZAZIONE (+100 XP)
      await db.update(users)
        .set({ xp: sql`COALESCE(xp, 0) + 100` })
        .where(eq(users.id, targetUserId))

      await db.insert(xpTransactions).values({
        userId: targetUserId,
        action: `Notarizzazione Vault: "${title.trim().substring(0, 30)}"`,
        points: 100
      })

      return { 
        success: true, 
        data: newCert, 
        message: 'Codice notarizzato nel Vault con Hash SHA-256 e +100 XP accreditati!' 
      }

    } catch (err: any) {
      console.error('[VAULT POST ERROR]:', err)
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }
})