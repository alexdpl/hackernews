// server/api/github-stats.post.ts
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = body?.username?.trim()

  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'Username GitHub richiesto' })
  }

  try {
    // Chiamata all'API pubblica di GitHub
    const response: any = await $fetch(`https://api.github.com/users/${username}`, {
      headers: { 
        'User-Agent': 'DevKernelPulse-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    const publicRepos = response.public_repos || 0
    const followers = response.followers || 0
    const karmaScore = (publicRepos * 12) + (followers * 8)

    let badge = '🌱 Script Kiddie'
    if (karmaScore >= 100 && karmaScore < 300) badge = '⚡ Kernel Contributor'
    if (karmaScore >= 300) badge = '🚀 Core Maintainer'

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
    // Stampiamo l'errore nel terminale di Node per diagnostica immediata
    console.error('❌ Errore GitHub API su DKP:', error?.data || error?.message || error)

    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Utente GitHub non trovato o limite richieste API superato.' 
    })
  }
})