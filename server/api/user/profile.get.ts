// server/api/user/profile.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { fetchUserProfileData } from '~~/server/utils/userProfile'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const username = (query.username as string) || 'alexdpl'

    const data = await fetchUserProfileData(username)
    return {
      success: true,
      // Mappatura compatibile al 100% con entrambi i formati frontend
      ...data,
      user: data.user,
      stats: data.stats,
      recentActivity: data.recentActivity,
      activeBounties: data.activeBounties
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || 'Errore durante il recupero del profilo'
    })
  }
})