// server/api/tools/terminal-exec.post.ts
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { command, userId } = body
  const targetUserId = userId ? Number(userId) : 1

  if (!command) {
    return { success: false, output: '', error: 'Comando vuoto.', isError: true }
  }

  const cmd = command.trim().toLowerCase()
  let output = ''
  let earnedXp = 0
  let isError = false

  try {
    const db = await getDb()

    // 1. MOTORE DEI COMANDI
    if (cmd === 'help' || cmd === 'dkp help') {
      output = `📚 DKP Terminal v2.5-GOLD - Comandi Supportati:\n  dkp info       - Mostra dettagli del sistema\n  dkp ping       - Verifica latenza server e DB\n  dkp stats      - Visualizza il tuo livello XP attuale\n  clear          - Pulisce la console\n\n💡 Prova il comando segreto "dkp hack" per guadagnare XP extra!`
    } 
    else if (cmd === 'dkp info') {
      output = `🛠️ DevKernelPulse (DKP) OS v2.5-GOLD\n- Engine: Nuxt 4 Nitro Serverless\n- Database: PostgreSQL (Neon DB)\n- Security: Proof-of-Code Vault Active\n- Gamification: Enabled`
    }
    else if (cmd === 'dkp ping') {
      const start = performance.now()
      await db.execute(sql`SELECT 1`)
      const latenza = Math.round(performance.now() - start)
      output = `PONG 🏓\n- API Gateway: Risposta OK\n- Neon DB Latency: ${latenza}ms`
    }
    else if (cmd === 'dkp stats') {
      const userRecord = await db.select({ xp: users.xp }).from(users).where(eq(users.id, targetUserId)).limit(1)
      const currentXp = userRecord[0]?.xp || 0
      output = `📊 Statistiche Profilo:\n- Utente ID: ${targetUserId}\n- Total XP: ${currentXp} ✨\nUsa gli AI Tools e il Vault per scalare la classifica!`
    }
    else if (cmd === 'dkp hack') {
      output = `👨‍💻 SYSTEM OVERRIDE SUCCESSFUL!\nHai sbloccato il comando segreto. Ti sono stati accreditati +50 XP bonus.`
      earnedXp = 50
    }
    else {
      output = `bash: ${cmd}: command not found\nDigita "help" per la lista dei comandi.`
      isError = true
    }

    // 2. GAMIFICATION
    if (!isError) {
      const finalXp = earnedXp > 0 ? earnedXp : 5
      
      await db.update(users).set({ xp: sql`COALESCE(xp, 0) + ${finalXp}` }).where(eq(users.id, targetUserId))
      await db.insert(xpTransactions).values({
        userId: targetUserId,
        action: `Terminal Command: ${cmd.substring(0, 20)}`,
        points: finalXp
      })
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    return {
      success: true,
      output: output,
      isError: isError
    }
  } catch (err: any) {
    console.error('[TERMINAL ERR]', err)
    return { success: false, output: 'Errore interno del server durante esecuzione comando.', isError: true }
  }
})