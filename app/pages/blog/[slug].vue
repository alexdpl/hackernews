// app/pages/blog/[slug].vue
<script setup lang="ts">
import { computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBlog } from '~/composables/useBlog'
import SocialShare from '~/components/blog/SocialShare.vue'
import DkpRelatedPosts from '~/components/blog/DkpRelatedPosts.vue'

// 🟢 Abilita la copia codice per l'articolo renderizzato
useCodeCopy()

const route = useRoute()
const slug = route.params.slug as string
const { $prism } = useNuxtApp()

const { likePost, incrementView, getAuthorRank } = useBlog()

const { data: apiResponse, pending, error } = await useFetch(`/api/blog/posts/${slug}`)
const post = computed(() => {
  const res = apiResponse.value as Record<string, any> | null
  return res?.data || null
})

// === CALCOLO TEMPO DI LETTURA REALE ===
const readTime = computed(() => {
  const text = post.value?.content || post.value?.description || ''
  if (!text) return 1
  const plainText = text.replace(/<\/?[^>]+(>|$)/g, "")
  const words = plainText.trim().split(/\s+/).length
  const wpm = 200
  return Math.max(1, Math.ceil(words / wpm))
})

// === PARSER CUSTOM (BLINDATO) ===
const parsedContent = computed(() => {
  try {
    const contentVal = post.value?.content || post.value?.description || ''
    if (!contentVal) return ''
    
    let rawContent = contentVal.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
    const codeBlocks: string[] = [];
    
    // 1. ISOLAMENTO BLOCCHI DI CODICE
    rawContent = rawContent.replace(/```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
      const index = codeBlocks.length;
      const cleanLang = lang ? lang.trim().toLowerCase() : '';
      const languageClass = cleanLang ? `language-${cleanLang}` : 'language-none';
      
      const languageLabel = cleanLang ? `<div class="dkp-code-header"><span>${cleanLang}</span><button class="dkp-copy-btn" data-code-id="code-block-${index}" title="Copia codice">📋</button></div>` : '';
      const escapedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      codeBlocks.push(`<div class="dkp-code-wrapper not-prose">${languageLabel}<pre class="dkp-code-block ${languageClass}"><code id="code-block-${index}" class="${languageClass}">${escapedCode}</code></pre></div>`);
      return `__DKP_CODE_BLOCK_${index}__`;
    });

    // 2. PARSING MARKDOWN
    let html = rawContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    html = html.replace(/^\|(.+)\|$/gm, (match, p1) => {
      const cells = p1.split('|').map((c: string) => c.trim())
      if (cells.every((c: string) => /^:?-+:?$/.test(c))) return '' 
      const rowHtml = cells.map((c: string) => `<td>${c}</td>`).join('')
      return `<tr>${rowHtml}</tr>`
    })
    html = html.replace(/(<tr>.*?<\/tr>[\s\n\r]*)+/g, (match) => {
      const cleanRows = match.replace(/[\n\r]+/g, '') 
      return `<div class="dkp-table-wrapper"><table class="dkp-table"><tbody>${cleanRows}</tbody></table></div>`
    })

    html = html
      .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="dkp-img" loading="lazy" />')
      .replace(/@[video]\(([^)]+)\)/g, '<div class="dkp-video-wrapper"><iframe src="$1" frameborder="0" allowfullscreen></iframe></div>')
      .replace(/==(.*?)==/g, '<mark class="dkp-highlight">$1</mark>')
      .replace(/\+\+(.*?)\+\+/g, '<u class="dkp-underline">$1</u>')
      .replace(/`([^`\n]+)`/g, '<code class="dkp-inline-code">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
      .replace(/\*(.*?)\*/g, '<em>$1</em>') 
      .replace(/~~(.*?)~~/g, '<del>$1</del>') 
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="dkp-link" target="_blank">$1</a>') 

    html = html
      .replace(/^# (.*?)\r?$/gm, '<h1 class="dkp-h1">$1</h1>')
      .replace(/^## (.*?)\r?$/gm, '<h2 class="dkp-h2">$1</h2>')
      .replace(/^### (.*?)\r?$/gm, '<h3 class="dkp-h3">$1</h3>')
      .replace(/^&gt; (.*?)\r?$/gm, '<blockquote class="dkp-quote">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="dkp-hr" />')

    html = html.replace(/^( {2,}|\t+)- (.*?)\r?$/gm, '<ul class="dkp-sub-list"><li class="dkp-li-nested">$2</li></ul>')
    html = html.replace(/^( {2,}|\t+)[0-9]+\. (.*?)\r?$/gm, '<ol class="dkp-sub-list"><li class="dkp-li-nested dkp-li-num">$2</li></ol>')
    html = html.replace(/^-(?!\S) (.*?)\r?$/gm, '<ul><li class="dkp-li-main">$1</li></ul>')
    html = html.replace(/^[0-9]+\. (.*?)\r?$/gm, '<ol><li class="dkp-li-main">$1</li></ol>')
    html = html.replace(/<\/ul>\s*<ul>/g, '')
    html = html.replace(/<\/ol>\s*<ol>/g, '')
    html = html.replace(/<\/ul>\s*<ul class="dkp-sub-list">/g, '')
    html = html.replace(/<\/ol>\s*<ol class="dkp-sub-list">/g, '')

    // 3. GESTIONE A CAPO E PARAGRAFI
    let lines = html.split(/\r?\n/);
    let parsedHtml = '';
    
    for (let i = 0; i < lines.length; i++) {
       let line = lines[i];
       let trimmed = line.trim();
       
       if (trimmed.includes('__DKP_CODE_BLOCK_')) {
          parsedHtml += line + '\n';
       } else if (/^<(h[1-6]|pre|div|table|ul|ol|blockquote|hr|li|img)/.test(trimmed) || /^<\/(div|table|ul|ol|blockquote)>/.test(trimmed)) {
          parsedHtml += line + '\n'; 
       } else if (trimmed === '') {
          parsedHtml += '<br />\n'; // 🟢 INSERISCE GLI SPAZI VUOTI
       } else {
          parsedHtml += line + (i < lines.length - 1 ? '<br />' : '');
       }
    }

    // 4. REINSERIMENTO SICURO DEI BLOCCHI DI CODICE
    codeBlocks.forEach((block, index) => {
      parsedHtml = parsedHtml.replace(new RegExp(`__DKP_CODE_BLOCK_${index}__(?:<br \\/>)?`, 'g'), () => block); // 🟢 FIX BUG SIMBOLO DOLLARO
    });

    // 5. CLEANUP
    return parsedHtml
      .replace(/(<\/h[1-6]>)<br \/>/g, '$1') 
      .replace(/(<\/pre>)<br \/>/g, '$1')
      .replace(/(<\/div>)<br \/>/g, '$1');

  } catch (err) {
    console.error('Errore nel parsing:', err)
    return `<p class="text-red-400">Errore nella formattazione del contenuto.</p>`
  }
})

const authorRank = computed(() => {
  try {
    const xp = post.value?.authorXp || 0
    return getAuthorRank ? getAuthorRank(xp) : { color: '#10b981', badge: '🔰', level: 1, title: 'Member' }
  } catch {
    return { color: '#10b981', badge: '🔰', level: 1, title: 'Member' }
  }
})

const currentUrl = computed(() => {
  return typeof window !== 'undefined' ? window.location.href : `https://devkernelpulse.org/blog/${slug}`
})

useDkpSeo({
  title: post.value ? `${post.value.title} - DevKernelPulse` : 'Caricamento...',
  description: post.value?.excerpt || 'Approfondimento tecnico dall ecosistema DKP.'
})

onMounted(() => {
  if (post.value?.id) incrementView(String(post.value.id))
})

let prismTimer: any = null
const applyPrism = () => {
  if (import.meta.client && $prism) {
    clearTimeout(prismTimer)
    prismTimer = setTimeout(() => {
      try {
        ($prism as any).highlightAll()
      } catch (e) {
        console.warn('Prism highlight notice:', e)
      }
    }, 100)
  }
}

const handleCopyClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const copyBtn = target.closest('.dkp-copy-btn') as HTMLButtonElement | null;
  
  if (copyBtn) {
    const codeId = copyBtn.getAttribute('data-code-id');
    if (codeId) {
      const codeElement = document.getElementById(codeId);
      if (codeElement) {
        const textToCopy = codeElement.innerText || codeElement.textContent || '';
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showCopyFeedback(copyBtn);
            });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                showCopyFeedback(copyBtn);
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
      }
    }
  }
}

const showCopyFeedback = (btn: HTMLButtonElement) => {
  const originalText = btn.innerHTML;
  btn.innerHTML = '✅'; 
  btn.style.color = '#00dc82';
  
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.color = ''; 
  }, 2000);
}

watch(parsedContent, async () => {
  await nextTick()
  applyPrism()
})

onMounted(() => {
  setTimeout(applyPrism, 200)
  document.addEventListener('click', handleCopyClick)
})

onUnmounted(() => {
   document.removeEventListener('click', handleCopyClick)
})

function handleLike() {
  if (post.value?.id) {
    likePost(String(post.value.id))
    post.value.likes = (post.value.likes || 0) + 1
  }
}
</script>

<template>
  <div class="blog-post-container max-w-6xl mx-auto px-4 py-12">
    <div v-if="pending" class="text-center py-20 text-emerald-400">
      <span class="text-3xl animate-pulse inline-block mb-4">⚡</span>
      <p>Caricamento Vault in corso...</p>
    </div>
    
    <div v-else-if="error || !post" class="text-center py-20 text-red-400">
      <h2 class="text-2xl mb-4">⚠️ Articolo non trovato</h2>
      <p>L'articolo richiesto non esiste o è stato rimosso dal Vault.</p>
      <NuxtLink to="/blog" class="mt-6 inline-block text-emerald-400 hover:underline">← Torna alla NewsRoom</NuxtLink>
    </div>
    
    <div v-else class="flex flex-col lg:flex-row gap-8 relative">
      <aside class="hidden lg:block w-16 flex-shrink-0">
        <div class="sticky top-32">
           <SocialShare :title="post.title" :url="currentUrl" :vertical="true" />
        </div>
      </aside>

      <article class="flex-1 glass-panel p-6 sm:p-10 rounded-2xl border border-slate-800 bg-[#0b0f19] shadow-2xl relative overflow-hidden">
        <div class="flex justify-between items-start mb-8 relative z-10">
          <NuxtLink to="/blog" class="text-emerald-400 hover:text-emerald-300 text-sm font-bold flex items-center gap-2 transition-colors">
            <span>←</span> Torna all'Hub
          </NuxtLink>
          <div class="flex items-center gap-3 flex-wrap justify-end">
             <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
               {{ post.categoryName || post.category || 'Generale' }}
             </span>
             <span v-if="post.isVerified" class="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
               DKP Verified
             </span>
          </div>
        </div>

        <h1 class="text-3xl md:text-5xl font-extrabold text-white mb-8 leading-tight relative z-10">{{ post.title }}</h1>
        
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#020420] border border-slate-800 mb-10 relative z-10 transition-colors"
             :style="{ borderColor: `${authorRank.color}40`, boxShadow: `0 4px 20px ${authorRank.color}10` }">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2"
                 :style="{ background: `linear-gradient(135deg, ${authorRank.color}, #0f172a)`, borderColor: authorRank.color }">
              {{ (post.authorName || 'D')[0].toUpperCase() }}
            </div>
            <div>
              <div class="text-slate-200 font-bold flex items-center gap-2">
                {{ post.authorName || 'DevKernelPulse Team' }}
                <span class="text-[0.65rem] px-2 py-0.5 rounded uppercase tracking-wider border font-bold flex items-center gap-1"
                      :style="{ backgroundColor: `${authorRank.color}15`, color: authorRank.color, borderColor: `${authorRank.color}40` }">
                  <span>{{ authorRank.badge }}</span> Lvl. {{ authorRank.level }} - {{ authorRank.title }}
                </span>
              </div>
              <div class="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                <span>📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : (post.date || 'Recente') }}</span>
                <span>👁️ {{ post.views || 0 }} visualizzazioni</span>
                <span>⏱️ {{ readTime }} min lettura</span>
              </div>
            </div>
          </div>
        </div>

        <p v-if="post.excerpt || post.summary" class="text-sky-400 font-semibold text-lg leading-relaxed mb-8 border-l-4 border-sky-400 pl-4 relative z-10">
          {{ post.excerpt || post.summary }}
        </p>

        <ClientOnly>
          <div class="post-content prose prose-invert max-w-none text-slate-200 mb-12 dkp-preview-content relative z-10" v-html="parsedContent"></div>
          <template #fallback>
            <div class="py-10 text-center text-slate-500 animate-pulse font-mono mb-12">
                ⏳ Formattazione Vault in corso...
            </div>
          </template>
        </ClientOnly>

        <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-10 relative z-10">
          <span v-for="tag in post.tags" :key="tag" class="bg-[#020420] text-sky-400 border border-slate-700 px-2 py-1 rounded text-xs font-mono transition-colors hover:border-sky-500 cursor-pointer">
            #{{ tag }}
          </span>
        </div>
        
        <div v-if="post.isVerified && post.vaultCertificateId" class="mt-12 bg-[#020420] border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)] z-10 mb-10">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
                <span class="text-emerald-400 text-xl">🛡️</span>
              </div>
              <div>
                <h3 class="text-emerald-400 font-bold text-lg tracking-wide uppercase">Vault Notarization Certificate</h3>
                <p class="text-xs text-slate-400 mt-0.5">Proof of Code & Security Scan by Pulse Sentinel AI</p>
              </div>
            </div>
          </div>
          <div class="bg-[#090d16] border border-slate-800 rounded-lg p-4 font-mono text-[11px] sm:text-xs text-slate-300 relative z-10">
            <div class="flex flex-col sm:flex-row sm:justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <span class="text-slate-500 font-semibold">CERTIFICATE_ID:</span>
              <span class="text-emerald-400 font-bold select-all">{{ post.vaultCertificateId }}</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
              <span class="text-slate-500 font-semibold">TIMESTAMP:</span>
              <span class="text-slate-300">{{ new Date(post.updatedAt || post.createdAt).toISOString() }}</span>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-slate-500 font-semibold">SHA-256 SECURE CHECKSUM:</span>
              <span class="text-sky-400 select-all break-all bg-[#020420] p-2 rounded border border-slate-800">{{ post.vaultHash }}</span>
            </div>
          </div>
        </div>

        <div class="article-actions-footer bg-[#020420] border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div class="flex flex-col gap-2 items-center md:items-start text-center md:text-left w-full md:w-auto">
            <button @click="handleLike" class="bg-emerald-500 hover:bg-emerald-400 text-slate-900 border-none px-6 py-3 rounded-lg font-bold text-lg cursor-pointer flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)] w-full md:w-auto">
              🔥 Accendi Kernel 
              <span class="bg-[#020420] text-emerald-400 px-3 py-1 rounded text-sm shadow-inner">{{ post.likes || 0 }}</span>
            </button>
            <span class="text-slate-400 text-xs">Premi per premiare questo articolo con Karma!</span>
          </div>
          <div class="flex flex-col gap-2 items-center md:items-end w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-slate-800 lg:hidden">
            <SocialShare :title="post.title" :url="currentUrl" :horizontal="true" />
          </div>
        </div>
        <DkpRelatedPosts 
          v-if="post"
          :current-post-id="post.id" 
          :category="post.category" 
          :tags="post.tags || []"  />
    <DKPBlogComments :blogSlug="post.slug" />
      </article>
    </div>
  </div>
</template>

<style scoped>
.glass-panel { backdrop-filter: blur(12px); }

/* === STILI TYPOGRAPHY & DKP OVERRIDES === */
.prose h1, .post-content h1 {
  @apply text-3xl md:text-4xl font-extrabold text-white mt-8 mb-4 border-b border-slate-800 pb-2;
}
.prose h2, .post-content h2 {
  @apply text-2xl font-bold text-white mt-6 mb-3;
}
.prose h3, .post-content h3 {
  @apply text-xl font-bold text-sky-400 mt-4 mb-2;
}
.prose p, .post-content p {
  @apply text-slate-300 text-lg leading-relaxed mb-6;
}
.prose blockquote, .post-content blockquote {
  @apply border-l-4 border-emerald-400 bg-emerald-500/10 p-4 my-6 text-slate-300 italic rounded-r-lg;
}

/* Tabelle DKP */
.prose table, .post-content table {
  @apply w-full border-collapse my-6 bg-[#090d16] rounded-lg overflow-hidden border border-slate-800 text-left;
}
.prose th, .post-content th {
  @apply bg-[#0d1322] text-emerald-400 font-bold p-3 border border-slate-800 text-xs uppercase tracking-wider;
}
.prose td, .post-content td {
  @apply p-3 text-slate-300 border border-slate-800 text-sm;
}

/* Rimozione dei backtick automatici aggiunti da Tailwind Typography */
.prose code::before,
.prose code::after {
  content: "" !important;
}

/* 🟢 GRAFICA DEI BLOCCHI CODICE DKP & RESET PER PRISM 🟢 */
:deep(.dkp-code-wrapper) { 
  background: #0d1117; 
  border: 1px solid #1e293b; 
  border-radius: 8px; 
  overflow: hidden; 
  margin: 1.2rem 0; 
  box-shadow: 0 4px 6px rgba(0,0,0,0.3); 
}
:deep(.dkp-code-header) { 
  background: #161b22; 
  padding: 0.5rem 1rem; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 1px solid #1e293b; 
  font-family: sans-serif; 
  font-size: 0.8rem; 
  font-weight: bold; 
  color: #8b949e; 
  text-transform: capitalize; 
}
:deep(.dkp-copy-btn) { background: none; border: none; color: #8b949e; cursor: pointer; font-size: 1rem; transition: color 0.2s; }
:deep(.dkp-copy-btn:hover) { color: #00dc82; }

:deep(.dkp-code-block) { padding: 1rem; margin: 0; overflow-x: auto; }

/* Rimuove i colori "forzati" dal CSS di Tailwind per lasciare agire i colori di PrismJS */
.prose pre code,
.post-content pre code,
:deep(.dkp-code-block code) {
  background-color: transparent !important;
  border: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 0.875rem !important;
  line-height: 1.7 !important;
  box-shadow: none !important;
}
.prose pre code .token,
:deep(.dkp-code-block code .token) {
  background: transparent !important;
}

/* 🟢 ELEMENTI CUSTOM 🟢 */
:deep(.dkp-img) { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; box-shadow: 0 4px 15px rgba(0,0,0,0.4); display: block; }
:deep(.dkp-video-wrapper) { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
:deep(.dkp-video-wrapper iframe) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
:deep(.dkp-highlight) { background-color: rgba(0, 220, 130, 0.25); color: #f8fafc; padding: 0.1rem 0.3rem; border-radius: 4px; }
:deep(.dkp-underline) { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #38bdf8; text-decoration-thickness: 2px; }

/* Codice inline (es. `variabile`) */
.prose :not(pre) > code,
.post-content :not(pre) > code,
:deep(.dkp-inline-code) {
  background-color: rgba(30, 41, 59, 0.8) !important;
  color: #38bdf8 !important;
  padding: 0.2rem 0.4rem !important;
  border-radius: 0.375rem !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  font-weight: 500 !important;
}

:deep(.dkp-h1) { font-size: 1.8rem; font-weight: 900; color: #ffffff; margin-top: 1.2rem; margin-bottom: 0.6rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.3rem;}
:deep(.dkp-h2) { font-size: 1.4rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
:deep(.dkp-h3) { font-size: 1.1rem; font-weight: 700; color: #00dc82; margin-top: 0.8rem; margin-bottom: 0.4rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.8rem; color: #94a3b8; font-style: italic; margin: 0.8rem 0; background: rgba(0, 220, 130, 0.05); padding-top: 0.2rem; padding-bottom: 0.2rem;}
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px;}
:deep(.dkp-link:hover) { color: #00dc82;}
:deep(.dkp-hr) { border: none; height: 1px; background-color: #334155; margin: 1.5rem 0; }

/* Liste */
:deep(.dkp-preview-content ul), :deep(.dkp-preview-content ol) { padding-left: 1.5rem; margin: 0.8rem 0; color: #cbd5e1; }
:deep(.dkp-preview-content ul) { list-style-type: none; }
:deep(.dkp-preview-content ol) { list-style-type: decimal; }
:deep(.dkp-li-main) { margin-bottom: 0.4rem; position: relative; }
:deep(ul > .dkp-li-main::before) { content: '○'; color: #38bdf8; position: absolute; left: -1.2rem; top: 0; font-weight: bold; }
:deep(.dkp-li-nested) { margin-left: 1.5rem; margin-bottom: 0.3rem; color: #94a3b8; position: relative; }
:deep(ul > .dkp-li-nested:not(.dkp-li-num)::before) { content: '▪'; color: #00dc82; position: absolute; left: -1.2rem; top: 0; }
</style>
