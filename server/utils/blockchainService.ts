// server/utils/blockchainService.ts
import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { getDb } from './db'

export type VaultEntityType = 'forum' | 'blog'

export interface VaultProofRecord {
  blockNumber: number
  chainNetwork: string
  entityType: VaultEntityType
  entityId: number
  postId: number
  contentHash: string
  previousHash: string
  vaultHash: string
  merkleRoot: string
  status: 'VERIFIED' | 'TAMPERED_CONTENT_MISMATCH' | 'NOT_NOTARIZED'
  notarizedAt: string
}

export interface VaultVerificationResult {
  verified: boolean
  status: 'VERIFIED' | 'TAMPERED_CONTENT_MISMATCH' | 'NOT_NOTARIZED'
  postTitle?: string | null
  proof: VaultProofRecord | null
}

function sha256(payload: string): string {
  return createHash('sha256').update(payload, 'utf8').digest('hex')
}

function computeContentHash(entityType: VaultEntityType, entityId: number, title: string, content: string): string {
  const normalized = `${entityType}:${entityId}:${String(title || '').trim()}:${String(content || '').trim()}`
  return sha256(normalized)
}

function extractRows(result: any): any[] {
  return Array.isArray(result) ? result : (result?.rows || [])
}

export class BlockchainService {
  private static schemaReady = false

  static async ensureSchema(dbInstance?: any) {
    if (this.schemaReady) return
    const db = dbInstance || (await getDb())
    if (!db) return

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dkp_vault_ledger (
        id SERIAL PRIMARY KEY,
        block_number INTEGER NOT NULL,
        entity_type VARCHAR(32) NOT NULL,
        entity_id INTEGER NOT NULL,
        content_hash VARCHAR(64) NOT NULL,
        previous_hash VARCHAR(64) NOT NULL,
        vault_hash VARCHAR(64) UNIQUE NOT NULL,
        merkle_root VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
        notarized_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).catch(() => null)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_dkp_vault_entity ON dkp_vault_ledger (entity_type, entity_id, id DESC);
    `).catch(() => null)

    await db.execute(sql`
      ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS vault_hash VARCHAR(128);
    `).catch(() => null)

    await db.execute(sql`
      ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS vault_block_number INTEGER;
    `).catch(() => null)

    this.schemaReady = true
  }

  private static async resolveBlogTable(db: any): Promise<string | null> {
    const res = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('blog_posts', 'articles', 'posts')
      ORDER BY CASE table_name
        WHEN 'blog_posts' THEN 1
        WHEN 'articles' THEN 2
        ELSE 3
      END
      LIMIT 1;
    `).catch(() => null)

