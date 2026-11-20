import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const mode = String(body?.mode || 'generate_draft')
  const context = String(body?.context || 'blog') // 'blog' | 'nodes'
  const title = String(body?.title || '').trim()
  const category = String(body?.category || 'Architecture').trim()
  const subCategory = String(body?.subCategory || '').trim()
  const summary = String(body?.summary || '').trim()
  const content = String(body?.content || '').trim()
  const selectedText = String(body?.selectedText || '').trim()
  const promptHint = String(body?.promptHint || '').trim()
  const codeLang = String(body?.codeLang || 'typescript').trim().toLowerCase()
  const tone = String(body?.tone || 'deep-dive').trim()

  const topic = promptHint || title || (context === 'nodes'
    ? 'Ottimizzazione Query Pure SQL e Architettura Zero-Trust'
    : 'Architettura Serverless Pure SQL v2.6 e Difesa Attiva SAST')

  const openRouterKey = process.env.OPENROUTER_API_KEY

  // Se OPENROUTER_API_KEY e' configurata, interroga il modello AI con output strutturato
  if (openRouterKey) {
    try {
      const systemPrompt = [
        'Sei un Principal Software Architect e Technical Editor senior per DevKernelPulse (DKP).',
        'Rispondi esclusivamente in formato JSON valido con le chiavi: "title", "summary", "tags" (array di stringhe), "content" (Markdown ricco con blocchi ```linguaggio, tabelle, liste puntate e ==highlight==), "insertSnippet" (stringa Markdown opzionale da inserire al cursore).',
        'Scrivi in italiano tecnico chiaro, autorevole e concreto, senza frasi riempitive.'
      ].join(' ')

      const userPrompt = JSON.stringify({
        mode,
        context,
        tone,
        codeLang,
        topic,
        currentTitle: title,
        category,
        subCategory,
        currentSummary: summary,
        selectedText,
        currentContent: content.slice(0, 4000)
      })

      const aiRes: any = await $fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.45
        }
      })

      const rawText = aiRes?.choices?.[0]?.message?.content
      if (rawText) {
        const parsed = JSON.parse(rawText)
        return {
          success: true,
          source: 'openrouter-ai',
          result: {
            title: parsed.title || title || topic,
            summary: parsed.summary || summary,
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
            content: parsed.content || content,
            insertSnippet: parsed.insertSnippet || ''
          }
        }
      }
    } catch {
      // Fallback deterministico ad alta qualita' in caso di timeout/rate-limit OpenRouter
    }
  }

  // Fallback intelligente locale/deterministico sempre disponibile
  const cleanTags = Array.from(new Set([
    category || 'Architecture',
    subCategory || 'Pure SQL',
    codeLang.toUpperCase(),
    'Security',
    'DevKernelPulse',
    'Performance'
  ].filter(Boolean)))

  if (mode === 'seo_optimize') {
    const optimizedTitle = title || `${topic}: Guida Architetturale & Benchmark Pratici`
    const optimizedSummary = summary || `Approfondimento tecnico su ${topic} (${category}): analisi architetturale, implementazione production-ready, hardening SAST e metriche di latenza.`
    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: {
        title: optimizedTitle,
        summary: optimizedSummary,
        tags: cleanTags,
        content,
        insertSnippet: ''
      }
    }
  }

  if (mode === 'generate_code') {
    const snippets: Record<string, string> = {
      typescript: `\`\`\`typescript\n// Implementazione DKP Pure-SQL & Validazione Zero-Trust\nexport async function executeKernelAudit(payload: { nodeId: number; hash: string }) {\n  if (!/^[a-f0-9]{64}$/i.test(payload.hash)) {\n    throw new Error('SHA-256 Vault Hash non valido')\n  }\n  const startedAt = performance.now()\n  return {\n    verified: true,\n    nodeId: payload.nodeId,\n    latencyMs: Math.round(performance.now() - startedAt)\n  }\n}\n\`\`\``,
      sql: `\`\`\`sql\n-- Query analitica Pure SQL con indice composito e aggregazione deterministica\nSELECT\n  n.slug AS node_slug,\n  COUNT(p.id)::int AS total_threads,\n  MAX(p.created_at) AS last_activity\nFROM dkp_nodes n\nLEFT JOIN forum_posts p ON p.node_id = n.id\nWHERE n.is_active = TRUE\nGROUP BY n.id, n.slug\nORDER BY total_threads DESC\nLIMIT 20;\n\`\`\``,
      rust: `\`\`\`rust\nuse sha2::{Digest, Sha256};\n\npub fn compute_vault_proof(artifact: &[u8]) -> String {\n    let mut hasher = Sha256::new();\n    hasher.update(artifact);\n    format!("{:x}", hasher.finalize())\n}\n\`\`\``,
      python: `\`\`\`python\nimport hashlib\nfrom dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass SentinelReport:\n    artifact: str\n    sha256: str\n    passed: bool\n\ndef audit_payload(data: bytes) -> SentinelReport:\n    digest = hashlib.sha256(data).hexdigest()\n    return SentinelReport(artifact="dkp-core", sha256=digest, passed=len(digest) == 64)\n\`\`\``,
      bash: `\`\`\`bash\n#!/usr/bin/env bash\nset -euo pipefail\necho "[DKP] Verifica integrita' endpoint e latenza..."\ncurl -sS -w "\\nHTTP: %{http_code} | Time: %{time_total}s\\n" -o /dev/null "https://devkernelpulse.org/api/health"\n\`\`\``
    }

    const chosen = snippets[codeLang] || `\`\`\`${codeLang}\n// Esempio tecnico generato per: ${topic}\n// Linguaggio: ${codeLang.toUpperCase()}\n\`\`\``
    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: {
        title: title || topic,
        summary,
        tags: cleanTags,
        content: content ? `${content}\n\n${chosen}\n` : chosen,
        insertSnippet: `\n${chosen}\n`
      }
    }
  }

  if (mode === 'tldr_table') {
    const tableBlock = [
      `## TL;DR & Matrice Comparativa`,
      `> ==Sintesi Esecutiva==: ${topic} riduce il debito tecnico migliorando determinismo, osservabilita' e tempi di risposta in produzione.`,
      ``,
      `| Dimensione | Approccio Tradizionale | Architettura DKP v2.6 |`,
      `| --- | --- | --- |`,
      `| Latenza Query | Overhead ORM & N+1 | **Pure SQL Deterministico (<15ms)** |`,
      `| Sicurezza | Controlli manuali post-deploy | **Pulse Sentinel SAST + WAF L7** |`,
      `| Integrita' Dati | Log mutabili | **Proof-of-Code Vault SHA-256** |`
    ].join('\n')

    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: {
        title: title || topic,
        summary,
        tags: cleanTags,
        content: content ? `${content}\n\n${tableBlock}\n` : tableBlock,
        insertSnippet: `\n${tableBlock}\n`
      }
    }
  }

  if (mode === 'security_audit') {
    const auditBlock = [
      `## 🛡️ Pulse Sentinel AI — Checklist Hardening & Security`,
      `- **Validazione Input Rigorosa**: sanitizzare tutti i payload in ingresso ed evitare interpolazioni SQL non parametrizzate.`,
      `- **Least Privilege & RBAC**: verificare sempre i token Bearer e i permessi ruolo prima di esporre mutazioni.`,
      `- **Rate Limiting & Edge WAF**: proteggere gli endpoint critici con soglie per IP e telemetria attiva.`
    ].join('\n')

    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: {
        title: title || topic,
        summary,
        tags: cleanTags,
        content: content ? `${content}\n\n${auditBlock}\n` : auditBlock,
        insertSnippet: `\n${auditBlock}\n`
      }
    }
  }

  if (mode === 'expand') {
    const targetText = selectedText || content || topic
    const expanded = [
      targetText,
      ``,
      `### Approfondimento Tecnico & Benchmark`,
      `In scenari ad alta concorrenza, l'adozione di pattern ++stateless++ e query SQL indicizzate consente di mantenere un throughput costante anche sotto picchi di traffico:`,
      `1. **Isolamento delle Dipendenze**: separare il layer di trasporto HTTP dalla logica di persistenza.`,
      `2. **Osservabilita' End-to-End**: tracciare latenza DB, memoria heap e hit-rate della cache edge.`,
      `3. **Verifica Deterministica**: accompagnare ogni rilascio con test di regressione automatizzati.`
    ].join('\n')

    const updatedContent = selectedText && content.includes(selectedText)
      ? content.replace(selectedText, expanded)
      : expanded

    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: {
        title: title || topic,
        summary,
        tags: cleanTags,
        content: updatedContent,
        insertSnippet: expanded
      }
    }
  }

  // Default: generate_draft / rewrite_tone
  const toneHeader =
    tone === 'tutorial'
      ? 'Guida Pratica Step-by-Step'
      : tone === 'rfc'
        ? 'RFC Architetturale & Specifiche Tecniche'
        : 'Analisi Architetturale & Implementazione'

  const generatedTitle = title || `${topic}: ${toneHeader}`
  const generatedSummary = summary || `Analisi tecnica completa su ${topic}: principi di progettazione, esempi di codice production-ready, benchmark e checklist di sicurezza.`
  const generatedBody = [
    `# ${generatedTitle}`,
    ``,
    `> ==Key Takeaway==: Una progettazione orientata a **semplicita' deterministica**, **sicurezza by-design** e **osservabilita' continua** garantisce stabilita' e prestazioni scalabili.`,
    ``,
    `## 1. Contesto & Obiettivi Architetturali`,
    `Nello sviluppo di sistemi moderni su **DevKernelPulse**, affrontare **${topic}** richiede di bilanciare velocita' di esecuzione, manutenibilita' del codice e protezione contro regressioni.`,
    ``,
    `- **Zero Overhead Inutile**: accesso diretto ai dati e contratti API tipizzati.`,
    `- **Difesa Attiva**: ispezione statica SAST e controllo dell'integrita' degli artefatti.`,
    `- **Scalabilita' Orizzontale**: componenti disaccoppiati pronti per ambienti serverless ed edge.`,
    ``,
    `## 2. Implementazione di Riferimento`,
    ``,
    `\`\`\`${codeLang}`,
    `// Esempio di riferimento: ${topic}`,
    `export interface KernelTelemetryResult {`,
    `  status: 'OPTIMAL' | 'DEGRADED'`,
    `  latencyMs: number`,
    `  verified: boolean`,
    `}`,
    ``,
    `export function evaluateNodeHealth(latencyMs: number): KernelTelemetryResult {`,
    `  return {`,
    `    status: latencyMs < 50 ? 'OPTIMAL' : 'DEGRADED',`,
    `    latencyMs,`,
    `    verified: true`,
    `  }`,
    `}`,
    `\`\`\``,
    ``,
    `## 3. Confronto Operativo & Metriche`,
    ``,
    `| Metrica | Baseline Standard | Implementazione Ottimizzata |`,
    `| --- | --- | --- |`,
    `| P95 Latency | 120 ms | **14 ms** |`,
    `| Copertura Audit | Manuale | **Automatizzata (Sentinel AI)** |`,
    `| Manutenibilita' | Media | **Alta (Contratti Tipizzati)** |`,
    ``,
    `## 4. Prossimi Passi`,
    `1. Validare i parametri di configurazione nell'ambiente di staging.`,
    `2. Eseguire il check diagnostico e monitorare le telemetrie post-rilascio.`,
    `3. Condividere benchmark e feedback con la community DKP.`
  ].join('\n')

  return {
    success: true,
    source: 'dkp-sentinel-heuristic',
    result: {
      title: generatedTitle,
      summary: generatedSummary,
      tags: cleanTags,
      content: generatedBody,
      insertSnippet: generatedBody
    }
  }
})