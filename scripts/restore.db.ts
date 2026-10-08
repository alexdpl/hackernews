// scripts/restore.db.ts
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import { blogCategories, blogSubcategories } from '../drizzle/schema' 

// Connessione diretta
const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const taxonomyData = [
  {
    name: "AI, LLM & Machine Learning",
    slug: "ai-llm-machine-learning",
    description: "Intelligenza Artificiale, RAG, e modelli locali.",
    icon: "🤖",
    color: "#00dc82",
    subcategories: [
      { name: "LLM Architecture", slug: "llm-architecture", description: "Architetture dei Large Language Models" },
      { name: "Local AI & Ollama", slug: "local-ai-ollama", description: "Esecuzione modelli open-source in locale" },
      { name: "Prompt Engineering", slug: "prompt-engineering", description: "Tecniche avanzate di prompting" },
      { name: "AI Agents", slug: "ai-agents", description: "Agenti autonomi e workflow AI" }
    ]
  },
  {
    name: "Cloud Native & DevOps",
    slug: "cloud-native-devops",
    description: "Infrastruttura, Kubernetes, Docker e CI/CD.",
    icon: "☁️",
    color: "#38bdf8",
    subcategories: [
      { name: "Docker & K8s", slug: "docker-k8s", description: "Containerizzazione e orchestrazione" },
      { name: "CI/CD Pipelines", slug: "cicd-pipelines", description: "Automazione del deployment" },
      { name: "GCP Architecture", slug: "gcp-architecture", description: "Infrastruttura su Google Cloud" },
      { name: "Infrastructure as Code", slug: "iac", description: "Terraform, Ansible e automazione" }
    ]
  },
  {
    name: "Cybersecurity & Vault",
    slug: "cybersecurity-vault",
    description: "Sicurezza informatica, crittografia e Zero Trust.",
    icon: "🛡️",
    color: "#ef4444",
    subcategories: [
      { name: "Zero Trust Architecture", slug: "zero-trust", description: "Sicurezza senza perimetro" },
      { name: "Penetration Testing", slug: "pentesting", description: "Analisi delle vulnerabilità" },
      { name: "Vault & Hashing", slug: "vault-hashing", description: "Gestione segreti e crittografia" },
      { name: "Web Security", slug: "web-security", description: "OWASP, XSS, CSRF, Injection" }
    ]
  },
  {
    name: "Blockchain & Web3",
    slug: "blockchain-web3",
    description: "DeFi, Smart Contracts e architetture decentralizzate.",
    icon: "⛓️",
    color: "#8b5cf6",
    subcategories: [
      { name: "Smart Contracts & Solidity", slug: "smart-contracts", description: "Sviluppo contratti su EVM" },
      { name: "DeFi Protocols", slug: "defi", description: "Finanza decentralizzata" },
      { name: "Zero-Knowledge Proofs", slug: "zkp", description: "Privacy e scalabilità crittografica" }
    ]
  },
  {
    name: "Frontend Architecture",
    slug: "frontend-architecture",
    description: "Sviluppo interfacce, framework e performance.",
    icon: "🎨",
    color: "#ec4899",
    subcategories: [
      { name: "Nuxt & Vue Ecosystem", slug: "nuxt-vue", description: "Il framework progressivo" },
      { name: "React & Next.js", slug: "react-next", description: "Ecosistema React" },
      { name: "Styling & Tailwind", slug: "styling", description: "CSS utility-first e design system" }
    ]
  }
];

async function seedDatabase() {
  console.log("🚀 Inizio Sincronizzazione Intelligente Database DKP Blog...\n")

  try {
    for (const cat of taxonomyData) {
      console.log(`Verifica categoria: ${cat.name}...`)

      // SOLUZIONE ANTI-CRASH: Usiamo select() standard invece di db.query
      const existingCats = await db.select()
        .from(blogCategories)
        .where(eq(blogCategories.slug, cat.slug))
        .limit(1)

      const existingCat = existingCats[0]
      let categoryId;

      if (existingCat) {
        console.log(`  └─ Già presente! Aggiorno i dettagli...`)
        await db.update(blogCategories).set({
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          color: cat.color
        }).where(eq(blogCategories.id, existingCat.id))
        
        categoryId = existingCat.id;
      } else {
        console.log(`  └─ Nuova Categoria! Inserimento in corso...`)
        const [insertedCat] = await db.insert(blogCategories).values({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
        }).returning()
        
        categoryId = insertedCat.id;
      }

      // 2. Verifica e Inserisci Sottocategorie in modo sicuro
      if (cat.subcategories && cat.subcategories.length > 0) {
        for (const sub of cat.subcategories) {
          
          // SOLUZIONE ANTI-CRASH: Usiamo select() standard
          const existingSubs = await db.select()
            .from(blogSubcategories)
            .where(eq(blogSubcategories.slug, sub.slug))
            .limit(1)

          const existingSub = existingSubs[0]

          if (existingSub) {
             await db.update(blogSubcategories).set({
               name: sub.name,
               description: sub.description
             }).where(eq(blogSubcategories.id, existingSub.id))
          } else {
             await db.insert(blogSubcategories).values({
               categoryId: categoryId,
               name: sub.name,
               slug: sub.slug,
               description: sub.description
             })
             console.log(`    └─ + Nuova Sottocategoria aggiunta: ${sub.name}`)
          }
        }
      }
    }

    console.log("\n✅ RIPRISTINO E SINCRONIZZAZIONE COMPLETATI CON SUCCESSO!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Errore critico durante la sincronizzazione:", error)
    process.exit(1)
  }
}

seedDatabase()