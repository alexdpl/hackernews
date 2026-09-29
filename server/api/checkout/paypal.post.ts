// server/api/checkout/paypal.post.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

// Helper per ottenere l'AccessToken PayPal
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
    const { productId, productName, amount, customerEmail } = body

    if (!productId || !amount || !customerEmail) {
      throw createError({ statusCode: 400, statusMessage: 'Dati mancanti per PayPal checkout.' })
    }

    const { token, baseUrl } = await getPayPalAccessToken()
    const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000'

    // 1. Creazione Ordine PayPal
    const paypalOrder: any = await $fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: productId,
            description: productName || 'DKP SaaS Plugin',
            amount: {
              currency_code: 'EUR',
              value: parseFloat(amount).toFixed(2)
            }
          }
        ],
        application_context: {
          return_url: `${siteUrl}/shop/success?provider=paypal`,
          cancel_url: `${siteUrl}/shop?canceled=true`
        }
      }
    })

    const db = getDb()
    if (db) {
      // 2. Inserimento record in ORDERS (Pending)
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
          ${productName || productId}, 
          ${amount}, 
          'EUR', 
          'paypal', 
          ${paypalOrder.id}, 
          'pending'
        );
      `)
    }

    // Trova l'URL di approvazione da restituire al frontend
    const approveUrl = paypalOrder.links?.find((link: any) => link.rel === 'approve')?.href

    return {
      success: true,
      paypalOrderId: paypalOrder.id,
      approveUrl
    }
  } catch (err: any) {
    console.error('[PAYPAL CHECKOUT ERROR]:', err?.message)
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Errore PayPal Order' })
  }
})