<!-- app/pages/blog/[slug].vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useBlog } from "~/composables/useBlog";
import SocialShare from "~/components/blog/SocialShare.vue";
import DkpRelatedPosts from "~/components/blog/DkpRelatedPosts.vue";
import DkpNodesHomeWidget from "~/components/DkpNodesHomeWidget.vue";
import VaultTrustBadge from "~/components/VaultTrustBadge.vue";

interface BlogPost {
  id?: string | number;
  slug?: string;
  title: string;
  content?: string;
  description?: string;
  excerpt?: string;
  summary?: string;
  categoryName?: string;
  category?: string;
  subcategoryName?: string;
  subCategory?: string;
  isVerified?: boolean;
  authorXp?: number;
  authorName?: string;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  views?: number;
  likes?: number;
  tags?: string[];
  vaultCertificateId?: string;
  vaultHash?: string;
  vaultBlockNumber?: number | null;
}

interface BlogApiResponse {
  data?: BlogPost | null;
}

interface AuthorRank {
  color: string;
  badge: string;
  level: number;
  title: string;
}

interface PrismHighlighter {
  highlightAll: () => void;
}

useCodeCopy();

const route = useRoute();
const slug = route.params.slug as string;
const { $prism } = useNuxtApp();

const { likePost, incrementView, getAuthorRank } = useBlog();

const {
  data: apiResponse,
  pending,
  error,
} = await useFetch(`/api/blog/posts/${slug}`);

const post = computed<BlogPost | null>(() => {
  const res = apiResponse.value as unknown as BlogApiResponse | null;
  return res?.data || null;
});

// --- BLOCKCHAIN VAULT LIVE VERIFICATION (BLOG) ---
const vaultProof = ref<any>(null);
const isCheckingVault = ref(false);
const hashCopied = ref(false);
const toastMsg = ref("");
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showNotification(msg: string) {
  toastMsg.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMsg.value = "";
  }, 3500);
}

async function loadOnChainBlogProof(autoNotarizeIfMissing = true) {
  if (!post.value?.id && !slug) return;
  isCheckingVault.value = true;
  try {
    const queryParams: Record<string, any> = {
      entityType: "blog",
      slug: post.value?.slug || slug,
    };
    if (post.value?.id && !Number.isNaN(Number(post.value.id))) {
      queryParams.entityId = Number(post.value.id);
    }

    let verifyRes: any = await $fetch("/api/vault/verify", {
      query: queryParams,
    }).catch(() => null);

    if (!verifyRes?.proof && autoNotarizeIfMissing && post.value?.id && !Number.isNaN(Number(post.value.id))) {
      await $fetch("/api/vault/notarize", {
        method: "POST",
        body: {
          entityType: "blog",
          entityId: Number(post.value.id),
        },
      }).catch(() => null);

      verifyRes = await $fetch("/api/vault/verify", {
        query: queryParams,
      }).catch(() => null);
    }

    if (verifyRes?.proof) {
      vaultProof.value = verifyRes.proof;
      if (post.value && !post.value.vaultHash) {
        post.value.vaultHash = verifyRes.proof.vaultHash;
      }
      if (post.value && !post.value.vaultBlockNumber) {
        post.value.vaultBlockNumber = verifyRes.proof.blockNumber;
      }
    }
  } finally {
    isCheckingVault.value = false;
  }
}

async function copyFullVaultHash() {
  const hash = vaultProof.value?.vaultHash || post.value?.vaultHash;
  if (!hash || typeof navigator === "undefined") return;
  await navigator.clipboard.writeText(hash).catch(() => {});
  hashCopied.value = true;
  showNotification("📋 Hash SHA-256 dell'articolo copiato negli appunti!");
  setTimeout(() => {
    hashCopied.value = false;
  }, 2000);
}

const readTime = computed(() => {
  const text = post.value?.content || post.value?.description || "";
  if (!text) return 1;
  const plainText = text.replace(/<\/?[^>]+(>|$)/g, "");
  const words = plainText.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
});

