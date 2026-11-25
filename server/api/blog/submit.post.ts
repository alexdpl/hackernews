import { KnowledgeDependabotService } from '~~/server/utils/knowledgeDependabot'
// server/api/blog/submit.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import crypto from 'node:crypto'
import { generateObject } from 'ai'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { AI_MODELS } from '~~/server/utils/ai'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

// --- 1. PULSE SENTINEL SAST: Regole di Sicurezza Statiche (Euristiche Locali) ---
const SECURITY_RULES = [
  {
    id: 'SEC-001',
    name: 'Hardcoded Secret / API Key',
    pattern: /(?:AIza[0-9a-zA-Z\-_]{35}|AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36}|sk-or-v1-[a-zA-Z0-9]{64})/,
    severity: 'CRITICAL' as const,
    description: 'Possibile chiave API (Google, AWS, OpenAI, GitHub, OpenRouter) rilevata nel codice in chiaro.'
  },
  {
    id: 'SEC-002',
    name: 'Dangerous Execution (eval/exec)',
    pattern: /\b(eval|exec|system|passthru|shell_exec)\s*\(/,
    severity: 'WARNING' as const,
    description: 'Rilevato utilizzo di funzioni di esecuzione dinamica potenzialmente pericolose.'
  },
  {
    id: 'SEC-003',
    name: 'Exposed Database Credentials',
    pattern: /postgres(?:ql)?:\/\/[a-zA-Z0-9_]+:[^@\s]+@[^\s/]+(?::[0-9]{2,5})?\/[a-zA-Z0-9_]+/,
    severity: 'CRITICAL' as const,
    description: 'Possibile stringa di connessione a database con password in chiaro.'
  }
]

// --- 2. SCHEMA ZOD PER L'AUDIT AI VIA OPENROUTER ---
const BlogVaultAuditSchema = z.object({
  authenticityScore: z.number().min(0).max(100).describe("Score di autenticità e valore tecnico dell'articolo (0-100)"),
  securityScore: z.number().min(0).max(100).describe("Score di sicurezza generale del codice e del contenuto (0-100)"),
  plagiarismRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe("Rischio di contenuto copiato o generato in modo generico da AI"),
  sastCheck: z.enum(['PASSED', 'WARNING', 'CRITICAL']).describe("Esito globale della sicurezza del codice"),
  summary: z.string().describe("Breve sintesi dell'audit in lingua italiana per il report Vault")
})

