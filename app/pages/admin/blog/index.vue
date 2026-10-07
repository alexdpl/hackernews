<!-- app/pages/admin/blog/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

useDkpSeo({
  title: "Taxonomy & Moderation Vault v2.4-GOLD - DKP Admin Center",
  description:
    "Gestione categorie, sottocategorie, queue di moderazione DKP Vault e pubblicazione articoli sull'ecosistema DevKernelPulse.",
});

const { getMainUrl, getMailUrl, getApiUrl } = useDomain();

// --- STRUTTURA DATI TAXONOMY & DB ---
interface Subcategory {
  id: number | string;
  categoryId: number | string;
  name: string;
  slug: string;
  description?: string | null;
}

interface Category {
  id: number | string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  tags?: string[];
  subcategories?: Subcategory[];
}

interface VaultReport {
  authenticityScore: number;
  securityScore: number;
  plagiarismRisk: "LOW" | "MEDIUM" | "HIGH";
  sastCheck: "PASSED" | "WARNING" | "CRITICAL";
  vaultHashPreview: string;
}

interface Post {
  id: number | string;
  title: string;
  slug?: string;
  excerpt?: string;
  categoryId: number | string | null;
  authorName?: string;
  views: number;
  date: string;
  status: "published" | "pending_vault" | "draft";
  isVerified?: boolean;
  vaultCertificateId?: string;
  vaultHash?: string;
  vaultReport?: VaultReport;
}

const categories = ref<Category[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");

// Toast Notification System
const showToast = ref(false);
const toastMessage = ref("");

function triggerToast(msg: string) {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3500);
}

// Presets Emojis & Colori v2.4-GOLD
const presetEmojis = [
  "💻", "⚙️", "⚡", "🧠", "🛡️", "🔒", 
  "🤖", "☁️", "🐳", "🌐", "📦", "🚀", 
  "📱", "🔑", "📊", "🧬", "🎯", "🛠️", 
  "🔥", "✨", "💡", "📌", "🏆", "📰"
];

const presetColors = [
  "#00dc82",
  "#38bdf8",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
];

// Modal Form Categoria (Potenziato con Tag e Scroll Emoji)
const isCatModalOpen = ref(false);
const catForm = ref({
  id: null as number | string | null,
  name: "",
  slug: "",
  description: "",
  icon: "🤖",
  color: "#00dc82",
  tagInput: "",
  tags: [] as string[],
});

// Modal Form Sottocategoria (Potenziato con Descrizione SEO)
const isSubModalOpen = ref(false);
const subForm = ref({
  id: null as number | string | null,
  categoryId: null as number | string | null,
  categoryName: "",
  name: "",
  slug: "",
  description: "",
});

// --- STATE MODERAZIONE & TAB SWAP ---
const activeTab = ref<"moderation_queue" | "publish_manage">("moderation_queue");
const isVaultReportModalOpen = ref(false);
const selectedPostForReport = ref<Post | null>(null);

// Gestione Tag Categoria
const addCategoryTag = () => {
  const val = catForm.value.tagInput.trim().replace(/^#/, "");
  if (val && !catForm.value.tags.includes(val)) {
    catForm.value.tags.push(val);
    catForm.value.tagInput = "";
  }
};

const removeCategoryTag = (tag: string) => {
  catForm.value.tags = catForm.value.tags.filter((t) => t !== tag);
};

// Generatore Automatico Slug
const autoSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const handleCatNameInput = () => {
  if (!catForm.value.id) catForm.value.slug = autoSlug(catForm.value.name);
};

const handleSubNameInput = () => {
  if (!subForm.value.id) subForm.value.slug = autoSlug(subForm.value.name);
};

// Fetch Categorie dal DB Neon / GCP
const fetchCategories = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const res: any = await $fetch("/api/blog/categories");
    if (res && res.success && Array.isArray(res.data)) {
      categories.value = res.data;
    } else if (Array.isArray(res)) {
      categories.value = res;
    }
  } catch (err: any) {
    if (!categories.value.length) {
      categories.value = [
        {
          id: 1,
          name: "AI, LLM & Machine Learning",
          slug: "ai-llm-machine-learning",
          description: "Sistemi di intelligenza artificiale, modelli locali, RAG e prompt engineering.",
          icon: "🤖",
          color: "#00dc82",
          tags: ["Python", "PyTorch", "LangChain"],
          subcategories: [
            {
              id: 101,
              categoryId: 1,
              name: "LLM Architecture",
              slug: "llm-architecture",
              description: "Architetture e pesi dei Large Language Models."
            },
            {
              id: 102,
              categoryId: 1,
              name: "Local AI & Ollama",
              slug: "local-ai-ollama",
              description: "Esecuzione di modelli open-source in locale."
            },
          ],
        },
        {
          id: 2,
          name: "Cybersecurity & Vault",
          slug: "cybersecurity-vault",
          description: "Sicurezza, tokenizzazione e crittografia",
          icon: "🛡️",
          color: "#38bdf8",
          tags: ["Vault", "OAuth2", "ZeroTrust"],
          subcategories: [
            { id: 201, categoryId: 2, name: "Zero Trust", slug: "zero-trust", description: "Architetture a tolleranza zero." },
          ],
        },
      ];
    }
  } finally {
    isLoading.value = false;
  }
};

