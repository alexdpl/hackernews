// server/utils/mailer.ts
import * as nodemailerModule from 'nodemailer'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

const nodemailer: any = (nodemailerModule as any).default || nodemailerModule

export interface KernelMailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
  headers?: Record<string, string>
  skipInternalArchive?: boolean
}

export interface SentinelMailOptions {
  to: string
  subject: string
  category: 'snippet_suggestion' | 'moderation_notice' | 'security_alert'
  recipientUsername: string
  sentinelName: string
  headline: string
  bodyMarkdown: string
  actionUrl?: string
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function archiveInDkpMailEngine(opts: {
  from: string
  to: string
  subject: string
  text: string
  html: string
  status: string
}): Promise<number | null> {
  try {
    const db = await getDb()
    if (!db) return null
    const res: any = await db.execute(sql`
      INSERT INTO pulse_mail_messages (
        sender, recipient, subject, body_text, body_html, direction, status, is_read
      )
      VALUES (
        ${opts.from}, ${opts.to}, ${opts.subject}, ${opts.text}, ${opts.html}, 'OUTBOUND', ${opts.status}, true
      )
      RETURNING id;
    `)
    const rows = Array.isArray(res) ? res : (res?.rows || [])
    return rows[0]?.id ? Number(rows[0].id) : null
  } catch (err: any) {
    console.warn('[DKP INTERNAL MAIL ARCHIVE WARN]:', err?.message)
    return null
  }
}

export async function sendKernelEmail(
  optionsOrTo: KernelMailOptions | string,
  subjectArg?: string,
  htmlArg?: string,
  textArg?: string
): Promise<{ success: boolean; messageId?: string; internalId?: number | null; transport?: string; error?: string }> {
  const opts: KernelMailOptions =
    typeof optionsOrTo === 'string'
      ? { to: optionsOrTo, subject: subjectArg || '', html: htmlArg, text: textArg }
      : optionsOrTo

  const defaultFrom = String(
    process.env.SMTP_FROM ||
    process.env.NUXT_SMTP_FROM ||
    '"DevKernelPulse Sentinel" <sentinel@devkernelpulse.org>'
  ).trim()

  const fromAddress = String(opts.from || defaultFrom).trim()
  const plainText = opts.text || (opts.html ? opts.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '')
  const htmlBody = opts.html || `<p>${escapeHtml(plainText)}</p>`

  const resendKey = String(process.env.RESEND_API_KEY || process.env.NUXT_RESEND_API_KEY || '').trim()
  const brevoApiKey = String(process.env.BREVO_API_KEY || process.env.NUXT_BREVO_API_KEY || '').trim()

  // 1. CANALE PRIMARIO: Resend HTTPS API (Porta 443 - Zero blocchi IP su Cloud Run)
  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [opts.to],
          subject: opts.subject,
          html: htmlBody,
          text: plainText,
          headers: opts.headers
        })
      })
      const data: any = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.message || `Resend HTTP ${response.status}`)
      }
      const internalId = opts.skipInternalArchive
        ? null
        : await archiveInDkpMailEngine({
            from: fromAddress,
            to: opts.to,
            subject: opts.subject,
            text: plainText,
            html: htmlBody,
            status: 'SENT_RESEND'
          })
      return { success: true, messageId: data?.id, internalId, transport: 'resend-https' }
    } catch (err: any) {
      console.error('[DKP MAILER RESEND ERROR]:', err?.message)
      return { success: false, error: err?.message || 'Errore Resend API', transport: 'resend-https' }
    }
  }

  // 2. CANALE SECONDARIO: Brevo HTTPS API v3 (Porta 443)
  if (brevoApiKey) {
    try {
      const senderMatch = fromAddress.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+)>?$/)
      const senderName = (senderMatch?.[1] || 'DevKernelPulse').trim()
      const senderEmail = (senderMatch?.[2] || 'alex@devkernelpulse.org').trim()

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: opts.to }],
          subject: opts.subject,
          htmlContent: htmlBody,
          textContent: plainText
        })
      })
      const data: any = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.message || `Brevo API HTTP ${response.status}`)
      }
      const internalId = opts.skipInternalArchive
        ? null
        : await archiveInDkpMailEngine({
            from: fromAddress,
            to: opts.to,
            subject: opts.subject,
            text: plainText,
            html: htmlBody,
            status: 'SENT_BREVO_API'
          })
      return { success: true, messageId: data?.messageId, internalId, transport: 'brevo-https' }
    } catch (err: any) {
      console.error('[DKP MAILER BREVO API ERROR]:', err?.message)
      return { success: false, error: err?.message || 'Errore Brevo API', transport: 'brevo-https' }
    }
  }

  // 3. CANALE TERZIARIO: SMTP Relay classico (se configurato senza blocco IP)
  const host = String(process.env.SMTP_HOST || process.env.NUXT_SMTP_HOST || '').trim()
  const port = Number(process.env.SMTP_PORT || process.env.NUXT_SMTP_PORT || 587)
  const user = String(process.env.SMTP_USER || process.env.NUXT_SMTP_USER || '').trim()
  const pass = String(process.env.SMTP_PASS || process.env.NUXT_SMTP_PASS || '').trim()

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      })
      const info = await transporter.sendMail({
        from: fromAddress,
        to: opts.to,
        subject: opts.subject,
        text: plainText,
        html: htmlBody,
        headers: opts.headers
      })
      const internalId = opts.skipInternalArchive
        ? null
        : await archiveInDkpMailEngine({
            from: fromAddress,
            to: opts.to,
            subject: opts.subject,
            text: plainText,
            html: htmlBody,
            status: 'SENT_SMTP'
          })
      return { success: true, messageId: info?.messageId, internalId, transport: 'smtp' }
    } catch (err: any) {
      const detail = err?.response || err?.message || 'Errore SMTP'
      const internalId = opts.skipInternalArchive
        ? null
        : await archiveInDkpMailEngine({
            from: fromAddress,
            to: opts.to,
            subject: opts.subject,
            text: plainText,
            html: htmlBody,
            status: 'INTERNAL_ONLY'
          })
      return {
        success: false,
        internalId,
        transport: 'smtp',
        error: `${detail} (Messaggio comunque archiviato nel Motore Interno DKP ID #${internalId ?? 'n/a'})`
      }
    }
  }

  // 4. MODALITÀ SOLO MOTORE INTERNO DKP (quando nessun relay esterno è attivo)
  const internalId = opts.skipInternalArchive
    ? null
    : await archiveInDkpMailEngine({
        from: fromAddress,
        to: opts.to,
        subject: opts.subject,
        text: plainText,
        html: htmlBody,
        status: 'INTERNAL_DELIVERED'
      })

  return {
    success: Boolean(internalId),
    messageId: internalId ? `dkp-internal-${internalId}` : undefined,
    internalId,
    transport: 'dkp-internal-engine',
    error: internalId ? undefined : 'Archiviazione interna fallita'
  }
}

