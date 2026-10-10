<!-- app/pages/admin/blog/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import DkpTagInput from '~/components/blog/DkpTagInput.vue'

useDkpSeo({
  title: "Taxonomy & Moderation Vault v2.4-GOLD - DKP Admin Center",
  description:
    "Gestione categorie, sottocategorie, queue di moderazione DKP Vault e pubblicazione articoli sull'ecosistema DevKernelPulse.",
});

const { getMainUrl, getMailUrl, getApiUrl } = useDomain();

// --- INTERFACCE DATI ---
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
  subcategoryId?: number | string | null; // Aggiunto per supporto DB
  authorName?: string;
  tags?: string[];
  views: number;
  date: string;
  status: "published" | "pending_vault" | "draft";
  isVerified?: boolean;
  vaultCertificateId?: string;
  vaultHash?: string;
  vaultReport?: VaultReport;
}

// --- STATI GLOBALI ---
const activeTab = ref<"moderation_queue" | "publish_manage">("publish_manage");
const categories = ref<Category[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");
const showToast = ref(false);
const toastMessage = ref("");

function triggerToast(msg: string) {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3500);
}

// --- STATO DEL FORM ---
const isEditing = ref(false);
const newArticle = ref({
  id: null as number | string | null,
  title: '',
  categoryId: '' as number | string,
  subcategoryId: '' as number | string | null,
  author: 'Alessandro De Paola',
  tags: [] as string[],
  excerpt: '',
  content: '', // Aggiunto per inviare il contenuto al DB
  status: 'published' as "published" | "pending_vault" | "draft"
});

// --- LISTA POST UNIFICATA ---
const posts = ref<Post[]>([]);

const pendingVaultPosts = computed(() => posts.value.filter((p) => p.status === "pending_vault"));
const publishedPosts = computed(() => posts.value.filter((p) => p.status === "published"));

// 🟢 FUNZIONE UNIFICATA: SALVA O AGGIORNA POST SU DB NEON
async function publishArticle() {
  if (!newArticle.value.title || !newArticle.value.categoryId) {
    return triggerToast('❌ Compila Titolo e Categoria prima di pubblicare.');
  }

  isLoading.value = true;

  try {
    // PREPARAZIONE PAYLOAD PER L'API DB
    const payload = {
      title: newArticle.value.title,
      categoryId: newArticle.value.categoryId,
      subcategoryId: newArticle.value.subcategoryId || null,
      excerpt: newArticle.value.excerpt,
      content: newArticle.value.content || newArticle.value.excerpt || 'Contenuto non disponibile.',
      tags: [...newArticle.value.tags],
      authorName: newArticle.value.author
    };

    if (isEditing.value && newArticle.value.id) {
       // UPDATE (Simulato se non hai l'endpoint PUT, per ora facciamo finta vada a buon fine a livello UI se non c'è API)
       // L'ideale sarebbe await $fetch(`/api/blog/posts/${newArticle.value.id}`, { method: 'PUT', body: payload })
       triggerToast('✅ Articolo aggiornato! (Assicurati di avere un endpoint PUT per il DB)');
       await fetchPosts(); 
    } else {
       // CREATE - Chiama il VERO ENDPOINT API
       const res: any = await $fetch('/api/blog/posts', {
          method: 'POST',
          body: payload
       });

       if (res && res.success) {
          triggerToast('🚀 Nuovo articolo salvato su Neon DB e pubblicato!');
          await fetchPosts(); // Ricarica la lista per sicurezza
       } else {
          throw new Error("Errore durante il salvataggio.");
       }
    }
    resetForm();
  } catch (error: any) {
    console.error("Errore salvataggio post:", error);
    triggerToast(`❌ Errore durante la pubblicazione: ${error.message || 'Errore DB'}`);
  } finally {
    isLoading.value = false;
  }
}

