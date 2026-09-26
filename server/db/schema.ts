// server/db/schema.ts
import { pgTable, serial, text, integer, timestamp, varchar, jsonb, unique } from 'drizzle-orm/pg-core'

// 1. TABELLA UTENTI (Users)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 20 }).default('user').notNull(), // 'user' | 'moderator' | 'admin'
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  reputation: integer('reputation').default(100).notNull(),
  githubHandle: varchar('github_handle', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 2. TABELLA POST (News, Ask, Show)
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'),
  content: text('content'),
  type: varchar('type', { length: 20 }).default('news').notNull(), // 'news' | 'ask' | 'show'
  userId: integer('user_id').references(() => users.id).notNull(),
  points: integer('points').default(1).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 3. TABELLA COMMENTI (Comments)
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 4. TABELLA VOTI (Votes - Gestione Voti e Prevenzione Duplicati)
export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  username: text('username').notNull(), // Memorizza l'IP o l'username del votante
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  // Vincolo UNIQUE: impedisce allo stesso utente/IP di votare più volte lo stesso post
  uniqueUserPostVote: unique('unique_user_post_vote').on(table.postId, table.username)
}))

// 5. TABELLA OFFERTE DI LAVORO (Jobs)
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company: varchar('company', { length: 100 }).notNull(),
  location: varchar('location', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).default('Remote').notNull(),
  applyUrl: text('apply_url').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 6. TABELLA CERTIFICATI VAULT DKP TOOLS (Vault Certs)
export const vaultCerts = pgTable('vault_certs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  toolType: varchar('tool_type', { length: 50 }).notNull(), // 'poc' | 'scanner' | 'snippet'
  title: text('title').notNull(),
  hash: text('hash').notNull(),
  metadata: jsonb('metadata'), // Punteggi AI, dettagli repository o configurazioni
  createdAt: timestamp('created_at').defaultNow().notNull()
})
