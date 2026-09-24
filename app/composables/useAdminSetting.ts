// app/composables/useAdminSettings.ts
import { useState } from '#imports'

export interface AdminSettings {
  siteTitle: string
  maintenanceMode: boolean
  enableBlog: boolean
  enableJobs: boolean
  enableShop: boolean
  
  // Metodi di Pagamento & Gateway Shop
  enableStripe: boolean
  stripePublicKey: string
  enablePayPal: boolean
  paypalClientId: string
  enableCreditCard: boolean
  
  // Chiavi Terze Parti & Banner
  githubClientKey: string
  announcementBanner: string
}

export function useAdminSettings() {
  const settings = useState<AdminSettings>('dkp_admin_settings', () => ({
    siteTitle: 'DevKernelPulse Ecosystem',
    maintenanceMode: false,
    enableBlog: true,
    enableJobs: true,
    enableShop: false,
    
    // Configurazione Pagamenti Predefinita
    enableStripe: true,
    stripePublicKey: 'pk_live_dkp_secure_prod_99x',
    enablePayPal: true,
    paypalClientId: 'client_id_paypal_dkp_prod',
    enableCreditCard: true,
    
    // Terze parti & Annunci
    githubClientKey: 'ghp_dkp_kernel_auth_token_v2',
    announcementBanner: '🚀 DKP v3.0 Online: Esplora il nuovo Admin Command Center e Proof of Code!'
  }))

  const fetchSettings = async () => {
    try {
      const data = await $fetch('/api/admin/settings')
      if (data) {
        settings.value = { ...settings.value, ...(data as any) }
      }
    } catch (e) {
      console.error('Errore nel recupero delle impostazioni admin:', e)
    }
  }

  const updateSettings = async (newSettings: Partial<AdminSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    try {
      const res = await $fetch('/api/admin/settings', {
        method: 'POST',
        body: settings.value
      })
      if (res) {
        settings.value = { ...settings.value, ...(res as any) }
      }
      return true
    } catch (e) {
      console.error('Errore nel salvataggio delle impostazioni admin:', e)
      return false
    }
  }

  return {
    settings,
    fetchSettings,
    updateSettings
  }
}