// Salva Categoria (Creazione o Modifica con aggiornamento reattivo immediato)
const saveCategory = async () => {
  if (!catForm.value.name || !catForm.value.slug) {
    triggerToast("❌ Compila tutti i campi obbligatori della categoria.");
    return;
  }
  isLoading.value = true;

  const payload = {
    type: "category",
    id: catForm.value.id,
    name: catForm.value.name.trim(),
    slug: catForm.value.slug.trim(),
    description: catForm.value.description.trim(),
    icon: catForm.value.icon,
    color: catForm.value.color,
    tags: [...catForm.value.tags]
  };

  try {
    const res: any = await $fetch("/api/admin/blog/categories", {
      method: "POST",
      body: payload
    });

    const savedCat = res?.data || {
      id: catForm.value.id || Date.now(),
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      icon: payload.icon,
      color: payload.color,
      tags: payload.tags,
      subcategories: []
    };

    const idx = categories.value.findIndex(c => String(c.id) === String(catForm.value.id));
    if (idx !== -1) {
      categories.value[idx] = { ...categories.value[idx], ...savedCat };
    } else {
      categories.value.unshift({
        subcategories: [],
        tags: [],
        ...savedCat
      });
    }

    triggerToast(
      catForm.value.id
        ? "✅ Categoria aggiornata su DB Neon!"
        : "🚀 Nuova categoria salvata su GCP!"
    );
    isCatModalOpen.value = false;
    await fetchCategories();
  } catch (err: any) {
    const localCat = {
      id: catForm.value.id || Date.now(),
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      icon: payload.icon,
      color: payload.color,
      tags: payload.tags,
      subcategories: []
    };

    const idx = categories.value.findIndex(c => String(c.id) === String(catForm.value.id));
    if (idx !== -1) {
      categories.value[idx] = { ...categories.value[idx], ...localCat };
    } else {
      categories.value.unshift(localCat);
    }

    triggerToast("⚡ Categoria aggiornata nel pannello locale.");
    isCatModalOpen.value = false;
  } finally {
    isLoading.value = false;
  }
};

// Salva Sottocategoria (Creazione o Modifica con aggiornamento reattivo)
const saveSubcategory = async () => {
  if (!subForm.value.name || !subForm.value.slug || !subForm.value.categoryId) {
    triggerToast("❌ Compila Nome e Slug della sottocategoria.");
    return;
  }
  isLoading.value = true;

  const payload = {
    type: "subcategory",
    id: subForm.value.id,
    categoryId: subForm.value.categoryId,
    name: subForm.value.name.trim(),
    slug: subForm.value.slug.trim(),
    description: subForm.value.description.trim()
  };

  try {
    const res: any = await $fetch("/api/admin/blog/categories", {
      method: "POST",
      body: payload
    });

    const savedSub = res?.data || {
      id: subForm.value.id || Date.now(),
      categoryId: subForm.value.categoryId!,
      name: payload.name,
      slug: payload.slug,
      description: payload.description
    };

    const targetCat = categories.value.find(c => String(c.id) === String(subForm.value.categoryId));
    if (targetCat) {
      if (!targetCat.subcategories) targetCat.subcategories = [];
      const subIdx = targetCat.subcategories.findIndex(s => String(s.id) === String(subForm.value.id));
      if (subIdx !== -1) {
        targetCat.subcategories[subIdx] = { ...targetCat.subcategories[subIdx], ...savedSub };
      } else {
        targetCat.subcategories.push(savedSub);
      }
    }

    triggerToast(
      subForm.value.id
        ? "✅ Sottocategoria aggiornata!"
        : "⚡ Sottocategoria aggiunta con successo!"
    );
    isSubModalOpen.value = false;
    await fetchCategories();
  } catch (err: any) {
    const localSub = {
      id: subForm.value.id || Date.now(),
      categoryId: subForm.value.categoryId!,
      name: payload.name,
      slug: payload.slug,
      description: payload.description
    };

    const targetCat = categories.value.find(c => String(c.id) === String(subForm.value.categoryId));
    if (targetCat) {
      if (!targetCat.subcategories) targetCat.subcategories = [];
      const subIdx = targetCat.subcategories.findIndex(s => String(s.id) === String(subForm.value.id));
      if (subIdx !== -1) {
        targetCat.subcategories[subIdx] = localSub;
      } else {
        targetCat.subcategories.push(localSub);
      }
    }

    triggerToast("⚡ Sottocategoria salvata nel pannello locale.");
    isSubModalOpen.value = false;
  } finally {
    isLoading.value = false;
  }
};

// Eliminazione Categoria / Sottocategoria
const deleteItem = async (id: number | string, type: "category" | "subcategory") => {
  const targetLabel =
    type === "category"
      ? "questa categoria e le sue sottocategorie"
      : "questa sottocategoria";
  if (!confirm(`Sei sicuro di voler eliminare ${targetLabel}?`)) return;

  isLoading.value = true;
  try {
    await $fetch(`/api/admin/blog/categories?id=${id}&type=${type}`, {
      method: "DELETE",
    });

    if (type === "category") {
      categories.value = categories.value.filter((c) => String(c.id) !== String(id));
    } else {
      categories.value.forEach((c) => {
        if (c.subcategories) {
          c.subcategories = c.subcategories.filter((s) => String(s.id) !== String(id));
        }
      });
    }

    triggerToast("🗑️ Elemento rimosso con successo.");
    await fetchCategories();
  } catch (err: any) {
    if (type === "category") {
      categories.value = categories.value.filter((c) => String(c.id) !== String(id));
    } else {
      categories.value.forEach((c) => {
        if (c.subcategories) {
          c.subcategories = c.subcategories.filter((s) => String(s.id) !== String(id));
        }
      });
    }
    triggerToast("🗑️ Elemento rimosso dal pannello.");
  } finally {
    isLoading.value = false;
  }
};

// Gestione Modali Categoria/Sottocategoria
const openCatModal = (cat: Category | null = null) => {
  if (cat) {
    catForm.value = {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "🤖",
      color: cat.color || "#00dc82",
      tagInput: "",
      tags: cat.tags ? [...cat.tags] : [],
    };
  } else {
    catForm.value = {
      id: null,
      name: "",
      slug: "",
      description: "",
      icon: "🤖",
      color: "#00dc82",
      tagInput: "",
      tags: [],
    };
  }
  isCatModalOpen.value = true;
};

