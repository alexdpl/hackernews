import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
  if (!dbUrl) {
    console.log('[INFO] Nessuna DATABASE_URL configurata in ambiente: salto migrazione DB locale.')
    return
  }

  const sql = neon(dbUrl)
  const nodes = await sql`SELECT id, slug, name, parent_id FROM nodes ORDER BY id ASC`
  if (!nodes.length) {
    console.log('[INFO] Tabella nodes vuota.')
    return
  }

  const validIds = new Set(nodes.map((n) => Number(n.id)))
  const fallbackNode =
    nodes.find((n) => String(n.slug || '').toLowerCase().includes('general')) ||
    nodes[0]

  const orphanPosts = await sql`
    SELECT id, title, node_id
    FROM node_posts
    WHERE node_id IS NULL
  `

  let fixed = 0
  for (const p of orphanPosts) {
    if (!validIds.has(Number(p.node_id))) {
      await sql`UPDATE node_posts SET node_id = ${fallbackNode.id} WHERE id = ${p.id}`
      fixed++
    }
  }

  console.log(`[OK] Nodi attivi: ${nodes.length} | Thread riallineati: ${fixed} | Nodo fallback: n/${fallbackNode.slug}`)
}

main().catch((err) => {
  console.error('[ERRORE ALLINEAMENTO THREAD]:', err?.message || err)
  process.exitCode = 1
})