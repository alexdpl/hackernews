import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'

// 1. Tabella POSTS (Storie, Ask, Show)
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'),
  text: text('text'),
  author: text('author').default('Anonimo'),
  points: integer('points').default(1),
  // Campo per distinguere il tipo: 'story' | 'ask' | 'show'
  type: text('type').default('story').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 2. Tabella COMMENTS (Commenti collegati ai Posts)
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  text: text('text').notNull(),
  author: text('author').default('Anonimo'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 3. Tabella JOBS (Offerte di Lavoro)
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'),
  text: text('text'),
  company: text('company'),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})