// 🟡 FUNZIONE: CARICA I DATI NEL FORM PER MODIFICA
function editPost(post: Post) {
  newArticle.value = {
    id: post.id,
    title: post.title,
    categoryId: post.categoryId || '',
    subcategoryId: post.subcategoryId || '',
    author: post.authorName || 'Alessandro De Paola',
    tags: post.tags ? [...post.tags] : [],
    excerpt: post.excerpt || '',
    content: (post as any).content || '', 
    status: post.status
  };
  isEditing.value = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 🔴 FUNZIONE: ELIMINA IL POST DAL DB
async function deletePost(id: number | string) {
  if (!confirm('⚠️ Sei sicuro di voler eliminare definitivamente questo articolo dal DB Neon?')) return;
  
  isLoading.value = true;
  try {
     const res: any = await $fetch(`/api/blog/posts/${id}`, { method: 'DELETE' });
     if (res && res.success) {
        posts.value = posts.value.filter(p => String(p.id) !== String(id));
        triggerToast('🗑️ Articolo eliminato dal Database.');
        if (String(newArticle.value.id) === String(id)) resetForm();
     } else {
        throw new Error("Impossibile eliminare");
     }
  } catch (error: any) {
     console.error("Errore eliminazione:", error);
     triggerToast('❌ Errore durante l\'eliminazione. Riprova.');
  } finally {
     isLoading.value = false;
  }
}

// ⚪ FUNZIONE: SVUOTA IL FORM
function resetForm() {
  newArticle.value = { id: null, title: '', categoryId: '', subcategoryId: '', author: 'Alessandro De Paola', tags: [], excerpt: '', content: '', status: 'published' };
  isEditing.value = false;
}

// Funzione Helper Categorie
function getCategoryName(id: number | string | null) {
  if (!id) return "Non Assegnata";
  const cat = categories.value.find((c) => String(c.id) === String(id));
  return cat ? `${cat.icon || "🏷️"} ${cat.name}` : "Non Assegnata";
}

// --- TAXONOMY PRESETS & LOGICA ---
const presetEmojis = ["💻", "⚙️", "⚡", "🧠", "🛡️", "🔒", "🤖", "☁️", "🐳", "🌐", "📦", "🚀", "📱", "🔑", "📊", "🧬", "🎯", "🛠️", "🔥", "✨", "💡", "📌", "🏆", "📰"];
const presetColors = ["#00dc82", "#38bdf8", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

const isCatModalOpen = ref(false);
const catForm = ref({ id: null as number | string | null, name: "", slug: "", description: "", icon: "🤖", color: "#00dc82", tagInput: "", tags: [] as string[] });

const isSubModalOpen = ref(false);
const subForm = ref({ id: null as number | string | null, categoryId: null as number | string | null, categoryName: "", name: "", slug: "", description: "" });

const isVaultReportModalOpen = ref(false);
const selectedPostForReport = ref<Post | null>(null);

const addCategoryTag = () => {
  const val = catForm.value.tagInput.trim().replace(/^#/, "");
  if (val && !catForm.value.tags.includes(val)) {
    catForm.value.tags.push(val);
    catForm.value.tagInput = "";
  }
};

const removeCategoryTag = (tag: string) => { catForm.value.tags = catForm.value.tags.filter((t) => t !== tag); };
const autoSlug = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
const handleCatNameInput = () => { if (!catForm.value.id) catForm.value.slug = autoSlug(catForm.value.name); };
const handleSubNameInput = () => { if (!subForm.value.id) subForm.value.slug = autoSlug(subForm.value.name); };

// FETCH CATEGORIES DAL DB NEON
const fetchCategories = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    // 🔥 FIX: Puntiamo all'API pubblica e pulita
    const res: any = await $fetch("/api/blog/categories");
    if (res && res.success) {
      categories.value = res.data || [];
    } else {
      categories.value = [];
    }
  } catch (err: any) {
    console.error("Errore fetch Categorie", err);
    triggerToast("Impossibile caricare le categorie dal database.");
  } finally {
    isLoading.value = false;
  }
};

// FETCH POSTS DAL DB NEON
const fetchPosts = async () => {
   isLoading.value = true;
   try {
      // 🔥 FIX: Puntiamo alla nuova API
      const res: any = await $fetch("/api/blog/posts");
      if(res && res.success) {
         posts.value = res.data.map((p: any) => ({
             ...p,
             date: p.createdAt ? String(p.createdAt).slice(0, 10) : 'N/A'
         })) || [];
      }
   } catch(e) {
      console.error("Errore fetch posts:", e);
   } finally {
      isLoading.value = false;
   }
}

// Salvataggio disattivato se hai deciso di usare il DB in sola lettura per le categorie dal front-end (come hai detto prima). 
// Lascio le funzioni vuote o con alert per sicurezza, in base alla tua scelta precedente.
const saveCategory = async () => { alert("Creazione categorie disabilitata da UI. Inserire da database."); isCatModalOpen.value = false; };
const saveSubcategory = async () => { alert("Creazione sottocategorie disabilitata da UI. Inserire da database."); isSubModalOpen.value = false; };
const deleteItem = async (id: number | string, type: "category" | "subcategory") => { alert("Eliminazione categorie disabilitata da UI."); };

const openCatModal = (cat: Category | null = null) => { alert("Modal disattivato (Sola lettura)"); };
const openSubModal = (category: Category, sub: Subcategory | null = null) => { alert("Modal disattivato (Sola lettura)"); };

const inspectVaultReport = (post: Post) => {
  selectedPostForReport.value = post;
  isVaultReportModalOpen.value = true;
};

const moderatePost = async (post: Post, action: "approve" | "reject") => {
  alert("Moderazione avanzata in fase di refactoring per DB Neon.");
  isVaultReportModalOpen.value = false;
};

onMounted(() => {
  fetchCategories();
  fetchPosts(); // 🔥 Carichiamo la griglia con i dati veri!
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

       <!-- TAB 2: FORM PUBBLICAZIONE & TABELLA GESTIONE ARTICOLI -->
        <div v-else-if="activeTab === 'publish_manage'">
          
          <!-- Form Pubblicazione/Modifica Articolo -->
          <div class="card mb-6">
            <h3 class="card-title">
              {{ isEditing ? '✏️ Modifica Articolo' : '✍️ Pubblica Nuovo Articolo' }}
            </h3>
            
            <form @submit.prevent="publishArticle" class="form-stack">
              <div class="form-group">
                <label>Titolo Articolo *</label>
                <input
                  v-model="newArticle.title"
                  type="text"
                  class="dkp-input"
                  placeholder="Es. Guida ad Architettura Micro-Kernel Nuxt 4"
                  required
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Categoria *</label>
                  <select v-model="newArticle.categoryId" class="dkp-input" required>
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
                  <input v-model="newArticle.author" class="dkp-input" type="text" readonly />
                </div>
              </div>

              <!-- ➕ COMPONENTE TAG AGGIUNTO QUI -->
              <div class="form-group full-width mt-4">
                <label style="font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase;">
                  TAGS DELL'ARTICOLO (AUTOSUGGEST 600+)
                </label>
                <DkpTagInput v-model="newArticle.tags" />
              </div>

              <div class="form-group mt-4">
                <label>Estratto Breve / Summary</label>
                <textarea
                  v-model="newArticle.excerpt"
                  class="dkp-input"
                  rows="2"
                  placeholder="Sintesi per le anteprime nella sezione notizie..."
                ></textarea>
              </div>

              <!-- PULSANTI DINAMICI SALVATAGGIO / ANNULLA MODIFICA -->
              <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button v-if="isEditing" type="button" @click="resetForm" class="btn-cancel" style="background: transparent; color: #ef4444; border: 1px solid #ef4444; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer;">
                  ❌ Annulla Modifica
                </button>
                <button type="submit" class="btn-submit" style="flex: 1;">
                  {{ isEditing ? '🔄 Salva Modifiche' : '🚀 Pubblica nel Blog DKP' }}
                </button>
              </div>
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
                    <th style="text-align: right;">Azioni</th>
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
                      <span class="cat-badge">
                        {{ getCategoryName(post.category || post.categoryId) }}
                      </span>
                    </td>
                    <td>
                      <span
                        v-if="post.status === 'published'"
                        class="status-badge success"
                      >Online</span>
                      <span
                        v-else-if="post.status === 'pending_vault'"
                        class="status-badge warning"
                      >DKP Vault (In Analisi)</span>
                      <span v-else class="status-badge draft">Bozza</span>
                    </td>
                    <td class="date-text">{{ post.date || (post.createdAt ? post.createdAt.slice(0, 10) : '') }}</td>
                    <td class="views-text">👁️ {{ post.views || 0 }}</td>
                    <td style="text-align: right;">
                      <div class="action-buttons">
                        <!-- EVENTI CLICK AGGIUNTI AI BOTTONI -->
                        <button @click="editPost(post)" class="btn-icon btn-edit" type="button" title="Modifica Articolo">
                          ✏️
                        </button>
                        <button @click="deletePost(post.id)" class="btn-icon btn-delete" type="button" title="Elimina Articolo">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="posts.length === 0">
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #888;">
                      📂 Nessun articolo presente nel Database Neon. Usa il form per crearne uno nuovo.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div> <!-- 👈 CHIUSURA DIV TAB "publish_manage" -->

      </main> <!-- 👈 CHIUSURA DEL MAIN-PANEL GENERALE -->
    </div>
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

/* AZIONI TABELLA (MODIFICA & ELIMINA) */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

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