// server/api/vault/poc.ts
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const storage = useStorage('db:vault:poc')

  // Mock ID dell'utente dalla sessione (es. 'alexdpl')
  const userId = 'alexdpl'
  const userStorageKey = `user:${userId}`

  if (method === 'GET') {
    const existing = await storage.getItem<any[]>(userStorageKey) || [
      {
        id: 'poc-98421',
        repo: 'alexdpl/devkernel-pulse',
        hash: '0x8f3a921bc4e21a0984f112b329',
        badge: '🌱 Script Kiddie',
        karmaScore: 120,
        createdAt: new Date().toISOString()
      }
    ]
    return { success: true, data: existing }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    if (!body?.repo || !body?.hash) {
      throw createError({ statusCode: 400, statusMessage: 'Parametri incompleti per il salvataggio PoC.' })
    }

    const currentList = await storage.getItem<any[]>(userStorageKey) || []
    const newCert = {
      id: `poc-${Date.now()}`,
      repo: body.repo,
      hash: body.hash,
      badge: body.badge || '🌱 Developer',
      karmaScore: body.karmaScore || 0,
      createdAt: new Date().toISOString()
    }

    currentList.unshift(newCert)
    await storage.setItem(userStorageKey, currentList)

    return { success: true, cert: newCert }
  }
})