// server/utils/mailer.ts
import nodemailer from 'nodemailer'

export const getSmtpTransporter = () => {
  const config = useRuntimeConfig()

  return nodemailer.createTransport({
    host: config.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(config.smtpPort || process.env.SMTP_PORT || 587),
    secure: Number(config.smtpPort) === 465,
    auth: {
      user: config.smtpUser || process.env.SMTP_USER,
      pass: config.smtpPass || process.env.SMTP_PASS,
    },
  })
}

export interface SendMailOptions {
  from: string
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendKernelEmail(options: SendMailOptions) {
  const transporter = getSmtpTransporter()

  const mailData = {
    from: `DKP Kernel <${options.from}>`,
    to: options.to,
    subject: options.subject,
    text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
    html: options.html,
  }

  return await transporter.sendMail(mailData)
}