// server/services/vault.service.ts
import { sql } from 'drizzle-orm'
import { getDb } from '../utils/db'
import { BlockchainService, type VaultEntityType } from '../utils/blockchainService'

export class VaultService {
  static async ensureForumVaultConnection(): Promise<boolean> {
    const db = await getDb()
    if (!db) return false

    await BlockchainService.ensureSchema(db)

    await db.execute(sql`
      INSERT INTO nodes (name, slug, description, icon, color, category, parent_id, creator_id, is_private, subscribers_count)
      SELECT
        'Blockchain Vault',
        'blockchain-vault',
        'Registro pubblico di notarizzazione crittografica SHA-256 e audit on-chain per tutti i thread e gli articoli dell''ecosistema DKP.',
        '⛓️',
        '#10b981',
        '1. DKP Ecosystem & Core',
        NULL,
        1,
        false,
        1
      WHERE NOT EXISTS (
        SELECT 1 FROM nodes WHERE slug = 'blockchain-vault'
      );
    `).catch(() => null)

    return true
  }

  static async syncUnnotarizedPosts(batchSize = 50): Promise<number> {
    const db = await getDb()
    if (!db) return 0

    await BlockchainService.ensureSchema(db)

    const res: any = await db.execute(sql`
      SELECT id, title, content
      FROM node_posts
      WHERE vault_hash IS NULL OR vault_hash = ''
      ORDER BY id ASC
      LIMIT ${batchSize};
    `)

    const rows = Array.isArray(res) ? res : (res?.rows || [])
    let synced = 0

    for (const row of rows) {
      try {
        await BlockchainService.notarizeEntity(db, {
          entityType: 'forum',
          entityId: Number(row.id),
          title: row.title || '',
          content: row.content || ''
        })
        synced++
      } catch {
        // Ignora eventuali collisioni singole e prosegue il batch
      }
    }

    return synced
  }

  static async notarizePost(postId: number, entityType: VaultEntityType = 'forum') {
    const db = await getDb()
    if (!db) return null

    if (entityType === 'forum') {
      const res: any = await db.execute(sql`
        SELECT id, title, content FROM node_posts WHERE id = ${postId} LIMIT 1;
      `)
      const rows = Array.isArray(res) ? res : (res?.rows || [])
      const post = rows[0]
      if (!post) return null

      return BlockchainService.notarizeEntity(db, {
        entityType: 'forum',
        entityId: Number(post.id),
        title: post.title,
        content: post.content
      })
    }

    const tableRes: any = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('blog_posts', 'articles', 'posts')
      LIMIT 1;
    `)
    const blogTable = (Array.isArray(tableRes) ? tableRes : (tableRes?.rows || []))[0]?.table_name
    if (!blogTable) return null

    const artRes: any = await db.execute(
      sql.raw(`SELECT * FROM ${blogTable} WHERE id = ${Number(postId)} LIMIT 1;`)
    )
    const article = (Array.isArray(artRes) ? artRes : (artRes?.rows || []))[0]
    if (!article) return null

    return BlockchainService.notarizeEntity(db, {
      entityType: 'blog',
      entityId: Number(article.id),
      title: article.title || '',
      content: article.content || article.body || ''
    })
  }

  static async verifyProof(params: {
    postId?: number
    entityId?: number
    slug?: string
    entityType?: VaultEntityType
    hash?: string
  }) {
    const db = await getDb()
    return BlockchainService.verifyEntity(db, {
      entityType: params.entityType || 'forum',
      entityId: params.entityId || params.postId,
      slug: params.slug,
      hash: params.hash
    })
  }
}