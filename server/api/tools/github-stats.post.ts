// server/api/github-stats.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = body?.username?.trim()
  const targetUserId = body?.userId ? Number(body.userId) : 1

  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'Username GitHub richiesto' })
  }

  try {
    // 1. Chiamata all'API pubblica di GitHub
    const response: any = await $fetch(`https://api.github.com/users/${username}`, {
      headers: { 
        'User-Agent': 'DevKernelPulse-App-v2.5',
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    const publicRepos = response.public_repos || 0
    const followers = response.followers || 0
    const karmaScore = (publicRepos * 12) + (followers * 8)

    let badge = '🌱 Script Kiddie'
    if (karmaScore >= 100 && karmaScore < 300) badge = '⚡ Kernel Contributor'
    if (karmaScore >= 300) badge = '🚀 Core Maintainer'

    // 2. GAMIFICATION: Premia l'utente per l'analisi del profilo (+20 XP)
    try {
      const db = await getDb()
      await db.update(users)
        .set({ xp: sql`COALESCE(xp, 0) + 20` })
        .where(eq(users.id, targetUserId))

      await db.insert(xpTransactions).values({
        userId: targetUserId,
        action: `Analisi GitHub Stats: @${response.login}`,
        points: 20
      })
    } catch (dbErr) {
      console.warn('[GITHUB-STATS GAMIFICATION ERROR]', dbErr)
    }

    return {
      success: true,
      githubUsername: response.login,
      avatarUrl: response.avatar_url,
      publicRepos,
      followers,
      karmaScore,
      badge
    }
  } catch (error: any) {
    console.error('❌ Errore GitHub API su DKP:', error?.data || error?.message || error)

    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Utente GitHub non trovato o limite richieste API superato.' 
    })
  }
})