import { onMounted, onUnmounted } from 'vue'

export function useCodeCopy() {
  function handleCodeCopy(e: MouseEvent) {
    const target = e.target as HTMLElement
    const copyBtn = target.closest('.dkp-copy-btn') as HTMLButtonElement | null
    if (!copyBtn) return

    const wrapper = copyBtn.closest('.dkp-code-wrapper')
    if (!wrapper) return

    const codeEl = wrapper.querySelector('code') || wrapper.querySelector('pre')
    if (!codeEl) return

    const textToCopy = codeEl.innerText || codeEl.textContent || ''
    if (!textToCopy) return

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        const originalContent = copyBtn.innerHTML
        copyBtn.innerHTML = '&#9989; <span style="font-size: 0.72rem; font-weight: 800; color: #00dc82;">Copiato!</span>'
        copyBtn.style.pointerEvents = 'none'

        setTimeout(() => {
          copyBtn.innerHTML = originalContent
          copyBtn.style.pointerEvents = 'auto'
        }, 2000)
      })
      .catch(() => {})
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleCodeCopy)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('click', handleCodeCopy)
    }
  })
}