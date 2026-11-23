// server/api/webhooks/stripe.post.ts
import Stripe from 'stripe'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { generateLicenseKey } from '~~/server/utils/license'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || ''
  const webhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ''
  const sig = getHeader(event, 'stripe-signature')

  let stripeEvent: Stripe.Event

  try {
    const rawBody = await readRawBody(event)
    if (!rawBody || !sig || !webhookSecret || !secretKey) {
      throw new Error('Firma, raw body o configurazione Stripe mancante')
    }

    const stripe = new Stripe(secretKey)
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error('[STRIPE WEBHOOK SIG ERROR]:', err?.message)
    setResponseStatus(event, 400)
    return 'Webhook Error: ' + (err?.message || 'Invalid signature')
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const sessionId = session.id
    const customerEmail = session.customer_details?.email || session.metadata?.customerEmail || ''
    const productId = session.metadata?.productId || 'sentinel-saas-pro'

    const db = await getDb()
    if (db) {
      try {
        const orderResult: any = await db.execute(sql`
          UPDATE orders
          SET status = 'completed', updated_at = NOW()
          WHERE payment_intent_id = ${sessionId}
          RETURNING id, status;
        `)

        const orderRow = (Array.isArray(orderResult) ? orderResult : (orderResult?.rows || []))[0]
        const orderId = orderRow?.id

        if (orderId) {
          const existingLic: any = await db.execute(sql`
            SELECT license_key FROM licenses WHERE order_id = ${orderId} LIMIT 1;
          `)
          const existingRow = (Array.isArray(existingLic) ? existingLic : (existingLic?.rows || []))[0]

          if (!existingRow?.license_key) {
            const prefix = productId.includes('openui') ? 'OUI' : productId.includes('vault') ? 'VLT' : 'SNT'
            const licenseKey = generateLicenseKey(prefix)

            await db.execute(sql`
              INSERT INTO licenses (
                order_id,
                license_key,
                customer_email,
                product_id,
                status,
                max_downloads
              )
              VALUES (
                ${orderId},
                ${licenseKey},
                ${customerEmail},
                ${productId},
                'active',
                25
              );
            `)
            console.log('[STRIPE SUCCESS] Ordine', orderId, 'completato. Licenza:', licenseKey)
          }
        }
      } catch (dbErr: any) {
        console.error('[STRIPE WEBHOOK DB ERROR]:', dbErr?.message)
      }
    }
  }

  return { received: true }
})