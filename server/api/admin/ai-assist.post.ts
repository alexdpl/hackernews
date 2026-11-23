import { defineEventHandler, readBody } from 'h3';

const BT = String.fromCharCode(96);
const FENCE = BT + BT + BT;

function shieldMarkdownCode(raw: string): {
  shielded: string;
  restore: (text: string) => string;
} {
  const blocks: string[] = [];
  const fenceRegex = new RegExp(FENCE + '[\\s\\S]*?' + FENCE, 'g');
  const inlineRegex = new RegExp(BT + '[^' + BT + '\\n]+' + BT, 'g');

  let working = String(raw || '').replace(fenceRegex, (m) => {
    const idx = blocks.length;
    blocks.push(m);
    return '__DKP_AI_FENCE_' + idx + '__';
  });

  working = working.replace(inlineRegex, (m) => {
    const idx = blocks.length;
    blocks.push(m);
    return '__DKP_AI_INLINE_' + idx + '__';
  });

  return {
    shielded: working,
    restore: (text: string) => {
      let out = text;
      blocks.forEach((b, idx) => {
        out = out
          .replace('__DKP_AI_FENCE_' + idx + '__', () => b)
          .replace('__DKP_AI_INLINE_' + idx + '__', () => b);
      });
      return out;
    }
  };
}

