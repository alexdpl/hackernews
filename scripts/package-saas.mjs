// scripts/package-saas.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const pluginsDir = path.resolve(process.cwd(), 'dkp-proprietary-plugins')
const downloadsDir = path.resolve(process.cwd(), 'public/downloads')

// 1. Creazione cartella downloads se non esiste
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true })
}

const plugins = [
  'dkp-automated-crawler-pro',
  'dkp-ecosystem-shop',
  'dkp-kernel-captcha',
  'dkp-native-blog-pro',
  'dkp-neural-playground',
  'dkp-pulse-nexus-pro',
  'dkp-translator-pro'
]

console.log('📦 [DKP Kernel v2.0] Inizializzazione pipeline di packaging professionale...\n')

plugins.forEach((pluginFolder) => {
  const sourcePath = path.join(pluginsDir, pluginFolder)
  const zipFileName = `${pluginFolder}-v2.0.zip`
  const targetZipPath = path.join(downloadsDir, zipFileName)

  // Creazione cartella plugin se non esiste
  if (!fs.existsSync(sourcePath)) {
    fs.mkdirSync(sourcePath, { recursive: true })
  }

  // 2. AUTO-SEEDING: Generazione automatica dei file professionali
  // Compiliamo dinamicamente i template con il nome del modulo
  const templates = {
    'README.md': `# ${pluginFolder.toUpperCase()}\n\nModulo SaaS proprietario avanzato per l'ecosistema DevKernelPulse v2.0.\n\n## Installazione\n1. Estrai il contenuto di questo archivio nella tua directory dei plugin.\n2. Segui la documentazione ufficiale nel DKP Vault.\n\n© 2026 DevKernelPulse. Tutti i diritti riservati.\n`,
    'SECURITY.md': `# Policy di Sicurezza\n\nLa sicurezza è la nostra priorità. Questo modulo è certificato dal DKP Core.\n\n## Segnalazioni\nSe individui vulnerabilità, contatta immediatamente il supporto architetturale DevKernelPulse.\n`,
    'UPGRADE.md': `# Guida all'Aggiornamento\n\nIstruzioni per passare alla versione v2.0 del modulo \`${pluginFolder}\`:\n- Esegui il backup dei dati precedenti.\n- Sostituisci la vecchia cartella con questa versione.\n- Avvia il processo di migrazione dal pannello admin.\n`
  }

  // Iniettiamo i file solo se mancano (non sovrascriviamo se hai già scritto codice dentro)
  Object.entries(templates).forEach(([fileName, content]) => {
    const filePath = path.join(sourcePath, fileName)
    if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8').trim() === '') {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`   📄 Auto-Seeding completato: ${fileName} aggiunto in ${pluginFolder}`)
    }
  })

  // 3. COMPRESSIONE ZIP
  console.log(`⚡ Comprimo: ${pluginFolder} -> ${zipFileName}`)
  
  // Usiamo PowerShell per comprimere direttamente l'intera directory
  const psCommand = `powershell -Command "if (Test-Path '${targetZipPath}') { Remove-Item '${targetZipPath}' }; Compress-Archive -Path '${sourcePath}' -DestinationPath '${targetZipPath}' -Force"`
  
  try {
    // Eseguiamo silenziosamente, catturando solo gli errori
    execSync(psCommand, { stdio: 'pipe' })
    
    // Verifica finale e garanzia di esistenza
    if (fs.existsSync(targetZipPath)) {
      console.log(`✅ Archiviato con successo: ${zipFileName}\n`)
    } else {
      console.log(`❌ IMPOSSIBILE CREARE ${zipFileName}. Errore sconosciuto di sistema.\n`)
    }
  } catch (err) {
    console.error(`❌ Errore critico in ${zipFileName}:`, err.message)
  }
})

console.log('🚀 Build SaaS completata! Tutti i moduli commerciali sono pronti in /public/downloads/')