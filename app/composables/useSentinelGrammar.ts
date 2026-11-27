// app/composables/useSentinelGrammar.ts
import { ref, watch, type Ref } from 'vue'
import { applySafeGrammarDiffPatch } from '~/utils/dkpSafeDiffPatch'

export interface SentinelGrammarIssue {
  id: string
  rule: string
  severity: 'info' | 'warn'
  message: string
  excerpt: string
  replacement?: {
    find: string
    replaceWith: string
  }
}

export function detectPostLanguage(text: string): 'it' | 'en' {
  const sample = ` ${text.toLowerCase()} `
  const itHits = (sample.match(/\b(che|non|per|con|sono|della|delle|degli|questo|questa|come|anche|nel|nella|sul|sulla|più|può|quindi|perché)\b/gu) || []).length
  const enHits = (sample.match(/\b(the|and|for|with|that|this|from|are|have|which|when|into|using|should|would|between)\b/gu) || []).length
  return itHits >= enHits ? 'it' : 'en'
}

export function analyzeTextWithSentinel(rawText: string): {
  lang: 'it' | 'en'
  issues: SentinelGrammarIssue[]
} {
  const text = String(rawText || '')
  const lang = detectPostLanguage(text)
  const issues: SentinelGrammarIssue[] = []

  if (text.trim().length < 15) {
    return { lang, issues }
  }

  const proseOnly = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ')

  const dupRegex = /\b([\p{L}]{2,})\s+\1\b/giu
  let dupMatch: RegExpExecArray | null
  let dupIdx = 0
  while ((dupMatch = dupRegex.exec(proseOnly)) !== null && dupIdx < 5) {
    issues.push({
      id: `dup-word-${dupIdx++}`,
      rule: lang === 'it' ? 'Ripetizione' : 'Repetition',
      severity: 'warn',
      message: lang === 'it'
        ? `Parola ripetuta consecutivamente: "${dupMatch[0]}"`
        : `Repeated consecutive word: "${dupMatch[0]}"`,
      excerpt: dupMatch[0],
      replacement: {
        find: dupMatch[0],
        replaceWith: dupMatch[1]
      }
    })
  }

  if (/[^\n ] {2,}[^\s-]/.test(proseOnly)) {
    issues.push({
      id: 'double-space',
      rule: lang === 'it' ? 'Spaziatura' : 'Spacing',
      severity: 'info',
      message: lang === 'it'
        ? 'Rilevati spazi multipli consecutivi nel testo.'
        : 'Multiple consecutive spaces detected in prose.',
      excerpt: '  '
    })
  }

  const punctRegex = /([\p{L}]{3,})([,;:])([\p{L}]{3,})/gu
  let punctMatch: RegExpExecArray | null
  let punctIdx = 0
  while ((punctMatch = punctRegex.exec(proseOnly)) !== null && punctIdx < 5) {
    issues.push({
      id: `punct-space-${punctIdx++}`,
      rule: lang === 'it' ? 'Punteggiatura' : 'Punctuation',
      severity: 'warn',
      message: lang === 'it'
        ? `Manca uno spazio dopo "${punctMatch[2]}" in "${punctMatch[0]}"`
        : `Missing space after "${punctMatch[2]}" in "${punctMatch[0]}"`,
      excerpt: punctMatch[0],
      replacement: {
        find: punctMatch[0],
        replaceWith: `${punctMatch[1]}${punctMatch[2]} ${punctMatch[3]}`
      }
    })
  }

  const fenceCount = (text.match(/```/g) || []).length
  if (fenceCount % 2 !== 0) {
    issues.push({
      id: 'unclosed-fence',
      rule: 'Markdown Code',
      severity: 'warn',
      message: lang === 'it'
        ? 'Blocco di codice (```) non chiuso: potrebbe alterare il rendering.'
        : 'Unclosed fenced code block (```): may break rendering.',
      excerpt: '```'
    })
  }

  const withoutFences = text.replace(/```[\s\S]*?```/g, '')
  const lines = withoutFences.split(/\r?\n/)
  const brokenLine = lines.find((line) => ((line.match(/`/g) || []).length % 2 !== 0))
  if (brokenLine) {
    issues.push({
      id: 'unclosed-inline-code',
      rule: 'Inline Code',
      severity: 'warn',
      message: lang === 'it'
        ? `Apice inverso (\`) spaiato sulla riga: "${brokenLine.trim().slice(0, 36)}..."`
        : `Unmatched inline backtick (\`) on line: "${brokenLine.trim().slice(0, 36)}..."`,
      excerpt: brokenLine.trim().slice(0, 40)
    })
  }

  if (/```[ \t]*\r?\n/.test(text)) {
    issues.push({
      id: 'missing-code-lang',
      rule: 'Prism Highlight',
      severity: 'info',
      message: lang === 'it'
        ? 'Specifica il linguaggio dopo ``` (es. ```ts o ```sql) per Prism.js.'
        : 'Specify a language after ``` (e.g. ```ts or ```sql) for Prism.js.',
      excerpt: '```'
    })
  }

  const sentences = proseOnly.split(/[.!?]+\s+/)
  const longSentence = sentences.find((s) => s.trim().split(/\s+/).length > 45)
  if (longSentence) {
    issues.push({
      id: 'long-sentence',
      rule: lang === 'it' ? 'Leggibilità' : 'Readability',
      severity: 'info',
      message: lang === 'it'
        ? 'Periodo lungo (>45 parole): valuta di spezzarlo in due frasi.'
        : 'Long sentence (>45 words): consider splitting into two sentences.',
      excerpt: `${longSentence.trim().slice(0, 48)}...`
    })
  }

  return { lang, issues }
}

