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
  // Calcolo livello corrente dinamico
  const level = computed(() => {
    const xp = userXp.value || 0
    return Math.floor(xp / 100) + 1
  })

  // Ranking, badge, colori e progress bar in percentuale
  const currentRank = computed<UserRank>(() => {
    const xp = userXp.value || 0
    const lvl = level.value
    
    const currentLevelBaseXp = (lvl - 1) * 100
    const nextLevelXp = lvl * 100
    const xpProgressInLevel = xp - currentLevelBaseXp
    const progressPercentage = Math.min(Math.max(Math.floor((xpProgressInLevel / 100) * 100), 0), 100)

    if (lvl >= 20) {
      return {
        level: lvl,
        title: 'DKP Sentinel Master',
        badge: '👑',
        color: '#ffd700',
        nextLevelXp,
        currentLevelXp: currentLevelBaseXp,
        progressPercentage
      }
    } else if (lvl >= 10) {
      return {
        level: lvl,
        title: 'Cyber Architect',
        badge: '🔮',
        color: '#c084fc',
        nextLevelXp,
        currentLevelXp: currentLevelBaseXp,
        progressPercentage
      }
    } else if (lvl >= 5) {
      return {
        level: lvl,
        title: 'Code Craftsman',
        badge: '⚡',
        color: '#38bdf8',
        nextLevelXp,
        currentLevelXp: currentLevelBaseXp,
        progressPercentage
      }
    } else {
      return {
        level: lvl,
        title: 'Kernel Initiate',
        badge: '🟢',
        color: '#00dc82',
        nextLevelXp,
        currentLevelXp: currentLevelBaseXp,
        progressPercentage
      }
    }
  })

  // Helper per incrementare l'XP reattivamente
  function addXp(amount: number) {
    if (typeof userXp.value === 'number') {
      userXp.value += amount
    }
  }

  return {
    level,
    currentRank,
    addXp
  }
}