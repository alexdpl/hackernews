// server/api/admin/sentinel.get.ts
export default defineEventHandler(async () => {
  return {
    success: true,
    sentinelState: {
      status: 'ACTIVE_PROTECTION',
      autoDefendEnabled: true,
      globalThreatIndex: 12,
      blockedRequests24h: 1420,
      activeFirewallRules: 18,
      gcpArmorStatus: 'OPTIMAL',
      recentThreats: [
        {
          id: 'TH-9041',
          type: 'Prompt Injection Attempt',
          target: 'Pulse Nexus Chat',
          ip: '185.220.101.5',
          severity: 'CRITICAL',
          timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
        },
        {
          id: 'TH-8902',
          type: 'Crawler Rate-Limit Abuse',
          target: 'Public Feed API',
          ip: '45.142.120.18',
          severity: 'MEDIUM',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: 'TH-8721',
          type: 'XSS Payload Detection',
          target: 'Submit Story Form',
          ip: '194.26.29.112',
          severity: 'HIGH',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ]
    }
  }
})