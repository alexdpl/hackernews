// sdk/src/modules/ai.ts
import type { DKPClient } from '../client.js';

export interface ChatPayload {
  model: 'dkp-coder' | 'dkp-flash' | 'dkp-pro';
  messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>;
}

export class AIModule {
  constructor(private client: DKPClient) {}

  async chat(payload: ChatPayload) {
    // Usa il RequestStream per generare i chunk
    return this.client.requestStream(`/ai/chat`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}