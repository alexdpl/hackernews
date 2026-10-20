// server/api/v1/data.get.ts
export default defineEventHandler(async (event) => {
  // Il middleware ha già autenticato la richiesta e iniettato le info nel contesto
  const apiKeyInfo = event.context.apiKey

  return {
    success: true,
    message: 'Accesso autorizzato alle API commerciali DevKernelPulse v2.5-GOLD',
    clientContext: {
      keyId: apiKeyInfo.id,
      keyName: apiKeyInfo.name,
      roleTier: apiKeyInfo.role,
      requestsUsed: apiKeyInfo.usageCount,
      requestsMax: apiKeyInfo.maxQuota
    },
    data: {
      status: 'OPERATIONAL',
      service: 'DKP Commercial Suite v1',
      timestamp: new Date().toISOString()
    }
  }
})