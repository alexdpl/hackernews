// server/api/public/health.ts
export default defineEventHandler((event) => {
  return {
    status: 'HEALTHY',
    service: 'DevKernelPulse Gateway',
    version: 'v2.4-GOLD',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'production',
    sentinelAI: 'ACTIVE'
  }
})