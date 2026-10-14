// app/plugins/prism.client.ts
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Carichiamo i linguaggi lato client usando require dinamico senza rompere il parser TS
    try {

// 1️⃣ CORE & DIPENDENZE BASE (DEVONO stare in cima)
 require('prismjs/components/prism-markup')
 require('prismjs/components/prism-css')
 require('prismjs/components/prism-clike')
 require('prismjs/components/prism-javascript')
 require('prismjs/components/prism-c') // Base per C++, Objective-C, OpenCL
 require('prismjs/components/prism-java') // Base per Scala, Javadoc
 require('prismjs/components/prism-markup-templating') // 🟢 IL SALVATORE: Base obbligatoria per Django e PHP
 require('prismjs/components/prism-javadoclike') // Base per i linguaggi di documentazione

// 2️⃣ LINGUAGGI CHE DIPENDONO DALLE BASI
 require('prismjs/components/prism-cpp')
 require('prismjs/components/prism-objectivec')
 require('prismjs/components/prism-opencl')
 require('prismjs/components/prism-scala')
 require('prismjs/components/prism-php')
 require('prismjs/components/prism-django')
 require('prismjs/components/prism-javadoc')
 require('prismjs/components/prism-xml-doc')

// 3️⃣ TUTTI GLI ALTRI LINGUAGGI INDIPENDENTI
 require('prismjs/components/prism-typescript')
 require('prismjs/components/prism-python')
 require('prismjs/components/prism-bash')
 require('prismjs/components/prism-json')
 require('prismjs/components/prism-jsonp')
 require('prismjs/components/prism-sql')
 require('prismjs/components/prism-go')
 require('prismjs/components/prism-rust')
 require('prismjs/components/prism-yaml')
 require('prismjs/components/prism-csharp')
 require('prismjs/components/prism-kotlin')
 require('prismjs/components/prism-swift')
 require('prismjs/components/prism-ruby')
 require('prismjs/components/prism-perl')
 require('prismjs/components/prism-docker')
 require('prismjs/components/prism-graphql')
 require('prismjs/components/prism-haskell')
 require('prismjs/components/prism-apacheconf')
 require('prismjs/components/prism-applescript')
 require('prismjs/components/prism-git')
 require('prismjs/components/prism-makefile')
 require('prismjs/components/prism-mongodb')
 require('prismjs/components/prism-neon')
 require('prismjs/components/prism-nginx')
 require('prismjs/components/prism-visual-basic')
 require('prismjs/components/prism-wiki')
 require('prismjs/components/prism-cobol')
 require('prismjs/components/prism-http')
 require('prismjs/components/prism-pascal')
 require('prismjs/components/prism-powershell')
 require('prismjs/components/prism-qsharp')
 require('prismjs/components/prism-rest')
 require('prismjs/components/prism-typoscript')

} catch (e) {
      // fallback silenzioso se un modulo non è presente
    }
  }

  return {
    provide: {
      prism: Prism
    }
  }
})