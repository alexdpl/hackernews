// server/db/shema.ts
import { pgTable, serial, text, integer, boolean, timestamp, varchar, jsonb, unique, numeric, pgEnum } from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm'

// -------------------------------------------------------------
// ENUMS
// -------------------------------------------------------------
export const orderStatusEnum = pgEnum('order_status', ['pending', 'completed', 'failed', 'refunded'])
export const licenseStatusEnum = pgEnum('license_status', ['active', 'suspended', 'revoked', 'expired'])
export const paymentProviderEnum = pgEnum('payment_provider', ['stripe', 'paypal'])

// -------------------------------------------------------------
// 1. TABELLA UTENTI (Users + Gamification)
// -------------------------------------------------------------
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 20 }).default('user').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  reputation: integer('reputation').default(100).notNull(),
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  badges: jsonb('badges').$type<string[]>().default([]),
  githubHandle: varchar('github_handle', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// -------------------------------------------------------------
// 2. CATEGORIE & BLOG v2.4-GOLD
// -------------------------------------------------------------

export const blogCategories = pgTable('blog_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }).default('i-heroicons-folder'),
  color: varchar('color', { length: 30 }).default('#10B981'),
  tags: jsonb('tags').$type<string[]>().default([]), // 🔥 AGGIUNTO: Array di Tags in formato JSONB
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const blogSubcategories = pgTable('blog_subcategories', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .references(() => blogCategories.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  categoryId: integer('category_id').references(() => blogCategories.id, { onDelete: 'set null' }),
  subcategoryId: integer('subcategory_id').references(() => blogSubcategories.id, { onDelete: 'set null' }),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]), // 🔥 AGGIUNTO: Array di Tags per gli articoli
  status: varchar('status', { length: 20 }).default('pending_vault').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  vaultCertificateId: varchar('vault_certificate_id', { length: 100 }),
  vaultHash: varchar('vault_hash', { length: 64 }),
  views: integer('views').default(0).notNull(),
  likes: integer('likes').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relazioni Drizzle per Query annidate del Blog
export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  subcategories: many(blogSubcategories),
  posts: many(blogPosts),
}))

export const blogSubcategoriesRelations = relations(blogSubcategories, ({ one, many }) => ({
  category: one(blogCategories, {
    fields: [blogSubcategories.categoryId],
    references: [blogCategories.id],
  }),
  posts: many(blogPosts),
}))

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  subcategory: one(blogSubcategories, {
    fields: [blogPosts.subcategoryId],
    references: [blogSubcategories.id],
  }),
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}))

// -------------------------------------------------------------
// 3. POSTS, COMMENTI, VOTI, JOBS, VAULT CERTS, STORIES & CHAT
// -------------------------------------------------------------
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'),
  content: text('content'),
  type: varchar('type', { length: 20 }).default('news').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  points: integer('points').default(1).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  username: text('username').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserPostVote: unique('unique_user_post_vote').on(table.postId, table.username),
}))

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company: varchar('company', { length: 100 }).notNull(),
  location: varchar('location', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).default('Remote').notNull(),
  applyUrl: text('apply_url').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const vaultCerts = pgTable('vault_certs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  toolType: varchar('tool_type', { length: 50 }).notNull(),
  title: text('title').notNull(),
  hash: text('hash').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

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
  createdAt: timestamp('created_at').defaultNow(),
})

export const pulseChatMessages = pgTable('pulse_chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  username: varchar('username', { length: 100 }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pulseUserXp = pgTable('pulse_user_xp', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// -------------------------------------------------------------
// 4. ORDINI, LICENZE & GAMIFICATION TRANSACTIONS
// -------------------------------------------------------------
export const orders = pgTable('orders', {
  id: text('id').default(sql`gen_random_uuid()`).primaryKey().notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  productId: varchar('product_id', { length: 100 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('EUR').notNull(),
  paymentProvider: paymentProviderEnum('payment_provider').notNull(),
  paymentIntentId: varchar('payment_intent_id', { length: 255 }).notNull().unique(),
  status: orderStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const licenses = pgTable('licenses', {
  id: text('id').default(sql`gen_random_uuid()`).primaryKey().notNull(),
  userId: integer('user_id').references(() => users.id),
  orderId: text('order_id').notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  productId: varchar('product_id', { length: 100 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  licenseKey: varchar('license_key', { length: 255 }).notNull().unique(),
  status: licenseStatusEnum('status').default('active').notNull(),
  downloadsCount: integer('downloads_count').default(0).notNull(),
  maxDownloads: integer('max_downloads').default(10).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
})

export const xpTransactions = pgTable('xp_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  points: integer('points').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})