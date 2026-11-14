// server/services/autoresponder.service.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export interface CreateAutoresponderRuleInput {
  targetAddress: string
  keywordTrigger?: string | null
  responseTemplate: string
  isActive?: boolean
}

let autoresponderSchemaReady = false

function extractRows(res: any): any[] {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.rows)) return res.rows
  return []
}

export class AutoresponderService {
  /**
   * Auto-migrazione idempotente Pure SQL (compatibile v2.4 + v2.6)
   */
  static async ensureSchema() {
    if (autoresponderSchemaReady) return
    const db = await getDb()
    if (!db) return

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_autoresponder_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        target_address VARCHAR(255) NOT NULL DEFAULT 'info@devkernelpulse.org',
        trigger_address VARCHAR(255),
        keyword_trigger TEXT,
        subject_template TEXT,
        response_template TEXT NOT NULL DEFAULT '',
        body_template TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Aggiunge le colonne v2.6 se la tabella esisteva già in versione v2.4
    await db.execute(sql`ALTER TABLE pulse_autoresponder_rules ADD COLUMN IF NOT EXISTS target_address VARCHAR(255);`)
    await db.execute(sql`ALTER TABLE pulse_autoresponder_rules ADD COLUMN IF NOT EXISTS keyword_trigger TEXT;`)
    await db.execute(sql`ALTER TABLE pulse_autoresponder_rules ADD COLUMN IF NOT EXISTS response_template TEXT;`)
    await db.execute(sql`ALTER TABLE pulse_autoresponder_rules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`)

    // Migra eventuali dati legacy v2.4 verso le colonne v2.6
    await db.execute(sql`
      UPDATE pulse_autoresponder_rules
      SET
        target_address = COALESCE(NULLIF(target_address, ''), trigger_address, 'info@devkernelpulse.org'),
        response_template = COALESCE(NULLIF(response_template, ''), body_template, '')
      WHERE target_address IS NULL OR response_template IS NULL;
    `)

    autoresponderSchemaReady = true
  }

  /**
   * Lista tutte le regole autoresponder normalizzate per la UI Admin
   */
  static async listRules() {
    const db = await getDb()
    if (!db) return []

    await this.ensureSchema()

    const res: any = await db.execute(sql`
      SELECT
        id,
        COALESCE(NULLIF(target_address, ''), trigger_address, 'info@devkernelpulse.org') AS target_address,
        COALESCE(keyword_trigger, '') AS keyword_trigger,
        COALESCE(NULLIF(response_template, ''), body_template, '') AS response_template,
        COALESCE(is_active, true) AS is_active,
        created_at
      FROM pulse_autoresponder_rules
      ORDER BY id DESC;
    `)

    return extractRows(res)
  }

  /**
   * Crea una nuova regola popolando sia i campi v2.6 che quelli legacy per retrocompatibilità
   */
  static async createRule(input: CreateAutoresponderRuleInput) {
    const db = await getDb()
    if (!db) throw new Error('Database offline (Pure SQL)')

    await this.ensureSchema()

    const targetAddress = input.targetAddress.trim().toLowerCase()
    const keywordTrigger = input.keywordTrigger
      ? input.keywordTrigger.trim().toUpperCase().replace(/\s+/g, '_')
      : null
    const responseTemplate = input.responseTemplate.trim()
    const isActive = input.isActive !== false
    const ruleName = keywordTrigger ? `${targetAddress} [${keywordTrigger}]` : `${targetAddress} [ALL]`

    const res: any = await db.execute(sql`
      INSERT INTO pulse_autoresponder_rules (
        name,
        target_address,
        trigger_address,
        keyword_trigger,
        subject_template,
        response_template,
        body_template,
        is_active
      )
      VALUES (
        ${ruleName},
        ${targetAddress},
        ${targetAddress},
        ${keywordTrigger},
        ${'[Auto-Reply] Re: {{subject}}'},
        ${responseTemplate},
        ${responseTemplate},
        ${isActive}
      )
      RETURNING
        id,
        target_address,
        keyword_trigger,
        response_template,
        is_active,
        created_at;
    `)

    return extractRows(res)[0] || null
  }

  /**
   * Attiva o disattiva una regola esistente
   */
  static async toggleRule(id: number, isActive: boolean) {
    const db = await getDb()
    if (!db) throw new Error('Database offline (Pure SQL)')

    await this.ensureSchema()

    await db.execute(sql`
      UPDATE pulse_autoresponder_rules
      SET is_active = ${isActive}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `)

    return { success: true }
  }

  /**
   * Elimina permanentemente una regola autoresponder
   */
  static async deleteRule(id: number) {
    const db = await getDb()
    if (!db) throw new Error('Database offline (Pure SQL)')

    await this.ensureSchema()

    await db.execute(sql`
      DELETE FROM pulse_autoresponder_rules
      WHERE id = ${id};
    `)

    return { success: true }
  }
}