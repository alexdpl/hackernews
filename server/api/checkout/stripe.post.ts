// server/api/checkout/stripe.post.ts
import Stripe from 'stripe'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { productId, productName, amount, customerEmail } = body

    if (!productId || !amount || !customerEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Dati incompleti per la creazione del checkout.'
      })
    }

    const db = getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000'

    // 1. Creazione Sessione Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Google Pay e Apple Pay si attivano automaticamente
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName || 'DKP SaaS Plugin',
              description: `Licenza Lifetime per ${productName || productId}`
            },
            unit_amount: Math.round(parseFloat(amount) * 100) // Converti in centesimi
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${siteUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop?canceled=true`,
      metadata: {
        productId,
        customerEmail
      }
    })

    // 2. Inserimento record in tabella ORDERS (Pending)
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
        'stripe', 
        ${session.id}, 
        'pending'
      );
    `)

    return {
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    }
  } catch (err: any) {
    console.error('[STRIPE CHECKOUT ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore creazione sessione Stripe'
    })
  }
})