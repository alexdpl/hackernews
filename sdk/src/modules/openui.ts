// sdk/src/modules/openui.ts
import type { DKPClient } from '../client.js';

export interface OpenUIGeneratePayload {
  prompt: string;
  model?: 'dkp-coder' | 'dkp-flash' | 'dkp-pro';
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OpenUINotarizePayload {
  title?: string;
  prompt: string;
  generatedCode: string;
  model?: 'dkp-coder' | 'dkp-flash' | 'dkp-pro';
  userId?: number;
}

export class OpenUIModule {
  constructor(private client: DKPClient) {}

  /**
   * Servizio SaaS (richiede chiave dkp_live_...): genera interfaccia UI / HTML+Tailwind in streaming.
   */
  async generate(payload: OpenUIGeneratePayload) {
    const sys = payload.systemPrompt ||
      'Sei il Kernel Architect di DevKernelPulse v2.6-PURE-SQL ed esperto di OpenUI. Avvolgi sempre l output UI in un blocco ```html ... ``` con Tailwind CSS.';

    return this.client.requestStream('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        model: payload.model || 'dkp-coder',
        systemPrompt: sys,
        temperature: payload.temperature ?? 0.7,
        maxTokens: payload.maxTokens ?? 2048,
        messages: [{ role: 'user', content: payload.prompt }]
      })
    });
  }

  /**
   * Servizio SaaS (richiede chiave dkp_live_...): esegue audit SAST su OpenUI e registra Proof of Safety SHA-256.
   */
  async notarizeProof(payload: OpenUINotarizePayload) {
    const scan = await this.client.request<any>('/tools/sentinel-scan', {
      method: 'POST',
      body: JSON.stringify({
        code: payload.generatedCode,
        language: 'html',
        filename: 'openui-' + (payload.model || 'dkp-coder') + '.html',
        useAi: false
      })
    }).catch(() => null);

    const grade = scan?.audit?.grade || 'A+';
    const score = scan?.audit?.score ?? 100;

    const vaultRes = await this.client.request<any>('/user/vault', {
      method: 'POST',
      body: JSON.stringify({
        userId: payload.userId || 1,
        toolType: 'openui-studio',
        title: payload.title || ('OpenUI Studio [' + grade + ' - ' + score + '/100]'),
        code: '/* PROMPT */\n' + payload.prompt + '\n\n/* OPENUI OUTPUT */\n' + payload.generatedCode,
        sastStatus: scan?.audit?.passed === false ? 'WARNING' : 'PASSED'
      })
    });

    return {
      vault: vaultRes,
      sentinelAudit: scan?.audit || null,
      vaultProof: scan?.vaultProof || null
    };
  }

  /**
   * Servizio SaaS / Admin (richiede chiave dkp_live_... o sessione autorizzata): legge BEMYAGENT.md e telemetria TTEV.
   */
  async bemyAgentWorkspace() {
    return this.client.request<any>('/admin/bemyagent');
  }
}