const parsedContent = computed(() => {
  try {
    const contentVal = post.value?.content || post.value?.description || "";
    if (!contentVal) return "";

    let rawContent = contentVal.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    const codeBlocks: string[] = [];

    rawContent = rawContent.replace(
      /```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g,
      (_match: string, lang: string, code: string) => {
        const index = codeBlocks.length;
        const cleanLang = lang ? lang.trim().toLowerCase() : "";
        const languageClass = cleanLang ? `language-${cleanLang}` : "language-none";

        const languageLabel = cleanLang
          ? `<div class="dkp-code-header"><span>${cleanLang}</span><button class="dkp-copy-btn" data-code-id="code-block-${index}" title="Copia codice">📋</button></div>`
          : "";
        const escapedCode = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        codeBlocks.push(
          `<div class="dkp-code-wrapper not-prose">${languageLabel}<pre class="dkp-code-block ${languageClass}"><code id="code-block-${index}" class="${languageClass}">${escapedCode}</code></pre></div>`,
        );
        return `__DKP_CODE_BLOCK_${index}__`;
      },
    );

    let html = rawContent
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(/^\|(.+)\|$/gm, (match, p1) => {
      const cells = p1.split("|").map((c: string) => c.trim());
      if (cells.every((c: string) => /^:?-+:?$/.test(c))) return "";
      const rowHtml = cells.map((c: string) => `<td>${c}</td>`).join("");
      return `<tr>${rowHtml}</tr>`;
    });
    html = html.replace(/(<tr>.*?<\/tr>[\s\n\r]*)+/g, (match) => {
      const cleanRows = match.replace(/[\n\r]+/g, "");
      return `<div class="dkp-table-wrapper"><table class="dkp-table"><tbody>${cleanRows}</tbody></table></div>`;
    });

    html = html
      .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="dkp-img" loading="lazy" />')
      .replace(/@\[video\]\(([^)]+)\)/g, '<div class="dkp-video-wrapper"><iframe src="$1" frameborder="0" allowfullscreen></iframe></div>')
      .replace(/==(.*?)==/g, '<mark class="dkp-highlight">$1</mark>')
      .replace(/\+\+(.*?)\+\+/g, '<u class="dkp-underline">$1</u>')
      .replace(/`([^`\n]+)`/g, '<code class="dkp-inline-code">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/~~(.*?)~~/g, "<del>$1</del>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="dkp-link" target="_blank">$1</a>');

    html = html
      .replace(/^# (.*?)\r?$/gm, '<h1 class="dkp-h1">$1</h1>')
      .replace(/^## (.*?)\r?$/gm, '<h2 class="dkp-h2">$1</h2>')
      .replace(/^### (.*?)\r?$/gm, '<h3 class="dkp-h3">$1</h3>')
      .replace(/^&gt; (.*?)\r?$/gm, '<blockquote class="dkp-quote">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="dkp-hr" />');

    html = html.replace(/^( {2,}|\t+)- (.*?)\r?$/gm, '<ul class="dkp-sub-list"><li class="dkp-li-nested">$2</li></ul>');
    html = html.replace(/^( {2,}|\t+)[0-9]+\. (.*?)\r?$/gm, '<ol class="dkp-sub-list"><li class="dkp-li-nested dkp-li-num">$2</li></ol>');
    html = html.replace(/^-(?!\S) (.*?)\r?$/gm, '<ul><li class="dkp-li-main">$1</li></ul>');
    html = html.replace(/^[0-9]+\. (.*?)\r?$/gm, '<ol><li class="dkp-li-main">$1</li></ol>');
    html = html.replace(/<\/ul>\s*<ul>/g, "");
    html = html.replace(/<\/ol>\s*<ol>/g, "");
    html = html.replace(/<\/ul>\s*<ul class="dkp-sub-list">/g, "");
    html = html.replace(/<\/ol>\s*<ol class="dkp-sub-list">/g, "");

    let lines = html.split(/\r?\n/);
    let parsedHtml = "";

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let trimmed = line.trim();

      if (trimmed.includes("__DKP_CODE_BLOCK_")) {
        parsedHtml += line + "\n";
      } else if (
        /^<(h[1-6]|pre|div|table|ul|ol|blockquote|hr|li|img)/.test(trimmed) ||
        /^<\/(div|table|ul|ol|blockquote)>/.test(trimmed)
      ) {
        parsedHtml += line + "\n";
      } else if (trimmed === "") {
        parsedHtml += "<br />\n";
      } else {
        parsedHtml += line + (i < lines.length - 1 ? "<br />" : "");
      }
    }

    codeBlocks.forEach((block, index) => {
      parsedHtml = parsedHtml.replace(
        new RegExp(`__DKP_CODE_BLOCK_${index}__(?:<br \\/>)?`, "g"),
        () => block,
      );
    });

    return parsedHtml
      .replace(/(<\/h[1-6]>)<br \/>/g, "$1")
      .replace(/(<\/pre>)<br \/>/g, "$1")
      .replace(/(<\/div>)<br \/>/g, "$1");
  } catch (err) {
    console.error("Errore nel parsing:", err);
    return `<p class="text-red-400">Errore nella formattazione del contenuto.</p>`;
  }
});

const authorRank = computed<AuthorRank>(() => {
  try {
    const xp = post.value?.authorXp || 0;
    return getAuthorRank
      ? getAuthorRank(xp)
      : { color: "#10b981", badge: "🔰", level: 1, title: "Member" };
  } catch {
    return { color: "#10b981", badge: "🔰", level: 1, title: "Member" };
  }
});

const currentUrl = computed(() =>
  import.meta.client ? window.location.href : `https://devkernelpulse.org/blog/${slug}`
);

useHead({
  title: computed(() => `${post.value?.title || "Caricamento Articolo"} — DevKernelPulse v2.6`),
  meta: [
    {
      name: "description",
      content: computed(() => post.value?.excerpt || post.value?.description || post.value?.summary || "Approfondimento tecnico dall'ecosistema DKP v2.6-PURE-SQL.")
    }
  ]
});

const viewTracked = ref(false);

watch(
  () => post.value,
  (currentPost) => {
    if (currentPost && !viewTracked.value) {
      const targetIdentifier = currentPost.slug || slug || currentPost.id;
      incrementView(String(targetIdentifier));
      viewTracked.value = true;
    }
  },
  { immediate: true },
);

watch(
  () => post.value?.id,
  (newId) => {
    if (newId && import.meta.client) {
      loadOnChainBlogProof(true);
    }
  }
);

let prismTimer: ReturnType<typeof setTimeout> | undefined;
const applyPrism = () => {
  if (import.meta.client && $prism) {
    clearTimeout(prismTimer);
    prismTimer = setTimeout(() => {
      try {
        ($prism as PrismHighlighter).highlightAll();
      } catch (e) {
        console.warn("Prism highlight notice:", e);
      }
    }, 100);
  }
};

const showCopyFeedback = (btn: HTMLButtonElement) => {
  const originalText = btn.innerHTML;
  btn.innerHTML = "✅";
  btn.style.color = "#00dc82";
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.color = "";
  }, 2000);
};

const handleCopyClick = (event: MouseEvent) => {
  const target = event.target;
  const copyBtn = target instanceof Element ? (target.closest(".dkp-copy-btn") as HTMLButtonElement | null) : null;

  if (copyBtn) {
    const codeId = copyBtn.getAttribute("data-code-id");
    if (codeId) {
      const codeElement = document.getElementById(codeId);
      if (codeElement) {
        const textToCopy = codeElement.innerText || codeElement.textContent || "";
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(textToCopy).then(() => showCopyFeedback(copyBtn));
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = textToCopy;
          textArea.style.position = "fixed";
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand("copy");
            showCopyFeedback(copyBtn);
          } catch (err) {
            console.error("Copy fallback error:", err);
          }
          document.body.removeChild(textArea);
        }
      }
    }
  }
};

