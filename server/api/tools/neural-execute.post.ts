// server/api/tools/neural-execute.post.ts
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { model, systemPrompt, userPrompt, temperature, maxTokens, userId } = body

  if (!userPrompt || !userPrompt.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Il prompt utente è obbligatorio.' })
  }

  const targetUserId = userId ? Number(userId) : 1
  let generatedResponse = ''

  // 1. SIMULAZIONE LLM DINAMICA
  const promptLower = userPrompt.toLowerCase()
  if (promptLower.includes('middleware') && promptLower.includes('auth')) {
    generatedResponse = `export default defineNuxtRouteMiddleware((to, from) => {\n  const { isAuthenticated } = useAuthCore()\n  if (!isAuthenticated.value && to.path.startsWith('/admin')) {\n    return navigateTo('/login')\n  }\n})`
  } else if (promptLower.includes('drizzle') || promptLower.includes('db')) {
    generatedResponse = `import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';\n\nexport const users = pgTable('users', {\n  id: serial('id').primaryKey(),\n  username: text('username').notNull(),\n  xp: integer('xp').default(0)\n});`
  } else if (promptLower.includes('tailwind')) {
    generatedResponse = `<div class="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl shadow-xl">\n  <h2 class="text-emerald-400 font-black">Generato da ${model}</h2>\n</div>`
  } else {
    generatedResponse = `[${model} Output]\nHo analizzato il tuo prompt alla temperatura di ${temperature}.\nCome Kernel Architect, ti confermo che la richiesta richiede un approccio modulare. Il limite di risposta è stato settato a ${maxTokens} tokens.\n\nContattami se desideri generare uno snippet di codice specifico!`
  }

  // 2. GAMIFICATION (Assegna XP sul DB Neon)
  try {
    const db = await getDb()
    await db.update(users)
      .set({ xp: sql`COALESCE(xp, 0) + 15` })
      .where(eq(users.id, targetUserId))

    await db.insert(xpTransactions).values({
      userId: targetUserId,
      action: `Esecuzione Modello: ${model}`,
      points: 15
    })
  } catch (dbErr) {
    console.warn('[NEURAL GAMIFICATION ERROR]', dbErr)
  }

  // Effetto "Generazione IA" realistico (1 secondo circa di calcolo)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 1000))

  return {
    success: true,
    result: generatedResponse
  }
})