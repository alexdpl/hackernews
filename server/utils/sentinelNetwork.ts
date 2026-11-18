// server/utils/sentinelNetwork.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sendSentinelEmail } from '~~/server/utils/mailer'

export interface SentinelEventContext {
  targetType: 'post' | 'comment' | 'node_post' | 'node_comment'
  targetId: number
  postId: number
  nodeId?: number
  sectionSlug?: string
  authorId: number
  authorUsername?: string
  authorEmail?: string
  authorIsBot?: boolean
  content: string
}

const THREAT_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: 'XSS_SCRIPT_INJECTION', regex: /<script\b[^>]*>[\s\S]*?<\/script>/i },
  { label: 'INLINE_EVENT_HANDLER', regex: /\bon(error|load|mouseover|click)\s*=/i },
  { label: 'SQL_UNION_PROBE', regex: /\bunion\s+all\s+select\b/i },
  { label: 'SPAM_CRYPTO_DROP', regex: /(free-airdrop|claim-usdt|seed-phrase|telegram\.me\/\+)/i }
]

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function detectCodeIssue(content: string): { title: string; suggestion: string } | null {
  if (!content.includes('```')) return null

  if (/innerHTML\s*=/.test(content)) {
    return {
      title: 'Rilevato assegnamento diretto a `innerHTML`',
      suggestion:
        'Per prevenire vulnerabilità DOM-XSS, sostituisci `element.innerHTML = value` con `element.textContent = value` oppure sanitizza l’input prima del rendering.'
    }
  }

  if (/SELECT\s+.+\s+FROM\s+.+\$\{/i.test(content)) {
    return {
      title: 'Possibile interpolazione stringa in query SQL',
      suggestion:
        'Evita la concatenazione diretta nelle query SQL. Usa i template tag parametrizzati di Drizzle (`sql\`SELECT * FROM users WHERE id = ${userId}\``) per delegare l’escaping al driver PostgreSQL.'
    }
  }

  return null
}

async function getBotUser(db: any, username: string): Promise<{ id: number; username: string } | null> {
  const res = await db.execute(sql`
    SELECT id, username FROM users WHERE LOWER(username) = LOWER(${username}) AND is_bot = TRUE LIMIT 1;
  `)
  const row = extractRows(res)[0]
  return row?.id ? { id: Number(row.id), username: String(row.username) } : null
}

async function postSentinelReply(
  db: any,
  ctx: SentinelEventContext,
  bot: { id: number; username: string },
  replyText: string
): Promise<void> {
  const isNodeThread = ctx.targetType === 'node_post' || ctx.targetType === 'node_comment'

  if (isNodeThread) {
    await db.execute(sql`
      INSERT INTO node_comments (post_id, author_id, content, karma_score)
      VALUES (${ctx.postId}, ${bot.id}, ${replyText}, 1);
    `)
    await db.execute(sql`
      UPDATE node_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${ctx.postId};
    `).catch(() => {})
  } else {
    const commentTargetType = ctx.sectionSlug === 'blog' ? 'blog' : 'post'
    await db.execute(sql`
      INSERT INTO comments (post_id, user_id, target_type, author, text, content, created_at)
      VALUES (${ctx.postId}, ${bot.id}, ${commentTargetType}, ${bot.username}, ${replyText}, ${replyText}, NOW());
    `)
    await db.execute(sql`
      UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${ctx.postId};
    `).catch(() => {})
    await db.execute(sql`
      UPDATE blog_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${ctx.postId};
    `).catch(() => {})
  }
}

export async function runSentinelPipeline(ctx: SentinelEventContext): Promise<void> {
  if (ctx.authorIsBot) return

  const db = await getDb()
  if (!db) return

  // Recupera dati aggiornati dell'autore dal DB
  const authorRes = await db.execute(sql`
    SELECT id, username, email, role, COALESCE(is_bot, FALSE) AS "isBot"
    FROM users WHERE id = ${ctx.authorId} LIMIT 1;
  `)
  const authorRow = extractRows(authorRes)[0]
  if (authorRow?.isBot) return

  const authorUsername = String(authorRow?.username || ctx.authorUsername || 'member')
  const authorEmail = String(authorRow?.email || ctx.authorEmail || '').trim()
  const threadUrl =
    ctx.targetType === 'node_post' || ctx.targetType === 'node_comment'
      ? `[https://devkernelpulse.org/nodes/thread/$](https://devkernelpulse.org/nodes/thread/$){ctx.postId}`
      : `[https://devkernelpulse.org/post/$](https://devkernelpulse.org/post/$){ctx.postId}`

  // 1. GUARDIAN_BOT: Firewall & Anti-Spam
  const matchedThreat = THREAT_PATTERNS.find((p) => p.regex.test(ctx.content))
  if (matchedThreat) {
    await db.execute(sql`
      UPDATE users
      SET is_shadowbanned = TRUE,
          ban_reason = ${`[guardian_bot] Firewall trigger: ${matchedThreat.label}`}
      WHERE id = ${ctx.authorId} AND LOWER(role) != 'admin';
    `)

    let smtpSent = false
    if (authorEmail) {
      smtpSent = await sendSentinelEmail({
        to: authorEmail,
        subject: 'Avviso di sicurezza dal Kernel Firewall',
        category: 'moderation_notice',
        recipientUsername: authorUsername,
        sentinelName: 'guardian_bot',
        headline: 'Contenuto intercettato dal Firewall DKP',
        bodyMarkdown: `Il tuo ultimo contributo ha attivato la regola di protezione **${matchedThreat.label}**.\nIl tuo account è stato posto in modalità revisione preventiva (shadowban) per proteggere la community.`,
        actionUrl: threadUrl
      })
    }

    await db.execute(sql`
      INSERT INTO sentinel_logs (
        sentinel_username, target_user_id, target_type, target_id,
        action_type, reasoning_trace, payload_summary, smtp_dispatched
      ) VALUES (
        'guardian_bot', ${ctx.authorId}, ${ctx.targetType}, ${ctx.targetId},
        'shadowban', ${JSON.stringify({ rule: matchedThreat.label })}::jsonb,
        ${ctx.content.slice(0, 240)}, ${smtpSent}
      );
    `)
    return
  }

  // 2. SNIPPET_MASTER: Revisione automatica snippet di codice
  const codeHint = detectCodeIssue(ctx.content)
  if (codeHint) {
    const bot = await getBotUser(db, 'snippet_master')
    if (bot) {
      const replyBody = `**[DKP Snippet Master // Static Hint]**\n\n**${codeHint.title}**\n${codeHint.suggestion}`
      await postSentinelReply(db, ctx, bot, replyBody)

      let smtpSent = false
      if (authorEmail) {
        smtpSent = await sendSentinelEmail({
          to: authorEmail,
          subject: 'Suggerimento di refactoring sul tuo snippet',
          category: 'snippet_suggestion',
          recipientUsername: authorUsername,
          sentinelName: 'snippet_master',
          headline: codeHint.title,
          bodyMarkdown: codeHint.suggestion,
          actionUrl: threadUrl
        })
      }

      await db.execute(sql`
        INSERT INTO sentinel_logs (
          sentinel_username, target_user_id, target_type, target_id,
          action_type, reasoning_trace, payload_summary, smtp_dispatched
        ) VALUES (
          'snippet_master', ${ctx.authorId}, ${ctx.targetType}, ${ctx.targetId},
          'snippet_reply', ${JSON.stringify({ hint: codeHint.title })}::jsonb,
          ${codeHint.suggestion}, ${smtpSent}
        );
      `)
    }
    return
  }

  // 3. SECURITY_WATCH: Monitoraggio n/Core Releases & Patch
  let resolvedSlug = String(ctx.sectionSlug || '').toLowerCase()
  if (!resolvedSlug && ctx.nodeId) {
    const nodeRes = await db.execute(sql`SELECT slug FROM nodes WHERE id = ${ctx.nodeId} LIMIT 1;`).catch(() => null)
    resolvedSlug = String(extractRows(nodeRes)[0]?.slug || '').toLowerCase()
  }

  if (
    (ctx.targetType === 'post' || ctx.targetType === 'node_post') &&
    (resolvedSlug.includes('core-releases') || resolvedSlug.includes('patch') || /\bCVE-\d{4}-\d+\b/i.test(ctx.content))
  ) {
    const bot = await getBotUser(db, 'security_watch')
    if (bot) {
      const advisory =
        `**[Security Watch // Release Verification]**\n\n` +
        `Thread indicizzato dal monitor **Security Watch**. ` +
        `Ricorda di includere checksum SHA-256, compatibilità migrazioni SQL e impatto sulle variabili d'ambiente per facilitare l'audit del Kernel.`

      await postSentinelReply(db, ctx, bot, advisory)

      await db.execute(sql`
        INSERT INTO sentinel_logs (
          sentinel_username, target_user_id, target_type, target_id,
          action_type, reasoning_trace, payload_summary, smtp_dispatched
        ) VALUES (
          'security_watch', ${ctx.authorId}, ${ctx.targetType}, ${ctx.targetId},
          'security_advisory', ${JSON.stringify({ channel: resolvedSlug || 'cve-mention' })}::jsonb,
          'Release checklist posted', FALSE
        );
      `)
    }
  }
}
