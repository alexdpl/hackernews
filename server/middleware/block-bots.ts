export default defineEventHandler((event) => {
  const path = event.path || ''

  // Pattern di bot/scanner da bloccare immediatamente
  const isBotRequest = 
    path.includes('.env') ||
    path.includes('.git') ||
    path.includes('.yml') ||
    path.endsWith('.php') ||
    /^\/(wp-admin|wp-includes|wp-json|wp-content)/i.test(path)

  if (isBotRequest) {
    // Risponde subito con 404 senza passare dal router di Vue
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found'
    })
  }
})