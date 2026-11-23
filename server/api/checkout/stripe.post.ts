// server/api/checkout/stripe.post.ts
import Stripe from 'stripe'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

const SERVER_PLAN_PRICES_EUR: Record<string, { name: string; amountEur: number; mode: 'subscription' | 'payment' }> = {
  'sentinel-saas-pro': { name: 'Sentinel Scan SaaS - Pro', amountEur: 19, mode: 'subscription' },
  'openui-bemyagent-saas': { name: 'OpenUI Studio + BEMYAGENT SaaS', amountEur: 39, mode: 'subscription' },
  'vault-safety-pack': { name: 'Proof of Safety Credit Pack', amountEur: 29, mode: 'payment' },
  'ads-feed-boost': { name: 'DKP Sponsored Ads - Tech Feed & Nodes', amountEur: 49, mode: 'payment' },
  'dkp-api-sentinel-trinity': { name: 'Sentinel Scan SaaS - Pro', amountEur: 19, mode: 'subscription' },
  'dkp-api-vault-notary': { name: 'Proof of Safety Credit Pack', amountEur: 29, mode: 'payment' },
  'dkp-ads-starter': { name: 'DKP Sponsored Ads - Tech Feed & Nodes', amountEur: 49, mode: 'payment' }
}

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const secretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || ''
    if (!secretKey) {
      throw createError({
        statusCode: 503,
        statusMessage: 'STRIPE_SECRET_KEY non configurata sul server.'
      })
    }

    const stripe = new Stripe(secretKey)
    const body = await readBody(event)
    const productId = String(body?.productId || '').trim()
    const customerEmail = String(body?.customerEmail || '').trim()

    if (!productId || !customerEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'productId e customerEmail sono obbligatori.'
      })
    }

    const catalogItem = SERVER_PLAN_PRICES_EUR[productId]
    const amountEur = catalogItem ? catalogItem.amountEur : Math.max(1, Number(body?.amount || 19))
    const resolvedName = catalogItem ? catalogItem.name : String(body?.productName || productId)
    const checkoutMode: 'subscription' | 'payment' =
      body?.billingCycle === 'monthly' || catalogItem?.mode === 'subscription' ? 'subscription' : 'payment'

    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: resolvedName,
              description: 'DevKernelPulse v2.6-PURE-SQL (' + productId + ')'
            },
            unit_amount: Math.round(amountEur * 100),
            ...(checkoutMode === 'subscription' ? { recurring: { interval: 'month' } } : {})
          },
          quantity: 1
        }
      ],
      mode: checkoutMode,
      success_url: siteUrl + '/shop/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe',
      cancel_url: siteUrl + '/shop?canceled=true',
      metadata: {
        productId,
        customerEmail,
        billingCycle: checkoutMode === 'subscription' ? 'monthly' : 'one_time'
      }
    })

    await db.execute(sql`
      INSERT INTO orders (
        customer_email,
        product_id,
        product_name,
        amount,
        currency,
        payment_provider,
        payment_intent_id,
        status
      )
      VALUES (
        ${customerEmail},
        ${productId},
        ${resolvedName},
        ${amountEur},
        'EUR',
        'stripe',
        ${session.id},
        'pending'
      );
    `)

    return {
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: checkoutMode
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('[STRIPE CHECKOUT ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore creazione sessione Stripe'
    })
  }
})