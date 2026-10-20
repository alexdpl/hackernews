// server/api/admin/whitelist.ts
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { ipWhitelist } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = getDb()

  if (method === 'GET') {
    const list = await db.select().from(ipWhitelist).orderBy(desc(ipWhitelist.createdAt))
    return { success: true, data: list }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { ip, description } = body

    if (!ip) {
      setResponseStatus(event, 400)
      return { success: false, message: 'Indirizzo IP obbligatorio.' }
    }

    const inserted = await db.insert(ipWhitelist).values({
      ip: ip.trim(),
      description: description || 'Sviluppatore / CI-CD Fidato',
      addedBy: 'Admin'
    }).returning()

    return { success: true, message: `IP ${ip} aggiunto alla Whitelist.`, data: inserted[0] }
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)

    await db.delete(ipWhitelist).where(eq(ipWhitelist.id, id))
    return { success: true, message: 'IP rimosso dalla Whitelist.' }
  }
})