<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpHomeTelemetry from '~/components/DkpHomeTelemetry.vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

useDkpSeo({
  title: 'Sentinel Scan SAST & Proof of Safety Vault — DevKernelPulse Tools',
  description: 'Audit SAST e AI Security in tempo reale con certificazione crittografica SHA-256 Proof of Safety e API SaaS DKP_live.',
  type: 'website',
  canonicalPath: '/tools/sentinel-scan'
})

const selectedLang = ref('typescript')
const filename = ref('auth-gateway.ts')
const apiKeyInput = ref('')
const useAiAudit = ref(true)
const isScanning = ref(false)
const scanError = ref('')
const copiedCert = ref(false)
const copiedCurl = ref(false)

const codeInput = ref(`import { sql } from 'drizzle-orm'

export async function authenticatePartner(db: any, reqBody: any) {
  const apiToken = "dkp_live_9981273645abcdef12345678"
  const query = "SELECT * FROM users WHERE email = '" + reqBody.email + "'"
  console.log("Debug login payload:", reqBody)
  return await db.execute(sql.raw(query))
}`)

const scanResult = ref<any>(null)

const languages = [
  { id: 'typescript', label: 'TypeScript / Node.js', ext: 'ts' },
  { id: 'sql', label: 'PostgreSQL / Pure SQL', ext: 'sql' },
  { id: 'python', label: 'Python / FastAPI', ext: 'py' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
  { id: 'bash', label: 'Bash / CI Script', ext: 'sh' }
]

const loadCleanSample = () => {
  selectedLang.value = 'typescript'
  filename.value = 'vault-verifier.ts'
  codeInput.value = `import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'

export async function verifyPartnerArtifact(db: any, artifactId: number, payload: string) {
  const expectedSha256 = createHash('sha256').update(payload, 'utf8').digest('hex')
  const rows = await db.execute(sql\`
    SELECT id, vault_hash
    FROM dkp_vault_ledger
    WHERE entity_id = \${artifactId} AND vault_hash = \${expectedSha256}
    LIMIT 1
  \`)
  return { verified: Array.isArray(rows) ? rows.length > 0 : Boolean(rows?.rows?.length) }
}`
}

const runSentinelScan = async () => {
  if (!codeInput.value.trim()) {
    scanError.value = 'Inserisci uno snippet di codice da scansionare.'
    return
  }
  isScanning.value = true
  scanError.value = ''
  try {
    const headers: Record<string, string> = {}
    if (apiKeyInput.value.trim()) {
      headers.Authorization = `Bearer ${apiKeyInput.value.trim()}`
    }

    const res: any = await $fetch('/api/tools/sentinel-scan', {
      method: 'POST',
      headers,
      body: {
        code: codeInput.value,
        language: selectedLang.value,
        filename: filename.value,
        useAi: useAiAudit.value
      }
    })
    scanResult.value = res
  } catch (err: any) {
    scanError.value = err?.data?.message || err?.data?.statusMessage || err?.message || 'Errore durante la scansione Sentinel.'
  } finally {
    isScanning.value = false
  }
}

const scoreColorClass = computed(() => {
  const s = Number(scanResult.value?.audit?.score || 0)
  if (s >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
  if (s >= 60) return 'text-amber-300 border-amber-500/40 bg-amber-500/10'
  return 'text-rose-400 border-rose-500/40 bg-rose-500/10'
})

const curlSnippet = computed(() => {
  return `curl -X POST https://devkernelpulse.org/api/tools/sentinel-scan \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer DKP_live_YOUR_API_KEY" \\
  -d '{"language":"${selectedLang.value}","filename":"${filename.value}","code":"..."}'`
})

const copyText = async (text: string, target: 'cert' | 'curl') => {
  if (typeof navigator === 'undefined') return
  await navigator.clipboard.writeText(text).catch(() => {})
  if (target === 'cert') {
    copiedCert.value = true
    setTimeout(() => { copiedCert.value = false }, 2000)
  } else {
    copiedCurl.value = true
    setTimeout(() => { copiedCurl.value = false }, 2000)
  }
}
</script>

<template>
  <div class="bg-dkp-bg text-dkp-text font-display min-h-screen bg-grid-pattern relative">
    <DkpHomeTelemetry />

    <section class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <NuxtLink to="/tools" class="text-xs font-mono text-cyan-400 hover:text-cyan-300 no-underline font-bold">
          &larr; Torna a Developer Tools
        </NuxtLink>
        <span class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">
          SENTINEL SCAN SAAS &bull; PROOF OF SAFETY SHA-256
        </span>
      </div>

      <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white m-0 mb-3">
        Sentinel Scan <span class="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">SAST &amp; Vault Audit</span>
      </h1>
      <p class="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed m-0">
        Analisi statica CWE, rilevamento secret hardcoded, SQLi/XSS/SSRF e certificazione crittografica <strong>Proof of Safety</strong> notarizzata on-chain nel DKP Vault.
      </p>
    </section>

    <DkpLayout :hide-section-header="true" :show-sidebar-ads="true">
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <!-- COLONNA EDITOR & CONTROLLI -->
        <div class="xl:col-span-7 bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 sm:p-6 card-glow flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 font-mono text-xs">
            <div class="flex items-center gap-2 flex-wrap">
              <select
                v-model="selectedLang"
                class="bg-[#050914] border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-bold outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option v-for="l in languages" :key="l.id" :value="l.id">{{ l.label }}</option>
              </select>

              <input
                v-model="filename"
                type="text"
                placeholder="filename.ts"
                class="bg-[#050914] border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg outline-none focus:border-cyan-400 w-36 box-border"
              />
            </div>

            <button
              type="button"
              @click="loadCleanSample"
              class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold cursor-pointer"
            >
              Carica Snippet Sicuro
            </button>
          </div>

          <textarea
            v-model="codeInput"
            rows="14"
            spellcheck="false"
            placeholder="Incolla qui il codice da analizzare con Sentinel Scan..."
            class="w-full bg-[#050914] border border-slate-800 focus:border-cyan-500 rounded-xl p-4 font-mono text-xs text-slate-100 leading-relaxed outline-none box-border"
          ></textarea>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center font-mono text-xs">
            <div class="sm:col-span-7">
              <input
                v-model="apiKeyInput"
                type="password"
                placeholder="Opzionale: Bearer DKP_live_... (Tier PRO / Quota estesa)"
                class="w-full bg-[#050914] border border-slate-800 focus:border-purple-400 text-slate-200 px-3.5 py-2.5 rounded-xl outline-none box-border"
              />
            </div>
            <label class="sm:col-span-5 inline-flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input v-model="useAiAudit" type="checkbox" class="accent-emerald-500" />
              <span>Abilita Hybrid AI Deep Audit</span>
            </label>
          </div>

          <div v-if="scanError" class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-xs">
            {{ scanError }}
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span class="text-[11px] font-mono text-slate-400">
              Guest: 5 req/ora &bull; DKP_live PRO: 5.000 req/ora
            </span>
            <button
              type="button"
              :disabled="isScanning"
              @click="runSentinelScan"
              class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs border-none cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            >
              {{ isScanning ? 'Scansione SAST & Notarizzazione...' : 'Avvia Sentinel Scan + Proof of Safety' }}
            </button>
          </div>
        </div>

        <!-- COLONNA REPORT & VAULT PROOF OF SAFETY -->
        <div class="xl:col-span-5 flex flex-col gap-5">
          <div v-if="!scanResult" class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 card-glow font-mono text-xs text-slate-400 space-y-3">
            <div class="text-sm font-extrabold text-white">Pronto per l'ispezione SAST</div>
            <p class="m-0 leading-relaxed">
              Premi <strong>Avvia Sentinel Scan</strong> per eseguire l'analisi delle vulnerabilità CWE, verificare la quota API e generare un certificato SHA-256 <strong>Proof of Safety</strong> nel registro DKP Vault.
            </p>
          </div>

          <template v-else>
            <!-- SCORE & RATE LIMIT -->
            <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow flex flex-col gap-4 font-mono">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="text-[10px] text-slate-400 uppercase">SENTINEL SECURITY SCORE</div>
                  <div class="text-3xl font-black text-white mt-0.5">
                    {{ scanResult.audit.score }}<span class="text-base text-slate-400">/100</span>
                  </div>
                </div>
                <div :class="['px-4 py-2 rounded-xl border text-2xl font-black', scoreColorClass]">
                  {{ scanResult.audit.grade }}
                </div>
              </div>

              <p class="text-xs text-slate-200 font-sans leading-relaxed m-0">
                {{ scanResult.audit.summary }}
              </p>

              <div class="grid grid-cols-3 gap-2 text-[10px] pt-2 border-t border-slate-800">
                <div class="bg-[#050914] p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 block">TIER API</span>
                  <strong class="text-cyan-300">{{ scanResult.rateLimit?.tier }}</strong>
                </div>
                <div class="bg-[#050914] p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 block">RIMANENTI</span>
                  <strong class="text-emerald-300">{{ scanResult.rateLimit?.remaining }}/{{ scanResult.rateLimit?.limit }}</strong>
                </div>
                <div class="bg-[#050914] p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 block">LATENZA</span>
                  <strong class="text-purple-300">{{ scanResult.latencyMs }} ms</strong>
                </div>
              </div>
            </div>

            <!-- PROOF OF SAFETY CERTIFICATE -->
            <div v-if="scanResult.vaultProof" class="bg-[#041612] border border-emerald-500/45 rounded-2xl p-5 card-glow font-mono text-xs flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="text-emerald-300 font-black">PROOF OF SAFETY CERTIFICATE</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  BLOCK #{{ scanResult.vaultProof.blockNumber }}
                </span>
              </div>
              <div class="text-[11px] text-slate-300 break-all bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
                <span class="text-slate-500 block text-[9px]">VAULT SHA-256 HASH</span>
                {{ scanResult.vaultProof.vaultHash }}
              </div>
              <button
                type="button"
                @click="copyText(scanResult.vaultProof.vaultHash, 'cert')"
                class="self-start px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold cursor-pointer"
              >
                {{ copiedCert ? 'Hash Certificato Copiato!' : 'Copia Vault Hash SHA-256' }}
              </button>
            </div>

            <!-- FINDINGS CWE -->
            <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow flex flex-col gap-3">
              <h3 class="text-sm font-extrabold text-white m-0 font-mono">
                Segnalazioni SAST ({{ scanResult.audit.findings.length }})
              </h3>

              <div v-if="scanResult.audit.findings.length === 0" class="text-xs font-mono text-emerald-400">
                Nessuna vulnerabilità rilevata dalle regole CWE Sentinel.
              </div>

              <div
                v-for="item in scanResult.audit.findings"
                :key="item.id"
                class="bg-[#050914] border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1.5 text-xs"
              >
                <div class="flex items-center justify-between gap-2 font-mono">
                  <span class="font-bold text-white">{{ item.title }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-black',
                      item.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      item.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    ]"
                  >
                    {{ item.severity }} &bull; {{ item.cwe }} &bull; L{{ item.line }}
                  </span>
                </div>
                <code class="text-[11px] text-rose-300 bg-black/50 px-2 py-1 rounded overflow-x-auto block">{{ item.snippet }}</code>
                <p class="text-[11px] text-slate-300 m-0 leading-relaxed">{{ item.remediation }}</p>
              </div>
            </div>
          </template>

          <!-- INTEGRAZIONE API CI/CD -->
          <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow font-mono text-xs flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="text-cyan-300 font-bold">API SaaS CI/CD Endpoint</span>
              <button
                type="button"
                @click="copyText(curlSnippet, 'curl')"
                class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold cursor-pointer"
              >
                {{ copiedCurl ? 'Copiato!' : 'Copia cURL' }}
              </button>
            </div>
            <pre class="bg-[#050914] border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 overflow-x-auto m-0">{{ curlSnippet }}</pre>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <DkpRelatedBlogWidget />
        <DkpRelatedNodesWidget />
		
      </div>
	  <!-- 3. Circuito 2 (Orizzontale - 3 Libri / Approfondimenti dal Vault) -->
      <DkpAdStrip
        layout="horizontal"
        category-tag="DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT"
      />
    </DkpLayout>
  </div>
</template>