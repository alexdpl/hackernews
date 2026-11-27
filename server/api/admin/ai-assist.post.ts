import { defineEventHandler, readBody } from 'h3';
import { generateText } from 'ai';
import { getSmartAIProvider } from '~~/server/utils/aiRouter';

const BT = String.fromCharCode(96);
const FENCE = BT + BT + BT;

function shieldMarkdownStructure(raw: string): {
  shielded: string;
  restore: (text: string) => string;
} {
  const tokens: string[] = [];
  const pushToken = (match: string, tag: string) => {
    const idx = tokens.length;
    tokens.push(match);
    return `__DKP_${tag}_${idx}__`;
  };

  let working = String(raw || '');

  // 1. Fenced code blocks
  working = working.replace(new RegExp(FENCE + '[\\s\\S]*?' + FENCE, 'g'), (m) => pushToken(m, 'FENCE'));
  // 2. Inline code
  working = working.replace(new RegExp(BT + '[^' + BT + '\\r\\n]+' + BT, 'g'), (m) => pushToken(m, 'CODE'));
  // 3. Video embeds, images, links
  working = working.replace(/@\[video\]\([^)]+\)/gi, (m) => pushToken(m, 'MEDIA'));
  working = working.replace(/!\[[^\]]*\]\([^)]+\)/g, (m) => pushToken(m, 'IMG'));
  working = working.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m) => pushToken(m, 'LINK'));
  // 4. Table lines
  working = working.replace(/^\|.+\|$/gm, (m) => pushToken(m, 'TBL'));
  // 5. Markdown structural prefixes (headings, blockquotes, ordered/unordered lists)
  working = working.replace(/^(\s*(?:#{1,6}\s+|>\s+|(?:\d+\.|[-*])\s+))/gm, (m) => pushToken(m, 'PFX'));
  // 6. Inline Markdown delimiters
  working = working.replace(/(\*\*|\+\+|~~|==|\*)/g, (m) => pushToken(m, 'DELIM'));

  return {
    shielded: working,
    restore: (text: string) => {
      let out = text;
      for (let idx = tokens.length - 1; idx >= 0; idx--) {
        const pattern = new RegExp(`__DKP_(?:FENCE|CODE|MEDIA|IMG|LINK|TBL|PFX|DELIM)_${idx}__`, 'g');
        out = out.replace(pattern, () => tokens[idx]);
      }
      return out;
    }
  };
}

function deterministicGrammarPolish(raw: string): string {
  const { shielded, restore } = shieldMarkdownStructure(raw);
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
  const content = String(body?.content || '');
  const selectedText = String(body?.selectedText || '').trim();
  const promptHint = String(body?.promptHint || '').trim();
  const codeLang = String(body?.codeLang || 'typescript').trim().toLowerCase();
  const tone = String(body?.tone || 'deep-dive').trim();

  const topic = promptHint || title || (context === 'nodes'
    ? 'Ottimizzazione Query Pure SQL e Architettura Zero-Trust'
    : 'Architettura Serverless Pure SQL v2.6 e Difesa Attiva SAST');

  const aiRouter = getSmartAIProvider();

  if (mode === 'grammar_fix') {
    if (!content.trim()) {
      return {
        success: true,
        source: 'dkp-sentinel-grammar',
        result: { title, summary, tags: [], content: '', insertSnippet: '' }
      };
    }

    try {
      const { shielded, restore } = shieldMarkdownStructure(content);
      // Suddivide in blocchi per paragrafo se molto lungo senza MAI troncare nulla
      const paragraphs = shielded.split(/\n{2,}/);
      const chunks: string[] = [];
      let currentChunk = '';
      for (const p of paragraphs) {
        if ((currentChunk.length + p.length + 2) > 9000 && currentChunk) {
          chunks.push(currentChunk);
          currentChunk = p;
        } else {
          currentChunk = currentChunk ? `${currentChunk}\n\n${p}` : p;
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      const correctedChunks: string[] = [];
      for (const chunk of chunks) {
        const corrected = await aiRouter.executeWithFallback(async (client, modelName) => {
          const { text } = await generateText({
            model: client(modelName),
            system: [
              'Sei un Technical Copy Editor conservativo per DevKernelPulse.',
              'Correggi SOLO refusi ortografici, accenti, concordanze grammaticali e punteggiatura nella prosa.',
              'REGOLE ASSOLUTE: NON riassumere, NON riscrivere frasi intere, NON eliminare alcuna riga o parola, e lascia 100% intatti tutti i segnaposto __DKP_*_N__ esattamente dove si trovano.',
              'Restituisci esclusivamente il testo corretto senza commenti o blocchi markdown esterni.'
            ].join(' '),
            prompt: chunk,
            temperature: 0.1,
            maxRetries: 0
          });
          if (!text || !text.trim()) throw new Error('Risposta vuota');
          return text;
        }, 'dkp-flash');
        correctedChunks.push(corrected);
      }

      const restoredContent = restore(correctedChunks.join('\n\n'));
      return {
        success: true,
        source: 'dkp-ai-nexus-trinity',
        result: {
          title,
          summary,
          tags: [],
          content: restoredContent,
          insertSnippet: ''
        }
      };
    } catch {
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
  }

  try {
    const aiParsed = await aiRouter.executeWithFallback(async (client, modelName) => {
      const systemPrompt = [
        'Sei un Principal Software Architect e Technical Editor senior per DevKernelPulse (DKP).',
        'Rispondi esclusivamente con un oggetto JSON valido (senza markdown fence esterni) avente le chiavi: "title", "summary", "tags" (array di stringhe), "content" (Markdown ricco con blocchi codice, tabelle, liste puntate e ==highlight==), "insertSnippet" (stringa Markdown opzionale da inserire al cursore).',
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
        currentContent: content.slice(0, 12000)
      });

      const { text } = await generateText({
        model: client(modelName),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.4,
        maxRetries: 0
      });

      const jsonMatch = String(text || '').match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON non valido');
      return JSON.parse(jsonMatch[0]);
    }, 'dkp-coder');

    if (aiParsed) {
      return {
        success: true,
        source: 'trinity-ai-engine',
        result: {
          title: aiParsed.title || title || topic,
          summary: aiParsed.summary || summary,
          tags: Array.isArray(aiParsed.tags) ? aiParsed.tags : [],
          content: aiParsed.content || content,
          insertSnippet: aiParsed.insertSnippet || ''
        }
      };
    }
  } catch {
    /* Fallback deterministico */
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