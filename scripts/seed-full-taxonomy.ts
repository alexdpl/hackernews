import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../server/db/schema'
import { eq } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL mancante in .env')
  process.exit(1)
}

const sql = neon(connectionString)
const db = drizzle(sql, { schema })

const fullTaxonomy = [
  {
    name: 'AI, LLM & Machine Learning',
    slug: 'ai-llm-machine-learning',
    description: 'Architetture LLM, agenti IA e modelli locali.',
    icon: '🤖',
    color: '#00dc82',
    subs: [
      { name: 'LLM Architecture', slug: 'llm-architecture' },
      { name: 'Local AI & Ollama', slug: 'local-ai-ollama' },
      { name: 'AI Agents & RAG', slug: 'ai-agents-rag' },
      { name: 'Fine-Tuning & Quantization', slug: 'fine-tuning-quantization' },
      { name: 'Prompt Engineering & SAST', slug: 'prompt-engineering-sast' }
    ]
  },
  {
    name: 'Blockchain & Web3',
    slug: 'blockchain-web3',
    description: 'Smart contract, infrastrutture decentralizzate e crittografia.',
    icon: '⚙️',
    color: '#f59e0b',
    subs: [
      { name: 'Smart Contracts & Solidity', slug: 'smart-contracts-solidity' },
      { name: 'Zero-Knowledge Proofs', slug: 'zero-knowledge-proofs' },
      { name: 'DeFi & Asset Tokenization', slug: 'defi-asset-tokenization' },
      { name: 'Layer 2 & Scaling', slug: 'layer-2-scaling' }
    ]
  },
  {
    name: 'Cloud Native & DevOps',
    slug: 'cloud-native-devops',
    description: 'Orchestratori, pipeline CI/CD e infrastruttura GCP/AWS.',
    icon: '☁️',
    color: '#38bdf8',
    subs: [
      { name: 'Docker & Kubernetes', slug: 'docker-kubernetes' },
      { name: 'CI/CD Pipelines', slug: 'cicd-pipelines' },
      { name: 'GCP & Cloud Infrastructure', slug: 'gcp-cloud-infrastructure' },
      { name: 'Infrastructure as Code (Terraform)', slug: 'iac-terraform' }
    ]
  },
  {
    name: 'Cybersecurity & Vault',
    slug: 'cybersecurity-vault',
    description: 'Sicurezza offensive/defensive, gestione vault e crittografia.',
    icon: '🛡️',
    color: '#8b5cf6',
    subs: [
      { name: 'Zero Trust Architecture', slug: 'zero-trust-architecture' },
      { name: 'Vault & Key Management', slug: 'vault-key-management' },
      { name: 'Threat Intelligence & SSE', slug: 'threat-intelligence-sse' },
      { name: 'Application Security (AppSec)', slug: 'application-security' }
    ]
  },
  {
    name: 'DKP Ecosystem & Releases',
    slug: 'dkp-ecosystem-releases',
    description: 'Changelog ufficiali, rilasci di versione e architettura DKP.',
    icon: '🚀',
    color: '#ec4899',
    subs: [
      { name: 'Core Releases & Patch', slug: 'core-releases-patch' },
      { name: 'Sentinel & Threat Stream', slug: 'sentinel-threat-stream' },
      { name: 'Pulse Nexus Protocol', slug: 'pulse-nexus-protocol' }
    ]
  },
  {
    name: 'Databases & Data Pipeline',
    slug: 'databases-data-pipeline',
    description: 'Neon PostgreSQL, Drizzle ORM, caching e streaming dati.',
    icon: '📊',
    color: '#10b981',
    subs: [
      { name: 'PostgreSQL & Neon DB', slug: 'postgresql-neon-db' },
      { name: 'Drizzle ORM & Migrations', slug: 'drizzle-orm-migrations' },
      { name: 'Redis & Caching Strategies', slug: 'redis-caching-strategies' },
      { name: 'ETL & Real-time Pipelines', slug: 'etl-realtime-pipelines' }
    ]
  },
  {
    name: 'Linguaggi di Programmazione & Framework',
    slug: 'linguaggi-programmazione-framework',
    description: 'TypeScript, Rust, Go e sviluppo di sistemi avanzati.',
    icon: '📦',
    color: '#f43f5e',
    subs: [
      { name: 'TypeScript & Node.js', slug: 'typescript-nodejs' },
      { name: 'Rust Engineering', slug: 'rust-engineering' },
      { name: 'Go Backend Systems', slug: 'go-backend-systems' },
      { name: 'Python for Systems', slug: 'python-for-systems' }
    ]
  },
  {
    name: 'Low-Level & Kernel Engineering',
    slug: 'low-level-kernel-engineering',
    description: 'Ottimizzazioni di memoria, kernel e programmazione di sistema.',
    icon: '🧬',
    color: '#6366f1',
    subs: [
      { name: 'Linux Kernel Modules', slug: 'linux-kernel-modules' },
      { name: 'Memory Management & eBPF', slug: 'memory-management-ebpf' },
      { name: 'System Calls & Performance', slug: 'system-calls-performance' }
    ]
  },
  {
    name: 'Tech & Architecture',
    slug: 'tech-architecture',
    description: 'Design pattern, architettura software e principi di sviluppo.',
    icon: '🧬',
    color: '#4410bc',
    subs: [
      { name: 'Software Architecture', slug: 'software-architecture' },
      { name: 'Microservices & Event-Driven', slug: 'microservices-event-driven' },
      { name: 'Domain-Driven Design (DDD)', slug: 'domain-driven-design' }
    ]
  },
  {
    name: 'Web Dev & Modern Frameworks',
    slug: 'web-dev-modern-frameworks',
    description: 'Nuxt 4, Vue 3, SSR e componenti ad alte prestazioni.',
    icon: '💻',
    color: '#06b6d4',
    subs: [
      { name: 'Nuxt 4 & Vue 3', slug: 'nuxt-4-vue-3' },
      { name: 'Server Side Rendering (SSR)', slug: 'ssr-performance' },
      { name: 'Tailwind CSS & UI Components', slug: 'tailwind-ui-components' }
    ]
  }
]

async function seedTaxonomy() {
  console.log('🌱 Popolamento tassonomia completa (10 Categorie + Sottocategorie)...')

  try {
    for (const catData of fullTaxonomy) {
      let category = await db.query.blogCategories.findFirst({
        where: eq(schema.blogCategories.slug, catData.slug)
      })

      if (!category) {
        const [inserted] = await db.insert(schema.blogCategories).values({
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          icon: catData.icon,
          color: catData.color
        }).returning()
        category = inserted
        console.log(`✅ Categoria creata: ${category.name}`)
      } else {
        console.log(`ℹ️ Categoria già presente: ${category.name}`)
      }

      for (const sub of catData.subs) {
        const existingSub = await db.query.blogSubcategories.findFirst({
          where: eq(schema.blogSubcategories.slug, sub.slug)
        })

        if (!existingSub) {
          await db.insert(schema.blogSubcategories).values({
            name: sub.name,
            slug: sub.slug,
            categoryId: category.id
          })
          console.log(`   └─ Sottocategoria: ${sub.name}`)
        }
      }
    }

    console.log('\n🚀 Tassonomia completa rigenerata con successo!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Errore durante il popolamento:', err)
    process.exit(1)
  }
}

seedTaxonomy()