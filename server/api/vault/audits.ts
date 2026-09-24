// server/api/vault/audits.ts
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const storage = useStorage('db:vault:audits')
  const userId = 'alexdpl'
  const userStorageKey = `user:${userId}`

  if (method === 'GET') {
    const existing = await storage.getItem<any[]>(userStorageKey) || [
      {
        id: 'audit-001',
        targetFile: 'server/api/auth.ts',
        score: 98,
        status: 'SECURE',
        issuesFound: 0,
        summary: 'Audit superato. Nessuna vulnerabilità SQLi/XSS riscontrata.',
        createdAt: new Date().toISOString()
      }
    ]
    return { success: true, data: existing }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    if (!body?.targetFile || body?.score === undefined) {
      throw createError({ statusCode: 400, statusMessage: 'Parametri report audit mancanti.' })
    }

    const currentList = await storage.getItem<any[]>(userStorageKey) || []
    const newAudit = {
      id: `audit-${Date.now()}`,
      targetFile: body.targetFile,
      score: body.score,
      status: body.score >= 90 ? 'SECURE' : body.score >= 70 ? 'WARNING' : 'CRITICAL',
      issuesFound: body.issuesFound || 0,
      summary: body.summary || 'Audit registrato da AI Code Scanner v2.',
      createdAt: new Date().toISOString()
    }

    currentList.unshift(newAudit)
    await storage.setItem(userStorageKey, currentList)

    return { success: true, audit: newAudit }
  }
})