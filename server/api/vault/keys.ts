// server/api/user/keys.ts
import { randomBytes } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const storage = useStorage('db:user:apikeys')
  const userId = 'alexdpl'
  const userStorageKey = `user:${userId}`

  if (method === 'GET') {
    const keys = await storage.getItem<any[]>(userStorageKey) || [
      {
        id: 'key-1',
        name: 'CLI Terminal Local SDK',
        prefix: 'dkp_live_98a...41b',
        createdAt: new Date().toISOString(),
        lastUsedAt: 'Oggi 14:20'
      }
    ]
    return { success: true, data: keys }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    if (!body?.name) {
      throw createError({ statusCode: 400, statusMessage: 'Inserisci un nome identificativo per la chiave API.' })
    }

    // Genera token crittografico live: dkp_live_<hex32>
    const rawSecret = randomBytes(20).toString('hex')
    const fullToken = `dkp_live_${rawSecret}`
    const maskedPrefix = `${fullToken.substring(0, 12)}...${fullToken.substring(fullToken.length - 4)}`

    const currentKeys = await storage.getItem<any[]>(userStorageKey) || []
    const newKeyRecord = {
      id: `key-${Date.now()}`,
      name: body.name.trim(),
      prefix: maskedPrefix,
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Mai'
    }

    currentKeys.push(newKeyRecord)
    await storage.setItem(userStorageKey, currentKeys)

    // Restituisce il secret token COMPLETO solo una volta al client
    return {
      success: true,
      keyRecord: newKeyRecord,
      rawToken: fullToken
    }
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id as string
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID chiave mancante.' })

    let currentKeys = await storage.getItem<any[]>(userStorageKey) || []
    currentKeys = currentKeys.filter(k => k.id !== id)
    await storage.setItem(userStorageKey, currentKeys)

    return { success: true, revokedId: id }
  }
})