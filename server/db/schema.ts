import { 
  pgTable, 
  serial, 
  integer, 
  text, 
  timestamp, 
  unique, 
  type AnyPgColumn 
} from 'drizzle-orm/pg-core'

// 1. Tabella Posts (con colonna points per conteggio atomico O(1))
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'), // Rendiamo opzionale per gestire sia storie con link che post di testo "Ask HN"
  type: text('type').default('news').notNull(),
  points: integer('points').default(1).notNull(), // Permette letture veloci senza JOIN pesanti
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 2. Tabella Jobs
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  url: text('url'),
  text: text('text'),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 3. Tabella Commenti (supporta thread annidati con parentId)
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  parentId: integer('parent_id')
    .references((): AnyPgColumn => comments.id, { onDelete: 'cascade' }), // Self-reference per risposte ai commenti
  author: text('author').default('utente_anonimo').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 4. Tabella Upvotes Reali
export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  username: text('username').notNull(), // Mappato su IP o Sessione utente
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  // Vincolo di unicità: impedisce voti doppi dallo stesso utente sullo stesso post
  unique('unique_user_post_vote').on(table.postId, table.username)
])