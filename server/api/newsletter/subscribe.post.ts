// server/api/newsletter/subscribe.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { NewsletterService } from '~~/server/services/newsletter.service'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const email = String(body.email || '').trim()
  const name = String(body.name || '').trim()
  const source = String(body.source || 'WEB').trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Indirizzo email non valido' })
  }

  await NewsletterService.subscribe(email, name, source)

  return {
    success: true,
    message: 'Iscrizione alla Newsletter DKP completata con successo!'
  }
})