watch(parsedContent, async () => {
  await nextTick();
  applyPrism();
});

onMounted(() => {
  setTimeout(applyPrism, 200);
  document.addEventListener("click", handleCopyClick);
  if (post.value?.id || slug) {
    loadOnChainBlogProof(true);
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleCopyClick);
  clearTimeout(prismTimer);
  clearTimeout(toastTimer);
});

function handleLike() {
  if (post.value) {
    const targetIdentifier = post.value.slug || slug || post.value.id;
    likePost(String(targetIdentifier));
    post.value.likes = (post.value.likes || 0) + 1;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-10">
    <div
      v-if="toastMsg"
      role="status"
      class="fixed top-6 right-6 z-[10000] bg-[#041a13]/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs font-bold"
    >
      {{ toastMsg }}
    </div>

    <div class="max-w-4xl mx-auto flex flex-col gap-6">

      <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink
          to="/news"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all"
        >
          🌍 DKP Tech Feed
        </NuxtLink>

        <NuxtLink
          to="/nodes"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all"
        >
          💬 DKP Talks Hub
        </NuxtLink>

        <NuxtLink
          to="/tools"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all"
        >
          🛠️ Developer Tools
        </NuxtLink>

        <NuxtLink
          to="/blog"
          class="px-4 py-2 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          ✍️ DKP Editorial Hub
        </NuxtLink>
      </nav>

      <div v-if="pending" class="text-center py-20 text-emerald-400 font-mono bg-[#090d16] border border-slate-800 rounded-2xl">
        <span class="text-3xl animate-pulse inline-block mb-4">⚡</span>
        <p>Caricamento articolo dal Vault v2.6-PURE-SQL...</p>
      </div>

      <div v-else-if="error || !post" class="text-center py-20 text-red-400 bg-[#090d16] border border-slate-800 rounded-2xl">
        <h2 class="text-2xl font-bold mb-4">⚠️ Articolo non trovato</h2>
        <p class="text-slate-400 text-sm">L'articolo richiesto non esiste o è stato rimosso dal Vault.</p>
        <NuxtLink
          to="/blog"
          class="mt-6 inline-block text-emerald-400 hover:underline font-bold font-mono text-xs"
        >
          ← Torna al DKP Editorial Hub
        </NuxtLink>
      </div>

      <div v-else class="flex flex-col gap-8 relative">
        <article
          class="glass-panel p-6 sm:p-10 rounded-2xl border border-slate-800 bg-[#090d16] shadow-2xl relative overflow-hidden"
        >
          <!-- BREADCRUMB NAVBAR SEO-READY -->
          <div class="flex flex-col gap-4 mb-8 relative z-10 border-b border-slate-800 pb-4">
            <nav aria-label="Breadcrumb" class="w-full text-sm text-slate-400">
              <ol class="flex items-center gap-2 m-0 p-0 list-none font-medium flex-wrap">
                <li class="flex items-center">
                  <NuxtLink to="/blog" class="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <span class="text-xs">✍️</span> Editorial Hub
                  </NuxtLink>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-slate-600 font-bold">/</span>
                  <span class="text-sky-400 max-w-[140px] sm:max-w-[220px] truncate" :title="post.categoryName || post.category || 'Generale'">
                    {{ post.categoryName || post.category || "Generale" }}
                  </span>
                </li>
                <li v-if="post.subcategoryName || post.subCategory" class="flex items-center gap-2">
                  <span class="text-slate-600 font-bold">/</span>
                  <span class="text-sky-300 max-w-[140px] sm:max-w-[220px] truncate" :title="post.subcategoryName || post.subCategory">
                    {{ post.subcategoryName || post.subCategory }}
                  </span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-slate-600 font-bold">/</span>
                  <span class="text-slate-200 max-w-[160px] sm:max-w-[260px] truncate" :title="post.title" aria-current="page">
                    {{ post.title }}
                  </span>
                </li>
              </ol>
            </nav>

            <!-- Badges Categoria, Verifica & Blockchain Vault -->
            <div class="flex items-center gap-3 flex-wrap justify-start">
              <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                {{ post.categoryName || post.category || "Generale" }}
              </span>

              <span v-if="post.subcategoryName || post.subCategory" class="bg-sky-500/10 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                {{ post.subcategoryName || post.subCategory }}
              </span>

              <span v-if="post.isVerified" class="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                🛡️ DKP Verified v2.6
              </span>

              <VaultTrustBadge
                v-if="post.id"
                entity-type="blog"
                :post-id="Number(post.id)"
                :vault-hash="vaultProof?.vaultHash || post.vaultHash"
                :block-number="vaultProof?.blockNumber || post.vaultBlockNumber"
                @notarized="(h) => { if (post) post.vaultHash = h }"
              />
            </div>
          </div>

          <h1 class="text-3xl md:text-5xl font-black text-white mb-8 leading-tight relative z-10">
            {{ post.title }}
          </h1>

          <!-- Author Card -->
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#020420] border border-slate-800 mb-10 relative z-10 transition-colors"
            :style="{
              borderColor: `${authorRank.color}40`,
              boxShadow: `0 4px 20px ${authorRank.color}10`,
            }"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2"
                :style="{
                  background: `linear-gradient(135deg, ${authorRank.color}, #0f172a)`,
                  borderColor: authorRank.color,
                }"
              >
                {{ (post.authorName || "D")[0].toUpperCase() }}
              </div>

              <div>
                <div class="text-slate-200 font-bold flex items-center gap-2 flex-wrap">
                  {{ post.authorName || "DevKernelPulse Team" }}
                  <span
                    class="text-[0.65rem] px-2 py-0.5 rounded uppercase tracking-wider border font-bold flex items-center gap-1"
                    :style="{
                      backgroundColor: `${authorRank.color}15`,
                      color: authorRank.color,
                      borderColor: `${authorRank.color}40`,
                    }"
                  >
                    <span>{{ authorRank.badge }}</span> Lvl. {{ authorRank.level }} - {{ authorRank.title }}
                  </span>
                </div>

                <div class="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap font-mono">
                  <span>📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString("it-IT") : post.date || "Recente" }}</span>
                  <span>👁️ {{ post.views || 0 }} visualizzazioni</span>
                  <span>⏱️ {{ readTime }} min lettura</span>
                </div>
              </div>
            </div>
          </div>

          <p
            v-if="post.excerpt || post.summary"
            class="text-sky-400 font-semibold text-lg leading-relaxed mb-8 border-l-4 border-sky-400 pl-4 relative z-10"
          >
            {{ post.excerpt || post.summary }}
          </p>

          <ClientOnly>
            <div
              class="post-content prose prose-invert max-w-none text-slate-200 mb-12 dkp-preview-content relative z-10"
              v-html="parsedContent"
            ></div>

            <template #fallback>
              <div class="py-10 text-center text-slate-500 animate-pulse font-mono mb-12">
                ⏳ Formattazione Vault in corso...
              </div>
            </template>
          </ClientOnly>

          <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-10 relative z-10">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="bg-[#020420] text-sky-400 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono transition-colors hover:border-sky-500"
            >
              #{{ tag }}
            </span>
          </div>

          <!-- CERTIFICATO ON-CHAIN BLOCKCHAIN VAULT (UNIFICATO FORUM + BLOG) -->
          <div
            class="mt-8 bg-[#020420] border border-emerald-500/35 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.06)] z-10 mb-8 font-mono"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span class="text-lg">⛓️</span>
                <h3 class="text-emerald-400 font-black text-sm sm:text-base tracking-wide uppercase m-0">
                  Proof-of-Code On-Chain Vault v2.6
                </h3>
                <span
                  v-if="vaultProof"
                  class="text-[10px] px-2 py-0.5 rounded font-bold border"
                  :class="vaultProof.status === 'VERIFIED'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40'"
                >
                  {{ vaultProof.status === 'VERIFIED' ? '✅ SHA-256 VERIFIED' : '⚠️ MODIFIED POST-HASH' }}
                </span>
              </div>

              <div class="flex items-center gap-3">
                <span v-if="vaultProof?.blockNumber" class="text-xs text-sky-400 font-bold">
                  Block #{{ vaultProof.blockNumber }}
                </span>
                <NuxtLink
                  to="/nodes/n/blockchain-vault"
                  class="text-xs text-emerald-400 hover:underline no-underline font-bold"
                >
                  n/blockchain-vault →
                </NuxtLink>
              </div>
            </div>

            <div v-if="isCheckingVault" class="text-xs text-slate-400 py-2">
              ⚡ Verifica crittografica SHA-256 dell'articolo sul ledger in corso...
            </div>

            <div v-else class="flex flex-col gap-3 text-xs">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#090d16] border border-slate-800 rounded-lg p-3.5">
                <div class="min-w-0">
                  <div class="text-[10px] text-slate-500 uppercase">SHA-256 Editorial Content Proof Hash</div>
                  <div class="text-emerald-400 break-all select-all text-[11px] mt-1">
                    {{ vaultProof?.vaultHash || post.vaultHash || 'In attesa di notarizzazione...' }}
                  </div>
                </div>
                <button
                  type="button"
                  @click="copyFullVaultHash"
                  class="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 font-bold text-[11px] cursor-pointer"
                >
                  {{ hashCopied ? '✓ Copiato' : '📋 Copia Hash' }}
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div class="bg-[#090d16] border border-slate-800/80 rounded-lg p-2.5 truncate">
                  <span class="text-slate-500">Certificate:</span>
                  <span class="text-emerald-400 font-bold ml-1">{{ post.vaultCertificateId || `DKP-BLOG-${post.id}` }}</span>
                </div>
                <div class="bg-[#090d16] border border-slate-800/80 rounded-lg p-2.5 truncate">
                  <span class="text-slate-500">Network:</span>
                  <span class="text-sky-400 font-bold ml-1">{{ vaultProof?.chainNetwork || 'DKP-VAULT-MAINNET-v2.6' }}</span>
                </div>
                <div class="bg-[#090d16] border border-slate-800/80 rounded-lg p-2.5 truncate">
                  <span class="text-slate-500">Merkle Root:</span>
                  <span class="text-purple-400 ml-1">{{ vaultProof?.merkleRoot ? `${vaultProof.merkleRoot.slice(0, 16)}…` : 'Generazione...' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER KARMA / LIKE -->
          <div class="article-actions-footer bg-[#020420] border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 mb-6">
            <div class="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
              <button
                @click="handleLike"
                class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none px-6 py-3 rounded-lg font-bold text-lg cursor-pointer flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)] w-full sm:w-auto"
              >
                🔥 Accendi Kernel
                <span class="bg-[#020420] text-emerald-400 px-3 py-1 rounded text-sm shadow-inner">{{ post.likes || 0 }}</span>
              </button>
              <span class="text-slate-400 text-xs mt-1">Premi per premiare questo articolo con Karma!</span>
            </div>
          </div>

          <!-- SEZIONE CONDIVISIONE ARTICOLO -->
          <div class="share-horizontal-card bg-[#020420] border border-slate-800 rounded-xl p-6 relative z-10 mb-10 shadow-lg">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3 text-center md:text-left">
                <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl font-bold">
                  🚀
                </div>
                <div>
                  <h4 class="text-white font-extrabold text-base">Condividi articolo</h4>
                  <p class="text-slate-400 text-xs">Diffondi la conoscenza nell'ecosistema Dev</p>
                </div>
              </div>

              <div class="w-full md:w-auto flex justify-center">
                <SocialShare
                  :title="post?.title || 'DevKernelPulse Blog'"
                  :url="currentUrl"
                  :horizontal="true"
                />
              </div>
            </div>
          </div>

          <!-- WIDGET INTEGRATO NELLA PAGINA ARTICOLO -->
          <div class="mb-10 pt-4 border-t border-slate-800">
            <DkpNodesHomeWidget />
          </div>

          <!-- ARTICOLI CORRELATI -->
          <DkpRelatedPosts
            v-if="post && post.id"
            :current-post-id="String(post.id)"
            :category="post.categoryName || post.category || 'Generale'"
            :tags="post.tags || []"
          />
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  backdrop-filter: blur(12px);
}

