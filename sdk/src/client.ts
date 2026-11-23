// sdk/src/client.ts
import { BlogModule } from './modules/blog.js';
import { VaultModule } from './modules/vault.js';
import { AIModule } from './modules/ai.js';
import { SentinelModule } from './modules/sentinel.js';
import { OpenUIModule } from './modules/openui.js';

export interface DKPClientConfig {
  apiKey: string;
  environment?: 'development' | 'production';
  baseUrl?: string;
}

export class DKPClient {
  public config: DKPClientConfig;
  public blog: BlogModule;
  public vault: VaultModule;
  public ai: AIModule;
  public sentinel: SentinelModule;
  public openui: OpenUIModule;

  constructor(config: DKPClientConfig) {
    const cleanKey = String(config?.apiKey || '').trim();
    if (!cleanKey || !cleanKey.toLowerCase().startsWith('dkp_')) {
      throw new Error("[DKP SDK] Invalid or missing API Key. Must start with 'DKP_live_' or 'dkp_live_'");
    }

    this.config = {
      environment: config.environment || 'production',
      baseUrl: config.baseUrl || (config.environment === 'development'
        ? 'http://localhost:3000/api'
        : 'https://devkernelpulse.org/api'),
      apiKey: cleanKey
    };

    this.blog = new BlogModule(this);
    this.vault = new VaultModule(this);
    this.ai = new AIModule(this);
    this.sentinel = new SentinelModule(this);
    this.openui = new OpenUIModule(this);
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.config.baseUrl + endpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.config.apiKey,
      ...((options.headers as Record<string, string>) || {})
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({}));
      const msg = errorData.message || errorData.statusMessage || response.statusText;
      throw new Error('[DKP API Error] ' + response.status + ': ' + msg);
    }

    return response.json() as Promise<T>;
  }

  async requestStream(endpoint: string, options: RequestInit = {}): Promise<AsyncGenerator<{ text: string }, void, unknown>> {
    const url = this.config.baseUrl + endpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.config.apiKey,
      ...((options.headers as Record<string, string>) || {})
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new Error('[DKP Stream Error] ' + response.status + ': ' + response.statusText);
    }

    if (!response.body) {
      throw new Error('[DKP SDK] Streaming non supportato da questo endpoint.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return (async function* () {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        yield { text: chunk };
      }
    })();
  }
}