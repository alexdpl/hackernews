// server/utils/mailer.ts
import * as nodemailer from 'nodemailer'

export interface KernelMailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
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

function getSmtpTransporter() {
  const host = String(process.env.SMTP_HOST || '').trim()
  const port = Number(process.env.SMTP_PORT || 587)
  const user = String(process.env.SMTP_USER || '').trim()
  const pass = String(process.env.SMTP_PASS || '').trim()

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })
}

export async function sendKernelEmail(
  optionsOrTo: KernelMailOptions | string,
  subjectArg?: string,
  htmlArg?: string,
  textArg?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = getSmtpTransporter()
  const opts: KernelMailOptions =
    typeof optionsOrTo === 'string'
      ? { to: optionsOrTo, subject: subjectArg || '', html: htmlArg, text: textArg }
      : optionsOrTo

  if (!transporter) {
    console.warn('[DKP MAILER] Variabili SMTP mancanti (SMTP_HOST/USER/PASS): invio saltato per', opts.to)
    return { success: false, error: 'SMTP non configurato' }
  }

  const fromAddress = String(
    opts.from || process.env.SMTP_FROM || `"DevKernelPulse" <${process.env.SMTP_USER}>`
  ).trim()

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: opts.to,
      subject: opts.subject,
      text: opts.text || (opts.html ? opts.html.replace(/<[^>]+>/g, ' ').trim() : ''),
      html: opts.html
    })
    return { success: true, messageId: info?.messageId }
  } catch (err: any) {
    console.error('[DKP MAILER ERROR]:', err?.message)
    return { success: false, error: err?.message || 'Errore invio SMTP' }
  }
}

export async function sendSentinelEmail(opts: SentinelMailOptions): Promise<boolean> {
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

  const res = await sendKernelEmail({
    from: String(process.env.SMTP_FROM || `"DKP Sentinel Network" <${process.env.SMTP_USER}>`).trim(),
    to: opts.to,
    subject: `[DKP Sentinel] ${opts.subject}`,
    text: `${opts.headline}\n\n${opts.bodyMarkdown}\n\n${opts.actionUrl || ''}`,
    html
  })

  return res.success
}
