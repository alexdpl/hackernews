
// server/db/schema.ts
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

// Tabella per i Link inviati dagli utenti
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabella per i Commenti
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  parentId: integer('parent_id'), // Per gestire le risposte ai commenti (struttura ad albero)
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});