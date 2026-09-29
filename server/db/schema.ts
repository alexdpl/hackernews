// server/db/schema.ts
import { pgTable, serial, text, integer, timestamp, varchar, jsonb, unique, numeric, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Enum per lo stato dell'ordine
export const orderStatusEnum = pgEnum('order_status', ['pending', 'completed', 'failed', 'refunded'])

// Enum per lo stato della licenza
export const licenseStatusEnum = pgEnum('license_status', ['active', 'suspended', 'revoked', 'expired'])

// Enum per il provider di pagamento
export const paymentProviderEnum = pgEnum('payment_provider', ['stripe', 'paypal'])

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

export const pulseStories = pgTable('pulse_stories', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'),
  domain: varchar('domain', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(), // 'news', 'ask', 'show', 'jobs'
  
  // -- GAMIFICATION & ECOSYSTEM LAYER --
  author: varchar('author', { length: 255 }), // Nome autore (da HN, Dev.to o user DKP)
  authorId: integer('author_id'), // ID dell'utente DKP (se è un post nativo, null se da crawler)
  points: integer('points').default(1), // Upvotes
  commentsCount: integer('comments_count').default(0), // Contatore cache per performance
  xpAwarded: integer('xp_awarded').default(0), // Punti XP distribuiti per questo post
  
  createdAt: timestamp('created_at').defaultNow(),
})

/**
 * TABELLA ORDINI (Tracciamento Transazioni Finanziarie)
 */
export const orders = pgTable('orders', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  productId: varchar('product_id', { length: 100 }).notNull(), // es. 'dkp-automated-crawler-pro'
  productName: varchar('product_name', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // es. 199.00
  currency: varchar('currency', { length: 10 }).default('EUR').notNull(),
  paymentProvider: paymentProviderEnum('payment_provider').notNull(), // 'stripe' | 'paypal'
  paymentIntentId: varchar('payment_intent_id', { length: 255 }).notNull().unique(), // Stripe Session ID o PayPal Order ID
  status: orderStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

/**
 * TABELLA LICENZE SAAS (Gestione Chiavi, Download e Permessi)
 */
export const licenses = pgTable('licenses', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  licenseKey: varchar('license_key', { length: 64 }).notNull().unique(), // es. 'DKP-CRW-8F3A-91BC-2026'
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  productId: varchar('product_id', { length: 100 }).notNull(),
  status: licenseStatusEnum('status').default('active').notNull(),
  downloadsCount: integer('downloads_count').default(0).notNull(),
  maxDownloads: integer('max_downloads').default(10).notNull(), // -1 per illimitati
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at') // NULL = Licenza Lifetime
})