// server/api/users/[username].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { fetchUserProfileData } from '~~/server/utils/userProfile'

export default defineEventHandler(async (event) => {
  const rawUsername = String(getRouterParam(event, 'username') || '').trim()

  if (!rawUsername) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username non specificato.'
    })
  }

  if (rawUsername.length > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username non valido.'
    })
  }

  try {
    const data = await fetchUserProfileData(rawUsername)
    if (!data) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Profilo sviluppatore non trovato nel Kernel DKP.'
      })
    }

    return {
      success: true,
      ...data,
      user: data.user,
      stats: data.stats,
      recentActivity: data.recentActivity,
      activeBounties: data.activeBounties
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [USER PROFILE PARAM GET ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore interno durante il caricamento del profilo.'
    })
  }
})