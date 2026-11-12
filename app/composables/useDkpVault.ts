// app/composables/useDkpVault.ts
import { useState } from '#imports'

export interface PocCertificate {
  id: string | number
  repo: string
  hash: string
  badge?: string
  karmaScore?: number
  karma_score?: number
  createdAt?: string
  created_at?: string
}

export interface AuditReport {
  id: string | number
  targetFile?: string
  target_file?: string
  score: number
  summary?: string
  createdAt?: string
  created_at?: string
}

export interface VaultSnippet {
  id: string
  name: string
  code: string
  language?: string
  source?: string
  createdAt?: string
  created_at?: string
}

export function useDkpVault() {
  const pocList = useState<PocCertificate[]>('dkp_vault_poc', () => [])
  const auditList = useState<AuditReport[]>('dkp_vault_audits', () => [])
  const snippetList = useState<VaultSnippet[]>('dkp_vault_snippets', () => [])
  const loading = useState<boolean>('dkp_vault_loading', () => false)
  const error = useState<string | null>('dkp_vault_error', () => null)

  function notifyXpUpdate() {
    if (import.meta.client && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dkp:xp_updated'))
    }
  }

  async function fetchVaultData() {
    loading.value = true
    error.value = null

    try {
      const [pocResult, auditResult, snipResult] = await Promise.allSettled([
        $fetch<{ data?: PocCertificate[] }>('/api/vault/poc'),
        $fetch<{ data?: AuditReport[] }>('/api/vault/audits'),
        $fetch<{ data?: VaultSnippet[] }>('/api/vault/snippets')
      ])

      if (pocResult.status === 'fulfilled') {
        pocList.value = pocResult.value?.data || []
      }
      if (auditResult.status === 'fulfilled') {
        auditList.value = auditResult.value?.data || []
      }
      if (snipResult.status === 'fulfilled') {
        snippetList.value = snipResult.value?.data || []
      }

      if (
        pocResult.status === 'rejected' &&
        auditResult.status === 'rejected' &&
        snipResult.status === 'rejected'
      ) {
        error.value = 'Impossibile sincronizzare il DKP Vault Pure SQL.'
      }
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Errore caricamento DKP Vault.'
      console.error('Errore durante il caricamento del DKP Vault:', err)
    } finally {
      loading.value = false
    }
  }

  async function savePocCertificate(repo: string, hash: string, badge?: string, karmaScore?: number) {
    const res: any = await $fetch('/api/vault/poc', {
      method: 'POST',
      body: { repo, hash, badge, karmaScore }
    })
    if (res?.success && res?.cert) {
      pocList.value = [res.cert, ...pocList.value]
      notifyXpUpdate()
    }
    return res
  }

  async function saveAuditReport(targetFile: string, score: number, summary?: string) {
    const res: any = await $fetch('/api/vault/audits', {
      method: 'POST',
      body: { targetFile, score, summary }
    })
    if (res?.success && res?.audit) {
      auditList.value = [res.audit, ...auditList.value]
      notifyXpUpdate()
    }
    return res
  }

  async function saveSnippet(name: string, code: string, language?: string, source?: string) {
    const res: any = await $fetch('/api/vault/snippets', {
      method: 'POST',
      body: { name, code, language, source }
    })
    if (res?.success && res?.snippet) {
      snippetList.value = [res.snippet, ...snippetList.value]
      notifyXpUpdate()
    }
    return res
  }

  async function deleteSnippet(id: string) {
    await $fetch('/api/vault/snippets', {
      method: 'DELETE',
      query: { id }
    })
    snippetList.value = snippetList.value.filter(s => String(s.id) !== String(id))
  }

  return {
    pocList,
    auditList,
    snippetList,
    loading,
    error,
    fetchVaultData,
    savePocCertificate,
    saveAuditReport,
    saveSnippet,
    deleteSnippet
  }
}