<!-- app/pages/shop/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useShop, type ShopProduct, type ShopCategory } from '~/composables/useShop'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'

useDkpSeo({
  title: 'DKP Shop & SaaS v2.6 - Sentinel Scan, OpenUI Studio & Ads',
  description: 'Pacchetti SaaS con chiave dkp_live_... e campagne Ads Visualizzazioni, Click e Ibrido collegate a I Miei Link.',
  type: 'website',
  canonicalPath: '/shop'
})

const route = useRoute()
const { products } = useShop()

const searchQuery = ref('')
const activeCategory = ref<'ALL' | ShopCategory>('ALL')

onMounted(() => {
  const qCat = String(route.query.category || '').trim()
  if (qCat === 'sponsored_ads' || qCat === 'api_pass' || qCat === 'vault_pro') {
    activeCategory.value = qCat as ShopCategory
  }
})

const counts = computed(() => ({
  ALL: products.value.length,
  sponsored_ads: products.value.filter(p => p.category === 'sponsored_ads').length,
  api_pass: products.value.filter(p => p.category === 'api_pass').length,
  vault_pro: products.value.filter(p => p.category === 'vault_pro').length
}))

const filteredProducts = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return products.value.filter(p => {
    const matchCat = activeCategory.value === 'ALL' || p.category === activeCategory.value
    if (!matchCat) return false
    if (!q) return true
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.quotaLabel.toLowerCase().includes(q)
    )
  })
})

const showModal = ref(false)
const selectedProduct = ref<ShopProduct | null>(null)
const customerEmail = ref('')
const paymentProvider = ref<'stripe' | 'paypal'>('stripe')
const isLoading = ref(false)
const errorMessage = ref('')

function openCheckout(product: ShopProduct) {
  selectedProduct.value = product
  errorMessage.value = ''
  showModal.value = true
}

function closeModal() {
  if (isLoading.value) return
  showModal.value = false
  selectedProduct.value = null
}

