// app/composables/useAdminSettings.ts
import { useState } from '#imports'

export interface AdminSettings {
  siteTitle: string
  maintenanceMode: boolean

  // Feature Flags Ecosistema DKP v2.6-PURE-SQL
  enableBlog: boolean
  enableNodes: boolean
  enableJobs: boolean
  enableShop: boolean
  enableBounties: boolean
  enableOpenUIStudio: boolean
  enableSentinelAI: boolean

  // Metodi di Pagamento & Gateway Shop (Popolati solo da API Admin protetta)
  enableStripe: boolean
  stripePublicKey: string
  enablePayPal: boolean
  paypalClientId: string
  enableCreditCard: boolean

  // Configurazione & Banner
  githubOrgRepo: string
  announcementBanner: string
}

export function useAdminSettings() {
  const settings = useState<AdminSettings>('dkp_admin_settings_v26', () => ({
    siteTitle: 'DevKernelPulse v2.6-PURE-SQL',
    maintenanceMode: false,

    // Feature Flags Predefiniti
    enableBlog: true,
    enableNodes: true,
    enableJobs: true,
    enableShop: true,
    enableBounties: true,
    enableOpenUIStudio: true,
    enableSentinelAI: true,

    // Gateway Pagamenti (mai hardcodare chiavi o token nel client)
    enableStripe: true,
    stripePublicKey: '',
    enablePayPal: true,
    paypalClientId: '',
    enableCreditCard: true,

    // Ecosistema & Annunci
    githubOrgRepo: 'alexdpl/hackernews',
    announcementBanner: '🚀 DKP v2.6-PURE-SQL Online: Esplora OpenUI Studio AI, Node Talks Hub e Proof of Code Vault!'
  }))

  const loading = useState<boolean>('dkp_admin_settings_loading', () => false)
  const saving = useState<boolean>('dkp_admin_settings_saving', () => false)

  const fetchSettings = async () => {
    loading.value = true
    try {
      const res: any = await $fetch('/api/admin/settings')
      const payload = res?.data ?? res
      if (payload && typeof payload === 'object') {
        settings.value = { ...settings.value, ...payload }
      }
    } catch (e) {
      console.error('[DKP Admin Settings] Errore nel recupero delle impostazioni:', e)
    } finally {
      loading.value = false
    }
  }

  const updateSettings = async (newSettings: Partial<AdminSettings>): Promise<boolean> => {
    const previousState = { ...settings.value }
    settings.value = { ...settings.value, ...newSettings }
    saving.value = true

    try {
      const res: any = await $fetch('/api/admin/settings', {
        method: 'POST',
        body: settings.value
      })
      const payload = res?.data ?? res
      if (payload && typeof payload === 'object') {
        settings.value = { ...settings.value, ...payload }
      }
      return true
    } catch (e) {
      // Rollback ottimistico in caso di errore API
      settings.value = previousState
      console.error('[DKP Admin Settings] Errore nel salvataggio delle impostazioni:', e)
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    settings,
    loading,
    saving,
    fetchSettings,
    updateSettings
  }
}