// sdk/src/modules/sentinel.ts
import type { DKPClient } from '../client.js';

export interface SentinelFinding {
  id: string;
  cwe: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  line: number;
  snippet: string;
  remediation: string;
}

export interface ProofOfSafetyCertificate {
  certificateType: string;
  network: string;
  blockNumber: number;
  artifactSha256: string;
  reportSha256: string;
  vaultHash: string;
  merkleRoot: string;
  status: string;
  notarizedAt: string;
}

export interface SentinelScanRequest {
  code: string;
  language?: string;
  filename?: string;
  useAi?: boolean;
}

export interface SentinelScanResponse {
  success: boolean;
  engine: string;
  latencyMs: number;
  rateLimit: {
    tier: string;
    limit: number;
    remaining: number;
    resetAt: string;
  };
  audit: {
    filename: string;
    language: string;
    score: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    passed: boolean;
    summary: string;
    findings: SentinelFinding[];
    hardenedPatch: string;
  };
  vaultProof: ProofOfSafetyCertificate | null;
}

export interface SentinelContentAuditPayload {
  title?: string;
  content: string;
  contextType?: 'COMMENT' | 'POST' | 'CODE_SCAN';
  nodeSlug?: string;
}

export class SentinelModule {
  constructor(private client: DKPClient) {}

  async scan(payload: SentinelScanRequest): Promise<SentinelScanResponse> {
    return this.client.request<SentinelScanResponse>('/tools/sentinel-scan', {
      method: 'POST',
      body: JSON.stringify({
        code: payload.code,
        language: payload.language || 'typescript',
        filename: payload.filename || 'snippet.ts',
        useAi: payload.useAi !== false
      })
    });
  }

  async scanCode(payload: { source: string; language?: string; filename?: string }): Promise<SentinelScanResponse & { riskScore: number }> {
    const res = await this.scan({
      code: payload.source,
      language: payload.language,
      filename: payload.filename
    });
    return {
      ...res,
      riskScore: Math.max(0, 100 - (res.audit?.score ?? 100))
    };
  }

  async auditContent(payload: SentinelContentAuditPayload) {
    return this.client.request<any>('/ai/sentinel', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}