async function executeCheckout() {
  if (!selectedProduct.value || !customerEmail.value.trim()) return
  isLoading.value = true
  errorMessage.value = ''

  try {
    const endpoint = paymentProvider.value === 'stripe' ? '/api/checkout/stripe' : '/api/checkout/paypal'
    const res: any = await $fetch(endpoint, {
      method: 'POST',
      body: {
        productId: selectedProduct.value.id,
        productName: selectedProduct.value.title,
        amount: selectedProduct.value.price,
        billingCycle: selectedProduct.value.billingCycle,
        customerEmail: customerEmail.value.trim()
      }
    })

    const redirectUrl = res?.checkoutUrl || res?.approveUrl
    if (redirectUrl) {
      window.location.href = redirectUrl
    } else {
      throw new Error('URL di pagamento non restituito dal server.')
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.message || 'Errore durante la creazione del checkout.'
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-12 px-4 sm:px-6 font-sans">
    <div class="max-w-7xl mx-auto flex flex-col gap-10">
      <header class="text-center flex flex-col items-center gap-4 py-4">
        <div class="flex flex-wrap items-center justify-center gap-2 font-mono">
          <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-black uppercase">
            DKP v2.6-PURE-SQL + STRIPE
          </span>
          <span class="bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
            @devkernelpulse/sdk v1.1.0
          </span>
          <NuxtLink
            to="/user/ads"
            class="bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full text-[11px] font-mono font-bold no-underline"
          >
            I Miei Link &amp; Ads
          </NuxtLink>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight m-0">
          DKP SaaS, <span class="text-emerald-400">Ads &amp; Vault</span> Plans
        </h1>

        <p class="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed m-0">
          Attiva campagne <strong class="text-white">Visualizzazioni</strong>, <strong class="text-white">Click</strong> o <strong class="text-white">Ibride</strong> collegate a <NuxtLink to="/user/ads" class="text-cyan-400 underline">I Miei Link</NuxtLink>, oppure sblocca chiavi <code class="text-emerald-400 font-mono">dkp_live_...</code> per Sentinel Scan, OpenUI Studio e BEMYAGENT.md.
        </p>
      </header>

      <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 font-mono text-xs">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filtra campagne Visualizzazioni, Click, Ibrido o piani SaaS..."
          class="flex-1 bg-[#020420] border border-slate-800 focus:border-emerald-400 text-white px-4 py-2.5 rounded-xl outline-none"
        />

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            @click="activeCategory = 'ALL'"
            :class="['px-3.5 py-2 rounded-xl border font-bold cursor-pointer', activeCategory === 'ALL' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-[#020420] text-slate-300 border-slate-800']"
          >
            Tutti ({{ counts.ALL }})
          </button>
          <button
            type="button"
            @click="activeCategory = 'sponsored_ads'"
            :class="['px-3.5 py-2 rounded-xl border font-bold cursor-pointer', activeCategory === 'sponsored_ads' ? 'bg-purple-500 text-white border-purple-400' : 'bg-[#020420] text-slate-300 border-slate-800']"
          >
            Campagne Ads ({{ counts.sponsored_ads }})
          </button>
          <button
            type="button"
            @click="activeCategory = 'api_pass'"
            :class="['px-3.5 py-2 rounded-xl border font-bold cursor-pointer', activeCategory === 'api_pass' ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'bg-[#020420] text-slate-300 border-slate-800']"
          >
            SaaS &amp; API ({{ counts.api_pass }})
          </button>
          <button
            type="button"
            @click="activeCategory = 'vault_pro'"
            :class="['px-3.5 py-2 rounded-xl border font-bold cursor-pointer', activeCategory === 'vault_pro' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-[#020420] text-slate-300 border-slate-800']"
          >
            Proof of Safety ({{ counts.vault_pro }})
          </button>
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="item in filteredProducts"
          :key="item.id"
          :class="['bg-[#090d16] border rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xl', item.highlighted ? 'border-emerald-500/60' : 'border-slate-800']"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2 font-mono">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                {{ item.badge || item.category }}
              </span>
              <div class="text-right">
                <span class="text-2xl font-black text-white">EUR {{ item.price }}</span>
                <span class="block text-[10px] text-slate-400">
                  {{ item.billingCycle === 'monthly' ? '/mese' : 'una tantum' }}
                </span>
              </div>
            </div>

            <h2 class="text-lg font-extrabold text-white m-0">{{ item.title }}</h2>
            <p class="text-xs text-slate-400 leading-relaxed m-0">{{ item.description }}</p>

            <div class="bg-[#020420] border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-cyan-300">
              {{ item.quotaLabel }}
            </div>

            <ul class="space-y-1.5 text-xs text-slate-300 list-none p-0 m-0">
              <li v-for="feat in item.features" :key="feat" class="flex items-start gap-2">
                <span class="text-emerald-400 font-bold">+</span>
                <span>{{ feat }}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            @click="openCheckout(item)"
            class="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs cursor-pointer transition-colors"
          >
            Attiva con Stripe
          </button>
        </article>
      </section>

      <DkpAdsWidget placement="global" layout="horizontal" :limit="3" :showAdvertiseLink="true" />
    </div>

    <Teleport to="body">
      <div
        v-if="showModal && selectedProduct"
        class="fixed inset-0 z-50 bg-[#020420]/85 backdrop-blur-md flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <div class="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-[10px] font-mono font-extrabold text-emerald-400 uppercase">Checkout DKP v2.6</span>
              <h3 class="text-lg font-black text-white m-0 mt-0.5">{{ selectedProduct.title }}</h3>
            </div>
            <button type="button" @click="closeModal" class="text-slate-400 hover:text-white text-sm font-mono cursor-pointer">X</button>
          </div>

          <div class="text-xl font-mono font-black text-emerald-400">
            EUR {{ selectedProduct.price.toFixed(2) }}
            <span class="text-xs text-slate-400 font-normal">
              ({{ selectedProduct.billingCycle === 'monthly' ? 'Abbonamento mensile' : 'Pagamento singolo' }})
            </span>
          </div>

          <form @submit.prevent="executeCheckout" class="space-y-4 font-mono text-xs">
            <div>
              <label class="block text-slate-400 font-bold mb-1">Email per attivazione e gestione in I Miei Link *</label>
              <input
                v-model="customerEmail"
                type="email"
                required
                placeholder="dev@dominio.com"
                class="w-full bg-[#020420] border border-slate-800 focus:border-emerald-400 text-white px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <label :class="['flex items-center gap-2 p-3 rounded-xl border cursor-pointer', paymentProvider === 'stripe' ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-800 bg-[#020420] text-slate-400']">
                <input v-model="paymentProvider" type="radio" value="stripe" class="accent-emerald-500" />
                <span>Stripe / Card</span>
              </label>
              <label :class="['flex items-center gap-2 p-3 rounded-xl border cursor-pointer', paymentProvider === 'paypal' ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-800 bg-[#020420] text-slate-400']">
                <input v-model="paymentProvider" type="radio" value="paypal" class="accent-emerald-500" />
                <span>PayPal</span>
              </label>
            </div>

            <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300">
              {{ errorMessage }}
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer disabled:opacity-50"
            >
              {{ isLoading ? 'Reindirizzamento Stripe...' : 'Procedi al Pagamento' }}
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>