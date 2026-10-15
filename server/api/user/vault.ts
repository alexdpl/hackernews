// server/api/user/vault.ts
import { defineEventHandler, readBody, getQuery, createError } from 'h3'
import { eq, desc, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { vaultCerts, users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = await getDb()

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

  // 📤 POST: Notarizza, salva nel Vault e assegna XP (+100 XP)
  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { userId, title, code, sastStatus } = body

      if (!title || !code) {
        throw createError({ statusCode: 400, statusMessage: 'Titolo e codice sorgente obbligatori.' })
      }

      const targetUserId = userId ? Number(userId) : 1
      const hash = 'dkp_vlt_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const [newCert] = await db.insert(vaultCerts).values({
        userId: targetUserId,
        toolType: 'proof-of-code',
        title: title.trim(),
        hash,
        metadata: { 
          sastStatus: sastStatus || 'PASSED', 
          snippet: code.substring(0, 120) 
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
        message: 'Codice notarizzato nel Vault e +100 XP accreditati!' 
      }

    } catch (err: any) {
      console.error('[VAULT POST ERROR]:', err)
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }
})