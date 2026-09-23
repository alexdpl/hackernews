// server/api/auth/login.post.ts
import { defineEventHandler, readBody, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = body?.username?.trim()
  const password = body?.password

  if (!username || !password) {
    return { success: false, error: 'Inserisci username e password' }
  }

  // Credenziali Admin principali (puoi metterci la password sicura del tuo file di testo)
  const ADMIN_USERNAME = 'alexdpl'
  const ADMIN_PASSWORD = 'dk35%42Pfk$3rwQ323K' // <-- Inserisci qui la tua password complessa

  // Verifica credenziali admin
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Impostiamo anche i cookie lato server per massima compatibilità
    setCookie(event, 'dkp_logged_in', 'true', { path: '/', maxAge: 60 * 60 * 24 * 7 })
    setCookie(event, 'dkp_user', ADMIN_USERNAME, { path: '/', maxAge: 60 * 60 * 24 * 7 })

    return {
      success: true,
      username: ADMIN_USERNAME,
      message: 'Accesso amministratore effettuato con successo'
    }
  }

  // Gestione per eventuali altri utenti o test (password con almeno 6 caratteri)
  if (password.length >= 6) {
    setCookie(event, 'dkp_logged_in', 'true', { path: '/', maxAge: 60 * 60 * 24 * 7 })
    setCookie(event, 'dkp_user', username, { path: '/', maxAge: 60 * 60 * 24 * 7 })

    return {
      success: true,
      username,
      message: 'Accesso utente effettuato'
    }
  }

  return {
    success: false,
    error: 'Credenziali non valide o password troppo corta.'
  }
})