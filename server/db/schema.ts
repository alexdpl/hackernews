// server/db/schema.ts
import { pgTable, serial, text, integer, timestamp, varchar, jsonb, unique, numeric, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Enum per lo stato dell'ordine
export const orderStatusEnum = pgEnum('order_status', ['pending', 'completed', 'failed', 'refunded'])

// Enum per lo stato della licenza
export const licenseStatusEnum = pgEnum('license_status', ['active', 'suspended', 'revoked', 'expired'])

// Enum per il provider di pagamento
export const paymentProviderEnum = pgEnum('payment_provider', ['stripe', 'paypal'])

// 1. TABELLA UTENTI (Users + Gamification)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 20 }).default('user').notNull(), // 'user' | 'moderator' | 'admin'
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  reputation: integer('reputation').default(100).notNull(),
  xp: integer('xp').default(0).notNull(), // <--- RIPRISTINATO
  level: integer('level').default(1).notNull(), // <--- RIPRISTINATO
  githubHandle: varchar('github_handle', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 2. TABELLA POST (News, Ask, Show)
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'),
  content: text('content'),
  type: varchar('type', { length: 20 }).default('news').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  points: integer('points').default(1).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 3. TABELLA COMMENTI
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 4. TABELLA VOTI
export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  username: text('username').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueUserPostVote: unique('unique_user_post_vote').on(table.postId, table.username)
}))

// 5. TABELLA OFFERTE DI LAVORO
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

// 6. TABELLA CERTIFICATI VAULT DKP TOOLS
export const vaultCerts = pgTable('vault_certs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  toolType: varchar('tool_type', { length: 50 }).notNull(),
  title: text('title').notNull(),
  hash: text('hash').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 7. TABELLA PULSE STORIES
export const pulseStories = pgTable('pulse_stories', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'),
  domain: varchar('domain', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  author: varchar('author', { length: 255 }),
  authorId: integer('author_id'),
  points: integer('points').default(1),
  commentsCount: integer('comments_count').default(0),
  xpAwarded: integer('xp_awarded').default(0),
  createdAt: timestamp('created_at').defaultNow()
})

// 8. TABELLA PULSE CHAT MESSAGES (Ripristinata)
export const pulseChatMessages = pgTable('pulse_chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  username: varchar('username', { length: 100 }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 9. TABELLA PULSE USER XP (Ripristinata)
export const pulseUserXp = pgTable('pulse_user_xp', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 10. TABELLA ORDINI
export const orders = pgTable('orders', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  productId: varchar('product_id', { length: 100 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('EUR').notNull(),
  paymentProvider: paymentProviderEnum('payment_provider').notNull(),
  paymentIntentId: varchar('payment_intent_id', { length: 255 }).notNull().unique(),
  status: orderStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 11. TABELLA LICENZE SAAS
export const licenses = pgTable('licenses', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  licenseKey: varchar('license_key', { length: 64 }).notNull().unique(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  productId: varchar('product_id', { length: 100 }).notNull(),
  status: licenseStatusEnum('status').default('active').notNull(),
  downloadsCount: integer('downloads_count').default(0).notNull(),
  maxDownloads: integer('max_downloads').default(10).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at')
})