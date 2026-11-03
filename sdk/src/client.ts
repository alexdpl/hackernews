// sdk/src/client.ts
import { BlogModule } from './modules/blog.js';
import { VaultModule } from './modules/vault.js';
import { AIModule } from './modules/ai.js';
import { SentinelModule } from './modules/sentinel.js';

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

  constructor(config: DKPClientConfig) {
    if (!config.apiKey || !config.apiKey.startsWith('dkp_')) {
      throw new Error("[DKP SDK] Invalid or missing API Key. Must start with 'dkp_'");
    }

    this.config = {
      environment: config.environment || 'production',
      baseUrl: config.baseUrl || (config.environment === 'development' 
        ? 'http://localhost:3000/api' 
        : 'https://devkernelpulse.org/api'),
      apiKey: config.apiKey
    };

    // Inizializzazione moduli
    this.blog = new BlogModule(this);
    this.vault = new VaultModule(this);
    this.ai = new AIModule(this);
    this.sentinel = new SentinelModule(this);
  }

  // Metodo base per chiamate REST classiche
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...(options.headers || {})
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`[DKP API Error] ${response.status}: ${errorData.statusMessage || response.statusText}`);
    }
    
    return response.json() as Promise<T>;
  }

  // Metodo avanzato per lo streaming AI (AsyncGenerator)
  async requestStream(endpoint: string, options: RequestInit = {}): Promise<AsyncGenerator<{ text: string }, void, unknown>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...(options.headers || {})
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`[DKP Stream Error] ${response.status}: ${response.statusText}`);
    }
    
    if (!response.body) throw new Error('[DKP SDK] Streaming non supportato da questo endpoint.');

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