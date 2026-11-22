// app/composables/useSentinelGrammar.ts
import { ref, watch, type Ref } from 'vue'

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
  const itHits = (sample.match(/\b(che|non|per|con|sono|della|delle|degli|questo|questa|come|anche|nel|nella|sul|sulla|più|può|quindi|perché)\b/g) || []).length
  const enHits = (sample.match(/\b(the|and|for|with|that|this|from|are|have|which|when|into|using|should|would|between)\b/g) || []).length
  return itHits >= enHits ? 'it' : 'en'
}

export function analyzeTextWithSentinel(rawText: string): {
  lang: 'it' | 'en'
  issues: SentinelGrammarIssue[]
} {
  const text = String(rawText || '')
  const lang = detectPostLanguage(text)
  const issues: SentinelGrammarIssue[] = []

  if (text.trim().length < 20) {
    return { lang, issues }
  }

  // Isola blocchi di codice per non segnalare falsi positivi dentro il codice
  const proseOnly = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ')

  // 1. Parole consecutive duplicate (es. "il il", "the the")
  const dupMatch = proseOnly.match(/\b([a-zA-ZÀ-ÿ]{2,})\s+\1\b/i)
  if (dupMatch) {
    issues.push({
      id: 'dup-word',
      rule: 'Ripetizione',
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

  // 2. Doppi spazi nel testo
  if (/[^\n] {2,}[^\s-]/.test(proseOnly)) {
    issues.push({
      id: 'double-space',
      rule: 'Spaziatura',
      severity: 'info',
      message: lang === 'it'
        ? 'Rilevati spazi multipli consecutivi nel testo.'
        : 'Multiple consecutive spaces detected in prose.',
      excerpt: '  '
    })
  }

  // 3. Spazio mancante dopo virgola o punto
  const punctMatch = proseOnly.match(/([a-zA-ZÀ-ÿ]{3,})([,;:])([a-zA-ZÀ-ÿ]{3,})/)
  if (punctMatch) {
    issues.push({
      id: 'punct-space',
      rule: 'Punteggiatura',
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

  // 4. Blocchi codice ``` non chiusi
  const fenceCount = (text.match(/```/g) || []).length
  if (fenceCount % 2 !== 0) {
    issues.push({
      id: 'unclosed-fence',
      rule: 'Markdown Code',
      severity: 'warn',
      message: lang === 'it'
        ? 'Blocco di codice (```) non chiuso: potrebbe alterare la formattazione.'
        : 'Unclosed fenced code block (```): may break rendering.',
      excerpt: '```'
    })
  }

  // 5. Backtick inline ` non bilanciati
  const withoutFences = text.replace(/```[\s\S]*?```/g, '')
  const inlineTicks = (withoutFences.match(/`/g) || []).length
  if (inlineTicks % 2 !== 0) {
    issues.push({
      id: 'unclosed-inline-code',
      rule: 'Inline Code',
      severity: 'warn',
      message: lang === 'it'
        ? 'Apice inverso (`) spaiato rilevato nel testo.'
        : 'Unmatched inline code backtick (`) detected.',
      excerpt: '`'
    })
  }

  // 6. Blocco codice senza linguaggio specificato
  if (/```\r?\n/.test(text)) {
    issues.push({
      id: 'missing-code-lang',
      rule: 'Prism Highlight',
      severity: 'info',
      message: lang === 'it'
        ? 'Specifica il linguaggio dopo ``` (es. ```ts o ```sql) per attivare Prism.js.'
        : 'Specify a language after ``` (e.g. ```ts or ```sql) for Prism.js highlighting.',
      excerpt: '```'
    })
  }

  // 7. Frasi troppo lunghe (> 42 parole)
  const sentences = proseOnly.split(/[.!?]+\s+/)
  const longSentence = sentences.find((s) => s.trim().split(/\s+/).length > 42)
  if (longSentence) {
    issues.push({
      id: 'long-sentence',
      rule: 'Leggibilità',
      severity: 'info',
      message: lang === 'it'
        ? 'Periodo molto lungo (>42 parole): valuta di spezzarlo per migliorare la leggibilità tecnica.'
        : 'Very long sentence (>42 words): consider splitting it for better technical readability.',
      excerpt: `${longSentence.trim().slice(0, 48)}...`
    })
  }

  return { lang, issues }
}

export function useSentinelGrammar(contentRef: Ref<string>) {
  const detectedLang = ref<'it' | 'en'>('it')
  const grammarIssues = ref<SentinelGrammarIssue[]>([])
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
      timer = setTimeout(runCheck, 350)
    },
    { immediate: true }
  )

  const lastFixMessage = ref<string>('')

  function applyGrammarFix(issue: SentinelGrammarIssue) {
    if (!issue) return
    const current = String(contentRef.value || '')
    let next = current

    if (issue.replacement && issue.replacement.find) {
      const escapedFind = issue.replacement.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      next = current.replace(new RegExp(escapedFind), issue.replacement.replaceWith)
    } else if (issue.id === 'double-space') {
      next = current.replace(/([^\n ]) {2,}([^\s-])/g, '$1 $2')
    } else if (issue.id === 'unclosed-fence') {
      next = `${current.trimEnd()}\n\`\`\`\n`
    } else if (issue.id === 'unclosed-inline-code') {
      next = `${current}\``
    }

    if (next !== current) {
      contentRef.value = next
      lastFixMessage.value = `Applicato: ${issue.rule}`
      if (timer) clearTimeout(timer)
      runCheck()
      setTimeout(() => {
        lastFixMessage.value = ''
      }, 2200)
    }
  }

  return {
    detectedLang,
    grammarIssues,
    applyGrammarFix,
    runCheck
  }
}