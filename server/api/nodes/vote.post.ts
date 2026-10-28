// server/api/nodes/vote.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { awardNodeXpAndBadges, GamificationRules } from '~~/server/utils/gamification'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)

  // Sostituisci questo mock con il reale prelievo dell'ID dalla tua sessione utente (es. useSupabaseUser, JWT, ecc.)
  const userId = event.context.user?.id || 1 

  const targetType = body.targetType // 'post' | 'comment'
  const targetId = Number(body.targetId)
  const voteValue = Number(body.value) // 1 (Upvote) o -1 (Downvote)

  if (!targetType || !targetId || ![1, -1].includes(voteValue)) {
    throw createError({ statusCode: 400, statusMessage: 'Payload di voto non valido.' })
  }

  const isPost = targetType === 'post'
  const targetTable = isPost ? 'node_posts' : 'node_comments'
  const targetColumn = isPost ? sql`post_id` : sql`comment_id`

  try {
    // 1. Verifica se l'utente ha già votato questo elemento
    const existingVoteResult: any = await db.execute(sql`
      SELECT id, vote_value 
      FROM node_votes 
      WHERE user_id = ${userId} 
        AND ${isPost ? sql`post_id = ${targetId}` : sql`comment_id = ${targetId}`}
      LIMIT 1
    `)

    const existingVote = existingVoteResult?.rows?.[0] || existingVoteResult?.[0]
    
    let karmaDiff = 0
    let isNewUpvote = false

    if (existingVote) {
      if (existingVote.vote_value === voteValue) {
        // Toggle Off: L'utente ha cliccato lo stesso voto, quindi lo rimuoviamo
        await db.execute(sql`DELETE FROM node_votes WHERE id = ${existingVote.id}`)
        karmaDiff = -voteValue
      } else {
        // Inversione: L'utente ha cambiato idea (da Up a Down o viceversa)
        await db.execute(sql`UPDATE node_votes SET vote_value = ${voteValue} WHERE id = ${existingVote.id}`)
        karmaDiff = voteValue === 1 ? 2 : -2
        if (voteValue === 1) isNewUpvote = true
      }
    } else {
      // Primo Voto
      await db.execute(sql`
        INSERT INTO node_votes (user_id, ${targetColumn}, vote_value)
        VALUES (${userId}, ${targetId}, ${voteValue})
      `)
      karmaDiff = voteValue
      if (voteValue === 1) isNewUpvote = true
    }

    // 2. Applica la differenza di Karma al Thread o al Commento in modo atomico
    const targetUpdateResult: any = await db.execute(sql`
      UPDATE ${sql.raw(targetTable)}
      SET karma_score = karma_score + ${karmaDiff}
      WHERE id = ${targetId}
      RETURNING author_id, karma_score
    `)

    const targetData = targetUpdateResult?.rows?.[0] || targetUpdateResult?.[0]

    // 3. Integrazione XP (Gamification)
    // Non premiamo l'utente se si sta auto-votando
    if (isNewUpvote && targetData?.author_id && targetData.author_id !== userId) {
      try {
        await awardNodeXpAndBadges(
          targetData.author_id,
          `Upvote ricevuto sul tuo ${isPost ? 'Thread' : 'Commento'}`,
          GamificationRules.UPVOTE_RECEIVED
        )
      } catch (xpErr) {
        console.warn("⚠️ Impossibile assegnare XP per il voto:", xpErr)
      }
    }

    return {
      success: true,
      message: 'Voto registrato con successo',
      newKarma: targetData?.karma_score || 0
    }
    
  } catch (error: any) {
    console.error('💥 [VOTE ERROR]:', error?.message)
    throw createError({ statusCode: 500, statusMessage: 'Errore interno nel calcolo del Karma.' })
  }
})