// app/composables/useShop.ts
import { useState, computed } from '#imports'

export type ShopCategory = 'api_pass' | 'vault_pro' | 'sponsored_ads'
export type BillingCycleType = 'monthly' | 'one_time'
export type AdCampaignModel = 'IMPRESSIONS' | 'CLICKS' | 'HYBRID'

export interface ShopProduct {
  id: string
  category: ShopCategory
  adModel?: AdCampaignModel
  title: string
  description: string
  price: number
  xpPrice?: number
  billingCycle: BillingCycleType
  version: string
  quotaLabel: string
  features: string[]
  badge?: string
  highlighted?: boolean
  salesCount: number
}

export const DKP_SHOP_CATALOG_V26: ShopProduct[] = [
  {
    id: 'ads-impressions-15k',
    category: 'sponsored_ads',
    adModel: 'IMPRESSIONS',
    title: 'Campagna Visualizzazioni (15.000 Imp)',
    description: 'Massima visibilita per visualizzazioni verificate nei widget orizzontali e verticali con telemetria impression in tempo reale.',
    price: 39,
    xpPrice: 4000,
    billingCycle: 'one_time',
    version: 'v2.6-PURE-SQL',
    quotaLabel: '15.000 Visualizzazioni',
    features: [
      'Rotazione su widget orizzontali e verticali DKP',
      'Telemetria impressioni attiva in Home e I Miei Link',
      'Gestione link e stato in /user/ads',
      'Zero tracker esterni'
    ],
    badge: 'VISUALIZZAZIONI',
    highlighted: false,
    salesCount: 34
  },
  {
    id: 'ads-clicks-250',
    category: 'sponsored_ads',
    adModel: 'CLICKS',
    title: 'Campagna Click (250 Click Verificati)',
    description: 'Ottimizzata sul traffico diretto verso il tuo link con tracciamento click e CTR sincronizzato nella dashboard.',
    price: 49,
    xpPrice: 5200,
    billingCycle: 'one_time',
    version: 'v2.6-PURE-SQL',
    quotaLabel: '250 Click Verificati',
    features: [
      'Focus su click e CTR su link interni o esterni',
      'Contatori click e CTR in tempo reale su /user/ads',
      'Attivazione rapida su widget feed, nodi e blog',
      'Controllo diretto da I Miei Link & Ads'
    ],
    badge: 'CLICK',
    highlighted: false,
    salesCount: 28
  },
  {
    id: 'ads-hybrid-pack',
    category: 'sponsored_ads',
    adModel: 'HYBRID',
    title: 'Campagna Ibrida (30k Imp + 400 Click)',
    description: 'Modello ibrido visualizzazioni + click per combinare reach sul network e traffico qualificato verso i tuoi link.',
    price: 79,
    xpPrice: 8000,
    billingCycle: 'one_time',
    version: 'v2.6-PURE-SQL',
    quotaLabel: '30.000 Imp + 400 Click',
    features: [
      'Doppio tracciamento impression + click + CTR',
      'Presenza orizzontale e verticale su tutto il network',
      'Gestione centralizzata nella sezione I Miei Link',
      'Telemetria unificata Pure SQL'
    ],
    badge: 'IBRIDO',
    highlighted: true,
    salesCount: 47
  },
  {
    id: 'sentinel-saas-pro',
    category: 'api_pass',
    title: 'Sentinel Scan SaaS - Pro',
    description: 'Chiave API dkp_live_... con quota estesa per Sentinel Scan SAST + AI audit e certificazione Proof of Safety SHA-256.',
    price: 19,
    xpPrice: 2500,
    billingCycle: 'monthly',
    version: 'v2.6-PURE-SQL',
    quotaLabel: '50.000 Scan / mese',
    features: [
      'Chiave API dkp_live_... per Sentinel Scan',
      'Proof of Safety SHA-256 su n/blockchain-vault',
      'Moduli SaaS di @devkernelpulse/sdk v1.1.0',
      'Telemetria in tempo reale nella API Console'
    ],
    badge: 'SENTINEL SAAS',
    highlighted: false,
    salesCount: 64
  },
  {
    id: 'openui-bemyagent-saas',
    category: 'api_pass',
    title: 'OpenUI Studio + BEMYAGENT SaaS',
    description: 'Generazione UI/Tailwind streaming in OpenUI Studio, audit SAST e workspace BEMYAGENT.md con telemetria TTEV.',
    price: 39,
    xpPrice: 5000,
    billingCycle: 'monthly',
    version: 'v2.6-PURE-SQL',
    quotaLabel: '250.000 Req + BEMYAGENT',
    features: [
      'OpenUI Studio + SDK dkp.openui.*',
      'Workspace BEMYAGENT.md e tracce TTEV',
      'Proof of Safety SHA-256 automatico',
      'Quota estesa Pure SQL e CI/CD'
    ],
    badge: 'OPENUI + BEMYAGENT',
    highlighted: false,
    salesCount: 29
  },
  {
    id: 'vault-safety-pack',
    category: 'vault_pro',
    title: 'Proof of Safety Credit Pack',
    description: 'Crediti una tantum per scansioni Sentinel e notarizzazioni batch SHA-256 senza abbonamento ricorrente.',
    price: 29,
    xpPrice: 3500,
    billingCycle: 'one_time',
    version: 'v2.6-PURE-SQL',
    quotaLabel: '25.000 Crediti Audit & Vault',
    features: [
      'Crediti extra Sentinel Scan e Vault',
      'Nessuna scadenza mensile',
      'Verifica pubblica su n/blockchain-vault',
      'Compatibile con SDK v1.1.0 e CLI'
    ],
    badge: 'VAULT PACK',
    highlighted: false,
    salesCount: 42
  }
]

export function useShop() {
  const products = useState<ShopProduct[]>('dkp_shop_products_v26', () => [...DKP_SHOP_CATALOG_V26])
  const loading = useState<boolean>('dkp_shop_loading', () => false)

  const apiPassProducts = computed(() => products.value.filter(p => p.category === 'api_pass'))
  const vaultProducts = computed(() => products.value.filter(p => p.category === 'vault_pro'))
  const adsProducts = computed(() => products.value.filter(p => p.category === 'sponsored_ads'))

  async function fetchProducts() {
    loading.value = true
    try {
      const res: any = await $fetch('/api/shop/products')
      const list = res?.data ?? res
      if (Array.isArray(list) && list.length > 0) {
        products.value = list
      }
    } catch {
      // Mantiene il catalogo v2.6-PURE-SQL di default
    } finally {
      loading.value = false
    }
  }

  function addProduct(product: Omit<ShopProduct, 'id' | 'salesCount'>) {
    products.value.push({
      ...product,
      id: 'dkp-' + Date.now(),
      salesCount: 0
    })
  }

  function removeProduct(id: string) {
    products.value = products.value.filter(p => p.id !== id)
  }

  return {
    products,
    apiPassProducts,
    vaultProducts,
    adsProducts,
    loading,
    fetchProducts,
    addProduct,
    removeProduct
  }
}