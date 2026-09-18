// 1. Importa i tipi e le funzioni specifiche per PostgreSQL da pg-core
import { pgTable, serial, integer, text, timestamp, unique } from 'drizzle-orm/pg-core'

// Tabella dei Post
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Tabella dei Commenti
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  parentId: integer('parent_id'), // null per commenti principali
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Tabella per gestire gli Upvotes reali
export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  username: text('username').notNull(), // Verrà mappato sulla sessione utente in futuro
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  // Vincolo di unicità: previene voti duplicati dallo stesso utente sullo stesso post
  unique('unique_user_post_vote').on(table.postId, table.username)
])