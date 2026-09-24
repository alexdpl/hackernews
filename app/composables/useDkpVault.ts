// app/composables/useDkpVault.ts
import { ref } from 'vue'

export function useDkpVault() {
  const pocList = ref<any[]>([])
  const auditList = ref<any[]>([])
  const snippetList = ref<any[]>([])
  const loading = ref(false)

  async function fetchVaultData() {
    loading.value = true
    try {
      const [pocRes, auditRes, snipRes]: any[] = await Promise.all([
        $fetch('/api/vault/poc'),
        $fetch('/api/vault/audits'),
        $fetch('/api/vault/snippets')
      ])

      pocList.value = pocRes.data || []
      auditList.value = auditRes.data || []
      snippetList.value = snipRes.data || []
    } catch (err) {
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
    if (res.success) {
      pocList.value.unshift(res.cert)
    }
    return res
  }

  async function saveAuditReport(targetFile: string, score: number, summary?: string) {
    const res: any = await $fetch('/api/vault/audits', {
      method: 'POST',
      body: { targetFile, score, summary }
    })
    if (res.success) {
      auditList.value.unshift(res.audit)
    }
    return res
  }

  async function saveSnippet(name: string, code: string, language?: string, source?: string) {
    const res: any = await $fetch('/api/vault/snippets', {
      method: 'POST',
      body: { name, code, language, source }
    })
    if (res.success) {
      snippetList.value.unshift(res.snippet)
    }
    return res
  }

  async function deleteSnippet(id: string) {
    await $fetch('/api/vault/snippets', {
      method: 'DELETE',
      query: { id }
    })
    snippetList.value = snippetList.value.filter(s => s.id !== id)
  }

  return {
    pocList,
    auditList,
    snippetList,
    loading,
    fetchVaultData,
    savePocCertificate,
    saveAuditReport,
    saveSnippet,
    deleteSnippet
  }
}