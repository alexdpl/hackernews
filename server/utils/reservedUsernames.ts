// server/utils/reservedUsernames.ts
export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'system', 'kernel',
  'profile', 'me', 'self', 'login', 'logout', 'register', 'signup', 'auth',
  'groups', 'available-groups', 'keys', 'api-keys', 'models', 'available_models',
  'api', 'settings', 'dashboard', 'sentinel', 'bot', 'moderator', 'null', 'undefined'
])

export function isValidHumanUsername(username: string): boolean {
  const clean = String(username || '').trim().toLowerCase()
  if (clean.length < 3 || clean.length > 32) return false
  if (!/^[a-z0-9_-]+$/.test(clean)) return false
  if (RESERVED_USERNAMES.has(clean)) return false
  return true
}
