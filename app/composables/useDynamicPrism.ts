import { ref } from 'vue'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import componentsManifest from 'prismjs/components.json'

// Caricamento lazy di tutti i componenti linguaggi PrismJS (~300 linguaggi)
const prismModules = import.meta.glob('../../../node_modules/prismjs/components/prism-*.min.js')

const loadedLanguages = new Set<string>(Object.keys(Prism.languages))
const loadingPromises = new Map<string, Promise<void>>()

// Contatore reattivo: quando un nuovo linguaggio viene caricato, i computed si aggiornano
export const prismRegistryVersion = ref(0)

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  py3: 'python',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  cs: 'csharp',
  'c#': 'csharp',
  'c++': 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  h: 'c',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  vue: 'markup',
  svelte: 'markup',
  md: 'markdown',
  dockerfile: 'docker',
  rb: 'ruby',
  kt: 'kotlin',
  kts: 'kotlin',
  ps1: 'powershell',
  psm1: 'powershell',
  pwsh: 'powershell',
  tf: 'hcl',
  terraform: 'hcl',
  sol: 'solidity',
  objc: 'objectivec',
  'objective-c': 'objectivec',
  vb: 'visual-basic',
  vba: 'visual-basic',
  tex: 'latex',
  gql: 'graphql',
  pgsql: 'sql',
  postgres: 'sql',
  postgresql: 'sql',
  mysql: 'sql',
  sqlite: 'sql'
}

export function normalizePrismLang(rawLang?: string): string {
  if (!rawLang) return ''
  const clean = rawLang.trim().toLowerCase().replace(/^language-/, '')
  return LANGUAGE_ALIASES[clean] || clean
}

function getDependencies(lang: string): string[] {
  const languagesMeta = (componentsManifest as any)?.languages || {}
  const entry = languagesMeta[lang]
  if (!entry || !entry.require) return []
  return Array.isArray(entry.require) ? entry.require : [entry.require]
}

async function loadSinglePrismLanguage(rawLang: string): Promise<void> {
  if (!import.meta.client) return
  const lang = normalizePrismLang(rawLang)
  if (!lang || lang === 'none' || lang === 'text' || lang === 'plaintext' || lang === 'txt') return
  if (loadedLanguages.has(lang) || Prism.languages[lang]) {
    loadedLanguages.add(lang)
    return
  }

  if (loadingPromises.has(lang)) {
    return loadingPromises.get(lang)
  }

  const task = (async () => {
    // 1. Carica prima tutte le dipendenze richieste in ordine topologico
    const deps = getDependencies(lang)
    for (const dep of deps) {
      await loadSinglePrismLanguage(dep)
    }

    // 2. Trova il modulo corrispondente in node_modules/prismjs/components
    const targetSuffix = `/prism-${lang}.min.js`
    const matchedKey = Object.keys(prismModules).find((k) => k.endsWith(targetSuffix))
    const loader = matchedKey ? prismModules[matchedKey] : undefined
    if (loader) {
      try {
        // Assicura che Prism sia visibile globalmente ai plugin UMD di PrismJS
        ;(window as any).Prism = Prism
        await loader()
        loadedLanguages.add(lang)
        prismRegistryVersion.value++
      } catch {
        // Fallback silenzioso se il linguaggio non esiste
      }
    }
  })().finally(() => {
    loadingPromises.delete(lang)
  })

  loadingPromises.set(lang, task)
  return task
}

export async function ensurePrismLanguages(langs: string[]): Promise<void> {
  if (!import.meta.client || !langs.length) return
  const unique = Array.from(new Set(langs.map(normalizePrismLang).filter(Boolean)))
  await Promise.all(unique.map(l => loadSinglePrismLanguage(l)))
}

export function extractLanguagesFromMarkdown(markdown: string): string[] {
  if (!markdown) return []
  const matches = markdown.matchAll(/```([a-zA-Z0-9_+#.-]+)/g)
  const langs: string[] = []
  for (const m of matches) {
    if (m[1]) langs.push(normalizePrismLang(m[1]))
  }
  return Array.from(new Set(langs))
}

export function escapeHtmlCode(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Evidenzia sincronicamente se il linguaggio è già in memoria,
 * altrimenti lo carica dinamicamente in background e aggiorna prismRegistryVersion.
 */
export function highlightCodeDynamic(code: string, rawLang: string): string {
  const lang = normalizePrismLang(rawLang)
  if (!lang || lang === 'none' || lang === 'text' || lang === 'plaintext') {
    return escapeHtmlCode(code)
  }

  const grammar = Prism.languages[lang]
  if (grammar) {
    try {
      return Prism.highlight(code, grammar, lang)
    } catch {
      return escapeHtmlCode(code)
    }
  }

  if (import.meta.client) {
    void loadSinglePrismLanguage(lang)
  }
  return escapeHtmlCode(code)
}

/**
 * Evidenzia tutti i blocchi <pre><code class="language-xxx"> dentro un container DOM
 * (utilizzabile sia nelle anteprime admin sia nelle pagine slug pubbliche).
 */
export async function highlightDomElement(root?: HTMLElement | Document | null): Promise<void> {
  if (!import.meta.client) return
  const container = root || document
  const codeEls = Array.from(container.querySelectorAll('code[class*="language-"], pre[class*="language-"]'))
  const langsToLoad: string[] = []

  for (const el of codeEls) {
    const match = el.className.match(/language-([a-zA-Z0-9_+#.-]+)/)
    if (match?.[1]) {
      const normalized = normalizePrismLang(match[1])
      if (normalized && normalized !== 'none') {
        langsToLoad.push(normalized)
        if (!el.classList.contains(`language-${normalized}`)) {
          el.classList.add(`language-${normalized}`)
        }
      }
    }
  }

  if (langsToLoad.length > 0) {
    await ensurePrismLanguages(langsToLoad)
  }

  for (const el of codeEls) {
    if (el.tagName.toLowerCase() === 'code') {
      try {
        const match = el.className.match(/language-([a-zA-Z0-9_+#.-]+)/)
        const lang = match?.[1] ? normalizePrismLang(match[1]) : ''
        const grammar = lang ? Prism.languages[lang] : undefined
        if (lang && grammar) {
          const rawCode = el.textContent || ''
          ;(el as HTMLElement).innerHTML = Prism.highlight(rawCode, grammar, lang)
        } else {
          Prism.highlightElement(el as HTMLElement)
        }
      } catch {}
    }
  }
}

export function useDynamicPrism() {
  return {
    Prism,
    prismRegistryVersion,
    normalizePrismLang,
    ensurePrismLanguages,
    extractLanguagesFromMarkdown,
    highlightCodeDynamic,
    highlightDomElement
  }
}