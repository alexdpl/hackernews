// server/api/admin/dependabot.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { KnowledgeDependabotService } from '~~/server/utils/knowledgeDependabot'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Accesso riservato al Kernel Admin.' })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  await KnowledgeDependabotService.ensureSchemaAndRoles(db)

  // 1. Aggiornamento matrice permessi RBAC nel DB
  if (body.action === 'update_permissions') {
    const roleKey = String(body.roleKey || '').trim()
    if (roleKey !== 'sentinel_dockeeper' && roleKey !== 'sentinel_archguard') {
      throw createError({ statusCode: 400, statusMessage: 'Ruolo Sentinel non valido.' })
    }

    await db.execute(sql`
      UPDATE sentinel_role_permissions
      SET
        is_enabled = ${Boolean(body.isEnabled)},
        can_parse_code_blocks = ${Boolean(body.canParseCodeBlocks)},
        can_detect_obsolete_deps = ${Boolean(body.canDetectObsoleteDeps)},
        can_inspect_architecture = ${Boolean(body.canInspectArchitecture)},
        can_suggest_doc_updates = ${Boolean(body.canSuggestDocUpdates)},
        can_auto_comment_threads = ${Boolean(body.canAutoCommentThreads)},
        can_auto_comment_blog = ${Boolean(body.canAutoCommentBlog)},
        can_audit_vault = ${Boolean(body.canAuditVault)},
        updated_at = NOW()
      WHERE role_key = ${roleKey};
    `)

    return {
      success: true,
      message: `Permessi RBAC salvati su NeonDB per ${roleKey}.`
    }
  }

  // 2. Scansione Live Sandbox (snippet manuale)
  if (body.action === 'scan_snippet') {
    const title = String(body.title || 'Snippet Sandbox Admin').trim()
    const content = String(body.content || '').trim()
    if (!content) {
      throw createError({ statusCode: 400, statusMessage: 'Inserisci un blocco di codice da analizzare.' })
    }

    const result = await KnowledgeDependabotService.inspectAndAutoComment({
      entityType: 'manual',
      title,
      content,
      forceAutoComment: false
    })

    return {
      success: true,
      message: 'Analisi semantica completata.',
      result
    }
  }

  // 3. Scansione mirata su Thread ID o Blog Slug con eventuale auto-commento
  if (body.action === 'scan_target') {
    const targetType = body.targetType === 'blog' ? 'blog' : 'forum'
    const autoComment = Boolean(body.autoComment)

    if (targetType === 'forum') {
      const threadId = Number(body.threadId || 0)
      if (!threadId) {
        throw createError({ statusCode: 400, statusMessage: 'Specifica un ID Thread valido.' })
      }
      const res = await db.execute(sql`
        SELECT id, title, content FROM node_posts WHERE id = ${threadId} LIMIT 1;
      `)
      const row = extractRows(res)[0]
      if (!row) {
        throw createError({ statusCode: 404, statusMessage: `Thread #${threadId} non trovato.` })
      }

      const result = await KnowledgeDependabotService.inspectAndAutoComment({
        entityType: autoComment ? 'forum' : 'manual',
        entityId: Number(row.id),
        title: String(row.title || ''),
        content: String(row.content || ''),
        forceAutoComment: autoComment
      })

      return {
        success: true,
        message: result.autoCommented
          ? `Scansione completata e auto-commento pubblicato sul Thread #${threadId}!`
          : `Scansione completata sul Thread #${threadId} (${result.docKeeperFindings.length + result.archGuardFindings.length} rilevamenti).`,
        result
      }
    } else {
      const slug = String(body.blogSlug || '').trim()
      if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Specifica lo slug dell’articolo blog.' })
      }
      const res = await db.execute(sql`
        SELECT id, slug, title, content FROM blog_posts WHERE slug = ${slug} LIMIT 1;
      `)
      const row = extractRows(res)[0]
      if (!row) {
        throw createError({ statusCode: 404, statusMessage: `Articolo "${slug}" non trovato.` })
      }

      const result = await KnowledgeDependabotService.inspectAndAutoComment({
        entityType: autoComment ? 'blog' : 'manual',
        entityId: Number(row.id),
        entitySlug: String(row.slug),
        title: String(row.title || ''),
        content: String(row.content || ''),
        forceAutoComment: autoComment
      })

      return {
        success: true,
        message: result.autoCommented
          ? `Scansione completata e auto-commento pubblicato sull'articolo "${slug}"!`
          : `Scansione completata sull'articolo "${slug}" (${result.docKeeperFindings.length + result.archGuardFindings.length} rilevamenti).`,
        result
      }
    }
  }

  // 4. Audit Retroattivo sugli ultimi 10 Thread + 10 Articoli Blog
  if (body.action === 'run_batch_audit') {
    const [threadsRes, blogsRes] = await Promise.all([
      db.execute(sql`SELECT id, title, content FROM node_posts ORDER BY created_at DESC LIMIT 10;`).catch(() => null),
      db.execute(sql`SELECT id, slug, title, content FROM blog_posts ORDER BY created_at DESC LIMIT 10;`).catch(() => null)
    ])

    let auditedCount = 0
    let autoCommentedCount = 0

    for (const t of extractRows(threadsRes)) {
      const r = await KnowledgeDependabotService.inspectAndAutoComment({
        entityType: 'forum',
        entityId: Number(t.id),
        title: String(t.title || ''),
        content: String(t.content || '')
      })
      auditedCount++
      if (r.autoCommented) autoCommentedCount++
    }

    for (const b of extractRows(blogsRes)) {
      const r = await KnowledgeDependabotService.inspectAndAutoComment({
        entityType: 'blog',
        entityId: Number(b.id),
        entitySlug: String(b.slug || ''),
        title: String(b.title || ''),
        content: String(b.content || '')
      })
      auditedCount++
      if (r.autoCommented) autoCommentedCount++
    }

    return {
      success: true,
      message: `Audit batch completato su ${auditedCount} contenuti (${autoCommentedCount} auto-commenti pubblicati).`
    }
  }

  throw createError({ statusCode: 400, statusMessage: 'Azione non supportata.' })
})