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
    tags: "ai, llm, machine learning, deep learning, neural networks, gpt-4, openai, llama-3, anthropic, claude, huggingface, pytorch, tensorflow, rag, vector database, prompt engineering, langchain, llamaindex, autonomous agents, nlp, computer vision, mlops, reinforcement learning, generative ai, midjourney, stable diffusion, fine-tuning, qlora, peft, edge ai, ai ethics, data science, pandas, numpy, scikit-learn, jupyter, transformers, whisper, chatgpt, copilot, tabnine, ai coding, embeddings, similarity search, semantic search, ai security, prompt injection, ai agents, agi, open source ai".split(", "),
    subcategories: [
      { name: "LLM Architecture", slug: "llm-architecture", description: "Architetture dei Large Language Models" },
      { name: "Local AI & Ollama", slug: "local-ai-ollama", description: "Esecuzione modelli open-source in locale" },
      { name: "Prompt Engineering", slug: "prompt-engineering", description: "Tecniche avanzate di prompting" },
      { name: "AI Agents", slug: "ai-agents", description: "Agenti autonomi e workflow AI" },
      { name: "NLP & Computer Vision", slug: "nlp-vision", description: "Elaborazione linguaggio e immagini" },
      { name: "RAG & Vector DBs", slug: "rag-vector-dbs", description: "Retrieval-Augmented Generation" },
      { name: "MLOps", slug: "mlops", description: "Deploy e gestione modelli in produzione" },
      { name: "Model Fine-Tuning", slug: "model-fine-tuning", description: "Adattamento modelli (LoRA, QLoRA)" },
      { name: "Generative Art & Audio", slug: "gen-art-audio", description: "Generazione media tramite AI" },
      { name: "Data Science & Analysis", slug: "data-science", description: "Analisi esplorativa e statistica" },
      { name: "Reinforcement Learning", slug: "reinforcement-learning", description: "Apprendimento per rinforzo" },
      { name: "AI Ethics & Safety", slug: "ai-ethics", description: "Sicurezza e bias nell'IA" },
      { name: "Edge AI", slug: "edge-ai", description: "AI su dispositivi embedded e mobile" },
      { name: "Transformers Deep Dive", slug: "transformers", description: "Il cuore dell'AI moderna" },
      { name: "AI Development Tools", slug: "ai-tools", description: "Strumenti per sviluppatori AI" }
    ]
  },
  {
    name: "Cloud Native & DevOps",
    slug: "cloud-native-devops",
    description: "Infrastruttura, Kubernetes, Docker e CI/CD.",
    icon: "☁️",
    color: "#38bdf8",
    tags: "cloud, devops, cloud native, kubernetes, k8s, docker, containers, microservices, aws, gcp, azure, google cloud, amazon web services, ci/cd, github actions, gitlab ci, jenkins, circleci, terraform, ansible, infrastructure as code, iac, serverless, lambda, cloudflare, vercel, netlify, service mesh, istio, linkerd, observability, monitoring, prometheus, grafana, datadog, new relic, splunk, elk stack, logstash, kibana, sre, site reliability engineering, finops, edge computing, gitops, argocd, flux, helm, docker compose, nginx, traefik, haproxy, linux, bash, shell scripting, system administration, load balancing, auto-scaling".split(", "),
    subcategories: [
      { name: "Docker & Containers", slug: "docker-containers", description: "Containerizzazione applicazioni" },
      { name: "Kubernetes (K8s)", slug: "kubernetes", description: "Orchestrazione container" },
      { name: "CI/CD Pipelines", slug: "cicd-pipelines", description: "Automazione del deployment" },
      { name: "GCP Architecture", slug: "gcp-architecture", description: "Google Cloud Platform" },
      { name: "AWS Architecture", slug: "aws-architecture", description: "Amazon Web Services" },
      { name: "Azure Solutions", slug: "azure-solutions", description: "Microsoft Azure" },
      { name: "Infrastructure as Code", slug: "iac", description: "Terraform, Ansible, Pulumi" },
      { name: "Serverless & Edge", slug: "serverless-edge", description: "Funzioni e computazione edge" },
      { name: "Service Mesh", slug: "service-mesh", description: "Istio, Linkerd, Consul" },
      { name: "Observability", slug: "observability", description: "Monitoraggio, Logging, Tracing" },
      { name: "Site Reliability (SRE)", slug: "sre", description: "Affidabilità dei sistemi" },
      { name: "GitOps", slug: "gitops", description: "ArgoCD, Flux e deployment dichiarativo" },
      { name: "FinOps", slug: "finops", description: "Ottimizzazione costi cloud" },
      { name: "Linux & SysAdmin", slug: "linux-sysadmin", description: "Gestione server e OS" },
      { name: "Networking & Load Balancing", slug: "networking", description: "Routing e bilanciamento" }
    ]
  },
  {
    name: "Cybersecurity & Vault",
    slug: "cybersecurity-vault",
    description: "Sicurezza informatica, crittografia e Zero Trust.",
    icon: "🛡️",
    color: "#ef4444",
    tags: "cybersecurity, infosec, security, zero trust, pentesting, penetration testing, hacking, ethical hacking, red team, blue team, purple team, owasp, xss, sqli, csrf, ssrf, injection, cryptography, hashing, encryption, jwt, oauth, saml, sso, identity access management, iam, vault, hashicorp vault, secrets management, malware analysis, incident response, forensics, devsecops, cloud security, cspm, social engineering, phishing, nmap, wireshark, burp suite, kali linux, metasploit, cve, vulnerabilities, patch management, compliance, gdpr, hipaa, soc2, threat intelligence, ransomware, ddos, botnets, waf, firewall".split(", "),
    subcategories: [
      { name: "Zero Trust Architecture", slug: "zero-trust", description: "Sicurezza senza perimetro" },
      { name: "Penetration Testing", slug: "pentesting", description: "Analisi e test vulnerabilità" },
      { name: "Vault & Secrets", slug: "vault-secrets", description: "Gestione sicura chiavi e token" },
      { name: "Web Application Security", slug: "web-security", description: "OWASP e protezione frontend/backend" },
      { name: "Network Security", slug: "network-security", description: "Firewall, WAF e protocolli" },
      { name: "Cryptography", slug: "cryptography", description: "Cifratura, firme e algoritmi" },
      { name: "Identity & Access (IAM)", slug: "iam", description: "Autenticazione e Autorizzazione" },
      { name: "Incident Response", slug: "incident-response", description: "Gestione attacchi in corso" },
      { name: "Malware Analysis", slug: "malware-analysis", description: "Reverse engineering malware" },
      { name: "DevSecOps", slug: "devsecops", description: "Sicurezza integrata nella CI/CD" },
      { name: "Cloud Security", slug: "cloud-security", description: "Protezione ambienti Cloud" },
      { name: "Social Engineering", slug: "social-engineering", description: "Phishing e fattore umano" },
      { name: "Digital Forensics", slug: "forensics", description: "Indagini post-breach" },
      { name: "Threat Intelligence", slug: "threat-intelligence", description: "Analisi delle minacce globali" },
      { name: "Compliance & Audit", slug: "compliance", description: "GDPR, SOC2, ISO27001" }
    ]
  },
  {
    name: "Blockchain & Web3",
    slug: "blockchain-web3",
    description: "DeFi, Smart Contracts e architetture decentralizzate.",
    icon: "⛓️",
    color: "#8b5cf6",
    tags: "blockchain, web3, crypto, cryptocurrency, bitcoin, ethereum, solana, polkadot, smart contracts, solidity, rust, vyper, defi, decentralized finance, zkp, zero knowledge proofs, rollups, layer 2, l2, nft, tokens, erc20, erc721, consensus algorithms, pow, pos, web3 wallets, metamask, walletconnect, dao, decentralized autonomous organization, ipfs, arweave, decentralized storage, web3.js, ethers.js, viem, wagmi, hardhat, foundry, truffle, ganache, blockchain security, smart contract auditing, reentrancy, oracles, chainlink, the graph, tokenomics, enterprise blockchain, hyperledger, corda, cbdc".split(", "),
    subcategories: [
      { name: "Smart Contracts", slug: "smart-contracts", description: "Sviluppo Solidity, Rust e Vyper" },
      { name: "DeFi Protocols", slug: "defi", description: "Finanza decentralizzata e DEX" },
      { name: "Zero-Knowledge Proofs", slug: "zkp", description: "Privacy e scalabilità crittografica" },
      { name: "Ethereum Ecosystem", slug: "ethereum", description: "EVM, Layer 2 e Rollups" },
      { name: "Solana Ecosystem", slug: "solana", description: "Sviluppo su network Solana" },
      { name: "Web3 Frontend", slug: "web3-frontend", description: "Integrazione dApp (Wagmi, Ethers)" },
      { name: "NFTs & Digital Assets", slug: "nfts", description: "Standard token e mercati" },
      { name: "DAOs & Governance", slug: "daos", description: "Organizzazioni autonome" },
      { name: "Blockchain Security", slug: "blockchain-security", description: "Auditing e vulnerabilità Web3" },
      { name: "Consensus Mechanisms", slug: "consensus", description: "PoW, PoS e tolleranza bizantina" },
      { name: "Oracles & Data", slug: "oracles", description: "Chainlink e dati off-chain" },
      { name: "Decentralized Storage", slug: "decentralized-storage", description: "IPFS, Filecoin, Arweave" },
      { name: "Tokenomics", slug: "tokenomics", description: "Economia dei token" },
      { name: "Enterprise Blockchain", slug: "enterprise-blockchain", description: "Hyperledger e reti private" },
      { name: "Cryptography in Web3", slug: "web3-crypto", description: "Crittografia applicata" }
    ]
  },
  {
    name: "Frontend Architecture",
    slug: "frontend-architecture",
    description: "Sviluppo interfacce, framework e performance.",
    icon: "🎨",
    color: "#ec4899",
    tags: "frontend, ui, ux, javascript, typescript, web development, html, css, sass, tailwindcss, bootstrap, vuejs, vue3, nuxtjs, nuxt3, react, reactjs, nextjs, svelte, sveltekit, angular, solidjs, alpinejs, htmx, web assembly, wasm, micro-frontends, pwa, progressive web apps, webgl, three.js, canvas, svg, accessibility, a11y, aria, state management, pinia, redux, zustand, vuex, build tools, vite, webpack, rollup, esbuild, testing, jest, vitest, cypress, playwright, testing library, performance, core web vitals, seo, server side rendering, ssr, ssg, static site generation, jamstack, responsive design, css grid, flexbox, animations, framer motion, gsap".split(", "),
    subcategories: [
      { name: "Nuxt & Vue Ecosystem", slug: "nuxt-vue", description: "Sviluppo con Vue 3 e Nuxt" },
      { name: "React & Next.js", slug: "react-next", description: "Ecosistema React e meta-frameworks" },
      { name: "Styling & CSS", slug: "styling-css", description: "Tailwind, Sass, CSS-in-JS" },
      { name: "State Management", slug: "state-management", description: "Pinia, Redux, Zustand" },
      { name: "Web Performance", slug: "web-performance", description: "Core Web Vitals e ottimizzazioni" },
      { name: "Accessibility (a11y)", slug: "accessibility", description: "Sviluppo inclusivo e ARIA" },
      { name: "Build Tools", slug: "build-tools", description: "Vite, Webpack, Rollup" },
      { name: "Frontend Testing", slug: "frontend-testing", description: "Vitest, Cypress, Playwright" },
      { name: "Micro-Frontends", slug: "micro-frontends", description: "Architetture UI distribuite" },
      { name: "PWA & Offline", slug: "pwa", description: "Progressive Web Apps" },
      { name: "WebGL & 3D", slug: "webgl-3d", description: "Three.js e grafica nel browser" },
      { name: "WebAssembly (Wasm)", slug: "wasm", description: "Performance native sul web" },
      { name: "UI/UX Engineering", slug: "ui-ux", description: "Design systems e user experience" },
      { name: "Animations", slug: "animations", description: "GSAP, Framer Motion, CSS Anim" },
      { name: "SEO & Meta", slug: "seo", description: "Ottimizzazione motori di ricerca" }
    ]
  },
  {
    name: "Backend & Microservices",
    slug: "backend-microservices",
    description: "Architetture lato server, API e scalabilità.",
    icon: "⚙️",
    color: "#f59e0b",
    tags: "backend, server, microservices, api, rest, graphql, grpc, websockets, nodejs, bun, deno, express, nestjs, fastify, python, django, fastapi, flask, golang, go, rust, java, spring boot, csharp, dotnet, ruby on rails, php, laravel, event driven architecture, cqrs, event sourcing, message brokers, kafka, rabbitmq, activemq, redis pubsub, celery, background jobs, serverless functions, api gateway, kong, apigee, authentication, authorization, jwt, oauth2, caching, redis, memcached, load balancing, reverse proxy, scalability, high availability, fault tolerance, ddd, domain driven design, mvc, webhooks".split(", "),
    subcategories: [
      { name: "Node.js, Bun & Deno", slug: "node-bun-deno", description: "Runtime JavaScript lato server" },
      { name: "Python Backend", slug: "python-backend", description: "FastAPI, Django, Flask" },
      { name: "Go & Rust", slug: "go-rust", description: "Sistemi ad alte prestazioni" },
      { name: "Java & .NET", slug: "java-dotnet", description: "Sviluppo Enterprise" },
      { name: "API Design", slug: "api-design", description: "REST, GraphQL e best practices" },
      { name: "Real-time & gRPC", slug: "real-time-grpc", description: "WebSockets, SSE e gRPC" },
      { name: "Event-Driven & CQRS", slug: "event-driven", description: "Architetture ad eventi" },
      { name: "Message Brokers", slug: "message-brokers", description: "Kafka, RabbitMQ, SQS" },
      { name: "Auth & Identity", slug: "auth-identity", description: "Gestione sessioni e JWT" },
      { name: "Caching Strategies", slug: "caching", description: "Redis e ottimizzazione letture" },
      { name: "API Gateways", slug: "api-gateways", description: "Gestione e routing API" },
      { name: "Background Processing", slug: "background-processing", description: "Job queues e worker" },
      { name: "Microservices Patterns", slug: "microservices-patterns", description: "Saga, Circuit Breaker" },
      { name: "Serverless Compute", slug: "serverless", description: "AWS Lambda, Cloud Functions" },
      { name: "High Availability", slug: "high-availability", description: "Fault tolerance e scalabilità" }
    ]
  },
  {
    name: "Database & Data Engineering",
    slug: "database-data",
    description: "Database relazionali, NoSQL, pipeline dati e ORM.",
    icon: "💾",
    color: "#6366f1",
    tags: "database, dbms, sql, nosql, relational, postgresql, mysql, mariadb, sqlite, neon, supabase, document db, mongodb, couchdb, key-value, redis, dynamodb, wide-column, cassandra, scylladb, graph db, neo4j, time-series, influxdb, timescale, vector db, pinecone, milvus, qdrant, weaviate, data engineering, etl, elt, data warehouse, snowflake, bigquery, redshift, data lake, apache spark, hadoop, apache flink, kafka streams, orm, drizzle, prisma, typeorm, sequelize, sqlalchemy, hibernate, entity framework, migrations, database design, normalization, indexing, performance tuning, sharding, replication, acid, cap theorem".split(", "),
    subcategories: [
      { name: "Relational DBs (SQL)", slug: "sql-dbs", description: "PostgreSQL, MySQL, SQLite" },
      { name: "NoSQL & Document", slug: "nosql", description: "MongoDB, DynamoDB" },
      { name: "Vector Databases", slug: "vector-dbs", description: "Ricerca semantica per AI" },
      { name: "Graph Databases", slug: "graph-dbs", description: "Neo4j e dati interconnessi" },
      { name: "Time-Series & Caching", slug: "time-series-caching", description: "Redis, InfluxDB" },
      { name: "ORMs & Query Builders", slug: "orms", description: "Drizzle, Prisma, TypeORM" },
      { name: "Database Performance", slug: "db-performance", description: "Indici, query tuning e scaling" },
      { name: "Data Warehousing", slug: "data-warehouse", description: "BigQuery, Snowflake" },
      { name: "Data Pipelines (ETL)", slug: "etl-pipelines", description: "Integrazione ed elaborazione dati" },
      { name: "Big Data & Streaming", slug: "big-data", description: "Spark, Flink, Kafka Streams" },
      { name: "Database Migrations", slug: "migrations", description: "Gestione versioni schema" },
      { name: "Replication & Sharding", slug: "replication-sharding", description: "Scaling orizzontale" },
      { name: "Data Governance", slug: "data-governance", description: "Qualità e conformità dei dati" },
      { name: "In-Memory Data Grids", slug: "in-memory", description: "Calcolo distribuito in memoria" },
      { name: "DB Security", slug: "db-security", description: "Cifratura e accessi ai dati" }
    ]
  },
  {
    name: "Mobile Development",
    slug: "mobile-development",
    description: "Sviluppo app native, cross-platform e ottimizzazione.",
    icon: "📱",
    color: "#10b981",
    tags: "mobile, app development, ios, android, cross platform, native, react native, expo, flutter, dart, swift, swiftui, kotlin, jetpack compose, objective-c, java, kotlin multiplatform, kmp, ionic, capacitor, tauri, mobile security, app store, google play, aso, app store optimization, mobile ci/cd, fastlane, bitrise, augmented reality, arkit, arcore, wearables, watchos, wearos, iot, bluetooth low energy, ble, mobile testing, appium, detox, offline first, sqlite mobile, push notifications, fcm, apns, in-app purchases, biometrics, mobile performance, memory leaks".split(", "),
    subcategories: [
      { name: "React Native & Expo", slug: "react-native", description: "Sviluppo app con React" },
      { name: "Flutter & Dart", slug: "flutter", description: "Ecosistema Flutter" },
      { name: "Swift & iOS Native", slug: "swift-ios", description: "Sviluppo ecosistema Apple" },
      { name: "Kotlin & Android", slug: "kotlin-android", description: "Sviluppo nativo Google" },
      { name: "Kotlin Multiplatform", slug: "kmp", description: "Condivisione logica business" },
      { name: "Mobile Security", slug: "mobile-security", description: "Protezione app e jailbreak" },
      { name: "App Store & ASO", slug: "app-store", description: "Pubblicazione e visibilità" },
      { name: "Mobile CI/CD", slug: "mobile-cicd", description: "Fastlane, Bitrise e automazione" },
      { name: "Augmented Reality", slug: "ar-mobile", description: "ARKit e ARCore" },
      { name: "IoT & Bluetooth", slug: "iot-ble", description: "Integrazione hardware" },
      { name: "Wearables", slug: "wearables", description: "Apple Watch e WearOS" },
      { name: "Offline-First Apps", slug: "offline-first", description: "Sincronizzazione locale" },
      { name: "Push Notifications", slug: "push-notifications", description: "FCM, APNs e engagement" },
      { name: "Mobile Testing", slug: "mobile-testing", description: "Appium, Detox, XCTest" },
      { name: "Hardware Features", slug: "hardware-features", description: "Fotocamera, Sensori, Biometria" }
    ]
  },
  {
    name: "Software Engineering & Architecture",
    slug: "software-engineering",
    description: "Design pattern, clean code e metodologie.",
    icon: "📐",
    color: "#64748b",
    tags: "software engineering, architecture, system design, design patterns, clean code, clean architecture, hexagonal architecture, solid principles, dry, kiss, yagni, domain driven design, ddd, test driven development, tdd, bdd, agile, scrum, kanban, extreme programming, xp, open source, oss, code review, refactoring, technical debt, uml, sequence diagrams, c4 model, functional programming, fp, object oriented programming, oop, memory management, garbage collection, concurrency, multithreading, async, parallelism, scalability, trade-offs, algorithms, data structures, leetcode".split(", "),
    subcategories: [
      { name: "System Design", slug: "system-design", description: "Progettazione sistemi scalabili" },
      { name: "Design Patterns", slug: "design-patterns", description: "GoF e pattern architetturali" },
      { name: "Clean Code & SOLID", slug: "clean-code", description: "Qualità del codice" },
      { name: "Domain-Driven Design", slug: "ddd", description: "Modellazione del dominio" },
      { name: "Test-Driven Dev (TDD)", slug: "tdd", description: "Sviluppo guidato dai test" },
      { name: "Agile & Scrum", slug: "agile", description: "Metodologie di lavoro" },
      { name: "Open Source", slug: "open-source", description: "Contribuire a progetti OSS" },
      { name: "Code Review & Git", slug: "code-review", description: "Collaborazione e versioning" },
      { name: "Refactoring & Tech Debt", slug: "refactoring", description: "Mantenibilità e pulizia" },
      { name: "Modeling & UML", slug: "modeling", description: "C4 Model e documentazione" },
      { name: "Functional Programming", slug: "functional", description: "Paradigma funzionale" },
      { name: "OOP", slug: "oop", description: "Programmazione orientata agli oggetti" },
      { name: "Concurrency & Async", slug: "concurrency", description: "Multithreading e parallelismo" },
      { name: "Algorithms & Data Structs", slug: "algorithms", description: "Fondamenti di informatica" },
      { name: "Memory Management", slug: "memory-management", description: "Garbage collection e puntatori" }
    ]
  },
  {
    name: "Game Development",
    slug: "game-development",
    description: "Motori grafici, fisica, rendering 3D e design.",
    icon: "🎮",
    color: "#84cc16",
    tags: "game development, gamedev, unity, unity3d, c#, unreal engine, c++, blueprints, godot, gdscript, html5 games, phaser, webgl, shaders, glsl, hlsl, game physics, rigidbodies, colliders, game ai, pathfinding, navmesh, behavior trees, multiplayer, netcode, photon, procedural generation, perlin noise, game design, level design, monetization, f2p, vr, virtual reality, ar, xr, oculus, audio engineering, fmod, wwise, 2d animation, spine2d, pixel art, 3d modeling, blender, maya, textures, materials, pbr, rendering pipeline".split(", "),
    subcategories: [
      { name: "Unity 3D", slug: "unity", description: "Sviluppo con motore Unity" },
      { name: "Unreal Engine", slug: "unreal", description: "C++ e Blueprints" },
      { name: "Godot Engine", slug: "godot", description: "Motore open-source emergente" },
      { name: "Web & HTML5 Games", slug: "web-games", description: "Phaser e giochi browser" },
      { name: "Shader Programming", slug: "shaders", description: "GLSL, HLSL e grafica avanzata" },
      { name: "Game Physics", slug: "game-physics", description: "Motori fisici e collisioni" },
      { name: "Game AI", slug: "game-ai", description: "Pathfinding e Behavior Trees" },
      { name: "Multiplayer & Netcode", slug: "multiplayer", description: "Sincronizzazione e server" },
      { name: "Procedural Generation", slug: "procedural", description: "Generazione mondi algoritmica" },
      { name: "Game Design", slug: "game-design", description: "Meccaniche e bilanciamento" },
      { name: "VR & AR", slug: "vr-ar", description: "Realtà virtuale ed estesa" },
      { name: "Audio Engineering", slug: "audio", description: "FMOD, Wwise e sound design" },
      { name: "2D Art & Animation", slug: "2d-art", description: "Pixel art e animazione" },
      { name: "3D Modeling", slug: "3d-modeling", description: "Blender, texturing e rigging" },
      { name: "Game Monetization", slug: "monetization", description: "Economia e pubblicazione" }
    ]
  },
  {
    name: "IT Career & Tech Leadership",
    slug: "career-leadership",
    description: "Crescita professionale, management e soft skills.",
    icon: "👔",
    color: "#a855f7",
    tags: "career, tech leadership, engineering management, em, tech lead, staff engineer, principal engineer, developer productivity, developer experience, dx, remote work, asynchronous communication, hiring, interviewing, coding interviews, system design interviews, mentorship, onboarding, tech startup, startup ecosystem, entrepreneurship, freelancing, consulting, public speaking, devrel, developer relations, developer advocacy, technical writing, blogging, burnout, mental health, salary negotiation, personal branding, resume, cv, networking, future of work, remote culture, imposter syndrome".split(", "),
    subcategories: [
      { name: "Engineering Management", slug: "engineering-management", description: "Gestione team tech" },
      { name: "Tech Lead Skills", slug: "tech-lead", description: "Guida tecnica e architetturale" },
      { name: "Developer Productivity", slug: "productivity", description: "Workflow e DevEx" },
      { name: "Remote Work", slug: "remote-work", description: "Lavoro asincrono e team distribuiti" },
      { name: "Hiring & Interviews", slug: "hiring", description: "Colloqui tecnici e recruiting" },
      { name: "Mentorship", slug: "mentorship", description: "Crescita di sviluppatori junior" },
      { name: "Tech Startup", slug: "startup", description: "Ecosistema startup e MVP" },
      { name: "Freelancing", slug: "freelancing", description: "Consulenza e gestione clienti" },
      { name: "Public Speaking", slug: "public-speaking", description: "Conferenze e presentazioni" },
      { name: "DevRel & Advocacy", slug: "devrel", description: "Gestione community tech" },
      { name: "Technical Writing", slug: "tech-writing", description: "Blogging e documentazione" },
      { name: "Mental Health & Burnout", slug: "mental-health", description: "Benessere nello sviluppo" },
      { name: "Salary Negotiation", slug: "salary", description: "Contratti e compensation" },
      { name: "Personal Branding", slug: "personal-branding", description: "Costruire visibilità online" },
      { name: "Future of Work", slug: "future-of-work", description: "Trend e carriere del futuro" }
    ]
  }
];

