import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

// 1. Core e dipendenze base
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-javadoclike'

// 2. Linguaggi dipendenti
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-objectivec'
import 'prismjs/components/prism-opencl'
import 'prismjs/components/prism-scala'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-django'
import 'prismjs/components/prism-javadoc'
import 'prismjs/components/prism-xml-doc'

// 3. Linguaggi applicativi e DevOps
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-docker'
import 'prismjs/components/prism-graphql'
import 'prismjs/components/prism-git'
import 'prismjs/components/prism-makefile'
import 'prismjs/components/prism-nginx'
import 'prismjs/components/prism-powershell'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-swift'
import 'prismjs/components/prism-ruby'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    ;(window as any).Prism = Prism
  }

  return {
    provide: {
      prism: Prism
    }
  }
})