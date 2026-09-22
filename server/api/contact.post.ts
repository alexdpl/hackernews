// server/api/contact.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, subject, message, captchaAnswer } = body

  // Verifica CAPTCHA personalizzato (es. risposta corretta "7" per "4 + 3")
  if (parseInt(captchaAnswer) !== 7) {
    return {
      success: false,
      error: 'Captcha errato. La risposta a 4 + 3 è 7!'
    }
  }

  if (!name || !email || !message) {
    return {
      success: false,
      error: 'Compila tutti i campi obbligatori.'
    }
  }

  // Qui viene simulato l'inoltro a alexdpl@gmail.com (in produzione collegabile a Resend, SendGrid o SMTP)
  console.log(`[DKP Mailer] Nuovo messaggio da ${name} (${email}) per alexdpl@gmail.com - Oggetto: ${subject}`)

  return {
    success: true,
    message: 'Messaggio inviato con successo! Ti risponderemo presto su alexdpl@gmail.com'
  }
})