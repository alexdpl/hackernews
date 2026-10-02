// server/utils/mailer.ts
import nodemailer from 'nodemailer'

interface SendEmailOptions {
  from: string
  to: string
  subject: string
  html: string
}

export async function sendKernelEmail({ from, to, subject, html }: SendEmailOptions) {
  // 1. Recupero configurazione sia da Nuxt RuntimeConfig che da process.env
  const config = useRuntimeConfig()

  const host = (config.smtpHost as string) || process.env.SMTP_HOST || process.env.NUXT_SMTP_HOST || 'smtp-relay.brevo.com'
  const port = Number((config.smtpPort as string) || process.env.SMTP_PORT || process.env.NUXT_SMTP_PORT || 587)
  const user = (config.smtpUser as string) || process.env.SMTP_USER || process.env.NUXT_SMTP_USER || ''
  const pass = (config.smtpPass as string) || process.env.SMTP_PASS || process.env.NUXT_SMTP_PASS || ''

  // 🔍 LOG DI DEBUG IN CONSOLE PER VERIFICARE LE VALORI IN RUNTIME
  console.log('--------------------------------------------------')
  console.log('📧 [MAILER DEBUG] Host:', host)
  console.log('📧 [MAILER DEBUG] Port:', port)
  console.log('📧 [MAILER DEBUG] User:', user)
  console.log('📧 [MAILER DEBUG] Pass Length:', pass ? `${pass.length} caratteri` : '❌ MANCANTE')
  console.log('📧 [MAILER DEBUG] Pass Prefix:', pass ? pass.substring(0, 10) + '...' : 'N/A')
  console.log('--------------------------------------------------')

  // 2. Controllo di sicurezza prima di tentare l'invio
  if (!user || !pass) {
    console.error('❌ [MAILER ERROR] Credenziali SMTP non trovate nell ambiente!')
    throw new Error(`Credenziali SMTP mancanti! User: ${user ? 'OK' : 'MANCANTE'}, Pass: ${pass ? 'OK' : 'MANCANTE'}`)
  }

  // 3. Creazione Transporter Nodemailer
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // false per 587 (STARTTLS)
    auth: {
      user,
      pass
    }
  })

  // 4. Invio dell'e-mail
  const info = await transporter.sendMail({
    from: from || process.env.SMTP_FROM || 'alex@devkernelpulse.org',
    to,
    subject,
    html
  })

  console.log('✅ [MAILER SUCCESS] Email inviata con ID:', info.messageId)
  return info
}