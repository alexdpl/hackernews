// server/api/vault/snippets.ts
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const storage = useStorage('db:vault:snippets')
  const userId = 'alexdpl'
  const userStorageKey = `user:${userId}`

  if (method === 'GET') {
    const existing = await storage.getItem<any[]>(userStorageKey) || [
      {
        id: 'snip-101',
        name: 'DKP Auth Interceptor',
        language: 'TypeScript',
        code: 'export default defineNuxtRouteMiddleware((to) => { ... })',
        source: 'Terminal Shell',
        createdAt: new Date().toISOString()
      }
    ]
    return { success: true, data: existing }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    if (!body?.name || !body?.code) {
      throw createError({ statusCode: 400, statusMessage: 'Snippet non valido.' })
    }

    const currentList = await storage.getItem<any[]>(userStorageKey) || []
    const newSnippet = {
      id: `snip-${Date.now()}`,
      name: body.name,
      language: body.language || 'Plain Text',
      code: body.code,
      source: body.source || 'Neural Playground',
      createdAt: new Date().toISOString()
    }

    currentList.unshift(newSnippet)
    await storage.setItem(userStorageKey, currentList)

    return { success: true, snippet: newSnippet }
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id as string
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID snippet mancante.' })

    let currentList = await storage.getItem<any[]>(userStorageKey) || []
    currentList = currentList.filter(s => s.id !== id)
    await storage.setItem(userStorageKey, currentList)

    return { success: true, deletedId: id }
  }
})