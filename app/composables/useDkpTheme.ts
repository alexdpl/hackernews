// app/composables/useDkpTheme.ts
import { watch } from 'vue'
import { useCookie } from '#app'

export const useDkpTheme = () => {
  const currentTheme = useCookie<'dark' | 'sepia'>('dkp_theme', {
    default: () => 'dark',
    maxAge: 31536000, // 1 anno
    path: '/'
  })

  const applyTheme = (theme: 'dark' | 'sepia') => {
    if (import.meta.client) {
      const html = document.documentElement
      if (theme === 'sepia') {
        html.classList.add('theme-sepia')
        html.classList.remove('dark')
      } else {
        html.classList.remove('theme-sepia')
        html.classList.add('dark')
      }
    }
  }

  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'dark' ? 'sepia' : 'dark'
    applyTheme(currentTheme.value)
  }

  // Applica immediatamente lato client
  if (import.meta.client) {
    applyTheme(currentTheme.value)
  }

  // Sincronizza i cambiamenti se il cookie cambia
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  })

  return { currentTheme, toggleTheme }
}