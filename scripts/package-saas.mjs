// scripts/package-saas.mjs
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const pluginsDir = path.resolve('./dkp-proprietary-plugins')
const outputDir = path.resolve('./public/downloads')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

console.log('📦 Avvio Impacchettamento Plugin SaaS DKP v2.0...\n')

const plugins = fs.readdirSync(pluginsDir)

plugins.forEach(plugin => {
  const pluginPath = path.join(pluginsDir, plugin)
  if (fs.statSync(pluginPath).isDirectory()) {
    const zipName = `${plugin}-v2.0.zip`
    const zipPath = path.join(outputDir, zipName)

    console.log(`⚡ Generazione archivio: ${zipName}...`)
    try {
      if (process.platform === 'win32') {
        execSync(`powershell Compress-Archive -Path "${pluginPath}\\*" -DestinationPath "${zipPath}" -Force`)
      } else {
        execSync(`zip -r "${zipPath}" "${pluginPath}"`)
      }
      console.log(`✅ ${zipName} creato con successo in public/downloads/\n`)
    } catch (err) {
      console.error(`❌ Errore durante la creazione di ${zipName}:`, err.message)
    }
  }
})

console.log('🚀 Tutti i plugin SaaS sono stati impacchettati e sono pronti per lo DKP Shop!')