// server/utils/mailNexus.ts
import * as nodemailerModule from 'nodemailer'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

const nodemailer: any = (nodemailerModule as any).default || nodemailerModule

export type MailChannel =
  | 'sentinel'
  | 'nexus_chat'
  | 'security_alert'
  | 'transactional'
  | 'newsletter'
  | 'autoresponder'
  | 'community'

export interface NexusMailPayload {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  channel: MailChannel
  from?: string
  idempotencyKey?: string
  headers?: Record<string, string>
}

export interface IMailProvider {
  readonly name: 'resend' | 'brevo' | 'internal'
  isConfigured(): boolean
  send(payload: NexusMailPayload): Promise<{ success: boolean; messageId?: string; error?: string }>
}

function stripHtml(html: string): string {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

class ResendSentinelProvider implements IMailProvider {
  readonly name = 'resend' as const

  private getKey(): string {
    return String(process.env.RESEND_API_KEY || process.env.NUXT_RESEND_API_KEY || '').trim()
  }

  isConfigured(): boolean {
    return Boolean(this.getKey())
  }

  async send(payload: NexusMailPayload) {
    const apiKey = this.getKey()
    if (!apiKey) return { success: false, error: 'RESEND_API_KEY mancante' }

    const defaultFrom = String(
      process.env.SMTP_FROM ||
      process.env.NUXT_SMTP_FROM ||
      '"DevKernelPulse Sentinel" <sentinel@devkernelpulse.org>'
    ).trim()

    const headers: Record<string, string> = { ...(payload.headers || {}) }
    if (payload.idempotencyKey) {
      headers['X-Entity-Ref-ID'] = payload.idempotencyKey
    }

    try {
      const res = await fetch('[https://api.resend.com/emails](https://api.resend.com/emails)', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: payload.from || defaultFrom,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text || stripHtml(payload.html),
          headers
        })
      })
      const data: any = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { success: false, error: data?.message || `Resend HTTP ${res.status}` }
      }
      return { success: true, messageId: data?.id }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Errore rete Resend' }
    }
  }
}

class BrevoCommunityProvider implements IMailProvider {
  readonly name = 'brevo' as const

  private getApiKey(): string {
    return String(process.env.BREVO_API_KEY || process.env.NUXT_BREVO_API_KEY || '').trim()
  }

  private getSmtpConfig() {
    const host = String(process.env.SMTP_HOST || process.env.NUXT_SMTP_HOST || '').trim()
    const port = Number(process.env.SMTP_PORT || process.env.NUXT_SMTP_PORT || 587)
    const user = String(process.env.SMTP_USER || process.env.NUXT_SMTP_USER || '').trim()
    const pass = String(process.env.SMTP_PASS || process.env.NUXT_SMTP_PASS || '').trim()
    return { host, port, user, pass }
  }

  isConfigured(): boolean {
    if (this.getApiKey()) return true
    const smtp = this.getSmtpConfig()
    return Boolean(smtp.host && smtp.user && smtp.pass)
  }

