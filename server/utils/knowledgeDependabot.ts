// server/utils/knowledgeDependabot.ts
import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export type SentinelBotRole = 'sentinel_dockeeper' | 'sentinel_archguard'

export interface DependabotFinding {
  agent: SentinelBotRole
  severity: 'HIGH' | 'MEDIUM' | 'INFO'
  category: 'OBSOLETE_DEPENDENCY' | 'DEPRECATED_API' | 'ARCH_PATTERN' | 'SECURITY_PATTERN' | 'DOC_UPDATE'
  title: string
  detectedSnippet: string
  recommendation: string
  modernReplacement: string
  docReference: string
}

export interface DependabotInspectionResult {
  success: boolean
  fingerprint: string
  codeBlocksCount: number
  docKeeperFindings: DependabotFinding[]
  archGuardFindings: DependabotFinding[]
  autoCommented: boolean
  postedComments: Array<{ agent: SentinelBotRole; commentId: number | null; targetType: string }>
}

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function extractCodeBlocks(markdown: string): Array<{ lang: string; code: string }> {
  const blocks: Array<{ lang: string; code: string }> = []
  const regex = /```([a-zA-Z0-9_+#.-]*)[ \t]*\r?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({
      lang: String(match[1] || 'text').trim().toLowerCase(),
      code: String(match[2] || '').trim()
    })
  }
  return blocks
}

export class KnowledgeDependabotService {
  private static schemaReady = false

  static async ensureSchemaAndRoles(dbInstance?: any) {
    if (this.schemaReady) return
    const db = dbInstance || (await getDb())
    if (!db) return

    // 1. Tabella Ruoli e Permessi dedicati per le Sentinels nel DB
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sentinel_role_permissions (
        role_key VARCHAR(64) PRIMARY KEY,
        bot_username VARCHAR(64) NOT NULL,
        display_name VARCHAR(120) NOT NULL,
        specialty VARCHAR(180) NOT NULL,
        can_parse_code_blocks BOOLEAN NOT NULL DEFAULT TRUE,
        can_detect_obsolete_deps BOOLEAN NOT NULL DEFAULT FALSE,
        can_inspect_architecture BOOLEAN NOT NULL DEFAULT FALSE,
        can_suggest_doc_updates BOOLEAN NOT NULL DEFAULT TRUE,
        can_auto_comment_threads BOOLEAN NOT NULL DEFAULT TRUE,
        can_auto_comment_blog BOOLEAN NOT NULL DEFAULT TRUE,
        can_audit_vault BOOLEAN NOT NULL DEFAULT TRUE,
        can_modify_core_db BOOLEAN NOT NULL DEFAULT FALSE,
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).catch(() => null)

    // 2. Tabella Audit Scansioni Knowledge Dependabot
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sentinel_dependabot_scans (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(32) NOT NULL,
        entity_id INTEGER NOT NULL DEFAULT 0,
        entity_slug VARCHAR(255),
        entity_title TEXT NOT NULL,
        fingerprint VARCHAR(64) NOT NULL,
        code_blocks_count INTEGER NOT NULL DEFAULT 0,
        dockeeper_findings_count INTEGER NOT NULL DEFAULT 0,
        archguard_findings_count INTEGER NOT NULL DEFAULT 0,
        findings_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        auto_commented BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).catch(() => null)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_sentinel_dependabot_scans_created_at
      ON sentinel_dependabot_scans (created_at DESC);
    `).catch(() => null)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_sentinel_dependabot_fingerprint
      ON sentinel_dependabot_scans (entity_type, entity_id, fingerprint);
    `).catch(() => null)

    // 3. Seed Ruoli & Permessi RBAC per DocKeeper e ArchGuard
    await db.execute(sql`
      INSERT INTO sentinel_role_permissions (
        role_key, bot_username, display_name, specialty,
        can_parse_code_blocks, can_detect_obsolete_deps, can_inspect_architecture,
        can_suggest_doc_updates, can_auto_comment_threads, can_auto_comment_blog,
        can_audit_vault, can_modify_core_db, is_enabled
      )
      VALUES
        (
          'sentinel_dockeeper',
          'sentinel_dockeeper',
          'Sentinel DocKeeper',
          'Knowledge Dependabot • Semantic Code-Block Parser & Obsolete Dependency Detector',
          TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE
        ),
        (
          'sentinel_archguard',
          'sentinel_archguard',
          'Sentinel ArchGuard',
          'Architecture Guardian • Pattern Verification, Security & Updated Docs Advisor',
          TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE
        )
      ON CONFLICT (role_key) DO NOTHING;
    `).catch(() => null)

    // 4. Assicura gli account bot dedicati nella tabella users con ruolo dedicato
    const botSpecs = [
      {
        username: 'sentinel_dockeeper',
        email: 'dockeeper@devkernelpulse.org',
        role: 'sentinel_dockeeper',
        specialty: 'Knowledge Dependabot • Code-Block & Dependency Parser',
        bio: 'Agente autonomo DKP Sentinel Network. Analizza semanticamente i code block, rileva librerie/runtime obsoleti e suggerisce migrazioni moderne.'
      },
      {
        username: 'sentinel_archguard',
        email: 'archguard@devkernelpulse.org',
        role: 'sentinel_archguard',
        specialty: 'Architecture Pattern & Updated Documentation Sentinel',
        bio: 'Agente autonomo DKP Sentinel Network. Verifica pattern architetturali, sicurezza Pure SQL/SSR e allineamento alla documentazione ufficiale.'
      }
    ]

    for (const bot of botSpecs) {
      const existing = await db.execute(sql`
        SELECT id FROM users WHERE username = ${bot.username} LIMIT 1;
      `).catch(() => null)

      if (extractRows(existing).length === 0) {
        await db.execute(sql`
          INSERT INTO users (username, email, password_hash, role, is_bot, bot_specialty, bio, xp)
          VALUES (
            ${bot.username},
            ${bot.email},
            'BOT_SYSTEM_LOCKED_NO_LOGIN',
            ${bot.role},
            TRUE,
            ${bot.specialty},
            ${bot.bio},
            500
          );
        `).catch(() => null)
      } else {
        await db.execute(sql`
          UPDATE users
          SET is_bot = TRUE, role = ${bot.role}, bot_specialty = ${bot.specialty}
          WHERE username = ${bot.username};
        `).catch(() => null)
      }
    }

    this.schemaReady = true
  }

  static async getPermissionsMap(db: any): Promise<Record<string, any>> {
    await this.ensureSchemaAndRoles(db)
    const res = await db.execute(sql`
      SELECT
        role_key AS "roleKey",
        bot_username AS "botUsername",
        display_name AS "displayName",
        specialty,
        can_parse_code_blocks AS "canParseCodeBlocks",
        can_detect_obsolete_deps AS "canDetectObsoleteDeps",
        can_inspect_architecture AS "canInspectArchitecture",
        can_suggest_doc_updates AS "canSuggestDocUpdates",
        can_auto_comment_threads AS "canAutoCommentThreads",
        can_auto_comment_blog AS "canAutoCommentBlog",
        can_audit_vault AS "canAuditVault",
        can_modify_core_db AS "canModifyCoreDb",
        is_enabled AS "isEnabled",
        updated_at AS "updatedAt"
      FROM sentinel_role_permissions
      ORDER BY role_key ASC;
    `).catch(() => null)

    const map: Record<string, any> = {}
    for (const row of extractRows(res)) {
      map[String(row.roleKey)] = row
    }
    return map
  }

  /**
   * Parser semantico su code block e contenuto tecnico:
   * - Sentinel DocKeeper: dipendenze obsolete, SDK deprecati, runtime EOL
   * - Sentinel ArchGuard: pattern architetturali, sicurezza SQL/DOM, doc aggiornata
   */
  static analyzeSemanticContent(
    title: string,
    content: string,
    perms?: Record<string, any>
  ): {
    codeBlocksCount: number
    docKeeperFindings: DependabotFinding[]
    archGuardFindings: DependabotFinding[]
  } {
    const fullText = `${title || ''}\n${content || ''}`
    const blocks = extractCodeBlocks(fullText)
    const codeCorpus = blocks.map((b) => `[${b.lang}]\n${b.code}`).join('\n\n')
    const inspectionTarget = codeCorpus.length > 0 ? codeCorpus : fullText

    const docKeeperEnabled = perms?.sentinel_dockeeper ? Boolean(perms.sentinel_dockeeper.isEnabled) : true
    const archGuardEnabled = perms?.sentinel_archguard ? Boolean(perms.sentinel_archguard.isEnabled) : true

    const docKeeperFindings: DependabotFinding[] = []
    const archGuardFindings: DependabotFinding[] = []

    // -------------------------------------------------------------------
    // 1. SENTINEL DOCKEEPER — Dipendenze Obsolete & API Deprecate
    // -------------------------------------------------------------------
    if (docKeeperEnabled) {
      const depRules: Array<{
        regex: RegExp
        severity: 'HIGH' | 'MEDIUM' | 'INFO'
        category: 'OBSOLETE_DEPENDENCY' | 'DEPRECATED_API'
        title: string
        detectedSnippet: string
        recommendation: string
        modernReplacement: string
        docReference: string
      }> = [
        {
          regex: /(?:from\s+['"]moment(?:-timezone)?['"]|require\(['"]moment(?:-timezone)?['"]\)|"moment"\s*:)/i,
          severity: 'MEDIUM',
          category: 'OBSOLETE_DEPENDENCY',
          title: 'Libreria legacy `moment` rilevata nel code block',
          detectedSnippet: "import moment from 'moment'",
          recommendation:
            '`moment` è in maintenance mode ufficiale (non tree-shakeable, ~300KB). Migra a `dayjs` o `date-fns` per ridurre drasticamente il bundle client/SSR.',
          modernReplacement: "import dayjs from 'dayjs'",
          docReference: 'https://momentjs.com/docs/#/-project-status/'
        },
        {
          regex: /(?:from\s+['"]request(?:-promise)?['"]|require\(['"]request(?:-promise)?['"]\)|"request"\s*:)/i,
          severity: 'HIGH',
          category: 'OBSOLETE_DEPENDENCY',
          title: 'Pacchetto deprecato `request` (EOL dal 2020)',
          detectedSnippet: "require('request')",
          recommendation:
            'Il pacchetto `request` è ufficialmente deprecato e non riceve patch di sicurezza. Usa la Web `fetch` API nativa di Node 20+ oppure `ofetch` (`$fetch` in Nuxt).',
          modernReplacement: "const data = await $fetch('https://api.example.com/v1')",
          docReference: 'https://github.com/request/request/issues/3142'
        },
        {
          regex: /(?:from\s+['"]node-fetch['"]|require\(['"]node-fetch['"]\)|"node-fetch"\s*:)/i,
          severity: 'INFO',
          category: 'OBSOLETE_DEPENDENCY',
          title: 'Dipendenza superflua `node-fetch` su Node.js moderno',
          detectedSnippet: "import fetch from 'node-fetch'",
          recommendation:
            'Su Node.js 20/22+ `fetch` è integrato globalmente nel runtime V8/Undici senza dipendenze esterne.',
          modernReplacement: "const res = await fetch(url, { method: 'GET' })",
          docReference: 'https://nodejs.org/api/globals.html#fetch'
        },
        {
          regex: /(?:from\s+['"]body-parser['"]|require\(['"]body-parser['"]\)|"body-parser"\s*:)/i,
          severity: 'INFO',
          category: 'DEPRECATED_API',
          title: 'Middleware `body-parser` ridondante',
          detectedSnippet: "app.use(bodyParser.json())",
          recommendation:
            'In Nitro/H3 usa `await readBody(event)` nativo; in Express 4.16+ usa `express.json()` integrato senza pacchetti esterni.',
          modernReplacement: 'const body = await readBody(event)',
          docReference: 'https://h3.unjs.io/utils/request#readbodyevent'
        },
        {
          regex: /(?:from\s+['"]lodash['"]|require\(['"]lodash['"]\)|"lodash"\s*:)/i,
          severity: 'MEDIUM',
          category: 'OBSOLETE_DEPENDENCY',
          title: 'Import monolitico `lodash` (non tree-shakeable)',
          detectedSnippet: "import _ from 'lodash'",
          recommendation:
            'L’import completo di `lodash` (CommonJS) blocca il tree-shaking di Vite/Rollup. Usa `lodash-es` con import puntuali o utility ES2024 native.',
          modernReplacement: "import { groupBy } from 'lodash-es'",
          docReference: 'https://vite.dev/guide/performance.html'
        },
        {
          regex: /\b(?:asyncData\s*\(|nuxtServerInit\s*\(|new\s+Vuex\.Store|Vue\.component\()/i,
          severity: 'HIGH',
          category: 'DEPRECATED_API',
          title: 'Pattern legacy Vue 2 / Nuxt 2 rilevato',
          detectedSnippet: 'asyncData() / Vuex.Store',
          recommendation:
            'Aggiorna alla Composition API di Vue 3.5+ e Nuxt 3/4 usando `useAsyncData()` / `useFetch()` e state management tipizzato con Pinia o `useState()`.',
          modernReplacement: "const { data } = await useFetch('/api/endpoint')",
          docReference: 'https://nuxt.com/docs/getting-started/data-fetching'
        },
        {
          regex: /FROM\s+(?:node:(?:12|14|16|18)|python:3\.(?:6|7|8)|ubuntu:(?:16\.04|18\.04|20\.04))/i,
          severity: 'HIGH',
          category: 'OBSOLETE_DEPENDENCY',
          title: 'Immagine base Docker EOL / fuori supporto sicurezza',
          detectedSnippet: 'FROM node:16 / python:3.8',
          recommendation:
            'L’immagine container specificata ha raggiunto l’End-of-Life. Aggiorna a `node:22-alpine` o `python:3.12-slim` per ricevere patch CVE attive.',
          modernReplacement: 'FROM node:22-alpine',
          docReference: 'https://github.com/nodejs/release#release-schedule'
        },
        {
          regex: /\bvar\s+[a-zA-Z_$][\w$]*\s*=/,
          severity: 'INFO',
          category: 'DEPRECATED_API',
          title: 'Dichiarazione legacy `var` con hoisting globale',
          detectedSnippet: 'var result = ...',
          recommendation:
            'Sostituisci `var` con `const` (immutabile per default) o `let` (block-scoped) per evitare bug di scoping.',
          modernReplacement: 'const result = ...',
          docReference: 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/const'
        }
      ]

      for (const rule of depRules) {
        if (rule.regex.test(inspectionTarget)) {
          docKeeperFindings.push({
            agent: 'sentinel_dockeeper',
            severity: rule.severity,
            category: rule.category,
            title: rule.title,
            detectedSnippet: rule.detectedSnippet,
            recommendation: rule.recommendation,
            modernReplacement: rule.modernReplacement,
            docReference: rule.docReference
          })
        }
      }
    }

    // -------------------------------------------------------------------
    // 2. SENTINEL ARCHGUARD — Pattern Architetturali & Doc Aggiornata
    // -------------------------------------------------------------------
    if (archGuardEnabled) {
      const archRules: Array<{
        regex: RegExp
        severity: 'HIGH' | 'MEDIUM' | 'INFO'
        category: 'ARCH_PATTERN' | 'SECURITY_PATTERN' | 'DOC_UPDATE'
        title: string
        detectedSnippet: string
        recommendation: string
        modernReplacement: string
        docReference: string
      }> = [
        {
          regex: /(?:\.innerHTML\s*=|v-html\s*=|dangerouslySetInnerHTML)/i,
          severity: 'HIGH',
          category: 'SECURITY_PATTERN',
          title: 'Rischio DOM-XSS su iniezione HTML non sanitizzata',
          detectedSnippet: 'element.innerHTML = ... / v-html',
          recommendation:
            'L’assegnamento diretto a `innerHTML` o `v-html` espone a XSS. Usa `textContent` oppure sanitizza esplicitamente l’HTML con DOMPurify / parser whitelistato.',
          modernReplacement: 'element.textContent = sanitizedValue',
          docReference: 'https://vuejs.org/guide/best-practices/security.html#html-injection'
        },
        {
          regex: /(?:SELECT|UPDATE|DELETE|INSERT)\s+[\s\S]{1,120}\$\{[^}]+\}/i,
          severity: 'HIGH',
          category: 'SECURITY_PATTERN',
          title: 'Interpolazione diretta di variabili in query SQL',
          detectedSnippet: 'SELECT ... WHERE id = ${userId}',
          recommendation:
            'Non interpolare mai stringhe raw nelle query. Usa i template tag parametrizzati `sql\`... ${param}\`` di Drizzle ORM affinché PostgreSQL esegua bind parametrizzati.',
          modernReplacement: 'await db.execute(sql`SELECT id FROM users WHERE id = ${Number(userId)}`)',
          docReference: 'https://orm.drizzle.team/docs/sql'
        },
        {
          regex: /(?:sk-(?:live|proj|ant)-[a-zA-Z0-9_-]{12,}|postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@|ghp_[a-zA-Z0-9]{20,})/,
          severity: 'HIGH',
          category: 'SECURITY_PATTERN',
          title: 'Possibile credenziale o DSN segreto esposto nel codice',
          detectedSnippet: 'postgres://user:password@... / sk-...',
          recommendation:
            'Rimuovi subito segreti e connection string dal codice sorgente/snippet. Spostali nelle variabili ambiente (`.env`) e leggili tramite `useRuntimeConfig()` o `process.env`.',
          modernReplacement: 'const config = useRuntimeConfig()',
          docReference: 'https://nuxt.com/docs/guide/going-further/runtime-config'
        },
        {
          regex: /\b(?:readFileSync|writeFileSync|execSync|existsSync)\s*\(/,
          severity: 'MEDIUM',
          category: 'ARCH_PATTERN',
          title: 'Operazione I/O sincrona bloccante sull’Event Loop Node.js',
          detectedSnippet: 'fs.readFileSync(...) / execSync(...)',
          recommendation:
            'Le chiamate `*Sync` bloccano l’intero event loop sotto carico concorrente. Usa le API asincrone `node:fs/promises` (`await readFile(...)`).',
          modernReplacement: "import { readFile } from 'node:fs/promises'\nconst raw = await readFile(path, 'utf8')",
          docReference: 'https://nodejs.org/api/fs.html#promises-api'
        },
        {
          regex: /SELECT\s+\*\s+FROM\s+[a-zA-Z0-9_]+(?!\s+WHERE|\s+LIMIT)/i,
          severity: 'MEDIUM',
          category: 'ARCH_PATTERN',
          title: 'Query `SELECT *` senza proiezione colonne né clausola `LIMIT`',
          detectedSnippet: 'SELECT * FROM table_name',
          recommendation:
            'In architettura Pure SQL ad alte prestazioni specifica sempre le colonne necessarie, sfrutta gli indici `created_at DESC` e applica un `LIMIT` esplicito.',
          modernReplacement: 'SELECT id, title, created_at FROM posts ORDER BY created_at DESC LIMIT 50;',
          docReference: 'https://www.postgresql.org/docs/current/indexes-ordering.html'
        },
        {
          regex: /(?:axios\.get|axios\.post)\s*\(/i,
          severity: 'INFO',
          category: 'DOC_UPDATE',
          title: 'Allineamento Documentazione Nuxt/Nitro: client HTTP nativo `$fetch`',
          detectedSnippet: 'axios.get(...)',
          recommendation:
            'Nello stack Nuxt 3/4 + Nitro, `$fetch` (basato su `ofetch`) gestisce automaticamente chiamate isomorfe SSR/CSR, serializzazione JSON e tipi TypeScript senza dipendenze aggiuntive.',
          modernReplacement: "const response = await $fetch('/api/resource')",
          docReference: 'https://nuxt.com/docs/api/utils/dollarfetch'
        }
      ]

      for (const rule of archRules) {
        if (rule.regex.test(inspectionTarget)) {
          archGuardFindings.push({
            agent: 'sentinel_archguard',
            severity: rule.severity,
            category: rule.category,
            title: rule.title,
            detectedSnippet: rule.detectedSnippet,
            recommendation: rule.recommendation,
            modernReplacement: rule.modernReplacement,
            docReference: rule.docReference
          })
        }
      }
    }

    return {
      codeBlocksCount: blocks.length,
      docKeeperFindings: docKeeperFindings.slice(0, 4),
      archGuardFindings: archGuardFindings.slice(0, 4)
    }
  }

  private static formatAgentMarkdownComment(
    agent: SentinelBotRole,
    findings: DependabotFinding[],
    entityTitle: string
  ): string {
    if (agent === 'sentinel_dockeeper') {
      const lines = [
        `### 🤖 Sentinel DocKeeper — Knowledge Dependabot Report`,
        `Ho analizzato semanticamente i code block di **"${entityTitle}"** e rilevato **${findings.length}** dipendenze/API aggiornabili:`,
        ``
      ]
      findings.forEach((f, idx) => {
        lines.push(`**${idx + 1}. [${f.severity}] ${f.title}**`)
        lines.push(`- **Analisi:** ${f.recommendation}`)
        lines.push(`- **Suggerimento moderno:** \`${f.modernReplacement.replace(/\n/g, ' ')}\``)
        lines.push(`- **Doc ufficiale:** ${f.docReference}`)
        lines.push(``)
      })
      lines.push(`*Scansione automatica DKP Sentinel Network • Role: \`sentinel_dockeeper\`*`)
      return lines.join('\n')
    }

    const lines = [
      `### 🛡️ Sentinel ArchGuard — Architecture & Docs Audit`,
      `Durante la verifica architetturale di **"${entityTitle}"** ho individuato **${findings.length}** suggerimenti di pattern e documentazione:`,
      ``
    ]
    findings.forEach((f, idx) => {
      lines.push(`**${idx + 1}. [${f.severity}] ${f.title}**`)
      lines.push(`- **Pattern consigliato:** ${f.recommendation}`)
      lines.push(`- **Esempio consigliato:** \`${f.modernReplacement.replace(/\n/g, ' ')}\``)
      lines.push(`- **Riferimento doc:** ${f.docReference}`)
      lines.push(``)
    })
    lines.push(`*Audit architetturale DKP Sentinel Network • Role: \`sentinel_archguard\`*`)
    return lines.join('\n')
  }

  /**
   * Esegue l'ispezione semantica e pubblica automaticamente i commenti di suggerimento
   * su Thread Forum (node_comments) o Articoli Blog (blog_comments) rispettando i permessi DB.
   */
  static async inspectAndAutoComment(params: {
    entityType: 'forum' | 'blog' | 'manual'
    entityId?: number
    entitySlug?: string
    title: string
    content: string
    authorUsername?: string
    forceAutoComment?: boolean
  }): Promise<DependabotInspectionResult> {
    const db = await getDb()
    const cleanTitle = String(params.title || 'Contenuto Tecnico DKP').trim()
    const cleanContent = String(params.content || '').trim()
    const fingerprint = createHash('sha256')
      .update(`${params.entityType}:${params.entityId || 0}:${params.entitySlug || ''}:${cleanTitle}:${cleanContent}`)
      .digest('hex')
      .slice(0, 32)

    if (!db) {
      const local = this.analyzeSemanticContent(cleanTitle, cleanContent)
      return {
        success: true,
        fingerprint,
        codeBlocksCount: local.codeBlocksCount,
        docKeeperFindings: local.docKeeperFindings,
        archGuardFindings: local.archGuardFindings,
        autoCommented: false,
        postedComments: []
      }
    }

    await this.ensureSchemaAndRoles(db)

    // Evita loop se l'autore è già uno dei bot Sentinel
    const lowerAuthor = String(params.authorUsername || '').toLowerCase()
    if (lowerAuthor === 'sentinel_dockeeper' || lowerAuthor === 'sentinel_archguard' || lowerAuthor === 'guardian_bot') {
      return {
        success: true,
        fingerprint,
        codeBlocksCount: 0,
        docKeeperFindings: [],
        archGuardFindings: [],
        autoCommented: false,
        postedComments: []
      }
    }

    const perms = await this.getPermissionsMap(db)
    const analysis = this.analyzeSemanticContent(cleanTitle, cleanContent, perms)
    const allFindings = [...analysis.docKeeperFindings, ...analysis.archGuardFindings]
    const postedComments: Array<{ agent: SentinelBotRole; commentId: number | null; targetType: string }> = []

    const entityId = Number(params.entityId || 0)
    const entitySlug = String(params.entitySlug || '').trim()

    // Verifica idempotenza: non ripubblicare lo stesso audit sullo stesso target
    let alreadyCommented = false
    if (!params.forceAutoComment && (entityId > 0 || entitySlug)) {
      const dupRes = await db.execute(sql`
        SELECT id FROM sentinel_dependabot_scans
        WHERE entity_type = ${params.entityType}
          AND fingerprint = ${fingerprint}
          AND auto_commented = TRUE
        LIMIT 1;
      `).catch(() => null)
      if (extractRows(dupRes).length > 0) {
        alreadyCommented = true
      }
    }

    if (allFindings.length > 0 && !alreadyCommented) {
      const agentsToPublish: Array<{ agent: SentinelBotRole; findings: DependabotFinding[] }> = []
      if (analysis.docKeeperFindings.length > 0) {
        agentsToPublish.push({ agent: 'sentinel_dockeeper', findings: analysis.docKeeperFindings })
      }
      if (analysis.archGuardFindings.length > 0) {
        agentsToPublish.push({ agent: 'sentinel_archguard', findings: analysis.archGuardFindings })
      }

      for (const entry of agentsToPublish) {
        const rolePerm = perms[entry.agent]
        if (!rolePerm || !rolePerm.isEnabled) continue

        if (params.entityType === 'forum' && entityId > 0 && rolePerm.canAutoCommentThreads) {
          const botRes = await db.execute(sql`
            SELECT id FROM users WHERE username = ${entry.agent} LIMIT 1;
          `).catch(() => null)
          const botId = Number(extractRows(botRes)[0]?.id || 0)

          if (botId > 0) {
            const commentMd = this.formatAgentMarkdownComment(entry.agent, entry.findings, cleanTitle)
            const insRes = await db.execute(sql`
              INSERT INTO node_comments (post_id, author_id, parent_id, content, karma_score)
              VALUES (${entityId}, ${botId}, NULL, ${commentMd}, 3)
              RETURNING id;
            `).catch(() => null)

            const insertedId = Number(extractRows(insRes)[0]?.id || 0) || null
            if (insertedId) {
              await db.execute(sql`
                UPDATE node_posts
                SET comments_count = COALESCE(comments_count, 0) + 1
                WHERE id = ${entityId};
              `).catch(() => null)

              await db.execute(sql`
                UPDATE users SET xp = COALESCE(xp, 0) + 5 WHERE id = ${botId};
              `).catch(() => null)

              postedComments.push({ agent: entry.agent, commentId: insertedId, targetType: 'forum' })
            }
          }
        }

        if (params.entityType === 'blog' && entitySlug && rolePerm.canAutoCommentBlog) {
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS blog_comments (
              id SERIAL PRIMARY KEY,
              blog_slug VARCHAR(255) NOT NULL,
              author VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              points INT DEFAULT 0,
              created_at TIMESTAMP DEFAULT NOW()
            );
          `).catch(() => null)

          const commentMd = this.formatAgentMarkdownComment(entry.agent, entry.findings, cleanTitle)
          const insBlogRes = await db.execute(sql`
            INSERT INTO blog_comments (blog_slug, author, content, points)
            VALUES (${entitySlug}, ${entry.agent}, ${commentMd}, 3)
            RETURNING id;
          `).catch(() => null)

          const insertedBlogCommentId = Number(extractRows(insBlogRes)[0]?.id || 0) || null
          if (insertedBlogCommentId) {
            await db.execute(sql`
              UPDATE users SET xp = COALESCE(xp, 0) + 5 WHERE username = ${entry.agent};
            `).catch(() => null)

            postedComments.push({ agent: entry.agent, commentId: insertedBlogCommentId, targetType: 'blog' })
          }
        }
      }
    }

    const autoCommented = postedComments.length > 0

    // Registra scansione su sentinel_dependabot_scans
    await db.execute(sql`
      INSERT INTO sentinel_dependabot_scans (
        entity_type, entity_id, entity_slug, entity_title, fingerprint,
        code_blocks_count, dockeeper_findings_count, archguard_findings_count,
        findings_json, auto_commented
      )
      VALUES (
        ${params.entityType},
        ${entityId},
        ${entitySlug || null},
        ${cleanTitle},
        ${fingerprint},
        ${analysis.codeBlocksCount},
        ${analysis.docKeeperFindings.length},
        ${analysis.archGuardFindings.length},
        ${JSON.stringify(allFindings)}::jsonb,
        ${autoCommented}
      );
    `).catch(() => null)

    // Registra anche nel log generale sentinel_logs se ci sono findings
    if (allFindings.length > 0) {
      const leadAgent = analysis.docKeeperFindings.length > 0 ? 'sentinel_dockeeper' : 'sentinel_archguard'
      const summary = `${allFindings.length} rilevamenti (${analysis.docKeeperFindings.length} DocKeeper, ${analysis.archGuardFindings.length} ArchGuard) su "${cleanTitle.slice(0, 70)}"`
      await db.execute(sql`
        INSERT INTO sentinel_logs (
          sentinel_username, target_type, target_id, action_type, reasoning_trace, payload_summary, smtp_dispatched
        )
        VALUES (
          ${leadAgent},
          ${params.entityType},
          ${entityId},
          ${autoCommented ? 'DEPENDABOT_AUTO_COMMENT' : 'DEPENDABOT_AUDIT'},
          ${'Semantic code-block & dependency parser (DKP Knowledge Dependabot v2.6)'},
          ${summary},
          FALSE
        );
      `).catch(() => null)
    }

    return {
      success: true,
      fingerprint,
      codeBlocksCount: analysis.codeBlocksCount,
      docKeeperFindings: analysis.docKeeperFindings,
      archGuardFindings: analysis.archGuardFindings,
      autoCommented,
      postedComments
    }
  }
}