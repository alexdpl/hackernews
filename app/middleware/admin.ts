// app/middleware/admin.ts
export default defineNuxtRouteMiddleware(to => {
  // Sostituisci con la logica del tuo stato utente (es. useUser() o useAuth())
  const user = useState('user').value as { username?: string; role?: string } | null

  // Controlla se l'utente è loggato ed è l'admin (o ha ruolo admin)
  const isAdmin = user && (user.username === 'alexdpl' || user.role === 'admin')

  if (!isAdmin && to.path.startsWith('/admin')) {
    return navigateTo('/')
  }
})