    const rows = extractRows(res)
    return rows[0]?.table_name || null
  }

  static async notarizeEntity(
    dbInstance: any,
    params: {
      entityType: VaultEntityType
      entityId: number
      title: string
      content: string
    }
  ): Promise<VaultProofRecord> {
    const db = dbInstance || (await getDb())
    await this.ensureSchema(db)

    const { entityType, entityId, title, content } = params
    const contentHash = computeContentHash(entityType, entityId, title, content)

    const lastBlockRes = await db.execute(sql`
      SELECT block_number, vault_hash
      FROM dkp_vault_ledger
      ORDER BY block_number DESC, id DESC
      LIMIT 1;
    `)
    const lastBlock = extractRows(lastBlockRes)[0]

    const blockNumber = lastBlock ? Number(lastBlock.block_number) + 1 : 1
    const previousHash = lastBlock?.vault_hash || '0'.repeat(64)
    const vaultHash = sha256(`${blockNumber}:${previousHash}:${contentHash}`)
    const merkleRoot = sha256(`${contentHash}:${vaultHash}`)

    const insertedRes = await db.execute(sql`
      INSERT INTO dkp_vault_ledger (
        block_number, entity_type, entity_id, content_hash, previous_hash, vault_hash, merkle_root, status
      )
      VALUES (
        ${blockNumber}, ${entityType}, ${entityId}, ${contentHash}, ${previousHash}, ${vaultHash}, ${merkleRoot}, 'VERIFIED'
      )
      RETURNING notarized_at;
    `)
    const notarizedAt = extractRows(insertedRes)[0]?.notarized_at || new Date().toISOString()

    if (entityType === 'forum') {
      await db.execute(sql`
        UPDATE node_posts
        SET vault_hash = ${vaultHash}, vault_block_number = ${blockNumber}
        WHERE id = ${entityId};
      `).catch(() => null)
    } else if (entityType === 'blog') {
      const blogTable = await this.resolveBlogTable(db)
      if (blogTable) {
        await db.execute(
          sql.raw(`ALTER TABLE ${blogTable} ADD COLUMN IF NOT EXISTS vault_hash VARCHAR(128);`)
        ).catch(() => null)
        await db.execute(
          sql.raw(`ALTER TABLE ${blogTable} ADD COLUMN IF NOT EXISTS vault_block_number INTEGER;`)
        ).catch(() => null)
        await db.execute(
          sql.raw(`UPDATE ${blogTable} SET vault_hash = '${vaultHash}', vault_block_number = ${blockNumber} WHERE id = ${Number(entityId)};`)
        ).catch(() => null)
      }
    }

    return {
      blockNumber,
      chainNetwork: 'DKP-VAULT-MAINNET-v2.6',
      entityType,
      entityId,
      postId: entityId,
      contentHash,
      previousHash,
      vaultHash,
      merkleRoot,
      status: 'VERIFIED',
      notarizedAt: new Date(notarizedAt).toISOString()
    }
  }

  static async verifyEntity(
    dbInstance: any,
    params: {
      entityType?: VaultEntityType
      entityId?: number
      slug?: string
      hash?: string
    }
  ): Promise<VaultVerificationResult> {
    const db = dbInstance || (await getDb())
    await this.ensureSchema(db)

    if (params.hash) {
      const cleanHash = String(params.hash).trim()
      const ledgerRes = await db.execute(sql`
        SELECT *
        FROM dkp_vault_ledger
        WHERE vault_hash = ${cleanHash} OR content_hash = ${cleanHash}
        ORDER BY id DESC
        LIMIT 1;
      `)
      const ledger = extractRows(ledgerRes)[0]
      if (!ledger) {
        return { verified: false, status: 'NOT_NOTARIZED', postTitle: null, proof: null }
      }

      const entId = Number(ledger.entity_id)
      let foundTitle: string | null = null
      if (ledger.entity_type === 'forum') {
        const pRes = await db.execute(sql`SELECT title FROM node_posts WHERE id = ${entId} LIMIT 1;`).catch(() => null)
        foundTitle = extractRows(pRes)[0]?.title || null
      }

      return {
        verified: true,
        status: 'VERIFIED',
        postTitle: foundTitle,
        proof: {
          blockNumber: Number(ledger.block_number),
          chainNetwork: 'DKP-VAULT-MAINNET-v2.6',
          entityType: ledger.entity_type as VaultEntityType,
          entityId: entId,
          postId: entId,
          contentHash: ledger.content_hash,
          previousHash: ledger.previous_hash,
          vaultHash: ledger.vault_hash,
          merkleRoot: ledger.merkle_root,
          status: 'VERIFIED',
          notarizedAt: new Date(ledger.notarized_at).toISOString()
        }
      }
    }

    const entityType: VaultEntityType = params.entityType || 'forum'
    let targetId = params.entityId ? Number(params.entityId) : 0
    let liveTitle = ''
    let liveContent = ''
    let legacyHash: string | null = null

    if (entityType === 'forum' && targetId > 0) {
      const postRes = await db.execute(sql`
        SELECT id, title, content, vault_hash
        FROM node_posts
        WHERE id = ${targetId}
        LIMIT 1;
      `)
      const post = extractRows(postRes)[0]
      if (!post) return { verified: false, status: 'NOT_NOTARIZED', postTitle: null, proof: null }

      targetId = Number(post.id)
      liveTitle = post.title
      liveContent = post.content
      legacyHash = post.vault_hash || null
    } else if (entityType === 'blog') {
      const blogTable = await this.resolveBlogTable(db)
      if (!blogTable) return { verified: false, status: 'NOT_NOTARIZED', postTitle: null, proof: null }

      const blogRes = targetId > 0
        ? await db.execute(sql.raw(`SELECT * FROM ${blogTable} WHERE id = ${targetId} LIMIT 1;`))
        : params.slug
          ? await db.execute(sql.raw(`SELECT * FROM ${blogTable} WHERE slug = '${String(params.slug).replace(/'/g, "''")}' LIMIT 1;`))
          : null

      const article = extractRows(blogRes)[0]
      if (!article) return { verified: false, status: 'NOT_NOTARIZED', postTitle: null, proof: null }

      targetId = Number(article.id)
      liveTitle = article.title || ''
      liveContent = article.content || article.body || ''
      legacyHash = article.vault_hash || null
    }

    if (!targetId) {
      return { verified: false, status: 'NOT_NOTARIZED', postTitle: null, proof: null }
    }

    const ledgerRes = await db.execute(sql`
      SELECT *
      FROM dkp_vault_ledger
      WHERE entity_type = ${entityType} AND entity_id = ${targetId}
      ORDER BY id DESC
      LIMIT 1;
    `)
    const ledger = extractRows(ledgerRes)[0]

    if (!ledger) {
      if (legacyHash) {
        const migrated = await this.notarizeEntity(db, {
          entityType,
          entityId: targetId,
          title: liveTitle,
          content: liveContent
        })
        return { verified: true, status: 'VERIFIED', postTitle: liveTitle, proof: migrated }
      }
      return { verified: false, status: 'NOT_NOTARIZED', postTitle: liveTitle, proof: null }
    }

    const liveContentHash = computeContentHash(entityType, targetId, liveTitle, liveContent)
    const isIntact = liveContentHash === ledger.content_hash
    const status = isIntact ? 'VERIFIED' : 'TAMPERED_CONTENT_MISMATCH'

    return {
      verified: isIntact,
      status,
      postTitle: liveTitle,
      proof: {
        blockNumber: Number(ledger.block_number),
        chainNetwork: 'DKP-VAULT-MAINNET-v2.6',
        entityType,
        entityId: targetId,
        postId: targetId,
        contentHash: ledger.content_hash,
        previousHash: ledger.previous_hash,
        vaultHash: ledger.vault_hash,
        merkleRoot: ledger.merkle_root,
        status,
        notarizedAt: new Date(ledger.notarized_at).toISOString()
      }
    }
  }
}