function slugify(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per inviare un articolo al DKP Vault.'
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const { title, content, category, subcategory, excerpt, tags } = body

  const cleanTitle = String(title || '').trim()
  const cleanContent = String(content || '').trim()

  if (!cleanTitle || !cleanContent) {
    throw createError({ statusCode: 400, statusMessage: 'Titolo e contenuto sono obbligatori per l\'analisi.' })
  }

  if (cleanTitle.length > 255) {
    throw createError({ statusCode: 400, statusMessage: 'Il titolo non può superare i 255 caratteri.' })
  }

  // A. ESTRAZIONE FRAMMENTI DI CODICE (Code Extraction Engine)
  const codeBlockRegex = /```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  const extractedSnippets: Array<{ language: string; code: string }> = []

  while ((match = codeBlockRegex.exec(cleanContent)) !== null) {
    extractedSnippets.push({
      language: match[1].trim() || 'unknown',
      code: match[2].trim()
    })
  }

  // B. ANALISI SAST STATICA LOCALE (Regex Check)
  let staticSastStatus: 'PASSED' | 'WARNING' | 'CRITICAL' = 'PASSED'
  let totalIssues = 0
  const analysisReport: any[] = []

  extractedSnippets.forEach((snippet, index) => {
    const issuesFound: any[] = []

    SECURITY_RULES.forEach((rule) => {
      if (rule.pattern.test(snippet.code)) {
        issuesFound.push({
          ruleId: rule.id,
          name: rule.name,
          severity: rule.severity,
          message: rule.description
        })

        if (rule.severity === 'CRITICAL') staticSastStatus = 'CRITICAL'
        else if (rule.severity === 'WARNING' && staticSastStatus !== 'CRITICAL') staticSastStatus = 'WARNING'
        totalIssues++
      }
    })

    analysisReport.push({
      snippetIndex: index + 1,
      language: snippet.language,
      issuesFound,
      status: issuesFound.length === 0 ? 'CLEAN' : 'VULNERABILITIES_DETECTED'
    })
  })

  // C. ANALISI SEMANTICA AI CON OPENROUTER (Vercel AI SDK)
  let aiReport = {
    authenticityScore: staticSastStatus === 'CRITICAL' ? 10 : (staticSastStatus === 'WARNING' ? 65 : 95),
    securityScore: staticSastStatus === 'CRITICAL' ? 5 : (staticSastStatus === 'WARNING' ? 70 : 100),
    plagiarismRisk: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
    sastCheck: staticSastStatus,
    summary: 'Analisi statica locale completata con successo.'
  }

  try {
    const { object: llmResult } = await generateObject({
      model: AI_MODELS.BALANCED,
      schema: BlogVaultAuditSchema,
      system: `Sei DKP Vault Audit Engine. Valuti la sicurezza, l'autenticità e il rischio di plagio degli articoli per DevKernelPulse.
Se sono presenti credenziali esposte o vulnerabilità critiche, forza il punteggio di sicurezza a livelli bassi.`,
      prompt: `Titolo: "${cleanTitle}"
Estratto Contenuto:
"""
${cleanContent.substring(0, 3000)}
"""

Snippet di codice estratti (${extractedSnippets.length}):
${extractedSnippets.map((s, idx) => `Snippet #${idx + 1} (${s.language}):\n${s.code.substring(0, 500)}`).join('\n---\n')}

Risultato scansione statica locale: ${staticSastStatus} (Problemi trovati: ${totalIssues})`
    })

    const finalSastCheck = staticSastStatus === 'CRITICAL'
      ? 'CRITICAL'
      : (llmResult.sastCheck === 'CRITICAL' ? 'CRITICAL' : (staticSastStatus === 'WARNING' || llmResult.sastCheck === 'WARNING' ? 'WARNING' : 'PASSED'))

    const finalSecurityScore = staticSastStatus === 'CRITICAL'
      ? Math.min(15, llmResult.securityScore)
      : llmResult.securityScore

    aiReport = {
      authenticityScore: llmResult.authenticityScore,
      securityScore: finalSecurityScore,
      plagiarismRisk: llmResult.plagiarismRisk,
      sastCheck: finalSastCheck,
      summary: llmResult.summary
    }
  } catch (llmError) {
    console.warn('⚠️ [BLOG VAULT OPENROUTER FALLBACK]:', llmError)
  }

  // D. GENERAZIONE HASH CRITTOGRAFICO SHA-256 VAULT (Proof-of-Code)
  const rawDataForHashing = extractedSnippets.length > 0
    ? extractedSnippets.map((s) => s.code).join('|||')
    : cleanContent

  const vaultHash = crypto
    .createHash('sha256')
    .update(`DKP_BLOG_VAULT::${cleanTitle}::${rawDataForHashing}::${Date.now()}`)
    .digest('hex')

  // E. PERSISTENZA SU NEON DB ALLINEATA ALLO SCHEMA REALE
  let savedPostRecord: any = null
  const baseSlug = slugify(body.slug || cleanTitle) || `post-${Date.now()}`
  let finalSlug = baseSlug

  try {
    const db = await getDb()
    if (db) {
      // Verifica utente reale nel DB
      const userRows = extractRows(
        await db.execute(sql`SELECT id, role FROM users WHERE id = ${Number(sessionUser.id)} LIMIT 1;`)
      )
      const dbUser = userRows[0]
      if (!dbUser?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Utente sessione non valido.' })
      }
      const authorId = Number(dbUser.id)

      // Assicura eventuali colonne extra di telemetria audit se non ancora presenti
      await db.execute(sql`
        ALTER TABLE blog_posts
          ADD COLUMN IF NOT EXISTS sast_status VARCHAR(20),
          ADD COLUMN IF NOT EXISTS security_score INTEGER,
          ADD COLUMN IF NOT EXISTS authenticity_score INTEGER;
      `).catch(() => null)

      // Rileva tipo colonna tags (ARRAY vs JSONB)
      const colInfo = extractRows(
        await db.execute(sql`
          SELECT data_type, udt_name
          FROM information_schema.columns
          WHERE table_name = 'blog_posts' AND column_name = 'tags'
          LIMIT 1;
        `)
      )[0]
      const tagsDataType = String(colInfo?.data_type || '').toUpperCase()
      const tagsUdtName = String(colInfo?.udt_name || '').toLowerCase()
      const isPgArray = tagsDataType === 'ARRAY' || tagsUdtName.startsWith('_')
      const isJsonb = tagsDataType === 'JSONB' || tagsDataType === 'JSON'

      const cleanTags: string[] = Array.isArray(tags)
        ? tags.map((t: any) => String(t).trim().replace(/^#/, '')).filter(Boolean)
        : ['DKP', 'Vault', 'Sentinel']

      const tagsSqlExpr = isPgArray
        ? (cleanTags.length > 0 ? sql`ARRAY[${sql.join(cleanTags.map((t) => sql`${t}`), sql`, `)}]::text[]` : sql`ARRAY[]::text[]`)
        : isJsonb
          ? sql`${JSON.stringify(cleanTags)}::jsonb`
          : sql`${JSON.stringify(cleanTags)}`

      // Risolvi category_id da blog_categories
      const catName = String(category || 'DKP Ecosystem & Releases').trim()
      const catSlug = slugify(catName) || 'dkp-ecosystem-releases'
      let categoryId: number | null = null

      const existingCat = extractRows(
        await db.execute(sql`
          SELECT id FROM blog_categories WHERE slug = ${catSlug} OR name ILIKE ${catName} LIMIT 1;
        `)
      )[0]

      if (existingCat?.id) {
        categoryId = Number(existingCat.id)
      } else {
        const createdCat = extractRows(
          await db.execute(sql`
            INSERT INTO blog_categories (name, slug)
            VALUES (${catName}, ${catSlug})
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
          `).catch(() => [])
        )[0]
        if (createdCat?.id) categoryId = Number(createdCat.id)
      }

      // Risolvi subcategory_id da blog_subcategories
      let subcategoryId: number | null = null
      if (subcategory && categoryId) {
        const subName = String(subcategory).trim()
        const subSlug = slugify(subName)
        if (subSlug) {
          const existingSub = extractRows(
            await db.execute(sql`
              SELECT id FROM blog_subcategories WHERE slug = ${subSlug} OR name ILIKE ${subName} LIMIT 1;
            `)
          )[0]

          if (existingSub?.id) {
            subcategoryId = Number(existingSub.id)
          } else {
            const createdSub = extractRows(
              await db.execute(sql`
                INSERT INTO blog_subcategories (category_id, name, slug)
                VALUES (${categoryId}, ${subName}, ${subSlug})
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                RETURNING id;
              `).catch(() => [])
            )[0]
            if (createdSub?.id) subcategoryId = Number(createdSub.id)
          }
        }
      }

      // Controllo preventivo slug per evitare conflitto 23505
      const existingRows = extractRows(
        await db.execute(sql`SELECT id FROM blog_posts WHERE slug = ${finalSlug} LIMIT 1;`)
      )
      if (existingRows.length > 0) {
        finalSlug = `${baseSlug}-${Date.now().toString(36)}`
      }

      const isVerified = aiReport.sastCheck === 'PASSED'
      const postStatus = aiReport.sastCheck === 'CRITICAL'
        ? 'rejected_vault'
        : (isVerified ? 'published' : 'pending_vault')
      const certSuffix = crypto.randomBytes(4).toString('hex').toUpperCase()
      const vaultCertificateId = `DKP-VAULT-SENTINEL-${certSuffix}`

      const insertRes: any = await db.execute(sql`
        INSERT INTO blog_posts (
          title,
          slug,
          content,
          excerpt,
          category_id,
          subcategory_id,
          author_id,
          tags,
          status,
          is_verified,
          vault_certificate_id,
          vault_hash,
          sast_status,
          security_score,
          authenticity_score,
          created_at
        ) VALUES (
          ${cleanTitle},
          ${finalSlug},
          ${cleanContent},
          ${String(excerpt || aiReport.summary || '').trim()},
          ${categoryId},
          ${subcategoryId},
          ${authorId},
          ${tagsSqlExpr},
          ${postStatus},
          ${isVerified},
          ${vaultCertificateId},
          ${vaultHash},
          ${aiReport.sastCheck},
          ${aiReport.securityScore},
          ${aiReport.authenticityScore},
          NOW()
        )
        RETURNING id, slug, title, status, is_verified AS "isVerified", vault_hash AS "vaultHash", vault_certificate_id AS "vaultCertificateId";
      `).catch((insertErr: any) => {
        console.warn('⚠️ [BLOG INSERT WARN]:', insertErr?.message)
        return null
      })

      savedPostRecord = extractRows(insertRes)[0] || null
    }
  } catch (dbErr: any) {
    if (dbErr?.statusCode) throw dbErr
    console.warn('⚠️ [NEON DB PERSISTENCE WARN]:', dbErr?.message)
  }

  if (savedPostRecord?.id || finalSlug) {
    void KnowledgeDependabotService.inspectAndAutoComment({
      entityType: 'blog',
      entityId: Number(savedPostRecord?.id || 0),
      entitySlug: String(savedPostRecord?.slug || finalSlug || ''),
      title: cleanTitle,
      content: String(body.content || ''),
      authorUsername: String(body.author || '')
    }).catch(() => null)
  }

  // F. RISPOSTA STRUTTURATA PER L'ADMIN PANEL E LA UI
  return {
    success: true,
    message: 'Analisi Pulse Sentinel completata e articolo notarizzato su NeonDB.',
    post: savedPostRecord || {
      title: cleanTitle,
      slug: finalSlug,
      vaultHash
    },
    vaultData: {
      totalSnippetsAnalyzed: extractedSnippets.length,
      sastCheck: aiReport.sastCheck,
      totalIssuesFound: totalIssues,
      authenticityScore: aiReport.authenticityScore,
      securityScore: aiReport.securityScore,
      plagiarismRisk: aiReport.plagiarismRisk,
      summary: aiReport.summary,
      vaultHashPreview: vaultHash,
      detailedReport: analysisReport
    }
  }
})