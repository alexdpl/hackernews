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
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false

    // Sostituisci le stringhe a tre cifre (v2.0.0 / v2.3.0 -> v2.5.0-gold)
    if (content.includes('v2.0.0') || content.includes('v2.3.0')) {
      content = content.replaceAll('v2.0.0', 'v2.5.0-gold').replaceAll('v2.3.0', 'v2.5.0-gold')
      changed = true
    }

    // Sostituisci il numero di versione standard in package.json
    if (content.includes('"version": "2.0.0"') || content.includes('"version": "2.3.0"') || content.includes('"version": "2.4.0"')) {
      content = content.replaceAll('"version": "2.0.0"', '"version": "2.5.0"')
                       .replaceAll('"version": "2.3.0"', '"version": "2.5.0"')
                       .replaceAll('"version": "2.4.0"', '"version": "2.5.0"')
      changed = true
    }

    // Sostituisci le stringhe v2.0 / v2.3 / v2.4 con v2.5-gold
    if (content.includes('v2.0') || content.includes('v2.3') || content.includes('v2.4')) {
      content = content.replaceAll('v2.4', 'v2.5-gold')
                       .replaceAll('v2.3', 'v2.5-gold')
                       .replaceAll('v2.0', 'v2.5-gold')
      changed = true
    }

    if (changed) {
      // Scrittura atomica blindata con file descriptor (Risoluzione CodeQL race condition)
      const fd = fs.openSync(filePath, 'w', 0o600)
      fs.writeFileSync(fd, content, 'utf8')
      fs.closeSync(fd)

      console.log(`✅ Aggiornato a v2.5-Gold in: ${path.relative(process.cwd(), filePath)}`)
      modifiedCount++
    }
  } catch (err) {
    console.warn(`⚠️ [BUMP WARN] Impossibile aggiornare ${filePath}:`, err.message)
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

console.log(`\n🎉 OPERAZIONE COMPLETATA! Aggiornati ${modifiedCount} file a DKP KERNEL v2.5-GOLD! 🔥🚀`)