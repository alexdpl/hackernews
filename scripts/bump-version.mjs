// scripts/bump-version.mjs
import fs from 'node:fs'
import path from 'node:path'

const dirsToScan = [
  'app',
  'server',
  'components',
  'composables',
  'pages',
  'layouts',
  'utils',
  'dkp-proprietary-plugins'
]

const rootFiles = ['package.json']

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return
  fs.readdirSync(dir).forEach(file => {
    const dirPath = path.join(dir, file)
    const stat = fs.statSync(dirPath)
    if (stat.isDirectory()) {
      walkDir(dirPath, callback)
    } else {
      callback(dirPath)
    }
  })
}

let modifiedCount = 0

function updateFileVersion(filePath) {
  if (!fs.existsSync(filePath)) return
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false

  // Sostituisci prima le stringhe a tre cifre (v2.0.0 -> v2.3.0)
  if (content.includes('v2.0.0')) {
    content = content.replaceAll('v2.0.0', 'v2.3.0')
    changed = true
  }

  // Sostituisci il numero di versione standard in package.json
  if (content.includes('"version": "2.0.0"')) {
    content = content.replaceAll('"version": "2.0.0"', '"version": "2.3.0"')
    changed = true
  }

  // Sostituisci le stringhe v2.0
  if (content.includes('v2.0')) {
    content = content.replaceAll('v2.0', 'v2.3')
    changed = true
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ Aggiornato a v2.3 in: ${path.relative(process.cwd(), filePath)}`)
    modifiedCount++
  }
}

// Scansiona le cartelle dell'applicazione
dirsToScan.forEach(dir => {
  walkDir(path.resolve(process.cwd(), dir), (filePath) => {
    if (filePath.endsWith('.vue') || filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.json') || filePath.endsWith('.md')) {
      updateFileVersion(filePath)
    }
  })
})

// Scansiona i file nella root
rootFiles.forEach(f => updateFileVersion(path.resolve(process.cwd(), f)))

console.log(`\n🎉 OPERAZIONE COMPLETATA! Aggiornati ${modifiedCount} file a DKP KERNEL v2.3! 🔥🚀`)