  async send(payload: NexusMailPayload) {
    const defaultFrom = String(
      process.env.SMTP_FROM ||
      process.env.NUXT_SMTP_FROM ||
      '"DevKernelPulse" <noreply@devkernelpulse.org>'
    ).trim()
    const fromAddr = payload.from || defaultFrom
    const plainText = payload.text || stripHtml(payload.html)

    // 1. Brevo API v3 se disponibile
    const apiKey = this.getApiKey()
    if (apiKey) {
      try {
        const senderMatch = fromAddr.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+)>?$/)
        const senderName = (senderMatch?.[1] || 'DevKernelPulse').trim()
        const senderEmail = (senderMatch?.[2] || 'noreply@devkernelpulse.org').trim()

        const res = await fetch('[https://api.brevo.com/v3/smtp/email](https://api.brevo.com/v3/smtp/email)', {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: payload.to, name: payload.toName || payload.to }],
            subject: payload.subject,
            htmlContent: payload.html,
            textContent: plainText,
            headers: payload.idempotencyKey ? { 'X-Mailin-custom': payload.idempotencyKey } : undefined
          })
        })
        const data: any = await res.json().catch(() => ({}))
        if (res.ok) {
          return { success: true, messageId: data?.messageId }
        }
      } catch {}
    }

    // 2. Brevo SMTP Relay (chiavi SMTP_* già configurate in .env)
    const smtp = this.getSmtpConfig()
    if (!smtp.host || !smtp.user || !smtp.pass) {
      return { success: false, error: 'Brevo API/SMTP non configurato' }
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: { user: smtp.user, pass: smtp.pass }
      })
      const info = await transporter.sendMail({
        from: fromAddr,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: plainText,
        headers: payload.headers
      })
      return { success: true, messageId: info?.messageId }
    } catch (err: any) {
      return { success: false, error: err?.response || err?.message || 'Errore Brevo SMTP' }
    }
  }
}

const resendProvider = new ResendSentinelProvider()
const brevoProvider = new BrevoCommunityProvider()

async function logNexusDispatch(entry: {
  channel: MailChannel
  provider: string
  to: string
  subject: string
  html: string
  status: string
  details?: string
}) {
  try {
    const db = await getDb()
    if (!db) return null
    const plain = stripHtml(entry.html)
    const res: any = await db.execute(sql`
      INSERT INTO pulse_mail_messages (
        sender, recipient, subject, body_text, body_html, direction, status, is_read
      )
      VALUES (
        ${`nexus:${entry.channel}`}, ${entry.to}, ${entry.subject}, ${plain}, ${entry.html}, 'OUTBOUND', ${entry.status}, true
      )
      RETURNING id;
    `)
    const rows = Array.isArray(res) ? res : (res?.rows || [])
    return rows[0]?.id ? Number(rows[0].id) : null
  } catch {
    return null
  }
}

/**
 * Dispatcher unificato DKP Mail Nexus© 2.6:
 * - Resend gestisce Sentinel Network, Chat Pulse Nexus, Security Alert e Transazionali critiche
 * - Brevo gestisce Newsletter, Autoresponder e Posta Ordinaria Community
 * - Failover automatico reciproco in caso di quota/errore
 */
export async function dispatchNexusMail(payload: NexusMailPayload) {
  const isSentinelOrKernel =
    payload.channel === 'sentinel' ||
    payload.channel === 'nexus_chat' ||
    payload.channel === 'security_alert' ||
    payload.channel === 'transactional'

  const primary: IMailProvider = isSentinelOrKernel ? resendProvider : brevoProvider
  const secondary: IMailProvider = isSentinelOrKernel ? brevoProvider : resendProvider

  if (primary.isConfigured()) {
    const firstTry = await primary.send(payload)
    if (firstTry.success) {
      const internalId = await logNexusDispatch({
        channel: payload.channel,
        provider: primary.name,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        status: `SENT_${primary.name.toUpperCase()}`
      })
      return {
        success: true,
        provider: primary.name,
        messageId: firstTry.messageId,
        internalId
      }
    }
    console.warn(`[DKP Mail Nexus] Primary (${primary.name}) fallback attivato:`, firstTry.error)
  }

  if (secondary.isConfigured()) {
    const secondTry = await secondary.send(payload)
    if (secondTry.success) {
      const internalId = await logNexusDispatch({
        channel: payload.channel,
        provider: secondary.name,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        status: `FAILOVER_${secondary.name.toUpperCase()}`
      })
      return {
        success: true,
        provider: secondary.name,
        failover: true,
        messageId: secondTry.messageId,
        internalId
      }
    }
  }

  const internalId = await logNexusDispatch({
    channel: payload.channel,
    provider: 'internal',
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    status: 'INTERNAL_QUEUED'
  })

  return {
    success: Boolean(internalId),
    provider: 'internal',
    internalId
  }
}