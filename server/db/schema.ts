// server/db/schema.ts
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

// Tabella per i Link inviati dagli utenti
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  by: text('by').default('anonymous').notNull(), // Aggiunto Autore
  score: integer('score').default(1).notNull(),  // Aggiunto Punteggio per Classifica
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabella per i Commenti
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  parentId: integer('parent_id'), 
  by: text('by').default('user_anon').notNull(),  // Aggiunto Autore del commento
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
