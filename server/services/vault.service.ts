// server/services/vault.service.ts
import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export interface VaultProofRecord {
  id: number
  blockNumber: number
  postId: number | null
  nodeSlug: string
  authorId: number | null
  vaultHash: string
  prevHash: string
  merkleRoot: string
  chainNetwork: string
  status: 'VERIFIED' | 'TAMPERED' | 'NOT_FOUND'
  notarizedAt: string
}

let vaultInitialized = false

function extractRows(res: any): any[] {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.rows)) return res.rows
  return []
}

function sha256Hex(payload: string): string {
  return createHash('sha256').update(payload, 'utf8').digest('hex')
}

export class VaultService {
  static async ensureForumVaultConnection(): Promise<boolean> {
    if (vaultInitialized) return true
    try {
      const db = await getDb()
      if (!db) return false

      await db.execute(sql`
        ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS vault_hash VARCHAR(64);
      `).catch(() => {})

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pulse_vault_ledger (
          id SERIAL PRIMARY KEY,
          block_number INTEGER NOT NULL,
          post_id INTEGER UNIQUE,
          node_slug VARCHAR(120) NOT NULL DEFAULT 'blockchain-vault',
          author_id INTEGER,
          content_hash VARCHAR(64) NOT NULL,
          vault_hash VARCHAR(64) UNIQUE NOT NULL,
          prev_hash VARCHAR(64) NOT NULL,
          merkle_root VARCHAR(64) NOT NULL,
          chain_network VARCHAR(60) NOT NULL DEFAULT 'DKP-VAULT-MAINNET-v2.6',
          notarized_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)

      const nodeCheck: any = await db.execute(sql`
        SELECT id FROM nodes WHERE slug = 'blockchain-vault' LIMIT 1;
      `)
      const existingNode = extractRows(nodeCheck)[0]

      if (!existingNode) {
        const colsRes: any = await db.execute(sql`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'nodes';
        `)
        const cols = new Set(extractRows(colsRes).map((r: any) => String(r.column_name)))

        // Cerca eventuale nodo padre Web3/Blockchain esistente per allineare parent_id e category
        let parentWeb3: any = null
        if (cols.has('parent_id')) {
          const parentRes: any = await db.execute(sql`
            SELECT id, category
            FROM nodes
            WHERE parent_id IS NULL
              AND (LOWER(slug) LIKE '%web3%' OR LOWER(slug) LIKE '%blockchain%' OR LOWER(name) LIKE '%web3%')
            ORDER BY id ASC
            LIMIT 1;
          `)
          parentWeb3 = extractRows(parentRes)[0] || null
        }

        const inheritedCategory = parentWeb3?.category || '2. Web3, Crypto & Blockchain'
        const inheritedParentId = parentWeb3?.id ? Number(parentWeb3.id) : null

        if (cols.has('parent_id') && cols.has('category') && cols.has('is_private')) {
          await db.execute(sql`
            INSERT INTO nodes (name, slug, description, icon, color, parent_id, category, subscribers_count, is_private)
            VALUES (
              'Proof-of-Code Vault',
              'blockchain-vault',
              'Nodo pubblico ufficiale di notarizzazione crittografica SHA-256, audit on-chain e verifica immutabile dei thread DKP.',
              '⛓️',
              '#10b981',
              ${inheritedParentId},
              ${inheritedCategory},
              1,
              false
            );
          `)
        } else if (cols.has('category') && cols.has('is_private')) {
          await db.execute(sql`
            INSERT INTO nodes (name, slug, description, icon, color, category, subscribers_count, is_private)
            VALUES (
              'Proof-of-Code Vault',
              'blockchain-vault',
              'Nodo pubblico ufficiale di notarizzazione crittografica SHA-256, audit on-chain e verifica immutabile dei thread DKP.',
              '⛓️',
              '#10b981',
              ${inheritedCategory},
              1,
              false
            );
          `)
        } else {
          await db.execute(sql`
            INSERT INTO nodes (name, slug, description, icon, color)
            VALUES (
              'Proof-of-Code Vault',
              'blockchain-vault',
              'Nodo pubblico ufficiale di notarizzazione crittografica SHA-256, audit on-chain e verifica immutabile dei thread DKP.',
              '⛓️',
              '#10b981'
            );
          `)
        }
      }

      vaultInitialized = true
      return true
    } catch (err: any) {
      console.error('⚠️ [VAULT INIT WARN]:', err?.message)
      return false
    }
  }

