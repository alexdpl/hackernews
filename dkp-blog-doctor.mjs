// dkp-blog-doctor.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Colori per il terminale
const c = {
  reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", cyan: "\x1b[36m", bold: "\x1b[1m"
}

console.log(`${c.cyan}${c.bold}🚀 DKP Blog Doctor - Avvio Diagnostica Ecosistema...${c.reset}\n`)

const dirsToCheck = [
  'server/api/blog',
  'server/api/admin/blog',
  'app/components/blog',
  'app/pages/admin/blog',
  'app/pages/blog'
]

let warnings = 0

// 1. Controllo Endpoint Duplicati / Conflitti
console.log(`${c.bold}🔍 1. Scansione Endpoint API (Conflitti Routing)${c.reset}`)
const apiDirs = ['server/api/blog', 'server/api/admin/blog']

apiDirs.forEach(apiDir => {
  const dirPath = path.join(__dirname, apiDir)
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts'))
    
    // Controlla se c'è un [id].delete.ts e un file.delete.ts nella stessa cartella (causa conflitti in h3)
    const hasDynamicDelete = files.some(f => f.includes('[id].delete.ts'))
    const staticDeletes = files.filter(f => f.includes('.delete.ts') && !f.includes('[id]'))

    if (hasDynamicDelete && staticDeletes.length > 0) {
      console.log(`  ${c.red}⚠️  ATTENZIONE in ${apiDir}:${c.reset} Hai un file dinamico [id].delete.ts e file statici come ${staticDeletes.join(', ')}. Questo causa conflitti in Nuxt Nitro!`)
      warnings++
    } else {
      console.log(`  ${c.green}✓ ${apiDir} OK (${files.length} endpoints)${c.reset}`)
    }
  }
})
console.log('')

// 2. Controllo Dati Mock Hardcodati (I "Fantasmi")
console.log(`${c.bold}👻 2. Scansione Dati Mock (File che impediscono l'uso reale del DB)${c.reset}`)
const vueDirs = ['app/pages/admin/blog', 'app/pages/blog', 'app/components/blog']

vueDirs.forEach(vDir => {
  const dirPath = path.join(__dirname, vDir)
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.vue'))
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // Cerchiamo pattern di array finti e blocchi catch che resettano i dati
      const hasMockPosts = content.includes('const posts = ref([') && content.includes('title:') && content.includes('id: 1')
      const hasMockCategories = content.includes('categories.value = [') && content.includes('id: 1')
      
      if (hasMockPosts || hasMockCategories) {
        console.log(`  ${c.yellow}⚠️  TROVATI DATI MOCK in: ${vDir}/${file}${c.reset}`)
        if (hasMockPosts) console.log(`     - Array 'posts' pre-compilato. Gli articoli cancellati torneranno al refresh!`)
        if (hasMockCategories) console.log(`     - Array 'categories' pre-compilato (probabilmente in un blocco catch).`)
        warnings++
      }
    })
  }
})
console.log('')

// 3. Responso Finale
if (warnings > 0) {
  console.log(`${c.red}${c.bold}🚨 Diagnosi Completata: Trovati ${warnings} problemi strutturali.${c.reset}`)
  console.log(`${c.yellow}💡 SOLUZIONE CONSIGLIATA:${c.reset}`)
  console.log(`   1. Elimina (o rinomina) eventuali endpoint API in conflitto.`)
  console.log(`   2. Apri i file .vue segnalati, cerca i dati finti e svuotali:`)
  console.log(`      Sostituisci: ${c.cyan}const posts = ref([{ id: 1, title: 'Finto' }]){c.reset}`)
  console.log(`      Con:         ${c.green}const posts = ref([])${c.reset}`)
} else {
  console.log(`${c.green}${c.bold}✨ Diagnosi Completata: Nessun problema strutturale evidente. Il Blog è pronto per scalare!${c.reset}`)
}