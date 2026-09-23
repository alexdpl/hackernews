// app/composables/useShop.ts
import { useState } from '#imports'

export interface ShopProduct {
  id: string
  title: string
  description: string
  price: number
  version: string
  stack: string
  zipFilename: string
  salesCount: number
}

export function useShop() {
  const products = useState<ShopProduct[]>('dkp_shop_products', () => [
    {
      id: '1',
      title: 'DKP Native Blog & Admin Pro',
      description: 'Modulo e-commerce editoriale completo con CRUD, Live Preview, Karma Likes e pannello admin protetto.',
      price: 49,
      version: 'v2.1.0',
      stack: 'Nuxt 3 / TypeScript / CSS',
      zipFilename: 'dkp-native-blog-pro-v2.1.0.zip',
      salesCount: 12
    },
    {
      id: '2',
      title: 'DKP Neural Code Playground Suite',
      description: 'Sandbox interattivo multi-linguaggio (Rust, TS, Python, Go) con motore di analisi neurale integrato.',
      price: 79,
      version: 'v1.5.0',
      stack: 'Nuxt 3 / Node.js / AI API',
      zipFilename: 'dkp-neural-playground-v1.5.0.zip',
      salesCount: 8
    },
    {
      id: '3',
      title: 'DKP Kernel Security Captcha',
      description: 'Sistema anti-bot proprietario ad altissima sicurezza per form critici e autenticazioni.',
      price: 29,
      version: 'v1.0.2',
      stack: 'TypeScript / Serverless',
      zipFilename: 'dkp-kernel-captcha-v1.0.2.zip',
      salesCount: 24
    }
  ])

  function addProduct(product: Omit<ShopProduct, 'id' | 'salesCount'>) {
    products.value.push({
      ...product,
      id: Date.now().toString(),
      salesCount: 0
    })
  }

  function removeProduct(id: string) {
    products.value = products.value.filter(p => p.id !== id)
  }

  return {
    products,
    addProduct,
    removeProduct
  }
}