function deterministicGrammarPolish(raw: string): string {
  const { shielded, restore } = shieldMarkdownCode(raw);
  const polished = shielded
    .replace(/\b([\p{L}]{2,})\s+\1\b/giu, '$1')
    .replace(/([^\n ]) {2,}([^\s-])/g, '$1 $2')
    .replace(/([\p{L}]{3,})([,;:])([\p{L}]{3,})/gu, '$1$2 $3')
    .replace(/\s+([,.;:!?])(?=\s|$)/g, '$1')
    .replace(/(^|[.!?]\s+)([a-zàèéìòù])/g, (_m, sep, ch) => sep + ch.toUpperCase());
  return restore(polished);
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const mode = String(body?.mode || 'generate_draft');
  const context = String(body?.context || 'blog');
  const title = String(body?.title || '').trim();
  const category = String(body?.category || 'Architecture').trim();
  const subCategory = String(body?.subCategory || '').trim();
  const summary = String(body?.summary || '').trim();
  const content = String(body?.content || '').trim();
  const selectedText = String(body?.selectedText || '').trim();
  const promptHint = String(body?.promptHint || '').trim();
  const codeLang = String(body?.codeLang || 'typescript').trim().toLowerCase();
  const tone = String(body?.tone || 'deep-dive').trim();

  const topic = promptHint || title || (context === 'nodes'
    ? 'Ottimizzazione Query Pure SQL e Architettura Zero-Trust'
    : 'Architettura Serverless Pure SQL v2.6 e Difesa Attiva SAST');

  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (mode === 'grammar_fix') {
    if (!content) {
      return {
        success: true,
        source: 'dkp-sentinel-grammar',
        result: { title, summary, tags: [], content: '', insertSnippet: '' }
      };
    }

    if (openRouterKey) {
      try {
        const { shielded, restore } = shieldMarkdownCode(content);
        const aiRes: any = await $fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + openRouterKey,
            'Content-Type': 'application/json'
          },
          body: {
            model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: 'Sei un Technical Copy Editor per DevKernelPulse. Correggi esclusivamente grammatica, ortografia, accenti e punteggiatura nel testo ricevuto, mantenendo intatti tutti i segnaposto __DKP_AI_FENCE_N__ e __DKP_AI_INLINE_N__, i titoli Markdown e la struttura. Rispondi in JSON con chiave "content".'
              },
              { role: 'user', content: shielded.slice(0, 8000) }
            ],
            temperature: 0.15
          }
        });
        const rawText = aiRes?.choices?.[0]?.message?.content;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed?.content) {
            return {
              success: true,
              source: 'dkp-ai-nexus',
              result: {
                title,
                summary,
                tags: [],
                content: restore(String(parsed.content)),
                insertSnippet: ''
              }
            };
          }
        }
      } catch {
        /* Fallback deterministico */
      }
    }

    return {
      success: true,
      source: 'dkp-sentinel-grammar',
      result: {
        title,
        summary,
        tags: [],
        content: deterministicGrammarPolish(content),
        insertSnippet: ''
      }
    };
  }

  if (openRouterKey) {
    try {
      const systemPrompt = [
        'Sei un Principal Software Architect e Technical Editor senior per DevKernelPulse (DKP).',
        'Rispondi esclusivamente in formato JSON valido con le chiavi: "title", "summary", "tags" (array di stringhe), "content" (Markdown ricco con blocchi codice, tabelle, liste puntate e ==highlight==), "insertSnippet" (stringa Markdown opzionale da inserire al cursore).',
        'Scrivi in italiano tecnico chiaro, autorevole e concreto, senza frasi riempitive.'
      ].join(' ');

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
      });

      const aiRes: any = await $fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + openRouterKey,
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
      });

      const rawText = aiRes?.choices?.[0]?.message?.content;
      if (rawText) {
        const parsed = JSON.parse(rawText);
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
        };
      }
    } catch {
      /* Fallback deterministico */
    }
  }

  const cleanTags = Array.from(new Set([
    category || 'Architecture',
    subCategory || 'Pure SQL',
    codeLang.toUpperCase(),
    'Security',
    'DevKernelPulse',
    'Performance'
  ].filter(Boolean)));

  if (mode === 'seo_optimize') {
    const optimizedTitle = title || (topic + ': Guida Architetturale & Benchmark Pratici');
    const optimizedSummary = summary || ('Approfondimento tecnico su ' + topic + ' (' + category + '): analisi architetturale, implementazione production-ready, hardening SAST e metriche di latenza.');
    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: { title: optimizedTitle, summary: optimizedSummary, tags: cleanTags, content, insertSnippet: '' }
    };
  }

  if (mode === 'generate_code') {
    const snippets: Record<string, string> = {
      typescript: [
        FENCE + 'typescript',
        'export async function executeKernelAudit(payload: { nodeId: number; hash: string }) {',
        "  if (!/^[a-f0-9]{64}$/i.test(payload.hash)) {",
        "    throw new Error('SHA-256 Vault Hash non valido');",
        '  }',
        '  const startedAt = performance.now();',
        '  return {',
        '    verified: true,',
        '    nodeId: payload.nodeId,',
        '    latencyMs: Math.round(performance.now() - startedAt)',
        '  };',
        '}',
        FENCE
      ].join('\n'),
      sql: [
        FENCE + 'sql',
        'SELECT',
        '  n.slug AS node_slug,',
        '  COUNT(p.id)::int AS total_threads,',
        '  MAX(p.created_at) AS last_activity',
        'FROM nodes n',
        'LEFT JOIN node_posts p ON p.node_id = n.id',
        'GROUP BY n.id, n.slug',
        'ORDER BY total_threads DESC',
        'LIMIT 20;',
        FENCE
      ].join('\n'),
      rust: [
        FENCE + 'rust',
        'use sha2::{Digest, Sha256};',
        '',
        'pub fn compute_vault_proof(artifact: &[u8]) -> String {',
        '    let mut hasher = Sha256::new();',
        '    hasher.update(artifact);',
        '    format!("{:x}", hasher.finalize())',
        '}',
        FENCE
      ].join('\n'),
      python: [
        FENCE + 'python',
        'import hashlib',
        'from dataclasses import dataclass',
        '',
        '@dataclass(frozen=True)',
        'class SentinelReport:',
        '    artifact: str',
        '    sha256: str',
        '    passed: bool',
        '',
        'def audit_payload(data: bytes) -> SentinelReport:',
        '    digest = hashlib.sha256(data).hexdigest()',
        '    return SentinelReport(artifact="dkp-core", sha256=digest, passed=len(digest) == 64)',
        FENCE
      ].join('\n')
    };
    const chosen = snippets[codeLang] || [
      FENCE + codeLang,
      '/* Esempio tecnico generato per: ' + topic + ' */',
      FENCE
    ].join('\n');

    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: {
        title: title || topic,
        summary,
        tags: cleanTags,
        content: content ? (content + '\n\n' + chosen + '\n') : chosen,
        insertSnippet: '\n' + chosen + '\n'
      }
    };
  }

  if (mode === 'tldr_table') {
    const tableBlock = [
      '## TL;DR & Matrice Comparativa',
      '> ==Sintesi Esecutiva==: ' + topic + ' riduce il debito tecnico migliorando determinismo, osservabilità e tempi di risposta in produzione.',
      '',
      '| Dimensione | Approccio Tradizionale | Architettura DKP v2.6 |',
      '| --- | --- | --- |',
      '| Latenza Query | Overhead ORM & N+1 | **Pure SQL Deterministico (<15ms)** |',
      '| Sicurezza | Controlli manuali post-deploy | **Pulse Sentinel SAST + WAF L7** |',
      '| Integrità Dati | Log mutabili | **Proof-of-Code Vault SHA-256** |'
    ].join('\n');

    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: {
        title: title || topic,
        summary,
        tags: cleanTags,
        content: content ? (content + '\n\n' + tableBlock + '\n') : tableBlock,
        insertSnippet: '\n' + tableBlock + '\n'
      }
    };
  }

  if (mode === 'security_audit') {
    const auditBlock = [
      '## Pulse Sentinel AI — Checklist Hardening & Security',
      '- **Validazione Input Rigorosa**: sanitizzare tutti i payload in ingresso ed evitare interpolazioni SQL non parametrizzate.',
      '- **Least Privilege & RBAC**: verificare sempre i token Bearer e i permessi ruolo prima di esporre mutazioni.',
      '- **Rate Limiting & Edge WAF**: proteggere gli endpoint critici con soglie per IP e telemetria attiva.'
    ].join('\n');

    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: {
        title: title || topic,
        summary,
        tags: cleanTags,
        content: content ? (content + '\n\n' + auditBlock + '\n') : auditBlock,
        insertSnippet: '\n' + auditBlock + '\n'
      }
    };
  }

  if (mode === 'expand') {
    const targetText = selectedText || content || topic;
    const expanded = [
      targetText,
      '',
      '### Approfondimento Tecnico & Benchmark',
      "In scenari ad alta concorrenza, l'adozione di pattern ++stateless++ e query SQL indicizzate consente di mantenere un throughput costante:",
      '1. **Isolamento delle Dipendenze**: separare il layer di trasporto HTTP dalla logica di persistenza.',
      '2. **Osservabilità End-to-End**: tracciare latenza DB, memoria heap e hit-rate della cache edge.',
      '3. **Verifica Deterministica**: accompagnare ogni rilascio con test di regressione automatizzati.'
    ].join('\n');

    const updatedContent = selectedText && content.includes(selectedText) ? content.replace(selectedText, expanded) : expanded;
    return {
      success: true,
      source: 'dkp-sentinel-heuristic',
      result: { title: title || topic, summary, tags: cleanTags, content: updatedContent, insertSnippet: expanded }
    };
  }

  const toneHeader = tone === 'tutorial' ? 'Guida Pratica Step-by-Step' : tone === 'rfc' ? 'RFC Architetturale' : 'Analisi Architetturale & Implementazione';
  const generatedTitle = title || (topic + ': ' + toneHeader);
  const generatedSummary = summary || ('Analisi tecnica completa su ' + topic + ': principi di progettazione, esempi di codice production-ready, benchmark e checklist di sicurezza.');
  const generatedBody = [
    '# ' + generatedTitle,
    '',
    '> ==Key Takeaway==: Una progettazione orientata a **semplicità deterministica**, **sicurezza by-design** e **osservabilità continua** garantisce stabilità e prestazioni scalabili.',
    '',
    '## 1. Contesto & Obiettivi Architetturali',
    'Nello sviluppo di sistemi moderni su **DevKernelPulse**, affrontare **' + topic + '** richiede di bilanciare velocità di esecuzione, manutenibilità del codice e protezione contro regressioni.',
    '',
    '## 2. Implementazione di Riferimento',
    FENCE + codeLang,
    'export interface KernelTelemetryResult {',
    "  status: 'OPTIMAL' | 'DEGRADED';",
    '  latencyMs: number;',
    '  verified: boolean;',
    '}',
    FENCE
  ].join('\n');

  return {
    success: true,
    source: 'dkp-sentinel-heuristic',
    result: { title: generatedTitle, summary: generatedSummary, tags: cleanTags, content: generatedBody, insertSnippet: generatedBody }
  };
});