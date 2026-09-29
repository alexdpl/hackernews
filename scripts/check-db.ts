// scripts/check-db.ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { orders, licenses } from '../server/db/schema'
import { eq, desc } from 'drizzle-orm'
import * as dotenv from 'dotenv'

dotenv.config()

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function checkDatabase() {
  console.log('🔍 Lettura transazioni e licenze da Neon DB...\n')

  try {
    const result = await db
      .select({
        orderId: orders.id,
        email: orders.customerEmail,
        product: orders.productName,
        amount: orders.amount,
        provider: orders.paymentProvider,
        orderStatus: orders.status,
        licenseKey: licenses.licenseKey,
        licenseStatus: licenses.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(licenses, eq(orders.id, licenses.orderId))
      .orderBy(desc(orders.createdAt))
      .limit(10)

    if (result.length === 0) {
      console.log('ℹ️ Nessun ordine trovato nel database.')
      return
    }

    console.table(result)
  } catch (error) {
    console.error('❌ Errore durante la verifica del DB:', error)
  }
}

checkDatabase()