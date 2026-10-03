// app/composables/useDomain.ts
export function useDomain() {
  // In ambiente browser usiamo window.location, in SSR usiamo l'header host
  const getBaseDomain = () => {
    if (import.meta.client) {
      const host = window.location.host
      if (host.includes('localhost')) return 'http://localhost:3000'
      return 'https://devkernelpulse.org'
    }
    return 'https://devkernelpulse.org'
  }

  /**
   * Genera un URL completo verso il Dominio Principale
   * Es: getMainUrl('/admin') -> https://devkernelpulse.org/admin (o http://localhost:3000/admin)
   */
  const getMainUrl = (path: string = '') => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${getBaseDomain()}${cleanPath}`
  }

  /**
   * Genera un URL completo verso il sottodominio Mail
   */
  const getMailUrl = (path: string = '') => {
    if (import.meta.client && window.location.host.includes('localhost')) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`
      return `http://localhost:3000${cleanPath}`
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `https://mail.devkernelpulse.org${cleanPath}`
  }

  /**
   * Genera un URL completo verso il sottodominio API
   */
  const getApiUrl = (path: string = '') => {
    if (import.meta.client && window.location.host.includes('localhost')) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`
      return `http://localhost:3000${cleanPath}`
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `https://api.devkernelpulse.org${cleanPath}`
  }

  return {
    getMainUrl,
    getMailUrl,
    getApiUrl
  }
}