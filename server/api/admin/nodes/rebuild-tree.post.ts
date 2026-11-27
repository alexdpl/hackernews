// server/api/admin/nodes/rebuild-tree.post.ts
import { defineEventHandler, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { rebuildSemanticNodesHierarchy } from '~~/server/utils/nodesTreeService'

export default defineEventHandler(async () => {
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  const stats = await rebuildSemanticNodesHierarchy(db)
  return {
    success: true,
    stats,
    message: `Albero nodi riallineato: ${stats.normalizedNames} nomi normalizzati, ${stats.relinkedParents} sottonodi collegati al padre, ${stats.updatedCategories} categorie aggiornate.`
  }
})