// server/api/wallet/spend.post.ts
import { defineEventHandler, readBody, getHeader, createError } from 'h3'
import { sql, eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, pulseTransactions } from '~~/server/db/schema'

// Catalogo Prezzi interno
const PULSE_STORE = {
  'BADGE_PRO': { cost: 50, type: 'profile_badge', value: 'badge-pro-gold' },
  'COLOR_NEON': { cost: 30, type: 'name_color', value: '#00dc82' },
  'BOOST_SHOWCASE': { cost: 100, type: 'boost', duration: '24h' }
}

export default defineEventHandler(async (event) => {
  // 1. Validazione sessione (Esempio tramite cookie o auth header)
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) throw createError({ statusCode: 401, statusMessage: 'Non autorizzato' })
  
  // Simuliamo l'ID utente (nella realtà lo estrai dal token/sessione decodificata)
  const userId = 1 // Sostituisci con la logica di estrazione sessione

  const body = await readBody(event)
  const { itemId } = body // Es: 'COLOR_NEON'

  if (!itemId || !PULSE_STORE[itemId as keyof typeof PULSE_STORE]) {
    throw createError({ statusCode: 400, statusMessage: 'Articolo non valido o inesistente' })
  }

  const item = PULSE_STORE[itemId as keyof typeof PULSE_STORE]
  const db = await getDb()

  // 2. Controllo Saldo
  const userResult = await db.select({ pulseBalance: users.pulseBalance }).from(users).where(eq(users.id, userId)).limit(1)
  const user = userResult[0]

  if (!user || user.pulseBalance < item.cost) {
    throw createError({ 
      statusCode: 403, 
      statusMessage: `Saldo insufficiente. Costo: ${item.cost} $PULSE. Saldo attuale: ${user?.pulseBalance || 0} $PULSE.` 
    })
  }

  // 3. Transazione (Scala $PULSE e applica il Perk)
  try {
    // A. Sottrai i $PULSE
    await db.update(users)
      .set({ pulseBalance: sql`${users.pulseBalance} - ${item.cost}` })
      .where(eq(users.id, userId))

    // B. Applica la modifica estetica (se applicabile)
    if (item.type === 'name_color') {
      await db.update(users).set({ nameColor: item.value }).where(eq(users.id, userId))
    } else if (item.type === 'profile_badge') {
      await db.update(users).set({ profileBadge: item.value }).where(eq(users.id, userId))
    }
    // (Se è un boost showcase, andrai ad aggiornare la tabella dei progetti)

    // C. Registra la ricevuta nel Ledger
    await db.insert(pulseTransactions).values({
      userId,
      amount: -item.cost,
      txType: `SPEND_${item.type.toUpperCase()}`,
      description: `Acquisto store interno: ${itemId}`
    })

    return { 
      success: true, 
      message: `Acquisto confermato! Hai speso ${item.cost} $PULSE.`,
      newBalance: user.pulseBalance - item.cost
    }

  } catch (err: any) {
    console.error('Errore Wallet:', err)
    throw createError({ statusCode: 500, statusMessage: 'Errore durante la transazione' })
  }
})