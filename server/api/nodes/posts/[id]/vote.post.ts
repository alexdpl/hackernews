// server/api/nodes/posts/[id]/vote.post.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../../utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const postId = Number(getRouterParam(event, 'id'))
  if (!postId || Number.isNaN(postId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID thread non valido.' })
  }

  const body = (await readBody(event)) || {}
  const direction = body.direction === 'down' ? 'down' : 'up'
  const voteValue = direction === 'up' ? 1 : -1
  const userId = Number(event.context.user?.id || body.userId || 1)

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Connessione al database non disponibile.' })
  }

  try {
    // 1. Assicura tabella voti univoci per utente/thread
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS node_post_votes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        vote_type SMALLINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (post_id, user_id)
      );
    `)

    // 2. Verifica esistenza thread
    const postRes = await db.execute(sql`
      SELECT id, author_id, COALESCE(karma_score, 0)::int AS karma_score
      FROM node_posts
      WHERE id = ${postId}
      LIMIT 1;
    `)
    const post = extractRows(postRes)[0]
    if (!post) {
      throw createError({ statusCode: 404, statusMessage: 'Thread non trovato.' })
    }

    // 3. Controlla voto precedente dell'utente su questo thread
    const existingRes = await db.execute(sql`
      SELECT id, vote_type::int AS vote_type
      FROM node_post_votes
      WHERE post_id = ${postId} AND user_id = ${userId}
      LIMIT 1;
    `)
    const existing = extractRows(existingRes)[0]

    let delta = 0
    let activeVote: 'up' | 'down' | null = direction

    if (!existing) {
      // Nuovo voto
      await db.execute(sql`
        INSERT INTO node_post_votes (post_id, user_id, vote_type)
        VALUES (${postId}, ${userId}, ${voteValue});
      `)
      delta = voteValue
    } else if (Number(existing.vote_type) === voteValue) {
      // Secondo click sullo stesso tasto -> rimuove il voto (toggle)
      await db.execute(sql`
        DELETE FROM node_post_votes
        WHERE id = ${Number(existing.id)};
      `)
      delta = -voteValue
      activeVote = null
    } else {
      // Cambio voto (es. da downvote a upvote -> +2)
      await db.execute(sql`
        UPDATE node_post_votes
        SET vote_type = ${voteValue}, created_at = NOW()
        WHERE id = ${Number(existing.id)};
      `)
      delta = voteValue - Number(existing.vote_type)
    }

    // 4. Aggiorna karma_score su node_posts
    const updatedRes = await db.execute(sql`
      UPDATE node_posts
      SET karma_score = COALESCE(karma_score, 0) + ${delta}
      WHERE id = ${postId}
      RETURNING karma_score::int AS karma_score;
    `)
    const newKarma = Number(extractRows(updatedRes)[0]?.karma_score ?? Number(post.karma_score) + delta)

    return {
      success: true,
      postId,
      karmaScore: newKarma,
      userVote: activeVote,
      data: {
        postId,
        karmaScore: newKarma,
        userVote: activeVote
      }
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [NODE POST VOTE ERROR]:', err?.message)
    throw createError({ statusCode: 500, statusMessage: 'Errore durante la registrazione del voto.' })
  }
})