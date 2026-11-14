// server/api/newsletter/unsubscribe.get.ts
import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { NewsletterService } from '~~/server/services/newsletter.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tokenOrEmail = String(query.token || query.email || '').trim()

  const removed = tokenOrEmail ? await NewsletterService.unsubscribe(tokenOrEmail) : false

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <title>Disiscrizione Newsletter — DevKernelPulse</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #020420; color: #f8fafc; font-family: ui-monospace, monospace; }
    .card { background: #090d16; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; max-width: 460px; text-align: center; }
    h1 { color: #34d399; font-size: 20px; margin-top: 0; }
    p { color: #94a3b8; font-size: 13px; line-height: 1.6; }
    a { display: inline-block; margin-top: 16px; color: #38bdf8; text-decoration: none; border: 1px solid #0284c7; padding: 8px 16px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${removed ? '✅ Disiscrizione Completata' : 'ℹ️ Richiesta Elaborata'}</h1>
    <p>${removed
      ? 'Il tuo indirizzo email è stato rimosso dalla lista di distribuzione DevKernelPulse.'
      : 'Nessuna iscrizione attiva trovata per questo link o indirizzo.'}</p>
    <a href="https://devkernelpulse.org">Torna su DevKernelPulse.org</a>
  </div>
</body>
</html>`
})