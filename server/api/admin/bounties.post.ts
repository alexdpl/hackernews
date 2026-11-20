import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const action = String(body?.action || 'create')

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

  if (action === 'create') {
    const title = String(body?.title || '').trim()
    if (!title) throw createError({ statusCode: 400, statusMessage: 'Titolo bounty obbligatorio' })

    const category = String(body?.category || 'Security & SAST').trim()
    const difficulty = ['EASY', 'MEDIUM', 'HARD', 'CRITICAL'].includes(String(body?.difficulty))
      ? String(body.difficulty)
      : 'MEDIUM'
    const rewardEur = Math.max(0, Number(body?.rewardEur || 100))
    const rewardXp = Math.max(50, Number(body?.rewardXp || 300))
    const repoUrl = String(body?.repoUrl || '').trim()
    const description = String(body?.description || '').trim()

    const inserted = await db.execute(sql`
      INSERT INTO dkp_bounties (title, category, difficulty, reward_eur, reward_xp, status, repo_url, description)
      VALUES (${title}, ${category}, ${difficulty}, ${rewardEur}, ${rewardXp}, 'OPEN', ${repoUrl}, ${description})
      RETURNING
        id,
        title,
        category,
        difficulty,
        reward_eur AS "rewardEur",
        reward_xp AS "rewardXp",
        status,
        claimed_by AS "claimedBy",
        repo_url AS "repoUrl",
        description,
        created_at AS "createdAt";
    `)

    return {
      success: true,
      message: 'Nuovo Bounty pubblicato nel DKP Reward Hub!',
      data: extractRows(inserted)[0]
    }
  }

  const id = Number(body?.id)
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID bounty non valido' })
  }

  if (action === 'update_status') {
    const status = ['OPEN', 'CLAIMED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'].includes(String(body?.status))
      ? String(body.status)
      : 'OPEN'
    const claimedBy = body?.claimedBy !== undefined ? String(body.claimedBy).trim() : null

    if (claimedBy !== null) {
      await db.execute(sql`
        UPDATE dkp_bounties
        SET status = ${status}, claimed_by = ${claimedBy}
        WHERE id = ${id};
      `)
    } else {
      await db.execute(sql`
        UPDATE dkp_bounties
        SET status = ${status}
        WHERE id = ${id};
      `)
    }

    return { success: true, message: `Stato Bounty #${id} aggiornato a ${status}.` }
  }

  if (action === 'delete') {
    await db.execute(sql`DELETE FROM dkp_bounties WHERE id = ${id};`)
    return { success: true, message: `Bounty #${id} eliminato.` }
  }

  throw createError({ statusCode: 400, statusMessage: 'Azione non supportata' })
})