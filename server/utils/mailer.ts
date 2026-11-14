// server/utils/mailer.ts
import nodemailer, { type Transporter } from 'nodemailer'

export interface SendEmailOptions {
  from?: string
  replyTo?: string
  to: string
  subject: string
  html: string
  headers?: Record<string, string>
}

let cachedTransporter: Transporter | null = null
let cachedConfigSignature = ''

function getSmtpConfig() {
  const config = useRuntimeConfig()
  const host = (config.smtpHost as string) || process.env.SMTP_HOST || process.env.NUXT_SMTP_HOST || 'smtp-relay.brevo.com'
  const port = Number((config.smtpPort as string) || process.env.SMTP_PORT || process.env.NUXT_SMTP_PORT || 587)
  const user = (config.smtpUser as string) || process.env.SMTP_USER || process.env.NUXT_SMTP_USER || ''
  const pass = (config.smtpPass as string) || process.env.SMTP_PASS || process.env.NUXT_SMTP_PASS || ''
  const defaultFrom =
    (config.smtpFrom as string) ||
    process.env.SMTP_FROM ||
    process.env.NUXT_SMTP_FROM ||
    'alex@devkernelpulse.org'

  return { host, port, user, pass, defaultFrom }
}

function getTransporter(): { transporter: Transporter; defaultFrom: string } {
  const { host, port, user, pass, defaultFrom } = getSmtpConfig()

  if (!user || !pass) {
    throw new Error(`Credenziali SMTP mancanti (User: ${user ? 'OK' : 'MISSING'}, Pass: ${pass ? 'OK' : 'MISSING'})`)
  }

  const signature = `${host}:${port}:${user}`
  if (!cachedTransporter || cachedConfigSignature !== signature) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: { user, pass }
    })
    cachedConfigSignature = signature
  }

  return { transporter: cachedTransporter, defaultFrom }
}

function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/)
  return (match ? match[1] : raw).trim().toLowerCase()
}

export async function sendKernelEmail({ from, replyTo, to, subject, html, headers }: SendEmailOptions) {
  const { transporter, defaultFrom } = getTransporter()

  const verifiedSender = defaultFrom.includes('<')
    ? defaultFrom
    : `DevKernelPulse <${defaultFrom}>`

  // Previene errore SMTP 550 se "from" usa un alias non autorizzato dal relay
  const requestedEmail = from ? extractEmailAddress(from) : ''
  const verifiedEmail = extractEmailAddress(verifiedSender)
  const isVerifiedDomain = requestedEmail.endsWith('@devkernelpulse.org')

  const effectiveFrom = requestedEmail && isVerifiedDomain
    ? (from!.includes('<') ? from! : `DevKernelPulse <${requestedEmail}>`)
    : verifiedSender

  const effectiveReplyTo =
    replyTo || (requestedEmail && requestedEmail !== verifiedEmail ? requestedEmail : undefined)

  const info = await transporter.sendMail({
    from: effectiveFrom,
    replyTo: effectiveReplyTo,
    to: to.trim(),
    subject,
    html,
    headers: {
      'X-DKP-Kernel-Version': 'v2.6-PURE-SQL',
      ...(headers || {})
    }
  })

  return info
}