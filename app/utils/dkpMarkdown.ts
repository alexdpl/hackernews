// app/utils/dkpMarkdown.ts

const BT = String.fromCharCode(96);
const FENCE = BT + BT + BT;

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&(?!(?:amp|lt|gt|quot|#39|#x27);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeInlineCodeContent(raw: string): string {
  const leadTick = new RegExp('^' + BT + '+|' + BT + '+$', 'g');
  const cleaned = String(raw || '')
    .replace(leadTick, '')
    .replace(/^''+|''+$/g, '')
    .trim();

  return cleaned
    .replace(/&(?!(?:amp|lt|gt|quot|#39|#x27);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function safeUrl(raw: string): string {
  const normalized = String(raw || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  if (!normalized || /[\u0000-\u001F\u007F\s]/.test(normalized)) {
    return '#';
  }

  if (/^https?:\/\//i.test(normalized) || /^\/(?!\/)/.test(normalized)) {
    return normalized
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return '#';
}

function parseMarkdownTables(text: string): string {
  const tableRegex = /^(\|.+\|)\r?\n(\|[ \t:|-]+\|)\r?\n((?:\|.+\|(?:\r?\n|$))+)/gm;

  return text.replace(tableRegex, (_match, headerLine: string, _alignLine: string, bodyBlock: string) => {
    const parseRow = (row: string) =>
      row
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((cell) => cell.trim());

    const headers = parseRow(headerLine);
    const bodyLines = bodyBlock
      .trim()
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    const thead = '<thead><tr>' + headers.map((h) => '<th>' + h + '</th>').join('') + '</tr></thead>';
    const tbody = '<tbody>' + bodyLines
      .map((line) => {
        const cells = parseRow(line);
        return '<tr>' + headers.map((_, idx) => '<td>' + (cells[idx] ?? '') + '</td>').join('') + '</tr>';
      })
      .join('') + '</tbody>';

    return '<div class="dkp-table-wrapper not-prose"><table class="dkp-table">' + thead + tbody + '</table></div>\n';
  });
}

export function parseDkpMarkdown(contentVal: string): string {
  try {
    if (!contentVal) return '';

    let rawContent = String(contentVal).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    const codeBlocks: string[] = [];
    const inlineCodes: string[] = [];

    const pushInlineCode = (rawCode: string): string => {
      const index = inlineCodes.length;
      inlineCodes.push('<code class="dkp-inline-code">' + escapeInlineCodeContent(rawCode) + '</code>');
      return '__DKP_INLINE_CODE_' + index + '__';
    };

    const fencedBlockRegex = new RegExp(FENCE + '([a-zA-Z0-9_+#.-]*)[ \\t]*\\r?\\n([\\s\\S]*?)' + FENCE, 'g');
    const stripOuterTicks = new RegExp('^' + BT + '+|' + BT + '+$', 'g');

    rawContent = rawContent.replace(
      fencedBlockRegex,
      (_match: string, lang: string, code: string) => {
        const index = codeBlocks.length;
        const cleanLang = lang ? lang.replace(/[^a-zA-Z0-9_+#.-]/g, '').toLowerCase() : 'code';
        const languageClass = cleanLang && cleanLang !== 'code' ? 'language-' + cleanLang : 'language-none';
        const languageLabel = '<div class="dkp-code-header"><span>' + (cleanLang || 'code') + '</span><button type="button" class="dkp-copy-btn" data-code-id="code-block-' + index + '" title="Copia codice">&#128203; Copia</button></div>';
        const escapedCode = escapeHtml(String(code || '').replace(stripOuterTicks, ''));

        codeBlocks.push(
          '<div class="dkp-code-wrapper not-prose">' + languageLabel + '<pre class="dkp-code-block ' + languageClass + '"><code id="code-block-' + index + '" class="' + languageClass + '">' + escapedCode + '</code></pre></div>'
        );
        return '__DKP_CODE_BLOCK_' + index + '__';
      }
    );

    const tripleInlineRegex = new RegExp(FENCE + '([^' + BT + '\\r\\n]+)' + FENCE, 'g');
    const doubleInlineRegex = new RegExp(BT + BT + '([^' + BT + '\\r\\n]+(?:' + BT + '[^' + BT + '\\r\\n]+)*)' + BT + BT, 'g');
    const singleInlineRegex = new RegExp(BT + '([^' + BT + '\\r\\n]+)' + BT, 'g');
    const existingCodeTagRegex = new RegExp('<code\\b[^>]*>' + BT + '*([^<' + BT + ']+?)' + BT + '*<\\/code>', 'gi');

    rawContent = rawContent.replace(tripleInlineRegex, (_m, code: string) => pushInlineCode(code));
    rawContent = rawContent.replace(doubleInlineRegex, (_m, code: string) => pushInlineCode(code));
    rawContent = rawContent.replace(singleInlineRegex, (_m, code: string) => pushInlineCode(code));
    rawContent = rawContent.replace(existingCodeTagRegex, (_m, code: string) => pushInlineCode(code));

    let html = escapeHtml(rawContent);
    html = parseMarkdownTables(html);

    html = html
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (_m, alt: string, src: string) =>
          '<img src="' + safeUrl(src) + '" alt="' + alt + '" class="dkp-img" loading="lazy" />'
      )
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_m, label: string, href: string) =>
          '<a href="' + safeUrl(href) + '" class="dkp-link" target="_blank" rel="noopener noreferrer">' + label + '</a>'
      );

    html = html
      .replace(/==(.*?)==/g, '<mark class="dkp-highlight">$1</mark>')
      .replace(/\+\+(.*?)\+\+/g, '<u class="dkp-underline">$1</u>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>');

    html = html
      .replace(/^# (.*?)\r?$/gm, '<h1 class="dkp-h1">$1</h1>')
      .replace(/^## (.*?)\r?$/gm, '<h2 class="dkp-h2">$1</h2>')
      .replace(/^### (.*?)\r?$/gm, '<h3 class="dkp-h3">$1</h3>')
      .replace(/^&gt; (.*?)\r?$/gm, '<blockquote class="dkp-quote">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="dkp-hr" />')
      .replace(/^(?:[-*]) (.+)\r?$/gm, '<li class="dkp-li">$1</li>')
      .replace(/^\d+\. (.+)\r?$/gm, '<li class="dkp-li-ordered">$1</li>');

    html = html
      .replace(/((?:<li class="dkp-li">.*<\/li>\n?)+)/g, '<ul class="dkp-ul">$1</ul>\n')
      .replace(/((?:<li class="dkp-li-ordered">.*<\/li>\n?)+)/g, '<ol class="dkp-ol">$1</ol>\n');

    const lines = html.split(/\r?\n/);
    let parsedHtml = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.includes('__DKP_CODE_BLOCK_') ||
        /^<(h[1-6]|pre|div|table|thead|tbody|tr|th|td|ul|ol|blockquote|hr|li|img)/.test(trimmed) ||
        /^<\/(div|table|thead|tbody|tr|ul|ol|blockquote)>/.test(trimmed)
      ) {
        parsedHtml += line + '\n';
      } else if (trimmed === '') {
        parsedHtml += '<br />\n';
      } else {
        parsedHtml += line + '<br />\n';
      }
    }

    inlineCodes.forEach((snippet, index) => {
      const wrapQuotes = new RegExp('(?:' + BT + '|&#39;|\'){0,2}__DKP_INLINE_CODE_' + index + '__(?:' + BT + '|&#39;|\'){0,2}', 'g');
      parsedHtml = parsedHtml.replace(wrapQuotes, () => snippet);
    });

    codeBlocks.forEach((block, index) => {
      parsedHtml = parsedHtml.replace(
        new RegExp('__DKP_CODE_BLOCK_' + index + '__(?:<br \\/>)?', 'g'),
        () => block
      );
    });

    const leadCodeQuote = new RegExp('(<code\\b[^>]*>)(?:' + BT + '|&#39;|\')+', 'gi');
    const trailCodeQuote = new RegExp('(?:' + BT + '|&#39;|\')+(<\\/code>)', 'gi');

    return parsedHtml
      .replace(leadCodeQuote, '$1')
      .replace(trailCodeQuote, '$1')
      .replace(/(<\/h[1-6]>)<br \/>/g, '$1')
      .replace(/(<\/div>)<br \/>/g, '$1')
      .replace(/(<\/ul>)<br \/>/g, '$1')
      .replace(/(<\/ol>)<br \/>/g, '$1')
      .replace(/(<\/blockquote>)<br \/>/g, '$1')
      .replace(/(<hr class="dkp-hr" \/>)<br \/>/g, '$1');
  } catch (err) {
    console.error('[parseDkpMarkdown error]:', err);
    return String(contentVal || '');
  }
}