export async function sendSentinelEmailDetailed(
  opts: SentinelMailOptions
): Promise<{ success: boolean; error?: string; messageId?: string; transport?: string }> {
  const accentColor =
    opts.category === 'moderation_notice'
      ? '#ef4444'
      : opts.category === 'security_alert'
        ? '#f59e0b'
        : '#10b981'

  const safeHeadline = escapeHtml(opts.headline)
  const safeBody = escapeHtml(opts.bodyMarkdown).replace(/\n/g, '<br/>')
  const ctaHtml = opts.actionUrl
    ? `<p style="margin-top:20px;"><a href="${escapeHtml(opts.actionUrl)}" style="background:${accentColor};color:#090d16;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:700;font-family:monospace;">Apri nel Kernel &rarr;</a></p>`
    : ''

  const html = `
    <div style="background:#090d16;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;padding:28px;border:1px solid #1e293b;border-radius:10px;max-width:600px;margin:auto;">
      <div style="font-family:monospace;font-size:12px;color:${accentColor};letter-spacing:1px;text-transform:uppercase;">
        [DKP SENTINEL NETWORK // ${escapeHtml(opts.sentinelName.toUpperCase())}]
      </div>
      <h2 style="color:#f8fafc;margin:12px 0 16px;">${safeHeadline}</h2>
      <p style="color:#94a3b8;font-size:14px;">Ciao <strong>@${escapeHtml(opts.recipientUsername)}</strong>,</p>
      <div style="background:#0f172a;border-left:3px solid ${accentColor};padding:14px 16px;border-radius:4px;font-size:14px;line-height:1.6;color:#cbd5e1;">
        ${safeBody}
      </div>
      ${ctaHtml}
      <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0 12px;" />
      <p style="font-size:11px;color:#64748b;font-family:monospace;">
        Messaggio automatico generato dal DevKernelPulse Autonomous Core.
      </p>
    </div>
  `

  return await sendKernelEmail({
    to: opts.to,
    subject: `[DKP Sentinel] ${opts.subject}`,
    text: `${opts.headline}\n\n${opts.bodyMarkdown}\n\n${opts.actionUrl || ''}`,
    html
  })
}

export async function sendSentinelEmail(opts: SentinelMailOptions): Promise<boolean> {
  const res = await sendSentinelEmailDetailed(opts)
  return res.success
}
