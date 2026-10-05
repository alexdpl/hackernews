// server/api/public/metrics.ts
export default defineEventHandler((event) => {
  return {
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    nitroEngine: 'v2.x Active',
    activeSubdomains: [
      'devkernelpulse.org',
      'api.devkernelpulse.org',
      'mail.devkernelpulse.org'
    ]
  }
})