  static computeContentDigest(input: {
    postId: number
    nodeSlug: string
    authorId: number
    title: string
    content: string
  }): string {
    const canonical = JSON.stringify({
      v: 'DKP-VAULT-SHA256-v2.6',
      postId: Number(input.postId),
      nodeSlug: String(input.nodeSlug || 'general').trim().toLowerCase(),
      authorId: Number(input.authorId || 0),
      title: String(input.title || '').trim(),
      content: String(input.content || '').trim()
    })
    return sha256Hex(canonical)
  }

  static async notarizePost(postId: number): Promise<VaultProofRecord | null> {
    try {
      const db = await getDb()
      if (!db) return null

      const ok = await this.ensureForumVaultConnection()
      if (!ok) return null

      const postRes: any = await db.execute(sql`
        SELECT
          p.id,
          p.title,
          p.content,
          p.author_id,
          p.vault_hash,
          p.created_at,
          n.slug AS node_slug
        FROM node_posts p
        JOIN nodes n ON p.node_id = n.id
        WHERE p.id = ${postId}
        LIMIT 1;
      `)
      const post = extractRows(postRes)[0]
      if (!post) return null

      const existingLedgerRes: any = await db.execute(sql`
        SELECT * FROM pulse_vault_ledger WHERE post_id = ${postId} LIMIT 1;
      `)
      const existingLedger = extractRows(existingLedgerRes)[0]

      const currentContentHash = this.computeContentDigest({
        postId: Number(post.id),
        nodeSlug: post.node_slug,
        authorId: Number(post.author_id),
        title: post.title,
        content: post.content
      })

      if (existingLedger) {
        if (!post.vault_hash) {
          await db.execute(sql`
            UPDATE node_posts SET vault_hash = ${existingLedger.vault_hash} WHERE id = ${postId};
          `).catch(() => {})
        }
        return {
          id: Number(existingLedger.id),
          blockNumber: Number(existingLedger.block_number),
          postId: Number(existingLedger.post_id),
          nodeSlug: existingLedger.node_slug,
          authorId: existingLedger.author_id ? Number(existingLedger.author_id) : null,
          vaultHash: existingLedger.vault_hash,
          prevHash: existingLedger.prev_hash,
          merkleRoot: existingLedger.merkle_root,
          chainNetwork: existingLedger.chain_network,
          status: existingLedger.content_hash === currentContentHash ? 'VERIFIED' : 'TAMPERED',
          notarizedAt: existingLedger.notarized_at
        }
      }

      const tipRes: any = await db.execute(sql`
        SELECT block_number, vault_hash
        FROM pulse_vault_ledger
        ORDER BY block_number DESC
        LIMIT 1;
      `)
      const tip = extractRows(tipRes)[0]
      const prevHash = tip?.vault_hash || '0'.repeat(64)
      const blockNumber = Number(tip?.block_number || 0) + 1

      const vaultHash = sha256Hex(`${blockNumber}:${prevHash}:${currentContentHash}`)
      const merkleRoot = sha256Hex(`${prevHash}:${vaultHash}`)

      const insertRes: any = await db.execute(sql`
        INSERT INTO pulse_vault_ledger (
          block_number,
          post_id,
          node_slug,
          author_id,
          content_hash,
          vault_hash,
          prev_hash,
          merkle_root
        )
        VALUES (
          ${blockNumber},
          ${postId},
          ${post.node_slug},
          ${Number(post.author_id)},
          ${currentContentHash},
          ${vaultHash},
          ${prevHash},
          ${merkleRoot}
        )
        RETURNING *;
      `)

      const inserted = extractRows(insertRes)[0]

      await db.execute(sql`
        UPDATE node_posts
        SET vault_hash = ${vaultHash}
        WHERE id = ${postId};
      `).catch(() => {})

      return {
        id: Number(inserted.id),
        blockNumber: Number(inserted.block_number),
        postId: Number(inserted.post_id),
        nodeSlug: inserted.node_slug,
        authorId: inserted.author_id ? Number(inserted.author_id) : null,
        vaultHash: inserted.vault_hash,
        prevHash: inserted.prev_hash,
        merkleRoot: inserted.merkle_root,
        chainNetwork: inserted.chain_network,
        status: 'VERIFIED',
        notarizedAt: inserted.notarized_at
      }
    } catch (err: any) {
      console.error('⚠️ [VAULT NOTARIZE WARN]:', err?.message)
      return null
    }
  }

