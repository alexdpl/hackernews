// server/api/contact.post.ts
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 1. Protezione Honeypot silenziosa
  if (body?.websiteHoneypot) {
    return { success: true, message: 'Messaggio ricevuto.' }
  }

  const name = String(body?.name || '').trim()
  const email = String(body?.email || '').trim()
  const subject = String(body?.subject || 'Generale').trim()
  const message = String(body?.message || '').trim()
  const gdprConsent = Boolean(body?.gdprConsent)
  const gdprAcceptedAt = body?.gdprAcceptedAt ? new Date(body.gdprAcceptedAt).toISOString() : null

  if (!name || !email || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome, email e messaggio sono obbligatori.'
    })
  }

  if (!gdprConsent || !gdprAcceptedAt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Il consenso esplicito all\'Informativa Privacy (GDPR) con timestamp è obbligatorio.'
    })
  }

  // Verifica Captcha equazionale
  const answer = Number(body?.captchaAnswer)
  const expected = Number(body?.captchaExpected)
  if (Number.isNaN(answer) || answer !== expected) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Verifica DKP Kernel Captcha non superata.'
    })
  }

  // Salvataggio Pure SQL (se presente helper useNeonSql / pool pg)
  try {
    const sql = useNeonSql()
    await sql`
      INSERT INTO contact_messages (name, email, subject, message, gdpr_consent, gdpr_accepted_at, created_at)
      VALUES (${name}, ${email}, ${subject}, ${message}, ${gdprConsent}, ${gdprAcceptedAt}, NOW())
    `
  } catch (dbErr) {
    // Fallback log strutturato se la tabella non è ancora migrata
    console.info('[DKP CONTACT DISPATCH]', { name, email, subject, gdprAcceptedAt })
  }

  return {
    success: true,
    message: `Messaggio inviato al Kernel DKP! Consenso GDPR registrato (${gdprAcceptedAt}).`
  }
})