// server/api/webhooks/stripe.post.ts
import Stripe from 'stripe'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { generateLicenseKey } from '~~/server/utils/license'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any
})

export default defineEventHandler(async (event) => {
  const req = event.node.req
  const sig = getHeader(event, 'stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let stripeEvent: Stripe.Event

  try {
    const rawBody = await readRawBody(event)
    if (!rawBody || !sig || !webhookSecret) {
      throw new Error('Firma o body del Webhook Stripe mancante')
    }

    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK SIG ERROR]: ${err.message}`)
    setResponseStatus(event, 400)
    return `Webhook Error: ${err.message}`
  }

  // Gestione Evento: Pagamento Completato
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const sessionId = session.id
    const customerEmail = session.customer_details?.email || session.metadata?.customerEmail || ''
    const productId = session.metadata?.productId || 'dkp-saas-plugin'

    const db = getDb()
    if (db) {
      try {
        // 1. Aggiorna Ordine in COMPLETED
        const orderResult: any = await db.execute(sql`
          UPDATE orders 
          SET status = 'completed', updated_at = NOW() 
          WHERE payment_intent_id = ${sessionId}
          RETURNING id;
        `)

        const orderId = orderResult?.rows?.[0]?.id || orderResult?.[0]?.id

        if (orderId) {
          // 2. Genera License Key Univoca (es. DKP-CRW-9F2A-18BC-33DE)
          const prefix = productId.includes('crawler') ? 'CRW' : 'DKP'
          const licenseKey = generateLicenseKey(prefix)

          // 3. Inserisci record in LICENSES
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
              10
            );
          `)

          console.log(`[STRIPE SUCCESS] Ordine ${orderId} completato! Licenza erogata: ${licenseKey}`)
        }
      } catch (dbErr: any) {
        console.error('[STRIPE WEBHOOK DB ERROR]:', dbErr?.message)
      }
    }
  }

  return { received: true }
})