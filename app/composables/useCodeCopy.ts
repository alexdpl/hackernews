// app/composables/useCodeCopy.ts
import { onMounted, onUnmounted } from 'vue'

export function useCodeCopy() {
  function handleCodeCopy(e: MouseEvent) {
    const target = e.target as HTMLElement
    const copyBtn = target.closest('.dkp-copy-btn') as HTMLButtonElement | null
    if (!copyBtn) return

    // Trova il wrapper genitore del blocco di codice
    const wrapper = copyBtn.closest('.dkp-code-wrapper')
    if (!wrapper) return

    // Trova il tag code o pre con il codice sorgente
    const codeEl = wrapper.querySelector('code') || wrapper.querySelector('pre')
    if (!codeEl) return

    const textToCopy = codeEl.innerText || codeEl.textContent || ''

    if (!textToCopy) return

    // Copia negli appunti tramite Clipboard API
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        const originalContent = copyBtn.innerHTML
        copyBtn.innerHTML = '✅ <span style="font-size: 0.7rem; font-weight: 800; color: #00dc82;">Copiato!</span>'
        copyBtn.style.pointerEvents = 'none'

        setTimeout(() => {
          copyBtn.innerHTML = originalContent
          copyBtn.style.pointerEvents = 'auto'
        }, 2000)
      })
      .catch((err) => {
        console.error('Errore durante la copia del codice negli appunti:', err)
      })
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