// composables/usePulseGamification.ts
import { computed, type Ref } from 'vue'

export interface UserRank {
  level: number
  title: string
  badge: string
  color: string
  nextLevelXp: number
  currentLevelXp: number
  progressPercentage: number
}

export const usePulseGamification = (userXp: Ref<number>) => {
  // 1. Curva di Livellamento Esponenziale (RPG Style)
  // Lvl 1 = 0 XP, Lvl 2 = 100 XP, Lvl 3 = 400 XP, Lvl 4 = 900 XP, ecc.
  const level = computed(() => {
    const xp = Math.max(0, userXp.value || 0)
    return Math.floor(Math.sqrt(xp / 100)) + 1
  })

  // 2. Calcolo Rank, Badge e Metriche Progressive
  const currentRank = computed<UserRank>(() => {
    const xp = Math.max(0, userXp.value || 0)
    const lvl = level.value
    
    // Calcolo esatto delle soglie XP per il livello attuale e il prossimo
    const currentLevelBaseXp = Math.pow(lvl - 1, 2) * 100
    const nextLevelXp = Math.pow(lvl, 2) * 100
    
    const xpProgressInLevel = xp - currentLevelBaseXp
    const totalXpForThisLevel = nextLevelXp - currentLevelBaseXp
    
    // Percentuale pulita tra 0 e 100
    const progressPercentage = Math.min(Math.max(Math.floor((xpProgressInLevel / totalXpForThisLevel) * 100), 0), 100)

    // Assegnazione Gradi DKP v2.5-GOLD
    let title = 'Kernel Initiate'
    let badge = '🟢'
    let color = '#00dc82' // Emerald

    if (lvl >= 30) {
      title = 'DKP Sentinel Master'
      badge = '👑'
      color = '#ffd700' // Gold
    } else if (lvl >= 20) {
      title = 'Nexus Vanguard'
      badge = '🌌'
      color = '#f43f5e' // Rose
    } else if (lvl >= 10) {
      title = 'Cyber Architect'
      badge = '🔮'
      color = '#c084fc' // Purple
    } else if (lvl >= 5) {
      title = 'Code Craftsman'
      badge = '⚡'
      color = '#38bdf8' // Sky blue
    }

    return {
      level: lvl,
      title,
      badge,
      color,
      nextLevelXp,
      currentLevelXp: currentLevelBaseXp,
      progressPercentage
    }
  })

  // 3. Sincronizzazione DB (Optimistic UI Update)
  async function addXp(amount: number, reason: string = 'Interazione piattaforma') {
    if (typeof userXp.value !== 'number' || amount <= 0) return

    // Salvataggio stato precedente per eventuale rollback
    const previousXp = userXp.value
    
    // Aggiornamento immediato della UI (nessuna attesa di caricamento per l'utente)
    userXp.value += amount

    try {
      // Sincronizzazione con H3 / Drizzle (Neon DB)
      // Nota: Crea un endpoint server in /server/api/user/gamification/sync.post.ts per gestire questo salvataggio
      await $fetch('/api/user/gamification/sync', {
        method: 'POST',
        body: { 
          xpToAdd: amount,
          reason,
          timestamp: new Date().toISOString()
        }
      })
      console.log(`[DKP Gamification] +${amount} XP (Motivo: ${reason}) - Salvato su Neon DB.`)
    } catch (err) {
      // Rollback se il database va offline o la query fallisce
      console.warn('⚠️ [DKP Gamification] Rete offline o DB non raggiungibile. Rollback XP.', err)
      userXp.value = previousXp
    }
  }

  return {
    level,
    currentRank,
    addXp
  }
}