// sdk/src/index.ts
export { DKPClient, type DKPClientConfig } from './client.js';
export { BlogModule, type CreateBlogPostPayload } from './modules/blog.js';
export { VaultModule, type NotarizePayload, type VerifyPayload } from './modules/vault.js';
export { AIModule, type ChatPayload } from './modules/ai.js';
export {
  SentinelModule,
  type SentinelFinding,
  type ProofOfSafetyCertificate,
  type SentinelScanRequest,
  type SentinelScanResponse,
  type SentinelContentAuditPayload
} from './modules/sentinel.js';
export {
  OpenUIModule,
  type OpenUIGeneratePayload,
  type OpenUINotarizePayload
} from './modules/openui.js';