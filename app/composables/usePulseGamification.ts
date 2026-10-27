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

export const usePulseGamification = (userXp?: Ref<number>) => {
  // Se non viene passato un ref, usiamo un fallback reattivo globale allineato a 2990 XP
  const xpRef = userXp || useState<number>('dkp_global_xp', () => 2990)

  // 1. Curva di Livellamento Esponenziale (RPG Style)
  const level = computed(() => {
    const xp = Math.max(0, xpRef.value || 0)
    return Math.floor(Math.sqrt(xp / 100)) + 1
  })

  // 2. Calcolo Rank, Badge e Metriche Progressive
  const currentRank = computed<UserRank>(() => {
    const xp = Math.max(0, xpRef.value || 0)
    const lvl = level.value
    
    const currentLevelBaseXp = Math.pow(lvl - 1, 2) * 100
    const nextLevelXp = Math.pow(lvl, 2) * 100
    
    const xpProgressInLevel = xp - currentLevelBaseXp
    const totalXpForThisLevel = nextLevelXp - currentLevelBaseXp
    
    const progressPercentage = Math.min(Math.max(Math.floor((xpProgressInLevel / totalXpForThisLevel) * 100), 0), 100)

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

  // 3. Sincronizzazione DB (Optimistic UI Update + Server Sync)
  async function addXp(amount: number, reason: string = 'Interazione piattaforma') {
    if (typeof xpRef.value !== 'number' || amount <= 0) return

    const previousXp = xpRef.value
    xpRef.value += amount

    try {
      const res: any = await $fetch('/api/user/gamification/sync', {
        method: 'POST',
        body: { 
          xpToAdd: amount,
          reason,
          timestamp: new Date().toISOString()
        }
      })

      // Se il server restituisce il totale aggiornato, lo sincronizziamo
      if (res && res.success && typeof res.newTotalXp === 'number') {
        xpRef.value = res.newTotalXp
      }

      if (import.meta.client) {
        window.dispatchEvent(new CustomEvent('dkp:xp_updated', { detail: xpRef.value }))
      }

      console.log(`[DKP Gamification] +${amount} XP (Motivo: ${reason}) - Sincronizzato con Neon DB.`)
    } catch (err) {
      console.warn('⚠️ [DKP Gamification] Rete offline o DB non raggiungibile. Rollback XP.', err)
      xpRef.value = previousXp
    }
  }

  return {
    level,
    currentRank,
    addXp
  }
}