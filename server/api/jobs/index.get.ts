// server/api/jobs/index.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  // Lista di fallback/default per DKP Job Board v2.3
  const defaultJobs = [
    {
      id: 1,
      title: 'Senior Nuxt 4 & Vue Architect',
      company: 'DevKernelPulse Core',
      location: 'Remoto (EU)',
      salary: '€65,000 - €85,000',
      tags: ['Nuxt 4', 'TypeScript', 'Tailwind'],
      timeAgo: '1 giorno fa'
    },
    {
      id: 2,
      title: 'Fullstack Rust & Postgres Engineer',
      company: 'Neural Tech Labs',
      location: 'Milano / Hybrid',
      salary: '€50,000 - €70,000',
      tags: ['Rust', 'Postgres', 'WebAssembly'],
      timeAgo: '2 giorni fa'
    },
    {
      id: 3,
      title: 'AI / ML Infrastructure Lead',
      company: 'Pulse Systems',
      location: 'Remoto (IT)',
      salary: '€60,000 - €80,000',
      tags: ['Python', 'Docker', 'GCP', 'LLM'],
      timeAgo: '3 giorni fa'
    }
  ]

  try {
    const db = getDb()

    // 1. Assicura che la tabella 'jobs' esista nel DB Neon
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        salary VARCHAR(100),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 2. Auto-migrazione: Aggiunge le colonne mancanti se la tabella esisteva già
    await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location VARCHAR(255);`)
    await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary VARCHAR(100);`)
    await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tags TEXT[];`)

    // 3. Fetch via SQL nativo
    const res: any = await db.execute(sql`
      SELECT id, title, company, location, salary, tags, created_at AS "createdAt"
      FROM jobs
      ORDER BY created_at DESC
    `)

    const dbJobs = Array.isArray(res) ? res : (res?.rows || [])

    if (dbJobs && dbJobs.length > 0) {
      return dbJobs
    }
  } catch (err) {
    console.warn('⚠️ [JOBS DB WARN] Errore DB Neon, uso dati di fallback:', err)
  }

  return defaultJobs
})