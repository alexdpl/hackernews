export default defineNuxtPlugin(() => {
  const root = document.documentElement
  let isApplying = false

  const applyStoredTheme = () => {
    if (isApplying) return
    isApplying = true
    try {
      const stored = (
        localStorage.getItem('dkp_theme') ||
        localStorage.getItem('dkp-theme') ||
        localStorage.getItem('theme') ||
        ''
      ).toLowerCase()

      const currentAttr = (root.getAttribute('data-theme') || '').toLowerCase()
      const useSepia =
        stored === 'sepia' ||
        stored === 'old' ||
        currentAttr === 'sepia' ||
        currentAttr === 'old' ||
        root.classList.contains('sepia') ||
        root.classList.contains('old')

      if (useSepia) {
        if (root.getAttribute('data-theme') !== 'sepia') root.setAttribute('data-theme', 'sepia')
        if (!root.classList.contains('sepia')) root.classList.add('sepia')
        if (root.classList.contains('dark')) root.classList.remove('dark')
      } else {
        if (root.getAttribute('data-theme') !== 'dark') root.setAttribute('data-theme', 'dark')
        if (!root.classList.contains('dark')) root.classList.add('dark')
        root.classList.remove('sepia', 'theme-sepia', 'old')
      }
    } finally {
      queueMicrotask(() => {
        isApplying = false
      })
    }
  }

  applyStoredTheme()
  window.addEventListener('storage', applyStoredTheme)
})