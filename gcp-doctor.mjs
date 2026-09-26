import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log("🔥 INIZIO DIAGNOSTICA KERNEL GCP 🔥\n");

try {
    // 1. Controllo Git e Sincronizzazione
    console.log("🛠️ 1. Controllo stato Git...");
    const gitStatus = execSync('git status -uno').toString();
    const gitLog = execSync('git log -1 --oneline').toString();
    console.log(`Commit attuale GCP: ${gitLog.trim()}`);
    if (gitStatus.includes('up to date') || gitStatus.includes('aggiornato')) {
        console.log("✅ Git è allineato con il main.");
    } else {
        console.log("⚠️ ATTENZIONE: Git NON è allineato. Il pull precedente potrebbe essere fallito!\n", gitStatus);
    }

    // 2. Controllo fisico del file app.vue (per assicurarci che il fix sia arrivato)
    console.log("\n🛠️ 2. Controllo file app.vue sul server...");
    const appVuePath = path.resolve(process.cwd(), 'app/app.vue'); 
    // Nota: aggiusta il path in 'app.vue' se non è dentro la cartella 'app'
    const actualAppVuePath = fs.existsSync(appVuePath) ? appVuePath : path.resolve(process.cwd(), 'app.vue');
    
    if (fs.existsSync(actualAppVuePath)) {
        const appVueContent = fs.readFileSync(actualAppVuePath, 'utf-8');
        if (appVueContent.includes('LazyDkpPulseNexus') && !appVueContent.includes('let body: Record')) {
            console.log("✅ Il file app.vue su GCP contiene il codice pulito della v2.3.");
        } else {
            console.log("❌ ERRORE CRITICO: app.vue su GCP è vecchio o corrotto. Git pull non ha funzionato.");
        }
    } else {
        console.log("❌ ERRORE: File app.vue non trovato!");
    }

    // 3. Ispezione spietata del file .env
    console.log("\n🛠️ 3. Controllo variabili d'ambiente (.env)...");
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        if (envContent.includes('duck.dns.org') || envContent.includes('localhost:3000')) {
            console.log("🚨 ALLARME ROSSO: Trovato 'duck.dns.org' o 'localhost' nel .env di produzione!");
            const lines = envContent.split('\n').filter(l => l.includes('duck.dns.org') || l.includes('localhost'));
            console.log("👉 Righe incriminate da correggere:", lines);
        } else {
            console.log("✅ Nessun dominio vecchio trovato nel .env.");
        }
    } else {
        console.log("⚠️ Nessun file .env trovato (potrebbe essere corretto se usi variabili di sistema pm2/GCP).");
    }

    // 4. Verifica dello stato della Build
    console.log("\n🛠️ 4. Controllo ultima Build Nuxt...");
    const buildPath = path.resolve(process.cwd(), '.output');
    if (fs.existsSync(buildPath)) {
        const stats = fs.statSync(buildPath);
        console.log(`✅ Cartella .output presente. Generata il: ${stats.mtime}`);
    } else {
        console.log("❌ ERRORE: Cartella .output NON esiste. L'ultimo pnpm run build ha fallito.");
    }

} catch (e) {
    console.error("\n❌ ERRORE DURANTE L'ESECUZIONE DELLO SCRIPT:", e.message);
}

console.log("\n🚀 DIAGNOSTICA COMPLETATA 🚀");