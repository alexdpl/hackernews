// app/composables/useDomain.ts
import { useRequestURL } from '#imports'

export function useDomain() {
  const reqUrl = useRequestURL()

  const isLocalEnv = () => {
    const host = reqUrl.host || ''
    return host.includes('localhost') || host.startsWith('127.0.0.1')
  }

  const normalizePath = (path: string = '') => {
    if (!path || path === '/') return '/'
    return path.startsWith('/') ? path : `/${path}`
  }

  /**
   * Genera un URL completo verso il Dominio Principale (SSR & CSR consistent)
   * Es: getMainUrl('/admin') -> https://devkernelpulse.org/admin (o http://localhost:3000/admin)
   */
  const getMainUrl = (path: string = '') => {
    const cleanPath = normalizePath(path)
    if (isLocalEnv()) {
      return `${reqUrl.protocol}//${reqUrl.host}${cleanPath}`
    }
    return `https://devkernelpulse.org${cleanPath}`
  }

  /**
   * Genera un URL completo verso il sottodominio Mail
   */
  const getMailUrl = (path: string = '') => {
    const cleanPath = normalizePath(path)
    if (isLocalEnv()) {
      return `${reqUrl.protocol}//${reqUrl.host}${cleanPath}`
    }
    return `https://mail.devkernelpulse.org${cleanPath}`
  }

  /**
   * Genera un URL completo verso il sottodominio API
   */
  const getApiUrl = (path: string = '') => {
    const cleanPath = normalizePath(path)
    if (isLocalEnv()) {
      return `${reqUrl.protocol}//${reqUrl.host}${cleanPath}`
    }
    return `https://api.devkernelpulse.org${cleanPath}`
  }

  return {
    isLocalEnv,
    getMainUrl,
    getMailUrl,
    getApiUrl
  }
}