  static async syncUnnotarizedPosts(limit = 15): Promise<number> {
    try {
      const db = await getDb()
      if (!db) return 0

      const ok = await this.ensureForumVaultConnection()
      if (!ok) return 0

      const unhashedRes: any = await db.execute(sql`
        SELECT id
        FROM node_posts
        WHERE vault_hash IS NULL OR vault_hash = ''
        ORDER BY id ASC
        LIMIT ${limit};
      `)
      const rows = extractRows(unhashedRes)

      let count = 0
      for (const row of rows) {
        const proof = await this.notarizePost(Number(row.id))
        if (proof) count++
      }
      return count
    } catch {
      return 0
    }
  }

  static async verifyProof(params: { postId?: number; hash?: string }): Promise<{
    connected: boolean
    vaultNodeSlug: string
    proof: VaultProofRecord | null
    postTitle?: string
    authorUsername?: string
  }> {
    try {
      const db = await getDb()
      if (!db) {
        return { connected: false, vaultNodeSlug: 'blockchain-vault', proof: null }
      }

      await this.ensureForumVaultConnection()

      const ledgerRes: any = params.postId
        ? await db.execute(sql`
            SELECT l.*, p.title, p.content, p.author_id AS p_author_id, n.slug AS p_node_slug, u.username AS author_username
            FROM pulse_vault_ledger l
            LEFT JOIN node_posts p ON l.post_id = p.id
            LEFT JOIN nodes n ON p.node_id = n.id
            LEFT JOIN users u ON p.author_id = u.id
            WHERE l.post_id = ${Number(params.postId)}
            LIMIT 1;
          `)
        : await db.execute(sql`
            SELECT l.*, p.title, p.content, p.author_id AS p_author_id, n.slug AS p_node_slug, u.username AS author_username
            FROM pulse_vault_ledger l
            LEFT JOIN node_posts p ON l.post_id = p.id
            LEFT JOIN nodes n ON p.node_id = n.id
            LEFT JOIN users u ON p.author_id = u.id
            WHERE l.vault_hash = ${String(params.hash || '').trim().toLowerCase()}
            LIMIT 1;
          `)

      const row = extractRows(ledgerRes)[0]
      if (!row) {
        return { connected: true, vaultNodeSlug: 'blockchain-vault', proof: null }
      }

      let status: 'VERIFIED' | 'TAMPERED' = 'VERIFIED'
      if (row.title && row.content) {
        const recomputed = this.computeContentDigest({
          postId: Number(row.post_id),
          nodeSlug: row.p_node_slug || row.node_slug,
          authorId: Number(row.p_author_id || row.author_id || 0),
          title: row.title,
          content: row.content
        })
        if (recomputed !== row.content_hash) {
          status = 'TAMPERED'
        }
      }

      return {
        connected: true,
        vaultNodeSlug: 'blockchain-vault',
        postTitle: row.title || undefined,
        authorUsername: row.author_username || undefined,
        proof: {
          id: Number(row.id),
          blockNumber: Number(row.block_number),
          postId: row.post_id ? Number(row.post_id) : null,
          nodeSlug: row.node_slug,
          authorId: row.author_id ? Number(row.author_id) : null,
          vaultHash: row.vault_hash,
          prevHash: row.prev_hash,
          merkleRoot: row.merkle_root,
          chainNetwork: row.chain_network,
          status,
          notarizedAt: row.notarized_at
        }
      }
    } catch {
      return { connected: false, vaultNodeSlug: 'blockchain-vault', proof: null }
    }
  }
}