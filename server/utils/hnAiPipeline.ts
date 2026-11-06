// server/utils/hnAiPipeline.ts
import { generateText } from 'ai'
import { openrouter } from './openrouter'
import { getDb } from './db'
import { sql } from 'drizzle-orm'

export interface AiEnrichmentResult {
  summaryIt: string
  tags: string[]
  techScore: number
}

const SYSTEM_PROMPT = `
Sei l'engine Sentinel AI per DevKernelPulse (DKP).
Il tuo compito è analizzare una notizia proveniente da Hacker News ed arricchirla in formato JSON rigido.

DEVI RESTITUIRE ESCLUSIVAMENTE UN OGGETTO JSON SENZA MARKDOWN E SENZA SPIEGAZIONI:
{
  "summaryIt": "Sintesi chiara, tecnica ed esaustiva di massimo 2 frasi in lingua italiana.",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "techScore": 85
}

REGOLE PER I CAMPI:
1. summaryIt: Deve essere in italiano, con un tono professionale e tecnico per sviluppatori.
2. tags: 2-4 tag senza il carattere '#' (es: ["TypeScript", "Docker", "CloudNative"]).
3. techScore: Punteggio da 0 a 100 che indica la rilevanza per developer e software engineering. Se è una notizia politica o non-tech, assegna meno di 40.
`

export async function enrichStoryWithAi(story: { id: number; title: string; url?: string; text?: string }): Promise<AiEnrichmentResult> {
  try {
    const prompt = `Titolo Notizia: "${story.title}"\nURL: "${story.url || 'N/A'}"\nTesto/Contesto: "${story.text?.slice(0, 500) || 'N/A'}"`

    const response = await generateText({
      model: openrouter('qwen/qwen-2.5-coder-32b-instruct'),
      system: SYSTEM_PROMPT,
      prompt: prompt,
      temperature: 0.2
    })

    const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    return {
      summaryIt: parsed.summaryIt || 'Approfondimento tecnico dall\'infrastruttura Hacker News.',
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: string) => String(t).trim()) : ['Tech'],
      techScore: typeof parsed.techScore === 'number' ? Math.min(100, Math.max(0, parsed.techScore)) : 70
    }
  } catch (err: any) {
    console.warn(`[AI Pipeline Error] Impossibile arricchire la storia #${story.id}:`, err.message)
    return {
      summaryIt: `Notizia di tendenza su Hacker News: ${story.title}`,
      tags: ['HackerNews', 'Tech'],
      techScore: 60
    }
  }
}

/**
 * Helper per formattare un array JS nel formato nativo PostgreSQL '{val1,val2}'
 */
function toPgArray(arr: string[]): string {
  if (!Array.isArray(arr) || arr.length === 0) return '{}'
  const escaped = arr.map(item => `"${String(item).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  return `{${escaped.join(',')}}`
}

/**
 * Processa un batch di storie non ancora elaborate nel DB
 */
export async function processUnprocessedStories(limit = 5) {
  const db = getDb()

  const pendingStoriesRes = await db.execute(sql`
    SELECT id, hn_id, title, original_url
    FROM hn_stories
    WHERE processed_by_ai = FALSE
    ORDER BY created_at DESC
    LIMIT ${limit}
  `)

  const stories: any[] = Array.isArray(pendingStoriesRes) ? pendingStoriesRes : (pendingStoriesRes.rows || [])

  if (stories.length === 0) {
    return { processedCount: 0, updated: [] }
  }

  const updatedRecords: any[] = []

  for (const story of stories) {
    const aiData = await enrichStoryWithAi({
      id: story.hn_id,
      title: story.title,
      url: story.original_url
    })

    // Conversione dell'array JS in stringa array compatibile con Postgres TEXT[]
    const pgTags = toPgArray(aiData.tags)

    const updateRes = await db.execute(sql`
      UPDATE hn_stories
      SET 
        summary_it = ${aiData.summaryIt},
        tags = ${pgTags}::text[],
        tech_score = ${aiData.techScore},
        processed_by_ai = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${story.id}
      RETURNING id, hn_id, title, summary_it, tags, tech_score
    `)

    const rows: any[] = Array.isArray(updateRes) ? updateRes : (updateRes.rows || [])
    if (rows.length > 0) {
      updatedRecords.push(rows[0])
    }
  }

  return {
    processedCount: updatedRecords.length,
    updated: updatedRecords
  }
}