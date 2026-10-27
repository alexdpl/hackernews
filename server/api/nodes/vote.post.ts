// server/api/nodes/vote.post.ts
import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const { postId, commentId, voteValue, userId } = body

  const targetPostId = postId ? Number(postId) : null
  const targetCommentId = commentId ? Number(commentId) : null
  const value = Number(voteValue)

  if (!targetPostId && !targetCommentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Devi specificare un postId o un commentId.'
    })
  }

  if (value !== 1 && value !== -1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Il valore del voto deve essere 1 (Upvote) o -1 (Downvote).'
    })
  }

  let voterUserId = userId ? Number(userId) : 1
  const sessionCookie = getCookie(event, 'dkp_session')
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      if (parsed.id) voterUserId = Number(parsed.id)
    } catch (_) {}
  }

  try {
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // 1. Controllo voto esistente per l'utente su questo target
    let existingVoteRes: any = null
    if (targetPostId) {
      existingVoteRes = await db.execute(sql`
        SELECT id, vote_value AS "voteValue" 
        FROM node_votes 
        WHERE user_id = ${voterUserId} AND post_id = ${targetPostId};
      `)
    } else if (targetCommentId) {
      existingVoteRes = await db.execute(sql`
        SELECT id, vote_value AS "voteValue" 
        FROM node_votes 
        WHERE user_id = ${voterUserId} AND comment_id = ${targetCommentId};
      `)
    }

    const existingVotes = Array.isArray(existingVoteRes) ? existingVoteRes : (existingVoteRes?.rows || [])
    const currentVote = existingVotes[0] || null

    let karmaDelta = 0
    let userVoteState = value

    if (!currentVote) {
      // NUOVO VOTO
      if (targetPostId) {
        await db.execute(sql`
          INSERT INTO node_votes (user_id, post_id, vote_value)
          VALUES (${voterUserId}, ${targetPostId}, ${value});
        `)
      } else {
        await db.execute(sql`
          INSERT INTO node_votes (user_id, comment_id, vote_value)
          VALUES (${voterUserId}, ${targetCommentId}, ${value});
        `)
      }
      karmaDelta = value
    } else if (currentVote.voteValue === value) {
      // TOGGLE OFF: Cliccando nuovamente sullo stesso tasto il voto viene annullato
      await db.execute(sql`
        DELETE FROM node_votes WHERE id = ${currentVote.id};
      `)
      karmaDelta = -value
      userVoteState = 0
    } else {
      // SWAP VOTO: Da -1 a +1 (o viceversa), con delta doppio
      await db.execute(sql`
        UPDATE node_votes 
        SET vote_value = ${value} 
        WHERE id = ${currentVote.id};
      `)
      karmaDelta = value * 2
    }

    // 2. Aggiornamento del karma_score e recupero del nuovo totale
    let updatedScore = 0

    if (targetPostId) {
      const updateRes: any = await db.execute(sql`
        UPDATE node_posts 
        SET karma_score = karma_score + ${karmaDelta}
        WHERE id = ${targetPostId}
        RETURNING karma_score AS "karmaScore", author_id AS "authorId";
      `)
      const row = Array.isArray(updateRes) ? updateRes[0] : (updateRes?.rows?.[0] || null)
      updatedScore = row?.karmaScore ?? 0

      // Gamification: +2 XP all'autore del post per ogni upvote ricevuto
      if (karmaDelta > 0 && row?.authorId && row.authorId !== voterUserId) {
        await db.execute(sql`
          UPDATE users SET xp = COALESCE(xp, 0) + 2 WHERE id = ${row.authorId};
        `).catch(() => {})
      }
    } else if (targetCommentId) {
      const updateRes: any = await db.execute(sql`
        UPDATE node_comments 
        SET karma_score = karma_score + ${karmaDelta}
        WHERE id = ${targetCommentId}
        RETURNING karma_score AS "karmaScore", author_id AS "authorId";
      `)
      const row = Array.isArray(updateRes) ? updateRes[0] : (updateRes?.rows?.[0] || null)
      updatedScore = row?.karmaScore ?? 0

      if (karmaDelta > 0 && row?.authorId && row.authorId !== voterUserId) {
        await db.execute(sql`
          UPDATE users SET xp = COALESCE(xp, 0) + 2 WHERE id = ${row.authorId};
        `).catch(() => {})
      }
    }

    return {
      success: true,
      karmaScore: updatedScore,
      userVote: userVoteState
    }
  } catch (err: any) {
    console.error('❌ [NODE VOTE ERROR]:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Errore durante la registrazione del voto.'
    })
  }
})