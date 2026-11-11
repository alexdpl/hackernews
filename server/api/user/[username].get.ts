// server/api/users/[username].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { fetchUserProfileData } from '~~/server/utils/userProfile'

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')

  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username non specificato'
    })
  }

  try {
    const data = await fetchUserProfileData(username)
    return {
      success: true,
      ...data,
      user: data.user,
      stats: data.stats,
      recentActivity: data.recentActivity,
      activeBounties: data.activeBounties
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore interno'
    })
  }
})