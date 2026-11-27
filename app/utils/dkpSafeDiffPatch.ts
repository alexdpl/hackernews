// app/utils/dkpSafeDiffPatch.ts

export interface SafeDiffPatchResult {
  patchedText: string
  appliedHunks: number
  rejectedHunks: number
  summary: string
}

function isProtectedStructuralLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return true
  if (/^```/.test(trimmed)) return true
  if (/^\|.*\|$/.test(trimmed)) return true
  if (/^!\[[^\]]*\]\([^)]+\)$/.test(trimmed)) return true
  if (/^@\[video\]\([^)]+\)$/i.test(trimmed)) return true
  if (/^---+$/.test(trimmed)) return true
  if (/^<\/?[a-z][\s\S]*>$/i.test(trimmed)) return true
  return false
}

function splitMarkdownPrefix(line: string): { prefix: string; body: string } {
  const match = line.match(/^(\s*(?:#{1,6}\s+|>\s+|(?:\d+\.|[-*])\s+))(.*)$/)
  if (match) {
    return { prefix: match[1], body: match[2] }
  }
  return { prefix: '', body: line }
}

function tokenizeWordsAndSpaces(text: string): string[] {
  return text.match(/\S+|\s+/g) || []
}

function computeWordDiffHunks(origTokens: string[], nextTokens: string[]): {
  patched: string
  applied: number
  rejected: number
} {
  const n = origTokens.length
  const m = nextTokens.length

  // Protezione complessità su righe lunghissime
  if (n * m > 250000) {
    if (nextTokens.join('').length < origTokens.join('').length * 0.75) {
      return { patched: origTokens.join(''), applied: 0, rejected: 1 }
    }
    return { patched: nextTokens.join(''), applied: 1, rejected: 0 }
  }

  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (origTokens[i] === nextTokens[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1]
      }
    }
  }

  type Op = { type: 'eq' | 'del' | 'ins'; token: string }
  const ops: Op[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (origTokens[i] === nextTokens[j]) {
      ops.push({ type: 'eq', token: origTokens[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', token: origTokens[i] })
      i++
    } else {
      ops.push({ type: 'ins', token: nextTokens[j] })
      j++
    }
  }
  while (i < n) ops.push({ type: 'del', token: origTokens[i++] })
  while (j < m) ops.push({ type: 'ins', token: nextTokens[j++] })

  // Raggruppa operazioni contigue di modifica in hunk
  const out: string[] = []
  let applied = 0
  let rejected = 0
  let idx = 0

  while (idx < ops.length) {
    if (ops[idx].type === 'eq') {
      out.push(ops[idx].token)
      idx++
      continue
    }

    const delTokens: string[] = []
    const insTokens: string[] = []
    while (idx < ops.length && ops[idx].type !== 'eq') {
      if (ops[idx].type === 'del') delTokens.push(ops[idx].token)
      else insTokens.push(ops[idx].token)
      idx++
    }

    const delStr = delTokens.join('')
    const insStr = insTokens.join('')

    // Blocca cancellazioni pure di parole sostanziali o perdita di sintassi Markdown
    const hasMarkdownSyntax = /(\*\*|\*|`|~~|\+\+|==|\[[^\]]+\]\([^)]+\)|!\[)/.test(delStr)
    const strippedSyntax = hasMarkdownSyntax && !/(\*\*|\*|`|~~|\+\+|==|\[[^\]]+\]\([^)]+\)|!\[)/.test(insStr)
    const delWords = delStr.trim().split(/\s+/).filter(Boolean).length
    const insWords = insStr.trim().split(/\s+/).filter(Boolean).length
    const isDestructiveDeletion = delWords >= 2 && insWords === 0

    if (strippedSyntax || isDestructiveDeletion) {
      out.push(delStr)
      rejected++
    } else {
      out.push(insStr)
      applied++
    }
  }

  return { patched: out.join(''), applied, rejected }
}

export function applySafeGrammarDiffPatch(originalRaw: string, suggestedRaw: string): SafeDiffPatchResult {
  const original = String(originalRaw || '')
  const suggested = String(suggestedRaw || '')

  if (!suggested.trim() || original === suggested) {
    return { patchedText: original, appliedHunks: 0, rejectedHunks: 0, summary: 'Nessuna modifica necessaria' }
  }

  // Guardia globale anti-troncamento: rifiuta risposte AI che tagliano >12% del documento
  if (suggested.length < original.length * 0.88) {
    return {
      patchedText: original,
      appliedHunks: 0,
      rejectedHunks: 1,
      summary: 'Patch AI bloccata dal guardrail anti-troncamento'
    }
  }

  const origLines = original.split(/\r?\n/)
  const nextLines = suggested.split(/\r?\n/)

  // Se il numero di righe diverge radicalmente, preserva la struttura originale riga per riga
  const n = origLines.length
  const m = nextLines.length
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (origLines[i] === nextLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1]
      }
    }
  }

  const resultLines: string[] = []
  let i = 0
  let j = 0
  let inFencedCode = false
  let appliedHunks = 0
  let rejectedHunks = 0

  while (i < n && j < m) {
    const oLine = origLines[i]
    const sLine = nextLines[j]

    if (/^\s*```/.test(oLine)) {
      inFencedCode = !inFencedCode
      resultLines.push(oLine)
      i++
      if (/^\s*```/.test(sLine)) j++
      continue
    }

    if (inFencedCode || isProtectedStructuralLine(oLine)) {
      resultLines.push(oLine)
      if (oLine === sLine) {
        i++
        j++
      } else {
        i++
      }
      continue
    }

    if (oLine === sLine) {
      resultLines.push(oLine)
      i++
      j++
    } else if (dp[i + 1][j] > dp[i][j + 1]) {
      // Riga originale presente ma mancante nel suggerimento AI -> NON cancellarla mai!
      resultLines.push(oLine)
      rejectedHunks++
      i++
    } else if (dp[i][j + 1] > dp[i + 1][j]) {
      // Riga extra inserita dall'AI -> ignoriamo inserimenti non richiesti di intere righe
      rejectedHunks++
      j++
    } else {
      // Sostituzione 1-a-1 sulla stessa riga: applica word-diff preservando il prefisso Markdown
      const oSplit = splitMarkdownPrefix(oLine)
      const sSplit = splitMarkdownPrefix(sLine)
      const oTokens = tokenizeWordsAndSpaces(oSplit.body)
      const sTokens = tokenizeWordsAndSpaces(sSplit.body)
      const wordRes = computeWordDiffHunks(oTokens, sTokens)
      resultLines.push(`${oSplit.prefix}${wordRes.patched}`)
      appliedHunks += wordRes.applied
      rejectedHunks += wordRes.rejected
      i++
      j++
    }
  }

  // Eventuali righe residue originali vengono sempre preservate
  while (i < n) {
    resultLines.push(origLines[i++])
  }

  const patchedText = resultLines.join('\n')
  return {
    patchedText,
    appliedHunks,
    rejectedHunks,
    summary:
      appliedHunks > 0
        ? `${appliedHunks} patch grammaticali applicate (${rejectedHunks} modifiche distruttive bloccate)`
        : 'Testo già integro e verificato'
  }
}