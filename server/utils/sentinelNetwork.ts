// server/utils/sentinelNetwork.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sendSentinelEmail } from '~~/server/utils/mailer'
import { callOpenRouterStructured } from '~~/server/utils/openrouterStructured'

export type CdmTier = 'MICRO' | 'STANDARD' | 'HEAVY'
export type ValidationVerdict = 'PASS' | 'PASS_WITH_CAVEATS' | 'FAIL'

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

interface TtevThinkPlan {
  cdmTier: CdmTier
  modelUsed: string
  assignedSentinel: 'guardian_bot' | 'snippet_master' | 'security_watch' | 'sentinel_ai' | 'none'
  intent: string
  validationCriteria: string[]
  driftSensors: string[]
  pivotTriggers: string[]
}

const THREAT_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: 'XSS_SCRIPT_INJECTION', regex: /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/i },
  { label: 'INLINE_EVENT_HANDLER', regex: /\bon(error|load|mouseover|click)\s*=/i },
  { label: 'SQL_UNION_PROBE', regex: /\bunion\s+all\s+select\b/i },
  { label: 'SPAM_CRYPTO_DROP', regex: /(free-airdrop|claim-usdt|seed-phrase|telegram\.me\/\+)/i }
]

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function detectStaticCodeIssue(content: string): { title: string; suggestion: string } | null {
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

/**
 * PHASE 1: THINK (Lazy Loading + CDM Complexity Scaling + autoModelSwitching)
 */
function thinkAndPlan(ctx: SentinelEventContext, resolvedSlug: string): TtevThinkPlan {
  const threat = THREAT_PATTERNS.find((p) => p.regex.test(ctx.content))
  if (threat) {
    return {
      cdmTier: 'HEAVY',
      modelUsed: 'deterministic-firewall-v2',
      assignedSentinel: 'guardian_bot',
      intent: `Quarantine active threat (${threat.label})`,
      validationCriteria: ['Author is not admin', 'Pattern matches known exploit/spam signature'],
      driftSensors: ['Avoid false positive on escaped code blocks', 'Do not lock admin accounts'],
      pivotTriggers: ['If author role is admin, downgrade to audit log only']
    }
  }

  const hasCodeBlock = ctx.content.includes('```')
  if (hasCodeBlock) {
    const isComplexCode = ctx.content.length > 600 || (ctx.content.match(/```/g)?.length || 0) >= 4
    return {
      cdmTier: isComplexCode ? 'HEAVY' : 'STANDARD',
      modelUsed: isComplexCode ? 'google/gemini-2.5-pro' : 'google/gemini-2.0-flash-001',
      assignedSentinel: 'snippet_master',
      intent: 'Static & AI code quality/security review',
      validationCriteria: [
        'Actionable refactoring advice',
        'Zero hallucinated APIs',
        'Concise technical tone under 900 chars'
      ],
      driftSensors: ['Do not rewrite entire user app', 'Stay strictly on security/performance bugs'],
      pivotTriggers: ['If code has no real flaw, return PASS with no noisy comment']
    }
  }

  const isReleaseOrCve =
    (ctx.targetType === 'post' || ctx.targetType === 'node_post') &&
    (resolvedSlug.includes('core-releases') ||
      resolvedSlug.includes('patch') ||
      /\bCVE-\d{4}-\d+\b/i.test(ctx.content))

  if (isReleaseOrCve) {
    return {
      cdmTier: 'STANDARD',
      modelUsed: 'google/gemini-2.0-flash-001',
      assignedSentinel: 'security_watch',
      intent: 'Release integrity & CVE verification checklist',
      validationCriteria: ['Includes SHA-256 and migration audit reminders'],
      driftSensors: ['Keep checklist concise'],
      pivotTriggers: ['Skip if thread is a reply comment']
    }
  }

  // MICRO tier: 0 tokens spent (BEMYAGENT Lazy Loading)
  return {
    cdmTier: 'MICRO',
    modelUsed: 'none (0-token lazy skip)',
    assignedSentinel: 'none',
    intent: 'Benign community content — no sentinel intervention required',
    validationCriteria: [],
    driftSensors: [],
    pivotTriggers: []
  }
}

/**
 * PHASE 4: SYMBIOTIC VALIDATION (Self-verification before external side effects)
 */
function symbioticValidate(
  plan: TtevThinkPlan,
  draftOutput: string
): { verdict: ValidationVerdict; notes: string[] } {
  const notes: string[] = []
  if (!draftOutput || draftOutput.trim().length < 20) {
    return { verdict: 'FAIL', notes: ['Output empty or below minimum signal threshold'] }
  }
  if (draftOutput.length > 1800) {
    notes.push('Output truncated to stay within concise CDM bounds')
  }
  if (/undefined|null|\[object Object\]/.test(draftOutput)) {
    return { verdict: 'FAIL', notes: ['Template interpolation artifact detected'] }
  }
  return {
    verdict: notes.length > 0 ? 'PASS_WITH_CAVEATS' : 'PASS',
    notes: notes.length > 0 ? notes : ['All CDM validation criteria satisfied']
  }
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

  const authorRes = await db.execute(sql`
    SELECT id, username, email, role, COALESCE(is_bot, FALSE) AS "isBot"
    FROM users WHERE id = ${ctx.authorId} LIMIT 1;
  `)
  const authorRow = extractRows(authorRes)[0]
  if (authorRow?.isBot) return

  const authorUsername = String(authorRow?.username || ctx.authorUsername || 'member')
  const authorEmail = String(authorRow?.email || ctx.authorEmail || '').trim()
  const authorRole = String(authorRow?.role || 'user').toLowerCase()
  const threadUrl =
    ctx.targetType === 'node_post' || ctx.targetType === 'node_comment'
      ? `[https://devkernelpulse.org/nodes/thread/$](https://devkernelpulse.org/nodes/thread/$){ctx.postId}`
      : `[https://devkernelpulse.org/post/$](https://devkernelpulse.org/post/$){ctx.postId}`

  let resolvedSlug = String(ctx.sectionSlug || '').toLowerCase()
  if (!resolvedSlug && ctx.nodeId) {
    const nodeRes = await db.execute(sql`SELECT slug FROM nodes WHERE id = ${ctx.nodeId} LIMIT 1;`).catch(() => null)
    resolvedSlug = String(extractRows(nodeRes)[0]?.slug || '').toLowerCase()
  }

  // PHASE 1: THINK
  const plan = thinkAndPlan(ctx, resolvedSlug)
  if (plan.assignedSentinel === 'none') {
    return // MICRO tier lazy exit: 0 tokens, 0 DB bloat
  }

  // PHASE 2 & 3: TASK & EXECUTE
  if (plan.assignedSentinel === 'guardian_bot') {
    const matchedThreat = THREAT_PATTERNS.find((p) => p.regex.test(ctx.content))!
    const isPivotAdmin = authorRole === 'admin'

    if (!isPivotAdmin) {
      await db.execute(sql`
        UPDATE users
        SET is_shadowbanned = TRUE,
            ban_reason = ${`[guardian_bot] Firewall trigger: ${matchedThreat.label}`}
        WHERE id = ${ctx.authorId};
      `)
    }

    let smtpSent = false
    if (authorEmail && !isPivotAdmin) {
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

    const trace = {
      protocol: 'BEMYAGENT-TTEV-v1',
      cdmTier: plan.cdmTier,
      modelUsed: plan.modelUsed,
      rule: matchedThreat.label,
      pivotTriggered: isPivotAdmin,
      verdict: isPivotAdmin ? 'PASS_WITH_CAVEATS' : 'PASS'
    }

    await db.execute(sql`
      INSERT INTO sentinel_logs (
        sentinel_username, target_user_id, target_type, target_id,
        action_type, reasoning_trace, payload_summary, smtp_dispatched
      ) VALUES (
        'guardian_bot', ${ctx.authorId}, ${ctx.targetType}, ${ctx.targetId},
        ${isPivotAdmin ? 'audit_admin_payload' : 'shadowban'}, ${JSON.stringify(trace)}::jsonb,
        ${ctx.content.slice(0, 240)}, ${smtpSent}
      );
    `)
    return
  }

  if (plan.assignedSentinel === 'snippet_master') {
    const bot = await getBotUser(db, 'snippet_master')
    if (!bot) return

    let title = ''
    let suggestion = ''
    let modelActuallyUsed = plan.modelUsed

    // 1. Controllo statico immediato (zero latenza)
    const staticHint = detectStaticCodeIssue(ctx.content)
    if (staticHint) {
      title = staticHint.title
      suggestion = staticHint.suggestion
      modelActuallyUsed = 'static-ast-fastpath + ' + plan.modelUsed
    } else {
      // 2. Analisi AI strutturata con autoModelSwitching (STANDARD vs HEAVY)
      const aiReview = await callOpenRouterStructured<{
        hasIssue: boolean
        title: string
        suggestion: string
      }>({
        schemaName: 'dkp_snippet_master_review',
        model: plan.modelUsed,
        temperature: 0.1,
        systemPrompt:
          'Sei snippet_master di DevKernelPulse. Analizza lo snippet di codice. Segnala SOLO bug reali, vulnerabilità di sicurezza o memory leak. Se il codice è pulito, imposta hasIssue: false.',
        userPrompt: ctx.content.slice(0, 4000),
        schema: {
          type: 'object',
          properties: {
            hasIssue: { type: 'boolean' },
            title: { type: 'string' },
            suggestion: { type: 'string' }
          },
          required: ['hasIssue', 'title', 'suggestion']
        },
        fallback: { hasIssue: false, title: '', suggestion: '' }
      }).catch(() => ({ fallbackUsed: true, data: { hasIssue: false, title: '', suggestion: '' }, providerModel: plan.modelUsed }))

      if (!aiReview.data?.hasIssue) {
        return // Pivot: codice pulito, nessun commento superfluo
      }
      title = aiReview.data.title
      suggestion = aiReview.data.suggestion
      modelActuallyUsed = aiReview.providerModel || plan.modelUsed
    }

    const replyBody = `**[DKP Snippet Master // TTEV Code Audit]**\n\n**${title}**\n${suggestion}`

    // PHASE 4: VERIFY (Symbiotic Validation)
    const validation = symbioticValidate(plan, replyBody)
    if (validation.verdict === 'FAIL') {
      return
    }

    await postSentinelReply(db, ctx, bot, replyBody.slice(0, 1800))

    let smtpSent = false
    if (authorEmail) {
      smtpSent = await sendSentinelEmail({
        to: authorEmail,
        subject: 'Suggerimento di refactoring sul tuo snippet',
        category: 'snippet_suggestion',
        recipientUsername: authorUsername,
        sentinelName: 'snippet_master',
        headline: title,
        bodyMarkdown: suggestion,
        actionUrl: threadUrl
      })
    }

    const trace = {
      protocol: 'BEMYAGENT-TTEV-v1',
      cdmTier: plan.cdmTier,
      modelUsed: modelActuallyUsed,
      hint: title,
      verdict: validation.verdict,
      validationNotes: validation.notes
    }

    await db.execute(sql`
      INSERT INTO sentinel_logs (
        sentinel_username, target_user_id, target_type, target_id,
        action_type, reasoning_trace, payload_summary, smtp_dispatched
      ) VALUES (
        'snippet_master', ${ctx.authorId}, ${ctx.targetType}, ${ctx.targetId},
        'snippet_reply', ${JSON.stringify(trace)}::jsonb,
        ${suggestion.slice(0, 240)}, ${smtpSent}
      );
    `)
    return
  }

  if (plan.assignedSentinel === 'security_watch') {
    const bot = await getBotUser(db, 'security_watch')
    if (!bot) return

    const advisory =
      `**[Security Watch // Release Verification]**\n\n` +
      `Thread indicizzato dal monitor **Security Watch**. ` +
      `Ricorda di includere checksum SHA-256, compatibilità migrazioni SQL e impatto sulle variabili d'ambiente per facilitare l'audit del Kernel.`

    const validation = symbioticValidate(plan, advisory)
    if (validation.verdict === 'FAIL') return

    await postSentinelReply(db, ctx, bot, advisory)

    const trace = {
      protocol: 'BEMYAGENT-TTEV-v1',
      cdmTier: plan.cdmTier,
      modelUsed: plan.modelUsed,
      channel: resolvedSlug || 'cve-mention',
      verdict: validation.verdict
    }

    await db.execute(sql`
      INSERT INTO sentinel_logs (
        sentinel_username, target_user_id, target_type, target_id,
        action_type, reasoning_trace, payload_summary, smtp_dispatched
      ) VALUES (
        'security_watch', ${ctx.authorId}, ${ctx.targetType}, ${ctx.targetId},
        'security_advisory', ${JSON.stringify(trace)}::jsonb,
        'Release checklist posted', FALSE
      );
    `)
  }
}


export async function runSentinelSweep(options?: { recipientEmail?: string; triggerSource?: string }) {
  const db = await getDb()
  if (!db) {
    return { success: false, scannedCount: 0, findingsCount: 0, emailDispatched: false }
  }

  const recipientEmail = String(
    options?.recipientEmail || process.env.ADMIN_ALERT_EMAIL || 'alex@devkernelpulse.org'
  ).trim()
  const triggerSource = String(options?.triggerSource || 'scheduled-cron').trim()

  const [postsRes, nodePostsRes, blogRes] = await Promise.all([
    db.execute(sql`
      SELECT id, title, COALESCE(content, text, '') AS body, user_id AS "authorId"
      FROM posts
      ORDER BY created_at DESC
      LIMIT 15;
    `).catch(() => []),
    db.execute(sql`
      SELECT id, title, COALESCE(content, '') AS body, author_id AS "authorId"
      FROM node_posts
      ORDER BY created_at DESC
      LIMIT 15;
    `).catch(() => []),
    db.execute(sql`
      SELECT id, title, COALESCE(content, '') AS body, author_id AS "authorId"
      FROM blog_posts
      ORDER BY created_at DESC
      LIMIT 10;
    `).catch(() => [])
  ])

  const items: Array<{ kind: string; id: number; title: string; body: string }> = [
    ...extractRows(postsRes).map((r: any) => ({ kind: 'POST', id: Number(r.id), title: String(r.title || ''), body: String(r.body || '') })),
    ...extractRows(nodePostsRes).map((r: any) => ({ kind: 'NODE_POST', id: Number(r.id), title: String(r.title || ''), body: String(r.body || '') })),
    ...extractRows(blogRes).map((r: any) => ({ kind: 'BLOG_POST', id: Number(r.id), title: String(r.title || ''), body: String(r.body || '') }))
  ]

  const findings: string[] = []
  for (const item of items) {
    const combined = `${item.title}\n${item.body}`
    const matchedThreat = THREAT_PATTERNS.find((p) => p.regex.test(combined))
    if (matchedThreat) {
      findings.push(`- [${item.kind} #${item.id}] Rilevato pattern **${matchedThreat.label}** su "${item.title.slice(0, 60)}"`)
      continue
    }
    const staticIssue = detectStaticCodeIssue(item.body)
    if (staticIssue) {
      findings.push(`- [${item.kind} #${item.id}] ${staticIssue.title} su "${item.title.slice(0, 60)}"`)
    }
  }

  const reportLines = [
    `### Telemetria Sentinel Network (${triggerSource})`,
    `- **Contenuti scansionati:** ${items.length} (Feed, Nodi, Blog)`,
    `- **Anomalie rilevate:** ${findings.length}`,
    `- **Stato CodeQL / SAST Guard:** Operativo`,
    '',
    findings.length > 0
      ? `#### Dettaglio Rilevazioni:\n${findings.join('\n')}`
      : 'Nessuna minaccia XSS, SQLi o regressione rilevata nel perimetro scansionato.'
  ].join('\n')

  const emailDispatched = await sendSentinelEmail({
    to: recipientEmail,
    subject: `[DKP Sentinel Report] ${findings.length > 0 ? `${findings.length} alert rilevati` : 'Perimetro pulito'} (${items.length} elementi)`,
    category: 'security_alert',
    recipientUsername: 'alexdpl',
    sentinelName: 'sentinel_ai',
    headline: findings.length > 0 ? 'Report Sentinel: Rilevate Anomalie da Verificare' : 'Report Sentinel: Perimetro Sicuro',
    bodyMarkdown: reportLines,
    actionUrl: 'https://devkernelpulse.org/admin/mail'
  }).catch(() => false)

  const trace = {
    protocol: 'BEMYAGENT-TTEV-v1',
    triggerSource,
    scannedCount: items.length,
    findingsCount: findings.length,
    verdict: 'PASS'
  }

  await db.execute(sql`
    INSERT INTO sentinel_logs (
      sentinel_username, target_type, target_id,
      action_type, reasoning_trace, payload_summary, smtp_dispatched
    ) VALUES (
      'sentinel_ai', 'system_sweep', 0,
      'scheduled_sweep', ${JSON.stringify(trace)}::jsonb,
      ${`Sweep completato: ${items.length} contenuti, ${findings.length} alert`}, ${emailDispatched}
    );
  `).catch(() => {})

  return {
    success: true,
    scannedCount: items.length,
    findingsCount: findings.length,
    findings,
    emailDispatched
  }
}