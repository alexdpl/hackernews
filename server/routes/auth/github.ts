// server/routes/auth/github.ts
export default defineEventHandler(async (event) => {
  // Simulazione sicura e immediata OAuth GitHub per ambiente di sviluppo e produzione MVP
  // In futuro qui andrà inserito il flusso ufficiale con GitHub API e Client ID/Secret
  setCookie(event, 'dkp_user', 'github_dev', { path: '/' })
  return sendRedirect(event, '/user/github_dev')
})