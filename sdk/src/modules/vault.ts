// sdk/src/modules/vault.ts
import type { DKPClient } from '../client.js';

export class VaultModule {
  constructor(private client: DKPClient) {}

  async notarize(payload: { title: string; content?: string; code?: string; language?: string }) {
    return this.client.request<any>(`/vault/notarize`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}