TypeScript
// app/composables/useAdminSettings.ts
import { useState } from '#imports'

export interface AdminSettings {
  siteTitle: string
  maintenanceMode: boolean
  enableBlog: boolean
  enableJobs: boolean
  enableShop: boolean
  stripePublicKey: string
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
    stripePublicKey: 'pk_live_dkp_secure_prod_99x',
    githubClientKey: 'ghp_dkp_kernel_auth_token_v2',
    announcementBanner: '🚀 DKP v3.0 Online: Esplora il nuovo Admin Command Center e Proof of Code!'
  }))

  function updateSettings(newSettings: Partial<AdminSettings>) {
    settings.value = { ...settings.value, ...newSettings }
  }

  return {
    settings,
    updateSettings
  }
}