.prose h1, .post-content h1 { @apply text-3xl md:text-4xl font-extrabold text-white mt-8 mb-4 border-b border-slate-800 pb-2; }
.prose h2, .post-content h2 { @apply text-2xl font-bold text-white mt-6 mb-3; }
.prose h3, .post-content h3 { @apply text-xl font-bold text-sky-400 mt-4 mb-2; }
.prose p, .post-content p { @apply text-slate-300 text-lg leading-relaxed mb-6; }
.prose blockquote, .post-content blockquote { @apply border-l-4 border-emerald-400 bg-emerald-500/10 p-4 my-6 text-slate-300 italic rounded-r-lg; }

.prose table, .post-content table { @apply w-full border-collapse my-6 bg-[#090d16] rounded-lg overflow-hidden border border-slate-800 text-left; }
.prose th, .post-content th { @apply bg-[#0d1322] text-emerald-400 font-bold p-3 border border-slate-800 text-xs uppercase tracking-wider; }
.prose td, .post-content td { @apply p-3 text-slate-300 border border-slate-800 text-sm; }

.prose code::before, .prose code::after { content: "" !important; }

:deep(.dkp-code-wrapper) {
  background: #0d1117;
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
  margin: 1.2rem 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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

:deep(.dkp-copy-btn) {
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s;
}
:deep(.dkp-copy-btn:hover) { color: #00dc82; }

:deep(.dkp-code-block) { padding: 1rem; margin: 0; overflow-x: auto; }

.prose pre code, .post-content pre code, :deep(.dkp-code-block code) {
  background-color: transparent !important;
  border: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-family: "Fira Code", "Courier New", Courier, monospace;
  font-size: 0.875rem !important;
  line-height: 1.7 !important;
  box-shadow: none !important;
}

.prose pre code .token, :deep(.dkp-code-block code .token) { background: transparent !important; }

:deep(.dkp-img) { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); display: block; }
:deep(.dkp-video-wrapper) { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); }
:deep(.dkp-video-wrapper iframe) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
:deep(.dkp-highlight) { background-color: rgba(0, 220, 130, 0.25); color: #f8fafc; padding: 0.1rem 0.3rem; border-radius: 4px; }
:deep(.dkp-underline) { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #38bdf8; text-decoration-thickness: 2px; }

.prose :not(pre) > code, .post-content :not(pre) > code, :deep(.dkp-inline-code) {
  background-color: rgba(30, 41, 59, 0.8) !important;
  color: #38bdf8 !important;
  padding: 0.2rem 0.4rem !important;
  border-radius: 0.375rem !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  font-weight: 500 !important;
}

:deep(.dkp-h1) { font-size: 1.8rem; font-weight: 900; color: #ffffff; margin-top: 1.2rem; margin-bottom: 0.6rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.3rem; }
:deep(.dkp-h2) { font-size: 1.4rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
:deep(.dkp-h3) { font-size: 1.1rem; font-weight: 700; color: #00dc82; margin-top: 0.8rem; margin-bottom: 0.4rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.8rem; color: #94a3b8; font-style: italic; margin: 0.8rem 0; background: rgba(0, 220, 130, 0.05); padding-top: 0.2rem; padding-bottom: 0.2rem; }
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px; }
:deep(.dkp-link:hover) { color: #00dc82; }
:deep(.dkp-hr) { border: none; height: 1px; background-color: #334155; margin: 1.5rem 0; }

:deep(.dkp-preview-content ul), :deep(.dkp-preview-content ol) { padding-left: 1.5rem; margin: 0.8rem 0; color: #cbd5e1; }
:deep(.dkp-preview-content ul) { list-style-type: none; }
:deep(.dkp-preview-content ol) { list-style-type: decimal; }
:deep(.dkp-li-main) { margin-bottom: 0.4rem; position: relative; }
:deep(ul > .dkp-li-main::before) { content: "○"; color: #38bdf8; position: absolute; left: -1.2rem; top: 0; font-weight: bold; }
:deep(.dkp-li-nested) { margin-left: 1.5rem; margin-bottom: 0.3rem; color: #94a3b8; position: relative; }
:deep(ul > .dkp-li-nested:not(.dkp-li-num)::before) { content: "▪"; color: #00dc82; position: absolute; left: -1.2rem; top: 0; }
</style>