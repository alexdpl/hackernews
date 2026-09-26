// drizzle/schema.ts
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'

// Tabella Storico Messaggi Chat Community & Pulse Agent
export const pulseChatMessages = pgTable('pulse_chat_messages', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  text: text('text').notNull(),
  xpEarned: integer('xp_earned').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Tabella Gamification XP & Livelli Utente
export const pulseUserXp = pgTable('pulse_user_xp', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  xp: integer('xp').default(150).notNull(),
  level: integer('level').default(1).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})