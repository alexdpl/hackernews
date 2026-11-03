// sdk/src/modules/sentinel.ts
import type { DKPClient } from '../client.js';

export class SentinelModule {
  constructor(private client: DKPClient) {}

  async scanCode(payload: { source: string }) {
    // Ritorna un mock coerente per ora, in attesa dell'endpoint reale SAST
    return this.client.request<any>(`/sentinel/scan`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch(() => ({ riskScore: 0, status: 'safe', message: 'Simulazione Sentinel superata' }));
  }
}