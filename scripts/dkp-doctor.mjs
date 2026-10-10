// scripts/dkp-doctor.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Colori per il terminale
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

console.log(`${colors.cyan}==================================================${colors.reset}`);
console.log(`${colors.cyan}   🛠️  DKP NEXUS DIAGNOSTIC ENGINE - CLI v1.0   ${colors.reset}`);
console.log(`${colors.cyan}==================================================\n${colors.reset}`);

let issuesFound = 0;

// 1. CHECK FILE OBSOLETI (Da eliminare)
const obsoleteFiles = [
  'server/api/blog/categories.ts',
  'server/api/blog/categories.get.ts',
  'server/api/blog/categories.delete.ts',
  'server/api/blog/tags.get.ts',
  'server/api/blog/posts.get.ts',
  'server/api/admin/blog/posts.post.ts'
];

console.log(`${colors.blue}[1] Scansione File Obsoleti & Fantasmi...${colors.reset}`);
obsoleteFiles.forEach(file => {
  if (fs.existsSync(path.join(rootDir, file))) {
    console.log(`  ${colors.red}❌ TROVATO FILE OBSOLETO:${colors.reset} ${file} (DEVE ESSERE ELIMINATO)`);
    issuesFound++;
  }
});
if (issuesFound === 0) console.log(`  ${colors.green}✅ Nessun file fantasma trovato nella struttura API.${colors.reset}`);

// 2. CHECK FILE ESSENZIALI (Nuova Architettura)
console.log(`\n${colors.blue}[2] Verifica Nuova Architettura API...${colors.reset}`);
const requiredFiles = [
  'server/api/blog/posts/index.get.ts',
  'server/api/blog/posts/index.post.ts',
  'server/api/blog/posts/[slug].get.ts',
  'server/api/blog/categories/index.get.ts',
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(path.join(rootDir, file))) {
    console.log(`  ${colors.red}❌ FILE MANCANTE:${colors.reset} ${file}`);
    issuesFound++;
  } else {
    console.log(`  ${colors.green}✅ OK:${colors.reset} ${file}`);
  }
});

// 3. RICERCA VECCHIE CHIAMATE API NEI FILE VUE
console.log(`\n${colors.blue}[3] Deep Scan dei Componenti (Ricerca chiamate API errate)...${colors.reset}`);

const dirsToScan = ['app/pages', 'app/components', 'composables'];
const oldEndpoints = [
  '/api/admin/blog/posts.post',
  '/api/blog/posts.get',
  '/api/posts/',
  'blog_posts' // check if using wrong tables directly in strange places
];

function scanDirectory(directory) {
  const fullPath = path.join(rootDir, directory);
  if (!fs.existsSync(fullPath)) return;
  
  const files = fs.readdirSync(fullPath);
  
  files.forEach(file => {
    const filePath = path.join(fullPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(path.join(directory, file));
    } else if (file.endsWith('.vue') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      oldEndpoints.forEach(endpoint => {
        if (content.includes(endpoint)) {
          console.log(`  ${colors.yellow}⚠️  ALLARME in ${directory}/${file}:${colors.reset} Trovata chiamata a '${endpoint}'`);
          issuesFound++;
        }
      });
      
      // Controllo specifico per l'editor Utente vs Admin
      if (file.includes('Editor') || file.includes('create')) {
         if (content.includes('pulse_stories') || content.includes('posts')) {
             if (!content.includes('blog_posts')) {
                 console.log(`  ${colors.red}⚠️  POSSIBILE BUG DB in ${directory}/${file}:${colors.reset} Potrebbe star salvando nella tabella vecchia!`);
                 issuesFound++;
             }
         }
      }
    }
  });
}

dirsToScan.forEach(dir => scanDirectory(dir));

console.log(`\n${colors.cyan}==================================================${colors.reset}`);
if (issuesFound > 0) {
  console.log(`${colors.red}🚨 DIAGNOSTICA COMPLETATA: Trovati ${issuesFound} problemi da risolvere.${colors.reset}`);
  console.log(`${colors.yellow}👉 Suggerimento: Controlla l'editor della Dashboard Utente. Probabilmente punta ancora alle vecchie API!${colors.reset}`);
} else {
  console.log(`${colors.green}🟢 DIAGNOSTICA COMPLETATA: Il sistema sembra pulito!${colors.reset}`);
}
console.log(`${colors.cyan}==================================================${colors.reset}\n`);