// server/api/checkout/paypal-capture.post.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { generateLicenseKey } from '~~/server/utils/license'

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const mode = process.env.PAYPAL_MODE || 'sandbox'
  const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res: any = await $fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  return { token: res.access_token, baseUrl }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { paypalOrderId } = body

    if (!paypalOrderId) {
      throw createError({ statusCode: 400, statusMessage: 'ID Ordine PayPal mancante.' })
    }

    const { token, baseUrl } = await getPayPalAccessToken()

    // 1. Capture Ordine su PayPal
    const captureData: any = await $fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (captureData.status === 'COMPLETED') {
      const db = getDb()
      if (db) {
        // 2. Update Ordine in COMPLETED
        const orderResult: any = await db.execute(sql`
          UPDATE orders 
          SET status = 'completed', updated_at = NOW() 
          WHERE payment_intent_id = ${paypalOrderId}
          RETURNING id, customer_email, product_id;
        `)

        const order = orderResult?.rows?.[0] || orderResult?.[0]

        if (order) {
          const prefix = order.product_id.includes('crawler') ? 'CRW' : 'DKP'
          const licenseKey = generateLicenseKey(prefix)

          // 3. Genera Licenza
          await db.execute(sql`
            INSERT INTO licenses (order_id, license_key, customer_email, product_id, status, max_downloads)
            VALUES (${order.id}, ${licenseKey}, ${order.customer_email}, ${order.product_id}, 'active', 10);
          `)

          return {
            success: true,
            status: 'COMPLETED',
            licenseKey
          }
        }
      }
    }

    return { success: false, status: captureData.status }
  } catch (err: any) {
    console.error('[PAYPAL CAPTURE ERROR]:', err?.message)
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Errore Capture PayPal' })
  }
})