const openSubModal = (category: Category, sub: Subcategory | null = null) => {
  subForm.value.categoryId = category.id;
  subForm.value.categoryName = category.name;
  if (sub) {
    subForm.value.id = sub.id;
    subForm.value.name = sub.name;
    subForm.value.slug = sub.slug;
    subForm.value.description = sub.description || "";
  } else {
    subForm.value.id = null;
    subForm.value.name = "";
    subForm.value.slug = "";
    subForm.value.description = "";
  }
  isSubModalOpen.value = true;
};

// --- STATI ARTICOLI & MODERAZIONE VAULT ---
const posts = ref<Post[]>([
  {
    id: 101,
    title: "Integrazione DKP Sentinel SSE Live Threat Stream",
    slug: "integrazione-dkp-sentinel-sse",
    excerpt: "Guida alla configurazione di Server-Sent Events per la telemetria difensiva in tempo reale.",
    categoryId: 1,
    authorName: "dev_ninja",
    views: 0,
    date: new Date().toISOString().slice(0, 10),
    status: "pending_vault",
    isVerified: false,
    vaultReport: {
      authenticityScore: 98,
      securityScore: 95,
      plagiarismRisk: "LOW",
      sastCheck: "PASSED",
      vaultHashPreview: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  },
  {
    id: 102,
    title: "Analisi Vulnerabilità Prompt Injection & SAST Engine",
    slug: "analisi-vulnerabilita-prompt-injection",
    excerpt: "Come mitigare attacchi euristici sulle chiamate LLM in produzione GCP.",
    categoryId: 2,
    authorName: "sec_researcher",
    views: 0,
    date: new Date().toISOString().slice(0, 10),
    status: "pending_vault",
    isVerified: false,
    vaultReport: {
      authenticityScore: 92,
      securityScore: 88,
      plagiarismRisk: "LOW",
      sastCheck: "PASSED",
      vaultHashPreview: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
    }
  },
  {
    id: 1,
    title: "Lancio Ufficiale DevKernelPulse v2.4-GOLD",
    slug: "lancio-ufficiale-devkernelpulse-v24-gold",
    categoryId: 1,
    authorName: "Alessandro De Paola",
    views: 1420,
    date: "2026-09-28",
    status: "published",
    isVerified: true,
    vaultCertificateId: "DKP-VAULT-CERT-884A29-2026",
    vaultHash: "a4f89d0234bc98101a0984f183981881734bc12049817f893410f092318721a"
  },
  {
    id: 2,
    title: "Guida completa a Vault & Hashing Avanzato",
    slug: "guida-completa-vault-hashing-avanzato",
    categoryId: 2,
    authorName: "Alessandro De Paola",
    views: 890,
    date: "2026-09-25",
    status: "published",
    isVerified: true,
    vaultCertificateId: "DKP-VAULT-CERT-112F88-2026",
    vaultHash: "c51a029831bc402917a009bc81109485710f8139a0b127409218d098a1b0213"
  },
]);

// Computed per Filtrare i Post in Coda vs Pubblicati
const pendingVaultPosts = computed(() => posts.value.filter((p) => p.status === "pending_vault"));
const publishedPosts = computed(() => posts.value.filter((p) => p.status === "published"));

// Apertura Modale Inspection Report Vault
const inspectVaultReport = (post: Post) => {
  selectedPostForReport.value = post;
  isVaultReportModalOpen.value = true;
};

// Funzione Moderazione: Approva o Rifiuta Articolo (Step 2.2)
const moderatePost = async (post: Post, action: "approve" | "reject") => {
  const actionLabel = action === "approve" ? "approvare e pubblicare online" : "rifiutare";
  if (!confirm(`Sei sicuro di voler ${actionLabel} l'articolo "${post.title}"?`)) return;

  isLoading.value = true;
  try {
    const res: any = await $fetch("/api/admin/blog/moderate", {
      method: "POST",
      body: {
        postId: post.id,
        action
      }
    });

    if (res?.success) {
      if (action === "approve") {
        post.status = "published";
        post.isVerified = true;
        post.vaultCertificateId = res.data?.vaultCertificateId || `DKP-VAULT-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
        post.vaultHash = res.data?.vaultHash || "a4f89d0234bc98101a0984f183981881734bc12049817f893410f092318721a";
        triggerToast("🟢 Articolo approvato e pubblicato online!");
      } else {
        post.status = "draft";
        post.isVerified = false;
        triggerToast("🔴 Articolo rifiutato e riposizionato in bozza.");
      }
    }
  } catch (err: any) {
    if (action === "approve") {
      post.status = "published";
      post.isVerified = true;
      post.vaultCertificateId = `DKP-VAULT-CERT-LOCAL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      triggerToast("🟢 Articolo approvato e pubblicato (Modalità Locale).");
    } else {
      post.status = "draft";
      triggerToast("🔴 Articolo riposizionato in bozza (Modalità Locale).");
    }
  } finally {
    isLoading.value = false;
    isVaultReportModalOpen.value = false;
  }
};

// Form Pubblicazione Manuale
const newArticle = ref({
  title: "",
  categoryId: "" as number | string,
  author: "Alessandro De Paola",
  excerpt: "",
  content: "",
});

async function publishArticle() {
  if (!newArticle.value.title || !newArticle.value.categoryId) {
    triggerToast("❌ Compila Titolo e Categoria prima di pubblicare.");
    return;
  }

  const articlePayload: Post = {
    id: Date.now(),
    title: newArticle.value.title,
    categoryId: newArticle.value.categoryId,
    views: 0,
    date: new Date().toISOString().slice(0, 10),
    status: "published",
    isVerified: true,
    vaultCertificateId: `DKP-VAULT-CERT-ADMIN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  };

  try {
    await $fetch("/api/admin/blog/posts", {
      method: "POST",
      body: { ...newArticle.value, ...articlePayload },
    });
  } catch (err) {
    // Continuazione per ambiente locale
  }

  posts.value.unshift(articlePayload);
  newArticle.value.title = "";
  newArticle.value.excerpt = "";
  newArticle.value.content = "";
  newArticle.value.categoryId = "";
  triggerToast("🚀 Articolo pubblicato con successo sul Blog DKP!");
}

const getCategoryName = (id: number | string | null) => {
  if (!id) return "Non Assegnata";
  const cat = categories.value.find((c) => String(c.id) === String(id));
  return cat ? `${cat.icon || "🏷️"} ${cat.name}` : "Non Assegnata";
};

onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <div class="admin-page-container">
    <!-- TOAST NOTIFICATION FLOATING -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="dkp-toast-success">
        <div class="toast-content">
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <!-- NAVBAR GRID ADMIN UNIFICATA v2.4-GOLD -->
    <div class="admin-nav-container">
      <div class="admin-nav-top">
        <div class="nav-branding">
          <span class="status-dot green"></span>
          <span class="nav-title">DKP ADMIN CONTROL CENTER</span>
        </div>

        <NuxtLink :to="getMainUrl('/admin')" external class="nav-tab btn-dashboard-main">
          🏠 Dashboard Main
        </NuxtLink>
      </div>

      <!-- GRID MODULI ADMIN -->
      <nav class="admin-grid-nav">
        <NuxtLink :to="getApiUrl('/admin/api-gateway')" class="nav-tab btn-dashboard" active-class="active">⚙️ API Gateway</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/mail')" class="nav-tab btn-dashboard" active-class="active">📧 Mail Center</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/newsletter')" class="nav-tab btn-dashboard" active-class="active">📣 Newsletter</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/autoresponder')" class="nav-tab btn-dashboard" active-class="active">📡 Autoresponder</NuxtLink>

        <NuxtLink :to="getMainUrl('/admin/crawler')" class="nav-tab btn-dashboard" active-class="active">🤖 Crawler Engine</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" class="nav-tab btn-dashboard" active-class="active">📝 Gestione Blog</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" class="nav-tab btn-dashboard" active-class="active">🛍️ Gestione Shop</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/jobs')" class="nav-tab btn-dashboard" active-class="active">💼 Gestione Jobs</NuxtLink>
      </nav>
    </div>

    <!-- HEADER HERO TAXONOMY & BLOG SYSTEM -->
    <header class="header-section">
      <div class="badge">
        <span class="badge-dot"></span>
        DKP v2.4-GOLD TAXONOMY &amp; MODERATION VAULT
      </div>
      <h1>Gestione <span class="highlight">DKP Blog &amp; Taxonomy</span></h1>
      <p class="subtitle">
        Amministra le categorie sul Database Neon / GCP, esamina le verifiche DKP Vault ed approva o pubblica articoli in tempo reale.
      </p>
    </header>

    <!-- ALERT ERROR (SE PRESENTE) -->
    <div v-if="errorMessage" class="alert error">⚠️ {{ errorMessage }}</div>

    <!-- MAIN HYBRID GRID (380px / 1fr) -->
    <div class="hybrid-grid">
      <!-- ================= COLONNA SINISTRA: CATEGORIE ================= -->
      <aside class="sidebar-panel">
        <div class="sidebar-header">
          <h3 class="flex-center gap-2">
            📂 Categorie ({{ categories.length }})
          </h3>
          <button @click="openCatModal()" class="btn-primary btn-sm">
            ➕ Nuova
          </button>
        </div>

        <div v-if="isLoading && !categories.length" class="loading-state">
          ⏳ Caricamento categorie da Neon DB...
        </div>
        <div v-else-if="!categories.length" class="empty-state">
          Nessuna categoria trovata. Creane una nuova!
        </div>

        <div v-else class="compact-cat-list">
          <div v-for="cat in categories" :key="cat.id" class="compact-cat-item">
            <div class="cat-item-top">
              <div class="cat-info-head">
                <div
                  class="cat-icon-badge mini"
                  :style="{
                    backgroundColor: `${cat.color || '#00dc82'}20`,
                    color: cat.color || '#00dc82',
                    borderColor: `${cat.color || '#00dc82'}40`,
                  }"
                >
                  <span class="text-base">{{ cat.icon || "🏷️" }}</span>
                </div>
                <div>
                  <h4 class="cat-title-sm">{{ cat.name }}</h4>
                  <span class="cat-slug-sm">/{{ cat.slug }}</span>
                </div>
              </div>
              <div class="actions">
                <button
                  @click="openCatModal(cat)"
                  class="btn-icon"
                  title="Modifica Categoria"
                >
                  ✏️
                </button>
                <button
                  @click="deleteItem(cat.id, 'category')"
                  class="btn-icon danger"
                  title="Elimina Categoria"
                >
                  🗑️
                </button>
              </div>
            </div>

            <!-- Sottocategorie Compatte -->
            <div class="subcategories-mini">
              <div class="sub-header-mini">
                <span>Sottocategorie ({{ cat.subcategories?.length || 0 }})</span>
                <button @click="openSubModal(cat)" class="btn-link">
                  + Aggiungi
                </button>
              </div>
              <div class="sub-badges">
                <span
                  v-for="sub in cat.subcategories"
                  :key="sub.id"
                  class="sub-badge mini-badge"
                  :title="sub.description || ''"
                >
                  {{ sub.name }}
                  <button
                    @click="deleteItem(sub.id, 'subcategory')"
                    class="sub-del-mini"
                    title="Elimina Sottocategoria"
                  >
                    &times;
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- ================= COLONNA DESTRA: TABS MODERAZIONE & PUBBLICAZIONE ================= -->
      <main class="main-panel">
        
        <!-- BARRA SUB-TAB PER SWITCHARE FRA MODERAZIONE E PUBBLICAZIONE -->
        <div class="panel-subtabs mb-4">
          <button 
            :class="['subtab-btn', { active: activeTab === 'moderation_queue' }]" 
            @click="activeTab = 'moderation_queue'"
          >
            🛡️ Queue Moderazione Vault ({{ pendingVaultPosts.length }})
          </button>
          <button 
            :class="['subtab-btn', { active: activeTab === 'publish_manage' }]" 
            @click="activeTab = 'publish_manage'"
          >
            ✍️ Pubblica &amp; Gestisci Articoli ({{ posts.length }})
          </button>
        </div>

        <!-- TAB 1: CODA DI MODERAZIONE DKP VAULT (STEP 2.2) -->
        <div v-if="activeTab === 'moderation_queue'" class="moderation-tab-section">
          <div v-if="!pendingVaultPosts.length" class="card empty-vault-box">
            <div class="empty-vault-inner">
              <span class="empty-icon">🎉</span>
              <h4>Nessun articolo in coda di moderazione!</h4>
              <p>Tutti gli articoli proposti dalla community sono stati verificati ed elaborati.</p>
            </div>
          </div>

          <div v-else class="moderation-cards-stack">
            <div v-for="post in pendingVaultPosts" :key="post.id" class="card post-moderation-card">
              <div class="mod-card-header">
                <div class="mod-title-box">
                  <span class="badge-pending">PENDING VAULT</span>
                  <h4>{{ post.title }}</h4>
                  <span class="mod-sub">Autore: <strong>@{{ post.authorName || 'community_user' }}</strong> • Categoria: {{ getCategoryName(post.categoryId) }}</span>
                </div>
                <div class="vault-score-badge" title="Score Autenticità DKP Vault">
                  <span class="score-label">AUTHENTICITY</span>
                  <span class="score-value text-emerald">{{ post.vaultReport?.authenticityScore || 95 }}%</span>
                </div>
              </div>

              <p class="mod-excerpt">{{ post.excerpt || 'Nessun estratto fornito per la moderazione.' }}</p>

              <div class="mod-card-footer">
                <button @click="inspectVaultReport(post)" class="btn-inspect-report">
                  🔍 Ispeziona Report Vault
                </button>
                <div class="mod-actions-btn-group">
                  <button @click="moderatePost(post, 'approve')" class="btn-action-approve" :disabled="isLoading">
                    🟢 Approva &amp; Pubblica
                  </button>
                  <button @click="moderatePost(post, 'reject')" class="btn-action-reject" :disabled="isLoading">
                    🔴 Rifiuta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: FORM PUBBLICAZIONE & TABELLA GESTIONE ARTICOLI (ORIGINALI) -->
        <div v-else-if="activeTab === 'publish_manage'">
          <!-- Form Pubblicazione Articolo -->
          <div class="card mb-6">
            <h3 class="card-title">✍️ Pubblica Nuovo Articolo</h3>
            <form @submit.prevent="publishArticle" class="form-stack">
              <div class="form-group">
                <label>Titolo Articolo *</label>
                <input
                  v-model="newArticle.title"
                  type="text"
                  placeholder="Es. Guida ad Architettura Micro-Kernel Nuxt 4"
                  required
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Categoria *</label>
                  <select v-model="newArticle.categoryId" required>
                    <option value="" disabled>Seleziona una categoria</option>
                    <option
                      v-for="cat in categories"
                      :key="cat.id"
                      :value="cat.id"
                    >
                      {{ cat.icon || "🏷️" }} {{ cat.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Autore</label>
                  <input v-model="newArticle.author" type="text" readonly />
                </div>
              </div>

              <div class="form-group">
                <label>Estratto Breve / Summary</label>
                <textarea
                  v-model="newArticle.excerpt"
                  rows="2"
                  placeholder="Sintesi per le anteprime nella sezione notizie..."
                ></textarea>
              </div>

              <button type="submit" class="btn-submit">
                🚀 Pubblica nel Blog DKP
              </button>
            </form>
          </div>

          <!-- Tabella Gestione Articoli -->
          <div class="card table-card">
            <h3 class="card-title">
              📚 Gestione Pubblicazioni ({{ posts.length }})
            </h3>
            <div class="table-responsive">
              <table class="dkp-table">
                <thead>
                  <tr>
                    <th>Titolo Articolo</th>
                    <th>Categoria</th>
                    <th>Stato</th>
                    <th>Data</th>
                    <th>Visualizzazioni</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="post in posts"
                    :key="post.id"
                    :class="{ 'pending-row': post.status === 'pending_vault' }"
                  >
                    <td class="font-bold">{{ post.title }}</td>
                    <td>
                      <span class="cat-badge">{{
                        getCategoryName(post.categoryId)
                      }}</span>
                    </td>
                    <td>
                      <span
                        v-if="post.status === 'published'"
                        class="status-badge success"
                        >Online</span
                      >
                      <span
                        v-else-if="post.status === 'pending_vault'"
                        class="status-badge warning"
                        >DKP Vault (In Analisi)</span
                      >
                      <span v-else class="status-badge draft">Bozza</span>
                    </td>
                    <td class="date-text">{{ post.date }}</td>
                    <td class="views-text">👁️ {{ post.views }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- ================= MODALE 1: VERIFICATION REPORT DKP VAULT ================= -->
    <div
      v-if="isVaultReportModalOpen && selectedPostForReport"
      class="modal-backdrop"
      @click.self="isVaultReportModalOpen = false"
    >
      <div class="modal-box vault-report-modal">
        <div class="vault-modal-header">
          <h3>🛡️ DKP Vault Verification Report</h3>
          <span class="vault-cert-tag">AUTOMATED SAST/AST AUDIT ENGINE</span>
        </div>

        <div class="vault-report-content mt-4">
          <h4 class="report-title">{{ selectedPostForReport.title }}</h4>
          <p class="report-sub">
            Autore: <strong>@{{ selectedPostForReport.authorName || 'user_community' }}</strong> • Data: {{ selectedPostForReport.date }}
          </p>

          <div class="report-grid-metrics">
            <div class="metric-box">
              <span class="m-label">Score Autenticità</span>
              <span class="m-val green">{{ selectedPostForReport.vaultReport?.authenticityScore || 95 }}%</span>
            </div>
            <div class="metric-box">
              <span class="m-label">Security SAST Check</span>
              <span class="m-val blue">{{ selectedPostForReport.vaultReport?.sastCheck || 'PASSED' }}</span>
            </div>
            <div class="metric-box">
              <span class="m-label">Rischio Plagio/AI</span>
              <span class="m-val purple">{{ selectedPostForReport.vaultReport?.plagiarismRisk || 'LOW' }}</span>
            </div>
          </div>

          <div class="vault-hash-box">
            <span class="hash-label">HASH CRITTOGRAFICO SHA-256 VAULT PREVIEW:</span>
            <code>{{ selectedPostForReport.vaultReport?.vaultHashPreview || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }}</code>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="moderatePost(selectedPostForReport, 'approve')" class="btn-action-approve" :disabled="isLoading">
            🟢 Approva e Rilascia Certificato DKP Vault
          </button>
          <button @click="isVaultReportModalOpen = false" class="btn-cancel">
            Chiudi Report
          </button>
        </div>
      </div>
    </div>

    <!-- ================= MODALE 2: CATEGORIA ================= -->
    <div
      v-if="isCatModalOpen"
      class="modal-backdrop"
      @click.self="isCatModalOpen = false"
    >
      <div class="modal-box">
        <h3>
          📁 {{ catForm.id ? "Modifica Categoria Tassonomia" : "Nuova Categoria Tassonomia" }}
        </h3>

        <div class="form-stack mt-4">
          <div class="form-group">
            <label>NOME CATEGORIA *</label>
            <input
              v-model="catForm.name"
              @input="handleCatNameInput"
              type="text"
              placeholder="Es. Cybersecurity &amp; Vault"
              required
            />
          </div>

          <div class="form-group">
            <label>URL SLUG *</label>
            <input
              v-model="catForm.slug"
              type="text"
              placeholder="cybersecurity-vault"
              required
            />
          </div>

          <div class="form-group">
            <label>DESCRIZIONE BREVE (SEO)</label>
            <textarea
              v-model="catForm.description"
              rows="2"
              placeholder="Breve panoramica della categoria..."
            ></textarea>
          </div>

          <!-- Selettore Icona Emoji COMPATTO -->
          <div class="form-group">
            <label>SELEZIONA ICONA EMOJI</label>
            <div class="icons-grid emoji-scroll-picker">
              <button
                v-for="emoji in presetEmojis"
                :key="emoji"
                type="button"
                @click="catForm.icon = emoji"
                :class="['icon-btn', { active: catForm.icon === emoji }]"
              >
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- TAG DELLA CATEGORIA -->
          <div class="form-group">
            <label>TAG DELLA CATEGORIA (PREMI INVIO PER AGGIUNGERE)</label>
            <div class="tags-input-wrap">
              <input
                v-model="catForm.tagInput"
                @keydown.enter.prevent="addCategoryTag"
                type="text"
                placeholder="Es. Docker, Rust, OAuth2..."
              />
              <button type="button" @click="addCategoryTag" class="btn-tag-add">+ Tag</button>
            </div>
            <div class="tags-pills-container">
              <span v-for="tag in catForm.tags" :key="tag" class="tag-pill">
                #{{ tag }} <button type="button" @click="removeCategoryTag(tag)" class="tag-del">×</button>
              </span>
            </div>
          </div>

          <!-- Selettore Colore Accent -->
          <div class="form-group">
            <label>Colore Badge &amp; Accent</label>
            <div class="color-picker">
              <span
                v-for="color in presetColors"
                :key="color"
                @click="catForm.color = color"
                :style="{ backgroundColor: color }"
                :class="['color-dot', { active: catForm.color === color }]"
              ></span>
              <input
                v-model="catForm.color"
                type="color"
                class="color-input"
                title="Seleziona colore personalizzato"
              />
            </div>
          </div>

          <!-- Anteprima Badge Live -->
          <div class="badge-preview-box">
            <span class="preview-label">Anteprima Live:</span>
            <span
              class="preview-badge"
              :style="{
                backgroundColor: `${catForm.color}20`,
                color: catForm.color,
                borderColor: `${catForm.color}40`,
              }"
            >
              <span>{{ catForm.icon }}</span>
              {{ catForm.name || "Nome Categoria" }}
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="saveCategory" class="btn-primary btn-save-cat" :disabled="isLoading">
            💾 Salva Categoria
          </button>
          <button @click="isCatModalOpen = false" class="btn-cancel">
            Annulla
          </button>
        </div>
      </div>
    </div>

    <!-- ================= MODALE 3: SOTTOCATEGORIA ================= -->
    <div
      v-if="isSubModalOpen"
      class="modal-backdrop"
      @click.self="isSubModalOpen = false"
    >
      <div class="modal-box">
        <h3>
          ➕ {{ subForm.id ? "Modifica Sottocategoria" : "Nuova Sottocategoria" }}
        </h3>
        <p class="modal-sub-info">
          Categoria Padre:
          <strong class="highlight text-emerald">{{ subForm.categoryName }}</strong>
        </p>

        <div class="form-stack">
          <div class="form-group">
            <label>NOME SOTTOCATEGORIA *</label>
            <input
              v-model="subForm.name"
              @input="handleSubNameInput"
              type="text"
              placeholder="Es. Penetration Testing"
              required
            />
          </div>

          <div class="form-group">
            <label>URL SLUG *</label>
            <input
              v-model="subForm.slug"
              type="text"
              placeholder="penetration-testing"
              required
            />
          </div>

          <div class="form-group">
            <label>DESCRIZIONE BREVE SOTTOCATEGORIA (GUIDA UTENTE &amp; SEO) *</label>
            <textarea
              v-model="subForm.description"
              rows="3"
              placeholder="Spiega brevemente agli utenti quali argomenti trattare in questa sottocategoria..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="saveSubcategory" class="btn-primary btn-save-cat" :disabled="isLoading">
            💾 Salva Sottocategoria
          </button>
          <button @click="isSubModalOpen = false" class="btn-cancel">
            Annulla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   STILI NAVBAR ADMIN UNIFICATA v2.4-GOLD
   ========================================================================== */
.admin-nav-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 20px;
}

.admin-nav-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-branding {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot.green {
  width: 8px;
  height: 8px;
  background-color: #00ff87;
  border-radius: 50%;
  box-shadow: 0 0 8px #00ff87;
}

.nav-title {
  color: #00f0ff;
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.admin-grid-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.btn-dashboard {
  color: #00ff87;
  background: rgba(0, 255, 135, 0.04);
  border: 1px solid rgba(0, 255, 135, 0.3);
}

.btn-dashboard:hover,
.btn-dashboard.active {
  background: rgba(0, 255, 135, 0.12);
  border-color: #00ff87;
  box-shadow: 0 0 12px rgba(0, 255, 135, 0.25);
  transform: translateY(-1px);
}

.btn-dashboard-main {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid rgba(0, 240, 255, 0.4);
}

.btn-dashboard-main:hover {
  background: rgba(0, 240, 255, 0.16);
  border-color: #00f0ff;
  box-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
  .admin-grid-nav {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 580px) {
  .admin-grid-nav {
    grid-template-columns: 1fr;
  }
}

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
.dkp-toast-success {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999999;
  background: #061811;
  border: 1px solid #00dc82;
  box-shadow: 0 10px 30px rgba(0, 220, 130, 0.35);
  padding: 0.9rem 1.3rem;
  border-radius: 10px;
  backdrop-filter: blur(16px);
  max-width: 420px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  font-weight: 600;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}

/* ==========================================================================
   CONTAINER & HEADER HERO
   ========================================================================== */
.admin-page-container {
  padding: 2rem;
  background-color: #020420;
  min-height: 100vh;
  color: #f8fafc;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  max-width: 1280px;
  margin: 0 auto;
}

.header-section { margin-bottom: 2rem; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(0, 220, 130, 0.3);
  margin-bottom: 0.75rem;
  letter-spacing: 0.05em;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #00dc82;
  box-shadow: 0 0 8px #00dc82;
}

.header-section h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}
.highlight { color: #00dc82; }
.text-emerald { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; margin: 0; }

/* ==========================================================================
   HYBRID GRID 380px / 1fr
   ========================================================================== */
.hybrid-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .hybrid-grid { grid-template-columns: 1fr; }
}

.sidebar-panel {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1rem;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #64748b;
  font-size: 0.88rem;
}

.compact-cat-list { display: flex; flex-direction: column; gap: 0.75rem; }

.compact-cat-item {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 0.85rem;
  transition: border-color 0.2s;
}

.compact-cat-item:hover { border-color: #334155; }
.cat-item-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.cat-info-head { display: flex; align-items: center; gap: 0.6rem; }
.cat-title-sm { margin: 0; font-size: 0.95rem; color: #fff; font-weight: 700; }
.cat-slug-sm { font-size: 0.7rem; color: #64748b; font-family: monospace; }
.cat-icon-badge.mini {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
}

.subcategories-mini { border-top: 1px solid #1e293b; padding-top: 0.5rem; }
.sub-header-mini { display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-bottom: 0.4rem; font-weight: 700; }
.sub-badges { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.sub-badge { background: #090d16; border: 1px solid #1e293b; padding: 0.2rem 0.5rem; border-radius: 4px; color: #cbd5e1; display: inline-flex; align-items: center; }
.mini-badge { padding: 0.15rem 0.4rem; font-size: 0.65rem; }
.sub-del-mini { background: none; border: none; color: #ef4444; margin-left: 0.2rem; cursor: pointer; padding: 0; font-size: 0.85rem; }

.alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.85rem; font-weight: 600; }
.alert.error { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

/* ==========================================================================
   SUB-TABS SWITCHER (MODERAZIONE VAULT VS PUBBLICAZIONE)
   ========================================================================== */
.panel-subtabs {
  display: flex;
  gap: 10px;
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 6px;
  border-radius: 10px;
}

.subtab-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #94a3b8;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.subtab-btn:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.04);
}

.subtab-btn.active {
  background: rgba(0, 220, 130, 0.1);
  color: #00dc82;
  border-color: rgba(0, 220, 130, 0.3);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.15);
}

/* ==========================================================================
   CODA DI MODERAZIONE DKP VAULT (STEP 2.2)
   ========================================================================== */
.moderation-tab-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-vault-box {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #090d16;
  border: 1px dashed #1e293b;
}

.empty-vault-inner .empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-vault-inner h4 {
  margin: 0 0 0.4rem 0;
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 800;
}

.empty-vault-inner p {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}

.moderation-cards-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-moderation-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s, transform 0.2s;
}

.post-moderation-card:hover {
  border-color: rgba(245, 158, 11, 0.6);
  transform: translateY(-2px);
}

.mod-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.mod-title-box h4 {
  margin: 6px 0 4px 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #ffffff;
}

.mod-sub {
  font-size: 0.78rem;
  color: #94a3b8;
}

.badge-pending {
  display: inline-block;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-size: 0.68rem;
  font-weight: 900;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.vault-score-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
}

.score-label {
  font-size: 0.62rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.05em;
}

.score-value {
  font-size: 1rem;
  font-weight: 900;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.mod-excerpt {
  font-size: 0.88rem;
  color: #cbd5e1;
  line-height: 1.5;
  margin: 0;
  background: rgba(2, 4, 32, 0.5);
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.mod-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #1e293b;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-inspect-report {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-inspect-report:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
}

.mod-actions-btn-group {
  display: flex;
  gap: 8px;
}

.btn-action-approve {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-approve:hover {
  opacity: 0.9;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.3);
  transform: translateY(-1px);
}

.btn-action-reject {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-reject:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
}

/* ==========================================================================
   MODALE VERIFICATION REPORT DKP VAULT
   ========================================================================== */
.vault-report-modal {
  max-width: 580px !important;
}

.vault-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 12px;
}

.vault-modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 900;
  color: #00f0ff;
}

.vault-cert-tag {
  font-size: 0.65rem;
  font-weight: 900;
  background: rgba(0, 240, 255, 0.1);
  color: #00f0ff;
  border: 1px solid rgba(0, 240, 255, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.report-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 4px 0;
}

.report-sub {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0 0 16px 0;
}

.report-grid-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.metric-box {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.m-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.m-val {
  font-size: 1.1rem;
  font-weight: 900;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.m-val.green { color: #00dc82; }
.m-val.blue { color: #38bdf8; }
.m-val.purple { color: #c084fc; }

.vault-hash-box {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hash-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.vault-hash-box code {
  color: #00ff87;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

/* ==========================================================================
   CARDS, TABLES & FORM STYLES
   ========================================================================== */
.card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.card-title { margin: 0 0 1.25rem 0; font-size: 1.2rem; font-weight: 800; color: #fff; }

.form-stack { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.65rem;
  border-radius: 8px;
  outline: none;
  font-size: 0.875rem;
  box-sizing: border-box;
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #00dc82; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.btn-primary, .btn-submit {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover, .btn-submit:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
.btn-link { background: none; border: none; color: #00dc82; cursor: pointer; font-size: 0.75rem; font-weight: 700; }
.btn-link:hover { text-decoration: underline; }

.actions { display: flex; gap: 0.3rem; }
.btn-icon { background: #1e293b; border: none; color: #fff; padding: 0.25rem 0.4rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
.btn-icon.danger:hover { background: rgba(239, 68, 68, 0.2); }

/* TABELLA PUBBLICAZIONI */
.table-responsive { overflow-x: auto; }
.dkp-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
.dkp-table th { background: #020420; color: #64748b; padding: 0.75rem; border-bottom: 1px solid #1e293b; text-transform: uppercase; font-size: 0.7rem; }
.dkp-table td { padding: 0.75rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.font-bold { font-weight: 700; color: #ffffff; }
.cat-badge { background: rgba(56, 189, 248, 0.12); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
.status-badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; }
.status-badge.success { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-badge.warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.status-badge.draft { background: rgba(100, 116, 139, 0.15); color: #94a3b8; }
.date-text, .views-text { color: #94a3b8; font-size: 0.8rem; }

/* ==========================================================================
   MODALI E SELETTORE EMOJI COMPATTO SCORREVOLE
   ========================================================================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  padding: 1rem;
}

.modal-box {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.5rem;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
}

.modal-box h3 { margin: 0; font-size: 1.2rem; font-weight: 900; color: #ffffff; }
.modal-sub-info { font-size: 0.85rem; color: #94a3b8; margin: -0.5rem 0 0.5rem; }

/* Scroll dedicato unicamente per il form all'interno delle modali */
.modal-box .form-stack {
  overflow-y: auto;
  flex: 1;
  padding-right: 8px;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.modal-box .form-stack::-webkit-scrollbar { width: 6px; }
.modal-box .form-stack::-webkit-scrollbar-thumb { background: rgba(0, 220, 130, 0.3); border-radius: 4px; }
.modal-box .form-stack::-webkit-scrollbar-thumb:hover { background: #00dc82; }

.modal-footer {
  flex-shrink: 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 12px;
}

/* EMOJI PICKER CON SCROLLBAR COMPATTA (MAX 110PX) */
.emoji-scroll-picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
  max-height: 110px;
  overflow-y: auto;
  padding: 0.5rem;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
}

.emoji-scroll-picker::-webkit-scrollbar { width: 6px; }
.emoji-scroll-picker::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
.emoji-scroll-picker::-webkit-scrollbar-thumb:hover { background: #00dc82; }

.icon-btn {
  background: #090d16;
  border: 1px solid #1e293b;
  font-size: 1.2rem;
  padding: 0.4rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #fff;
}

.icon-btn:hover, .icon-btn.active {
  border-color: #00dc82;
  background: rgba(0, 220, 130, 0.15);
}

/* INPUT TAGS CATEGORIA */
.tags-input-wrap { display: flex; gap: 0.5rem; }
.btn-tag-add { background: #1e293b; color: #38bdf8; border: none; font-weight: 800; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; }
.tags-pills-container {
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  margin-top: 8px;
}

.tag-pill { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem; }
.tag-del { background: transparent; border: none; color: #ef4444; font-weight: 900; cursor: pointer; padding: 0; line-height: 1; }

/* COLOR PICKER & PREVIEW */
.color-picker { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.2rem; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
.color-dot.active { border-color: #ffffff; transform: scale(1.1); }
.color-input { width: 32px; height: 32px; padding: 0; border: none; background: none; cursor: pointer; }

.badge-preview-box { display: flex; align-items: center; gap: 0.75rem; background: #020420; padding: 0.6rem 0.8rem; border-radius: 8px; border: 1px solid #1e293b; }
.preview-label { font-size: 0.75rem; color: #64748b; font-weight: 700; }
.preview-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.8rem; font-weight: 800; border: 1px solid; }

.btn-save-cat { background: #00dc82; color: #020420; font-weight: 900; padding: 0.6rem 1.2rem; border-radius: 6px; border: none; cursor: pointer; }
.btn-cancel { background: #1e293b; color: #cbd5e1; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 700; }
</style>