function transformProseOnly(raw: string, fn: (prose: string) => string): string {
  const shielded: string[] = []
  let working = raw.replace(/```[\s\S]*?```|`[^`\n]+`|\[[^\]]+\]\([^)]+\)|!\[[^\]]*\]\([^)]+\)/g, (m) => {
    const idx = shielded.length
    shielded.push(m)
    return `__DKP_PROSE_SHIELD_${idx}__`
  })
  working = fn(working)
  shielded.forEach((orig, idx) => {
    working = working.replace(`__DKP_PROSE_SHIELD_${idx}__`, () => orig)
  })
  return working
}

function fixLineUnmatchedBackticks(raw: string): string {
  const fences: string[] = []
  let working = raw.replace(/```[\s\S]*?```/g, (m) => {
    const idx = fences.length
    fences.push(m)
    return `__SENTINEL_FENCE_${idx}__`
  })

  working = working
    .split(/\r?\n/)
    .map((line) => {
      const ticks = (line.match(/`/g) || []).length
      if (ticks % 2 !== 0) {
        return `${line.trimEnd()}\``
      }
      return line
    })
    .join('\n')

  fences.forEach((f, idx) => {
    working = working.replace(`__SENTINEL_FENCE_${idx}__`, () => f)
  })
  return working
}

export function useSentinelGrammar(
  contentRef: Ref<string>,
  onBeforeProgrammaticEdit?: (prevContent: string) => void
) {
  const detectedLang = ref<'it' | 'en'>('it')
  const grammarIssues = ref<SentinelGrammarIssue[]>([])
  const lastFixMessage = ref<string>('')
  const isAiFixing = ref<boolean>(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function runCheck() {
    const res = analyzeTextWithSentinel(contentRef.value)
    detectedLang.value = res.lang
    grammarIssues.value = res.issues
  }

  watch(
    contentRef,
    () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(runCheck, 300)
    },
    { immediate: true }
  )

  function showBanner(msg: string) {
    lastFixMessage.value = msg
    setTimeout(() => {
      lastFixMessage.value = ''
    }, 3400)
  }

  function applySingleTransformation(current: string, issue: SentinelGrammarIssue): string {
    if (issue.replacement && issue.replacement.find) {
      const escapedFind = issue.replacement.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return transformProseOnly(current, (prose) =>
        prose.replace(new RegExp(escapedFind, 'g'), issue.replacement!.replaceWith)
      )
    }
    if (issue.id === 'double-space') {
      return transformProseOnly(current, (prose) =>
        prose.replace(/([^\n ]) {2,}([^\s-])/g, '$1 $2')
      )
    }
    if (issue.id === 'unclosed-fence') {
      return `${current.trimEnd()}\n\`\`\`\n`
    }
    if (issue.id === 'unclosed-inline-code') {
      return fixLineUnmatchedBackticks(current)
    }
    return current
  }

  function applyGrammarFix(issue: SentinelGrammarIssue) {
    if (!issue) return
    const current = String(contentRef.value || '')
    const next = applySingleTransformation(current, issue)
    if (next !== current) {
      onBeforeProgrammaticEdit?.(current)
      contentRef.value = next
      if (timer) clearTimeout(timer)
      runCheck()
      showBanner(`Applicato: ${issue.rule}`)
    }
  }

  function applyAllGrammarFixes(pushSnapshot = true): number {
    const initial = String(contentRef.value || '')
    let working = initial
    let appliedCount = 0
    for (const issue of grammarIssues.value) {
      const updated = applySingleTransformation(working, issue)
      if (updated !== working) {
        working = updated
        appliedCount++
      }
    }
    if (appliedCount > 0) {
      if (pushSnapshot) onBeforeProgrammaticEdit?.(initial)
      contentRef.value = working
      if (timer) clearTimeout(timer)
      runCheck()
      showBanner(`${appliedCount} correzioni applicate`)
    }
    return appliedCount
  }

  async function runAiGrammarFix(context: 'blog' | 'nodes' = 'blog') {
    const originalBeforeRun = String(contentRef.value || '')
    if (!originalBeforeRun.trim()) {
      showBanner('Scrivi prima del testo da revisionare')
      return
    }

    // Salva snapshot integrale nell'Undo Stack PRIMA di qualsiasi modifica
    onBeforeProgrammaticEdit?.(originalBeforeRun)
    isAiFixing.value = true

    // 1. Applica correzioni locali sicure solo sulla prosa
    applyAllGrammarFixes(false)
    const baselineForDiff = String(contentRef.value || '')

    try {
      const res: any = await $fetch('/api/admin/ai-assist', {
        method: 'POST',
        body: {
          mode: 'grammar_fix',
          context,
          content: baselineForDiff
        }
      })

      if (res?.success && res.result?.content && res.result.content !== baselineForDiff) {
        // 2. Applica SOLO diff testuali granulari (LCS word-diff) preservando formattazione e struttura
        const diffResult = applySafeGrammarDiffPatch(baselineForDiff, String(res.result.content))
        if (diffResult.patchedText !== baselineForDiff) {
          contentRef.value = diffResult.patchedText
          if (timer) clearTimeout(timer)
          runCheck()
          showBanner(`DKP Ai Nexus©: ${diffResult.summary}`)
        } else {
          showBanner('Prosa e formattazione già ottimali')
        }
      } else {
        showBanner('Prosa e sintassi già ottimali')
      }
    } catch {
      showBanner('Correzioni locali Sentinel applicate')
    } finally {
      isAiFixing.value = false
    }
  }

  return {
    detectedLang,
    grammarIssues,
    lastFixMessage,
    isAiFixing,
    applyGrammarFix,
    applyAllGrammarFixes,
    runAiGrammarFix,
    runCheck
  }
}