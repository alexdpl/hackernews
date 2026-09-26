// scripts/fix-urls.mjs
import fs from 'node:fs'
import path from 'node:path'

const targetDomain = 'https://devkernelpulse.org'
const oldDomains = [
  'https://devkernelpulse.duckdns.org',
  'http://devkernelpulse.duckdns.org',
  'devkernelpulse.duckdns.org',
  'https://devkernelpulse.io',
  'http://devkernelpulse.io'
]

const dirsToScan = ['app', 'server', 'components', 'composables', 'pages', 'layouts', 'utils', 'dkp-proprietary-plugins']

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

dirsToScan.forEach(dir => {
  walkDir(path.resolve(process.cwd(), dir), (filePath) => {
    if (filePath.endsWith('.vue') || filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.json')) {
      let content = fs.readFileSync(filePath, 'utf8')
      let changed = false

      oldDomains.forEach(oldD => {
        if (content.includes(oldD)) {
          const regex = new RegExp(oldD.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')
          content = content.replace(regex, targetDomain)
          changed = true
        }
      })

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log(`✅ URL aggiornato in: ${path.relative(process.cwd(), filePath)}`)
        modifiedCount++
      }
    }
  })
})

console.log(`\n🎉 Scansione completata! Aggiornati ${modifiedCount} file con il dominio ufficiale: ${targetDomain}`)