// server/api/admin/sentinel/action.post.ts
import { defineEventHandler, readBody, createError, setResponseHeaders } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { ipBlacklist } from '~~/server/db/schema'

// Helper regex per validare un indirizzo IP (IPv4 e IPv6 di base)
function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false
  const trimmed = ip.trim()
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  return ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed) || trimmed === '1.1.1.1' || trimmed === 'localhost'
}

export default defineEventHandler(async (event) => {
  const db = getDb()
  setResponseHeaders(event, { 'X-Cloud-Region': 'europe-west4' })

  const body = (await readBody(event)) || {}
  const { action, ip, reason = 'Ban Manuale Admin', severity = 'CRITICAL' } = body

  if (!action) {
    throw createError({ statusCode: 400, statusMessage: 'Parametro "action" mancante.' })
  }

  try {
    // 1. BAN IP CON VALIDAZIONE RIGOROSA
    if (action === 'ban_ip') {
      if (!isValidIP(ip)) {
        throw createError({ statusCode: 400, statusMessage: `Indirizzo IP non valido o malformato: "${ip}"` })
      }

      const cleanIp = ip.trim()
      await db.insert(ipBlacklist).values({
        ip: cleanIp,
        reason: reason.trim(),
        severity: severity.trim()
      }).onConflictDoNothing()

      return {
        success: true,
        message: `🚨 IP ${cleanIp} inserito con successo nella blacklist del database Neon.`
      }
    }

    // 2. UNBAN IP
    if (action === 'unban_ip') {
      if (!isValidIP(ip)) {
        throw createError({ statusCode: 400, statusMessage: `Indirizzo IP non valido per lo sblocco: "${ip}"` })
      }

      const cleanIp = ip.trim()
      await db.delete(ipBlacklist).where(eq(ipBlacklist.ip, cleanIp))

      return {
        success: true,
        message: `✅ IP ${cleanIp} rimosso dal database e sbloccato.`
      }
    }

    // 3. PURGE TOTALE
    if (action === 'purge_threats') {
      await db.delete(ipBlacklist)
      return {
        success: true,
        message: '🧹 Blacklist del database Neon svuotata completamente.'
      }
    }

    if (action === 'toggle_autodefend') {
      return { success: true, message: '🤖 Stato Auto-Defend aggiornato.' }
    }

    throw createError({ statusCode: 400, statusMessage: `Azione sconosciuta: "${action}"` })

  } catch (error: any) {
    console.error('❌ Errore esecuzione azione Sentinel:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: `Errore database: ${error.message}`
    })
  }
})