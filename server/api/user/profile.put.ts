// server/api/user/profile.put.ts
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { username, avatar, bio, github, twitter, linkedin, reddit } = body

    if (!username) {
      throw createError({ statusCode: 400, statusMessage: 'Username obbligatorio' })
    }

    // Qui inserisci la tua query SQL o l'aggiornamento su Neon DB / ORM
    // Esempio: await db.query('UPDATE users SET avatar=$1, bio=$2, github=$3, twitter=$4, linkedin=$5, reddit=$6 WHERE username=$7', [avatar, bio, github, twitter, linkedin, reddit, username])

    return {
      success: true,
      message: 'Profilo aggiornato con successo',
      data: { username, avatar, bio, github, twitter, linkedin, reddit }
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || 'Errore salvataggio profilo'
    })
  }
})