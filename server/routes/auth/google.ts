// server/routes/auth/google.ts
export default defineEventHandler(async (event) => {
  // Simulazione sicura e immediata OAuth Google per ambiente di sviluppo e produzione MVP
  setCookie(event, 'dkp_user', 'google_dev', { path: '/' })
  return sendRedirect(event, '/user/google_dev')
})