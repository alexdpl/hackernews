// server/api/hn/user.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = (query.id as string) || (query.username as string)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID utente mancante'
    })
  }

  const db = getDb()

  try {
    // Interroga il database Neon per calcolare karma (somma punti) e data di registrazione (prima attività) dell'utente
    const statsResult: any = await db.execute(sql`
      SELECT 
        COALESCE(SUM(points), 0) AS karma,
        MIN(created_at) AS created_at
      FROM posts
      WHERE author = ${id}
    `)

    const stats = statsResult[0] || statsResult?.rows?.[0] || { karma: 0, created_at: null }
    
    // Converte la data in timestamp UNIX (secondi) per compatibilità con i componenti esistenti
    let createdTimestamp = Math.floor(Date.now() / 1000)
    if (stats.created_at) {
      const d = new Date(stats.created_at)
      if (!isNaN(d.getTime())) {
        createdTimestamp = Math.floor(d.getTime() / 1000)
      }
    }

    return {
      id: id,
      karma: Number(stats.karma || 0),
      created: createdTimestamp,
      created_time: createdTimestamp,
      about: `Profilo ufficiale di ${id} su DevKernelPulse.`
    }
  } catch (err: any) {
    console.error(`Errore nel recupero utente ${id} da Neon DB:`, err)
    return {
      id: id,
      karma: 0,
      created: Math.floor(Date.now() / 1000),
      created_time: Math.floor(Date.now() / 1000),
      about: 'Membro della community DevKernelPulse.'
    }
  }
})