async function seedDatabase() {
  console.log("🚀 Inizio Sincronizzazione Intelligente Database DKP Blog...")
  console.log("📦 Target: 11 Categorie | 164 Sottocategorie | 600+ Tag\n")

  try {
    for (const cat of taxonomyData) {
      console.log(`\n🔹 Verifica categoria: ${cat.icon} ${cat.name}...`)

      // SOLUZIONE ANTI-CRASH: Usiamo select() standard invece di db.query
      const existingCats = await db.select()
        .from(blogCategories)
        .where(eq(blogCategories.slug, cat.slug))
        .limit(1)

      const existingCat = existingCats[0]
      let categoryId;

      if (existingCat) {
        console.log(`  └─ Già presente! Aggiorno i dettagli e inietto i TAG...`)
        await db.update(blogCategories).set({
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          tags: cat.tags // 🔥 Iniettiamo i TAG nell'aggiornamento
        }).where(eq(blogCategories.id, existingCat.id))
        
        categoryId = existingCat.id;
      } else {
        console.log(`  └─ Nuova Categoria! Inserimento in corso con TAG...`)
        const [insertedCat] = await db.insert(blogCategories).values({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          tags: cat.tags // 🔥 Iniettiamo i TAG nella creazione
        }).returning()
        
        categoryId = insertedCat.id;
      }

      // 2. Verifica e Inserisci Sottocategorie in modo sicuro
      if (cat.subcategories && cat.subcategories.length > 0) {
        let subAdded = 0;
        let subUpdated = 0;
        for (const sub of cat.subcategories) {
          
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
             subUpdated++;
          } else {
             await db.insert(blogSubcategories).values({
               categoryId: categoryId,
               name: sub.name,
               slug: sub.slug,
               description: sub.description
             })
             subAdded++;
          }
        }
        console.log(`  └─ Sottocategorie: ${subAdded} Nuove | ${subUpdated} Aggiornate | ${cat.tags.length} Tag mappati.`)
      }
    }

    console.log("\n✅ RIPRISTINO E SINCRONIZZAZIONE COMPLETATI CON SUCCESSO!")
    console.log("🔥 Tutte le 11 categorie e le 165 sottocategorie sono ora allineate con oltre 600 tag pronti per l'auto-suggest!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Errore critico durante la sincronizzazione:", error)
    process.exit(1)
  }
}

seedDatabase()