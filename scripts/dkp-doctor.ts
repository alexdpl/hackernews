// scripts/dkp-doctors.ts
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

// Tenta il caricamento dinamico di dotenv senza bloccare lo script se manca
try {
  const dotenv = require('dotenv')
  dotenv.config()
} catch {
  // Se dotenv non è installato, legge manualmente il file .env se esiste
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf-8').split('\n')
    for (const line of envLines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
      }
    }
  }
}

const ROOT_DIR = process.cwd()
const IS_FIX_MODE = process.argv.includes('--fix')

// Utility per output formattato nel terminale
const log = {
  info: (msg: string) => console.log(`\x1b[36mℹ ${msg}\x1b[0m`),
  success: (msg: string) => console.log(`\x1b[32m✔ ${msg}\x1b[0m`),
  warn: (msg: string) => console.log(`\x1b[33m⚠ ${msg}\x1b[0m`),
  error: (msg: string) => console.log(`\x1b[31m✖ ${msg}\x1b[0m`),
  header: (msg: string) => console.log(`\n\x1b[35m=== 🛡️  ${msg} ===\x1b[0m\n`)
}

interface Issue {
  category: string
  message: string
  autoFixable: boolean
  fixFn?: () => void
}

const issues: Issue[] = []

async function runDiagnostics() {
  console.clear()
  console.log(`\x1b[1m\x1b[34m
======================================================
     ⚡ DKP SYSTEM DOCTOR v1.0 - PULSE NEXUS SUITE ⚡
======================================================
\x1b[0m`)

  if (IS_FIX_MODE) {
    log.info('Modalità AUTORIPARAZIONE attiva (--fix)')
  } else {
    log.info('Modalità DIAGNOSTICA (Usa "pnpm dkp:fix" per applicare la riparazione automatica)')
  }

  // 1. VERIFICA ALIAS NUXT 4 IN SERVER/
  log.header('1. Controllo Compatibilità Alias Nuxt 4 (~~/server vs ~/server)')
  checkServerAliasImports()

  // 2. VERIFICA CONFIGURAZIONE NUXT
  log.header('2. Verifica Configurazione nuxt.config.ts')
  checkNuxtConfig()

  // 3. VERIFICA ROTTE API E INFRASTRUTTURA BLOG
  log.header('3. Integrità Rotte API Blog')
  checkBlogApiRoutes()

  // 4. VERIFICA VARIABILI DI AMBIENTE
  log.header('4. Check Connessione & Variabili d\'Ambiente DB')
  checkEnvVariables()

  // 5. REPORT FINALE E RIPARAZIONE
  log.header('5. Esito Diagnostica & Azioni')
  if (issues.length === 0) {
    log.success('Nessun problema rilevato! Il sistema è totalmente sincronizzato.')
  } else {
    log.warn(`Trovati ${issues.length} disallineamenti:`)
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.category}] ${issue.message} ${issue.autoFixable ? '🔧 (Riparabile)' : ''}`)
    })

    if (IS_FIX_MODE) {
      log.info('\nEsecuzione autoriparazioni in corso...')
      let fixedCount = 0
      for (const issue of issues) {
        if (issue.autoFixable && issue.fixFn) {
          try {
            issue.fixFn()
            fixedCount++
          } catch (err: any) {
            log.error(`Errore durante il fix di [${issue.category}]: ${err.message}`)
          }
        }
      }
      log.success(`Riparazioni completate: ${fixedCount}/${issues.length} problemi risolti.`)

      log.info('Pulizia cache temporanea Nuxt in corso...')
      try {
        execSync('npx nuxi cleanup', { stdio: 'inherit' })
        log.success('Cache pulita con successo.')
      } catch {
        log.warn('Impossibile pulire automaticamente la cache .nuxt')
      }
    } else {
      log.info('\n💡 Per riparare automaticamente gli errori risolvibili, esegui:\n    pnpm dkp:fix\n')
    }
  }
}

// Check 1: Scansione import errati in server/
function checkServerAliasImports() {
  const serverDir = path.join(ROOT_DIR, 'server')
  if (!fs.existsSync(serverDir)) {
    log.warn('Cartella server/ non trovata nella radice del progetto.')
    return
  }

  const files = getAllFiles(serverDir)
  let invalidImportCount = 0

  files.forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes("from '~/server") || content.includes('from "~/server')) {
        invalidImportCount++
        issues.push({
          category: 'Nuxt 4 Alias',
          message: `Import incoerente in ${path.relative(ROOT_DIR, file)}: sostituire '~/server' con '~~/server'`,
          autoFixable: true,
          fixFn: () => {
            const updated = content.replace(/from (['"])~\/server/g, "from $1~~/server")
            fs.writeFileSync(file, updated, 'utf-8')
            log.success(`Corretto import in: ${path.relative(ROOT_DIR, file)}`)
          }
        })
      }
    }
  })

  if (invalidImportCount === 0) {
    log.success('Tutti gli import nella cartella server/ usano la sintassi compatibile Nuxt 4 (~~/server).')
  }
}

// Check 2: Controllo nuxt.config.ts
function checkNuxtConfig() {
  const configPath = path.join(ROOT_DIR, 'nuxt.config.ts')
  if (!fs.existsSync(configPath)) {
    log.error('File nuxt.config.ts non trovato!')
    return
  }

  const content = fs.readFileSync(configPath, 'utf-8')
  if (!content.includes('appManifest: false')) {
    issues.push({
      category: 'Nuxt Config',
      message: 'appManifest: false non impostato in experimental. Può causare errori #app-manifest in build.',
      autoFixable: false
    })
  } else {
    log.success('Configurazione experimental.appManifest: false corretta.')
  }
}

// Check 3: Controllo rotte API del Blog
function checkBlogApiRoutes() {
  const requiredRoutes = [
    { path: 'server/api/posts/index.get.ts', label: 'Lista Articoli (GET)' },
    { path: 'server/api/posts/[id].get.ts', label: 'Articolo Singolo (GET)' },
    { path: 'server/api/posts/[id].delete.ts', label: 'Eliminazione Articolo (DELETE)' }
  ]

  requiredRoutes.forEach(route => {
    const fullPath = path.join(ROOT_DIR, route.path)
    if (!fs.existsSync(fullPath)) {
      issues.push({
        category: 'Missing Route',
        message: `Rotta API mancante: ${route.label} (${route.path})`,
        autoFixable: false
      })
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8')
      if (!content.includes('getDb') && !content.includes('db')) {
        issues.push({
          category: 'Route Logic',
          message: `La rotta ${route.path} non richiama l'istanza DB (getDb/db).`,
          autoFixable: false
        })
      } else {
        log.success(`Rotta OK: ${route.label}`)
      }
    }
  })
}

// Check 4: Variabili d'Ambiente
function checkEnvVariables() {
  const dbUrl = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL
  if (!dbUrl) {
    issues.push({
      category: 'Environment',
      message: 'DATABASE_URL non impostata in .env o nelle variabili d\'ambiente!',
      autoFixable: false
    })
    log.error('DATABASE_URL mancante in .env!')
  } else {
    log.success(`DATABASE_URL rilevata (${dbUrl.substring(0, 20)}...)`)
  }
}

// Helper ricorsivo per la ricerca dei file
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles
  const files = fs.readdirSync(dirPath)

  files.forEach(file => {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles)
    } else {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

// Esecuzione
runDiagnostics().catch(console.error)