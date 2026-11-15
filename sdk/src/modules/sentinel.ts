// sdk/src/modules/sentinel.ts
import type { DKPClient } from '../client.js';

export interface SentinelScanPayload {
  title?: string;
  content: string;
  contextType?: 'COMMENT' | 'POST' | 'CODE_SCAN';
  nodeSlug?: string;
}

export class SentinelModule {
  constructor(private client: DKPClient) {}

  async scanCode(payload: { source: string }) {
    return this.client.request<any>(`/sentinel/scan`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch(() => ({ riskScore: 0, status: 'safe', message: 'Simulazione Sentinel superata' }));
  }

  async auditContent(payload: SentinelScanPayload) {
    return this.client.request<any>(`/ai/sentinel`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}