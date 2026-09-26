// scripts/package-saas.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const pluginsDir = path.resolve(process.cwd(), 'dkp-proprietary-plugins')
const downloadsDir = path.resolve(process.cwd(), 'public/downloads')

// Creazione cartella downloads se non esiste
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true })
}

// Mappatura dei 7 moduli SaaS
const plugins = [
  'dkp-automated-crawler-pro',
  'dkp-ecosystem-shop',
  'dkp-kernel-captcha',
  'dkp-native-blog-pro',
  'dkp-neural-playground',
  'dkp-pulse-nexus-pro',
  'dkp-translator-pro'
]

console.log('📦 Impacchettamento dei 7 moduli SaaS in public/downloads/...\n')

plugins.forEach((pluginFolder) => {
  const sourcePath = path.join(pluginsDir, pluginFolder)
  const zipFileName = `${pluginFolder}-v2.0.zip`
  const targetZipPath = path.join(downloadsDir, zipFileName)

  if (fs.existsSync(sourcePath)) {
    console.log(`⚡ Zipping: ${pluginFolder} -> ${zipFileName}`)
    
    // Comando PowerShell per compattare la cartella
    const psCommand = `powershell -Command "if (Test-Path '${targetZipPath}') { Remove-Item '${targetZipPath}' }; Compress-Archive -Path '${sourcePath}\\*' -DestinationPath '${targetZipPath}' -Force"`
    
    try {
      execSync(psCommand, { stdio: 'inherit' })
      console.log(`✅ Creato: ${zipFileName}\n`)
    } catch (err) {
      console.error(`❌ Errore in ${zipFileName}:`, err.message)
    }
  } else {
    console.warn(`⚠️ Cartella non trovata: ${sourcePath}`)
  }
})

console.log('🚀 Impacchettamento completato!')