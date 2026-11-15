// sdk/src/modules/vault.ts
import type { DKPClient } from '../client.js';

export interface NotarizePayload {
  entityType?: 'blog' | 'forum' | 'code' | 'snippet';
  entityId?: number | string;
  title: string;
  content?: string;
  code?: string;
  language?: string;
}

export interface VerifyPayload {
  entityType?: 'blog' | 'forum' | 'code';
  entityId?: number | string;
  slug?: string;
  hash?: string;
}

export class VaultModule {
  constructor(private client: DKPClient) {}

  async notarize(payload: NotarizePayload) {
    return this.client.request<any>(`/vault/notarize`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async verify(payload: VerifyPayload) {
    const query = new URLSearchParams();
    if (payload.entityType) query.append('entityType', payload.entityType);
    if (payload.entityId) query.append('entityId', String(payload.entityId));
    if (payload.slug) query.append('slug', payload.slug);
    if (payload.hash) query.append('hash', payload.hash);

    return this.client.request<any>(`/vault/verify?${query.toString()}`);
  }

  async getLedger(limit = 50) {
    return this.client.request<any>(`/vault/ledger?limit=${limit}`);
  }
}