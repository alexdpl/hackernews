// server/db/seed.ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { posts, users } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const initialNews = [
  {
    title: 'DevKernelPulse v2.0 Released: Modular SaaS Architecture with Nuxt 4 & GCP',
    url: 'https://devkernelpulse.org/blog',
    content: 'Rilasciata la versione 2.0 di DevKernelPulse con DKP Auth Core, 4 DKP Tools (Neural Playground, Terminal, AI Scanner, Proof of Code) e caching Nitro sub-100ms.',
    userId: 1,
    points: 42
  },
  {
    title: 'Nuxt 4.0 & NuxtHub: The Developer-First Evolution for Vue Applications',
    url: 'https://blog.logrocket.com/nuxt-4-0-whats-new-what-to-expect/',
    content: 'Analisi delle novità di Nuxt 4: struttura app/, prestazioni HMR con Vite, type safety avanzata e Server Routes con Nitro Engine.',
    userId: 1,
    points: 28
  },
  {
    title: 'PostgreSQL 17 Released: JSON_TABLE, Memory Vacuum Optimization & Incremental Backups',
    url: 'https://www.postgresql.org/about/news/postgresql-17-released-2936/',
    content: 'PostgreSQL 17 introduce il supporto a JSON_TABLE, riduce l\'impronta di memoria fino a 20x per il vacuum ed eleva il throughput I/O.',
    userId: 1,
    points: 35
  },
  {
    title: 'Building Autonomous AI Agents with Gemini 3.5 Flash & Low Latency LLMs',
    url: 'https://blog.google/innovation-and-ai/technology/ai/google-ai-updates-july-2026/',
    content: 'Come le nuove API Gemini con token-efficiency elevata stanno consentendo workflow agentici complessi direttamente nel frontend.',
    userId: 1,
    points: 19
  },
  {
    title: 'Proof of Code: How Cryptographic Hashing is Redefining Developer Meritocracy',
    url: 'https://devkernelpulse.org/tools/proof-of-code',
    content: 'Un\'esplorazione di come il sistema di notarizzazione Vault di DKP permette agli sviluppatori di certificare i loro contributi open source.',
    userId: 1,
    points: 51
  },
  {
    title: 'Rust in Production: Why Enterprise Backend Teams are Migrating Microservices',
    url: 'https://medium.com/topic/technology',
    content: 'Benchmarking delle prestazioni, consumo di memoria contenuto e zero-cost abstractions di Rust nei microservizi ad alto traffico.',
    userId: 1,
    points: 22
  },
  {
    title: 'Drizzle ORM vs Prisma: Zero-Overhead Type Safety with Neon Serverless Postgres',
    url: 'https://orm.drizzle.team',
    content: 'Perché Drizzle ORM è la scelta ideale per le serverless Edge function di Nitro e Neon Postgres rispetto ai tradizionali ORM.',
    userId: 1,
    points: 31
  },
  {
    title: 'Zero-Downtime Deployment Strategies with PM2 and Nginx on GCP Compute Engine',
    url: 'https://cloud.google.com/compute',
    content: 'Guida pratica all\'ottimizzazione del reverse proxy Nginx, gestione dei processi Node con PM2 e riavvio graceful dei server Web.',
    userId: 1,
    points: 17
  },
  {
    title: 'Optimizing Web Crawlers & Social Cards with Dynamic SSR OpenGraph Tags',
    url: 'https://devkernelpulse.org/sitemap.xml',
    content: 'Come garantire sub-100ms di latenza con Nitro SWR rules per LinkedIn, Twitter Cards e crawler di indicizzazione Google.',
    userId: 1,
    points: 14
  },
  {
    title: 'Small Language Models (SLMs) on Edge Devices: Running AI Locally',
    url: 'https://hqsoftwarelab.com/blog/latest-ai-developments/',
    content: 'I modelli locali ottimizzati per task specifici stanno sostituendo le enormi API cloud per compiti di refactoring e code-audit.',
    userId: 1,
    points: 25
  },
  {
    title: 'Designing Cyber-Dark Interfaces: Modern UX for Developers',
    url: 'https://devkernelpulse.org/tools/neural-playground',
    content: 'Principi di design per palette cromatiche #020420, #00dc82 e #38bdf8 orientate alla massima produttività notturna.',
    userId: 1,
    points: 18
  },
  {
    title: '[JOB] Senior Fullstack Engineer (Nuxt 4, Neon Postgres, GCP) - Remote EU',
    url: 'https://devkernelpulse.org/jobs',
    content: 'Stiamo cercando sviluppatori senior per espandere il kernel di DevKernelPulse e la suite DKP Tools. Candidature aperte via Proof of Code.',
    userId: 1,
    points: 40
  }
]

async function main() {
  console.log('⚡ Popolamento database Neon con le prime 12 notizie DKP v2.0...')
  for (const item of initialNews) {
    await db.insert(posts).values(item)
  }
  console.log('✅ Popolamento completato con successo!')
}

main().catch(console.error)