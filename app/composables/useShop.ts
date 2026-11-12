// app/composables/useShop.ts
import { useState, computed } from '#imports'

export type ShopCategory = 'api_pass' | 'sponsored_ads' | 'vault_pro'

export interface ShopProduct {
  id: string
  category: ShopCategory
  title: string
  description: string
  price: number
  xpPrice?: number
  billingCycle: 'one_time' | 'monthly'
  version: string
  quotaLabel: string
  features: string[]
  badge?: string
  highlighted?: boolean
  salesCount: number
}

export function useShop() {
  const products = useState<ShopProduct[]>('dkp_shop_products_v26', () => [
    {
      id: 'api-pro-50k',
      category: 'api_pass',
      title: 'DKP API Pass — Developer Pro',
      description: 'Chiave API dedicata con rate-limit esteso per DKP Tech Feed, Trinity AI Summaries, OpenUI Studio e AI Code Scanner.',
      price: 19,
      xpPrice: 2500,
      billingCycle: 'monthly',
      version: 'v2.6-PURE-SQL',
      quotaLabel: '50.000 Richieste API / mese',
      features: [
        'Rate-limit 120 req/min su api.devkernelpulse.org',
        'Accesso completo agli endpoint Trinity AI & Repo Scanner',
        'Telemetria in tempo reale nella DKP API Console',
        'Zero cold-start su Neon PostgreSQL Pure SQL'
      ],
      badge: 'PIÙ SCELTO',
      highlighted: true,
      salesCount: 64
    },
    {
      id: 'api-scale-250k',
      category: 'api_pass',
      title: 'DKP API Pass — Scale & Enterprise',
      description: 'Banda prioritaria per pipeline CI/CD, automazioni DKP CLI e audit continui di sicurezza su repository multipli.',
      price: 59,
      xpPrice: 7500,
      billingCycle: 'monthly',
      version: 'v2.6-PURE-SQL',
      quotaLabel: '250.000 Richieste API / mese',
      features: [
        'Rate-limit 600 req/min + SLA 99.95%',
        'Notarizzazione Proof-of-Code Vault illimitata',
        'Chiavi API multiple con permessi granulari',
        'Supporto prioritario Direct Kernel Dispatch'
      ],
      badge: 'ENTERPRISE',
      salesCount: 21
    },
    {
      id: 'ads-feed-boost',
      category: 'sponsored_ads',
      title: 'DKP Sponsored Ads — Tech Feed & Nodes',
      description: 'Promuovi il tuo tool dev, prodotto SaaS o repository open-source con banner nativi non invasivi nel Tech Feed e in Node Talks.',
      price: 39,
      xpPrice: 4500,
      billingCycle: 'one_time',
      version: 'v2.6-PURE-SQL',
      quotaLabel: '15.000 Impressioni Verificate',
      features: [
        'Posizionamento nativo su /news, /feed e /nodes',
        'Zero tracker esterni (100% conforme Privacy DKP)',
        'Analytics CTR e click in tempo reale in Gestione Ads',
        'Approvazione rapida tramite Pulse Sentinel AI'
      ],
      badge: 'ADS BOOST',
      highlighted: true,
      salesCount: 38
    },
    {
      id: 'ads-launch-takeover',
      category: 'sponsored_ads',
      title: 'DKP Launch Partner — Full Ecosystem',
      description: 'Pacchetto visibilità massima per lanci di prodotto: banner fisso su Editorial Hub, Tech Feed, Newsletter e Show DKP.',
      price: 99,
      billingCycle: 'one_time',
      version: 'v2.6-PURE-SQL',
      quotaLabel: '50.000 Impressioni + Featured Badge',
      features: [
        'Slot in evidenza su DKP Editorial Hub e Show DKP',
        'Menzione dedicata nel digest settimanale DKP',
        'Report analitico completo di conversione e traffico',
        'Gestione campagne self-service da /user/ads'
      ],
      badge: 'LAUNCH PRO',
      salesCount: 14
    }
  ])

  const loading = useState<boolean>('dkp_shop_loading', () => false)

  const apiPassProducts = computed(() =>
    products.value.filter(p => p.category === 'api_pass')
  )

  const adsProducts = computed(() =>
    products.value.filter(p => p.category === 'sponsored_ads')
  )

  async function fetchProducts() {
    loading.value = true
    try {
      const res: any = await $fetch('/api/shop/products')
      const list = res?.data ?? res
      if (Array.isArray(list) && list.length > 0) {
        products.value = list
      }
    } catch {
      // Mantiene il catalogo v2.6-PURE-SQL di default se l'endpoint non è attivo
    } finally {
      loading.value = false
    }
  }

  function addProduct(product: Omit<ShopProduct, 'id' | 'salesCount'>) {
    products.value.push({
      ...product,
      id: `dkp-${Date.now()}`,
      salesCount: 0
    })
  }

  function removeProduct(id: string) {
    products.value = products.value.filter(p => p.id !== id)
  }

  return {
    products,
    apiPassProducts,
    adsProducts,
    loading,
    fetchProducts,
    addProduct,
    removeProduct
  }
}