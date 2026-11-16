// server/utils/dkpComments.ts
import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { sql } from 'drizzle-orm'

let schemaSynchronized = false

export interface DkpSessionUser {
  id: number
  username: string
  role: string
  isAdmin: boolean
}

export function extractSqlRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export function parseSessionUser(event: H3Event): DkpSessionUser | null {
  const rawCookie = getCookie(event, 'dkp_session')
  if (!rawCookie) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(rawCookie))
    const username = String(parsed?.username || '').trim()
    const id = Number(parsed?.id || 0)
    const role = String(parsed?.role || 'user').trim().toLowerCase()
    if (!username && !id) return null

    return {
      id: Number.isNaN(id) ? 0 : id,
      username: username || 'community',
      role,
      isAdmin: role === 'admin' || username.toLowerCase() === 'alexdpl'
    }
  } catch {
    return null
  }
}

export async function ensureUnifiedCommentsSchema(db: any) {
  if (schemaSynchronized || !db) return

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NULL,
      parent_id INT NULL,
      target_type VARCHAR(50) NOT NULL DEFAULT 'post',
      author VARCHAR(255) NOT NULL DEFAULT 'community',
      text TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NULL
    );
  `)

  // Migrazione colonne non distruttiva per allineare tabelle legacy su Neon DB
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS post_id INT;`)
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id INT NULL;`)
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INT NULL;`)
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) DEFAULT 'post';`)
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS author VARCHAR(255) DEFAULT 'community';`)
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS text TEXT DEFAULT '';`)
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';`)
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`)
  await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NULL;`)

  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_comments_post_target ON comments(post_id, target_type);`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);`)

  // Rende user_id nullable se in origine era NOT NULL e sincronizza content <-> text e author
  await db.execute(sql`
    DO $$
    BEGIN
      BEGIN
        ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;
      EXCEPTION WHEN others THEN
        NULL;
      END;

      UPDATE comments
      SET text = content
      WHERE (text IS NULL OR text = '') AND content IS NOT NULL AND content <> '';

      UPDATE comments
      SET content = text
      WHERE (content IS NULL OR content = '') AND text IS NOT NULL AND text <> '';

      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        UPDATE comments c
        SET author = u.username
        FROM users u
        WHERE c.user_id = u.id
          AND (c.author IS NULL OR c.author = '' OR c.author = 'community')
          AND u.username IS NOT NULL;
      END IF;
    EXCEPTION WHEN others THEN
      NULL;
    END $$;
  `)

  schemaSynchronized = true
}