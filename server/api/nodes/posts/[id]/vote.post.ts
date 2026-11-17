// server/api/nodes/posts/[id]/vote.post.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../../utils/db'
import { extractDkpUserFromEvent } from '../../../../utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per votare una discussione.'
    })
  }

  const rawPostId = String(getRouterParam(event, 'id') || '').trim()
  const postId = Number(rawPostId)
  if (!/^\d+$/.test(rawPostId) || !Number.isSafeInteger(postId) || postId <= 0 || postId > 2147483647) {
    throw createError({ statusCode: 400, statusMessage: 'ID thread non valido.' })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  if (body.direction !== 'up' && body.direction !== 'down') {
    throw createError({ statusCode: 400, statusMessage: 'Direzione voto non valida (usa "up" o "down").' })
  }

  const direction: 'up' | 'down' = body.direction
  const voteValue = direction === 'up' ? 1 : -1

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Connessione al database non disponibile.' })
  }

  try {
    // 1. Verifica utente autenticato su DB
    const userRes = await db.execute(sql`
      SELECT id FROM users WHERE id = ${Number(sessionUser.id)} LIMIT 1;
    `)
    const dbUser = extractRows(userRes)[0]
    if (!dbUser?.id) {
      throw createError({ statusCode: 401, statusMessage: 'Sessione non valida o utente inesistente.' })
    }
    const userId = Number(dbUser.id)

    // 2. Assicura tabella canonica node_votes (allineata a server/db/schema.ts)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS node_votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES node_posts(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES node_comments(id) ON DELETE CASCADE,
        vote_value INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_node_post_vote UNIQUE (user_id, post_id)
      );
    `).catch(() => null)

    // 3. Verifica esistenza thread
    const postRes = await db.execute(sql`
      SELECT id, author_id AS "authorId", COALESCE(karma_score, 0)::int AS "karmaScore"
      FROM node_posts
      WHERE id = ${postId}
      LIMIT 1;
    `)
    const post = extractRows(postRes)[0]
    if (!post) {
      throw createError({ statusCode: 404, statusMessage: 'Thread non trovato.' })
    }

    // 4. Controlla voto precedente dell'utente su questo thread
    const existingRes = await db.execute(sql`
      SELECT id, vote_value::int AS "voteValue"
      FROM node_votes
      WHERE post_id = ${postId} AND user_id = ${userId}
      LIMIT 1;
    `)
    const existing = extractRows(existingRes)[0]

    let delta = 0
    let activeVote: 'up' | 'down' | null = direction

    if (!existing) {
      // Nuovo voto
      await db.execute(sql`
        INSERT INTO node_votes (user_id, post_id, vote_value, created_at)
        VALUES (${userId}, ${postId}, ${voteValue}, NOW());
      `)
      delta = voteValue
    } else if (Number(existing.voteValue) === voteValue) {
      // Secondo click sullo stesso tasto -> rimuove il voto (toggle)
      await db.execute(sql`
        DELETE FROM node_votes
        WHERE id = ${Number(existing.id)};
      `)
      delta = -voteValue
      activeVote = null
    } else {
      // Cambio voto (es. da downvote a upvote -> +2)
      await db.execute(sql`
        UPDATE node_votes
        SET vote_value = ${voteValue}, created_at = NOW()
        WHERE id = ${Number(existing.id)};
      `)
      delta = voteValue - Number(existing.voteValue)
    }

    // 5. Aggiorna karma_score su node_posts
    const updatedRes = await db.execute(sql`
      UPDATE node_posts
      SET karma_score = COALESCE(karma_score, 0) + ${delta}
      WHERE id = ${postId}
      RETURNING karma_score::int AS "karmaScore";
    `)
    const newKarma = Number(extractRows(updatedRes)[0]?.karmaScore ?? Number(post.karmaScore) + delta)

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