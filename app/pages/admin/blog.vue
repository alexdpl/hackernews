<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'
import DkpEditor from '~/components/blog/DkpEditor.vue'
import { parseDkpMarkdown } from '~/utils/dkpMarkdown'
import { highlightCodeDynamic, prismRegistryVersion } from '~/composables/useDynamicPrism'

definePageMeta({
  middleware: 'admin-only'
})

interface BlogPost {
  id: number
  title: string
  slug: string
  category: string
  subCategory?: string
  excerpt: string
  content: string
  coverImage?: string
  author?: string
  tags: string[]
  status: 'PUBLISHED' | 'DRAFT'
  isFeatured?: boolean
  viewsCount?: number
  createdAt: string
}

interface BlogCategoryItem {
  id: number
  name: string
  slug: string
  description: string
  subcategories: string[]
}

const posts = ref<BlogPost[]>([])
const categoriesTree = ref<BlogCategoryItem[]>([])
const sourceTable = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const showModal = ref(false)
const showPreviewModal = ref(false)
const previewPost = ref<BlogPost | null>(null)
const feedbackMsg = ref('')

// Filtri sidebar verticale e barra ricerca
const searchQuery = ref('')
const selectedCategory = ref<string>('ALL')
const selectedSubCategory = ref<string>('ALL')
const filterStatus = ref<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')

// Modale Creazione / Modifica Categoria e Sottocategoria
const showCatModal = ref(false)
const catModalMode = ref<'create_cat' | 'edit_cat' | 'create_sub' | 'edit_sub'>('create_cat')
const catForm = ref({
  categoryId: 0,
  name: '',
  oldName: '',
  description: '',
  subName: '',
  oldSubName: ''
})

// Modello nativo collegato direttamente a DkpEditor.vue
const editingId = ref<number | null>(null)
const editorModel = ref({
  title: '',
  category: '',
  subCategory: '',
  tags: [] as string[],
  summary: '',
  content: ''
})

const extraMeta = ref({
  slug: '',
  coverImage: '',
  author: 'DKP Editorial',
  status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
  isFeatured: false
})

const blogStats = computed(() => ({
  total: posts.value.length,
  published: posts.value.filter(p => p.status === 'PUBLISHED').length,
  drafts: posts.value.filter(p => p.status === 'DRAFT').length,
  featured: posts.value.filter(p => p.isFeatured).length
}))

const filteredPosts = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return posts.value.filter(p => {
    const tagsStr = Array.isArray(p.tags) ? p.tags.join(', ') : String(p.tags || '')
    const matchQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.excerpt || '').toLowerCase().includes(q) ||
      tagsStr.toLowerCase().includes(q)
    const matchCat = selectedCategory.value === 'ALL' || p.category === selectedCategory.value
    const matchSub = selectedSubCategory.value === 'ALL' || (p.subCategory || '') === selectedSubCategory.value
    const matchStatus = filterStatus.value === 'ALL' || p.status === filterStatus.value
    return matchQuery && matchCat && matchSub && matchStatus
  })
})

function countByCategory(catName: string): number {
  return posts.value.filter(p => p.category === catName).length
}

function countBySubCategory(catName: string, subName: string): number {
  return posts.value.filter(p => p.category === catName && (p.subCategory || '') === subName).length
}

function selectCategoryFilter(catName: string, subName: string = 'ALL') {
  selectedCategory.value = catName
  selectedSubCategory.value = subName
}

const renderedPreviewHtml = computed(() => {
  void prismRegistryVersion.value
  const raw = previewPost.value?.content || ''
  if (!raw) return '<p class="text-slate-400">Nessun contenuto presente.</p>'
  return parseDkpMarkdown(raw)
})

async function fetchCategoriesTree() {
  const res: any = await $fetch('/api/admin/blog-categories', {
    method: 'POST',
    body: { action: 'list' }
  }).catch(() => null)
  if (res?.success) {
    categoriesTree.value = res.categories || []
  }
}

async function fetchPosts() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/admin/blog?_t=${Date.now()}`)
    if (res?.success) {
      posts.value = res.posts || []
      sourceTable.value = res.sourceTable || 'blog_posts'
    }
  } finally {
    isLoading.value = false
  }
}

// CRUD Categorie e Sottocategorie
function openCreateCategory() {
  catModalMode.value = 'create_cat'
  catForm.value = { categoryId: 0, name: '', oldName: '', description: '', subName: '', oldSubName: '' }
  showCatModal.value = true
}

function openEditCategory(cat: BlogCategoryItem) {
  catModalMode.value = 'edit_cat'
  catForm.value = {
    categoryId: cat.id,
    name: cat.name,
    oldName: cat.name,
    description: cat.description || '',
    subName: '',
    oldSubName: ''
  }
  showCatModal.value = true
}

function openCreateSubCategory(cat: BlogCategoryItem) {
  catModalMode.value = 'create_sub'
  catForm.value = {
    categoryId: cat.id,
    name: cat.name,
    oldName: cat.name,
    description: '',
    subName: '',
    oldSubName: ''
  }
  showCatModal.value = true
}

function openEditSubCategory(cat: BlogCategoryItem, sub: string) {
  catModalMode.value = 'edit_sub'
  catForm.value = {
    categoryId: cat.id,
    name: cat.name,
    oldName: cat.name,
    description: '',
    subName: sub,
    oldSubName: sub
  }
  showCatModal.value = true
}

async function submitCategoryModal() {
  let payload: any = {}
  if (catModalMode.value === 'create_cat') {
    if (!catForm.value.name.trim()) return
    payload = { action: 'create_category', name: catForm.value.name, description: catForm.value.description }
  } else if (catModalMode.value === 'edit_cat') {
    if (!catForm.value.name.trim()) return
    payload = {
      action: 'update_category',
      id: catForm.value.categoryId,
      name: catForm.value.name,
      oldName: catForm.value.oldName,
      description: catForm.value.description
    }
  } else if (catModalMode.value === 'create_sub') {
    if (!catForm.value.subName.trim()) return
    payload = { action: 'add_subcategory', categoryId: catForm.value.categoryId, subName: catForm.value.subName }
  } else if (catModalMode.value === 'edit_sub') {
    if (!catForm.value.subName.trim()) return
    payload = {
      action: 'rename_subcategory',
      categoryId: catForm.value.categoryId,
      oldSub: catForm.value.oldSubName,
      newSub: catForm.value.subName
    }
  }

  const res: any = await $fetch('/api/admin/blog-categories', { method: 'POST', body: payload })
  if (res?.success) {
    categoriesTree.value = res.categories || []
    feedbackMsg.value = res.message || 'Aggiornato!'
    showCatModal.value = false
    await fetchPosts()
  }
}

async function deleteCategory(cat: BlogCategoryItem) {
  if (!confirm(`Eliminare la categoria "${cat.name}"?`)) return
  const res: any = await $fetch('/api/admin/blog-categories', {
    method: 'POST',
    body: { action: 'delete_category', id: cat.id }
  })
  if (res?.success) {
    categoriesTree.value = res.categories || []
    if (selectedCategory.value === cat.name) selectCategoryFilter('ALL')
    feedbackMsg.value = res.message
  }
}

async function deleteSubCategory(cat: BlogCategoryItem, sub: string) {
  if (!confirm(`Eliminare la sottocategoria "${sub}" da "${cat.name}"?`)) return
  const res: any = await $fetch('/api/admin/blog-categories', {
    method: 'POST',
    body: { action: 'delete_subcategory', categoryId: cat.id, subName: sub }
  })
  if (res?.success) {
    categoriesTree.value = res.categories || []
    if (selectedSubCategory.value === sub) selectedSubCategory.value = 'ALL'
    feedbackMsg.value = res.message
  }
}

// CRUD Articoli con DkpEditor
function openCreateModal() {
  editingId.value = null
  if (import.meta.client) { try { localStorage.removeItem('DKP_BLOG_EDITOR_AUTOSAVE_V1') } catch {} }
  const defaultCat = selectedCategory.value !== 'ALL' ? selectedCategory.value : (categoriesTree.value[0]?.name || '')
  const defaultSub = selectedSubCategory.value !== 'ALL' ? selectedSubCategory.value : ''
  editorModel.value = {
    title: '',
    category: defaultCat,
    subCategory: defaultSub,
    tags: [],
    summary: '',
    content: ''
  }
  extraMeta.value = {
    slug: '',
    coverImage: '',
    author: 'DKP Editorial',
    status: 'PUBLISHED',
    isFeatured: false
  }
  showModal.value = true
}

function openEditModal(post: BlogPost) {
  editingId.value = post.id
  editorModel.value = {
    title: post.title,
    category: post.category || '',
    subCategory: post.subCategory || '',
    tags: Array.isArray(post.tags) ? [...post.tags] : [],
    summary: post.excerpt || '',
    content: post.content || ''
  }
  extraMeta.value = {
    slug: post.slug || '',
    coverImage: post.coverImage || '',
    author: post.author || 'DKP Editorial',
    status: post.status,
    isFeatured: Boolean(post.isFeatured)
  }
  showModal.value = true
}

function openPreview(post: BlogPost) {
  previewPost.value = post
  showPreviewModal.value = true
}

async function savePost() {
  if (!editorModel.value.title.trim()) return
  isSaving.value = true
  try {
    const res: any = await $fetch('/api/admin/blog', {
      method: 'POST',
      body: {
        action: 'save',
        id: editingId.value,
        title: editorModel.value.title,
        category: editorModel.value.category,
        subCategory: editorModel.value.subCategory,
        tags: editorModel.value.tags,
        excerpt: editorModel.value.summary,
        summary: editorModel.value.summary,
        content: editorModel.value.content,
        slug: extraMeta.value.slug,
        coverImage: extraMeta.value.coverImage,
        author: extraMeta.value.author,
        status: extraMeta.value.status,
        isFeatured: extraMeta.value.isFeatured
      }
    })
    if (res?.success) {
      if (import.meta.client) { try { localStorage.removeItem('DKP_BLOG_EDITOR_AUTOSAVE_V1') } catch {} }
      editingId.value = null
      editorModel.value = { title: '', category: '', subCategory: '', tags: [], summary: '', content: '' }
      showModal.value = false
      feedbackMsg.value = res.message
      await Promise.all([fetchPosts(), fetchCategoriesTree()])
    }
  } finally {
    isSaving.value = false
  }
}

async function toggleStatus(id: number) {
  const res: any = await $fetch('/api/admin/blog', { method: 'POST', body: { action: 'toggle_status', id } })
  if (res?.success) feedbackMsg.value = res.message
  await fetchPosts()
}

async function toggleFeatured(id: number) {
  const res: any = await $fetch('/api/admin/blog', { method: 'POST', body: { action: 'toggle_featured', id } })
  if (res?.success) feedbackMsg.value = res.message
  await fetchPosts()
}

async function deletePost(id: number) {
  if (!confirm('Eliminare definitivamente questo articolo dal Blog?')) return
  const res: any = await $fetch('/api/admin/blog', { method: 'POST', body: { action: 'delete', id } })
  if (res?.success) feedbackMsg.value = res.message
  await fetchPosts()
}

onMounted(async () => {
  await Promise.all([fetchCategoriesTree(), fetchPosts()])
})
</script>

<template>
  <DkpAdminShell
    title="Gestione Blog & Editorial CMS"
    subtitle="Albero verticale Categorie & Sottocategorie con CRUD completo e DkpEditor Avanzato (PrismJS Dinamico & AI Studio)."
    badge="EDITORIAL CMS v2.6"
    seo-title="Gestione Blog — DKP Admin v2.6"
  >
    <template #actions>
      <NuxtLink
        to="/blog"
        target="_blank"
        class="px-3.5 py-2.5 rounded-xl bg-[#030712] border border-slate-700 text-cyan-300 font-bold no-underline"
      >
        Blog Pubblico
      </NuxtLink>
      <button
        type="button"
        @click="openCreateCategory"
        class="px-3.5 py-2.5 rounded-xl bg-[#030712] border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer"
      >
        + Nuova Categoria
      </button>
      <button
        type="button"
        @click="openCreateModal"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer shadow-[0_0_16px_rgba(16,185,129,0.25)]"
      >
        + Nuovo Articolo
      </button>
    </template>

    <div v-if="feedbackMsg" class="bg-emerald-500/15 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-between">
      <span>{{ feedbackMsg }}</span>
      <button type="button" @click="feedbackMsg = ''" class="bg-transparent border-none text-emerald-300 cursor-pointer font-bold">Chiudi</button>
    </div>

    <!-- KPI EDITORIALI BLOG -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <span class="text-[10px] text-slate-400 font-bold uppercase">ARTICOLI TOTALI</span>
        <div class="text-2xl font-extrabold text-white mt-1">{{ blogStats.total }}</div>
        <span class="text-[10px] text-cyan-400">Tabella: {{ sourceTable || 'blog_posts' }}</span>
      </div>

      <div class="bg-dkp-card/95 border border-emerald-500/35 rounded-2xl p-4 card-glow">
        <span class="text-[10px] text-emerald-400 font-bold uppercase">PUBBLICATI LIVE</span>
        <div class="text-2xl font-extrabold text-emerald-400 mt-1">{{ blogStats.published }}</div>
        <span class="text-[10px] text-slate-400">Visibili sul portale</span>
      </div>

      <div class="bg-dkp-card/95 border border-amber-500/35 rounded-2xl p-4 card-glow">
        <span class="text-[10px] text-amber-400 font-bold uppercase">BOZZE (DRAFT)</span>
        <div class="text-2xl font-extrabold text-amber-300 mt-1">{{ blogStats.drafts }}</div>
        <span class="text-[10px] text-slate-400">In lavorazione</span>
      </div>

      <div class="bg-dkp-card/95 border border-purple-500/35 rounded-2xl p-4 card-glow">
        <span class="text-[10px] text-purple-400 font-bold uppercase">CATEGORIE ATTIVE</span>
        <div class="text-2xl font-extrabold text-purple-300 mt-1">{{ categoriesTree.length }}</div>
        <span class="text-[10px] text-slate-400">Tassonomia Blog</span>
      </div>
    </section>

    <!-- LAYOUT PRINCIPALE: NAVBAR VERTICALE CATEGORIE/SOTTOCATEGORIE (SX) + ARTICOLI (DX) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- SIDEBAR VERTICALE CATEGORIE E SOTTOCATEGORIE -->
      <aside class="lg:col-span-3 bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow font-mono text-xs">
        <div class="p-3.5 border-b border-dkp-border flex items-center justify-between bg-[#030712]">
          <span class="font-extrabold text-white uppercase text-[11px]">Categorie &amp; Sub</span>
          <button
            type="button"
            @click="openCreateCategory"
            class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] cursor-pointer"
          >
            + Cat
          </button>
        </div>

        <div class="p-2.5 space-y-1.5 max-h-[680px] overflow-y-auto">
          <!-- Tutte le categorie -->
          <button
            type="button"
            @click="selectCategoryFilter('ALL', 'ALL')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left font-bold cursor-pointer transition-colors',
              selectedCategory === 'ALL'
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-[#030712] border-transparent text-slate-300 hover:border-slate-700'
            ]"
          >
            <span>Tutti gli Articoli</span>
            <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{{ posts.length }}</span>
          </button>

          <!-- Albero Categorie + Sottocategorie -->
          <div
            v-for="cat in categoriesTree"
            :key="cat.id"
            class="rounded-xl border border-slate-800/80 bg-[#030712]/80 overflow-hidden"
          >
            <div
              :class="[
                'flex items-center justify-between gap-1 px-3 py-2 cursor-pointer transition-colors',
                selectedCategory === cat.name && selectedSubCategory === 'ALL'
                  ? 'bg-emerald-500/15 text-emerald-300 font-extrabold'
                  : 'text-slate-200 hover:bg-slate-900/80 font-bold'
              ]"
              @click="selectCategoryFilter(cat.name, 'ALL')"
            >
              <span class="truncate">{{ cat.name }}</span>
              <div class="flex items-center gap-1 shrink-0" @click.stop>
                <span class="text-[10px] text-slate-400 mr-1">{{ countByCategory(cat.name) }}</span>
                <button
                  type="button"
                  @click="openCreateSubCategory(cat)"
                  class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 text-[10px] border-none cursor-pointer"
                  title="Aggiungi Sottocategoria"
                >
                  +Sub
                </button>
                <button
                  type="button"
                  @click="openEditCategory(cat)"
                  class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-500/20 text-sky-300 text-[10px] border-none cursor-pointer"
                  title="Modifica Categoria"
                >
                  Mod
                </button>
                <button
                  type="button"
                  @click="deleteCategory(cat)"
                  class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-[10px] border-none cursor-pointer"
                  title="Elimina Categoria"
                >
                  Del
                </button>
              </div>
            </div>

            <!-- Sottocategorie indentate -->
            <div v-if="cat.subcategories?.length" class="border-t border-slate-800/60 bg-[#020410] py-1 px-2 space-y-1">
              <div
                v-for="sub in cat.subcategories"
                :key="sub"
                @click="selectCategoryFilter(cat.name, sub)"
                :class="[
                  'flex items-center justify-between gap-1 pl-3 pr-1.5 py-1.5 rounded-lg cursor-pointer text-[11px]',
                  selectedCategory === cat.name && selectedSubCategory === sub
                    ? 'bg-sky-500/20 text-sky-300 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                ]"
              >
                <span class="truncate">-- {{ sub }}</span>
                <div class="flex items-center gap-1 shrink-0" @click.stop>
                  <span class="text-[9px] text-slate-500">{{ countBySubCategory(cat.name, sub) }}</span>
                  <button
                    type="button"
                    @click="openEditSubCategory(cat, sub)"
                    class="px-1 py-0.5 rounded bg-slate-900 text-sky-300 text-[9px] border-none cursor-pointer"
                  >
                    Mod
                  </button>
                  <button
                    type="button"
                    @click="deleteSubCategory(cat, sub)"
                    class="px-1 py-0.5 rounded bg-slate-900 text-rose-300 text-[9px] border-none cursor-pointer"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- AREA PRINCIPALE: RICERCA + TABELLA ARTICOLI -->
      <div class="lg:col-span-9 space-y-4">
        <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow flex flex-col sm:flex-row gap-3 font-mono text-xs">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca per titolo, slug, tag o contenuto..."
            class="flex-1 bg-[#030712] border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none box-border"
          />

          <select
            v-model="filterStatus"
            class="bg-[#030712] border border-slate-700 text-emerald-300 font-bold px-3.5 py-2.5 rounded-xl cursor-pointer"
          >
            <option value="ALL">Tutti gli Stati</option>
            <option value="PUBLISHED">Solo Pubblicati</option>
            <option value="DRAFT">Solo Bozze</option>
          </select>
        </section>

        <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow font-mono text-xs">
          <div class="p-4 border-b border-dkp-border flex flex-wrap items-center justify-between gap-2">
            <span class="font-bold text-white">
              Articoli ({{ filteredPosts.length }})
              <span v-if="selectedCategory !== 'ALL'" class="text-cyan-400">
                — Filtro: {{ selectedCategory }} <span v-if="selectedSubCategory !== 'ALL'">/ {{ selectedSubCategory }}</span>
              </span>
            </span>
            <button
              type="button"
              @click="openCreateModal"
              class="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-extrabold border-none cursor-pointer"
            >
              + Scrivi con DkpEditor
            </button>
          </div>

          <div v-if="isLoading" class="p-10 text-center text-cyan-400">Sincronizzazione articoli dal database...</div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#030712] border-b border-dkp-border text-slate-400 uppercase text-[11px]">
                  <th class="p-4">Articolo &amp; Sommario</th>
                  <th class="p-4">Categoria &amp; Tag</th>
                  <th class="p-4">Stato</th>
                  <th class="p-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dkp-border/60">
                <tr v-for="p in filteredPosts" :key="p.id" class="hover:bg-slate-900/50">
                  <td class="p-4 max-w-md">
                    <div class="flex items-start gap-3">
                      <img
                        v-if="p.coverImage"
                        :src="p.coverImage"
                        alt=""
                        class="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span v-if="p.isFeatured" class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40">
                            FEATURED
                          </span>
                          <strong class="text-white text-sm font-sans line-clamp-1">{{ p.title }}</strong>
                        </div>
                        <NuxtLink :to="`/blog/${p.slug}`" target="_blank" class="text-cyan-400 hover:underline text-[11px] block mt-0.5 no-underline">
                          /blog/{{ p.slug }}
                        </NuxtLink>
                        <p v-if="p.excerpt" class="text-slate-400 text-[11px] font-sans line-clamp-2 m-0 mt-1">
                          {{ p.excerpt }}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td class="p-4">
                    <span class="px-2.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/35 text-sky-300 font-bold inline-block mb-1">
                      {{ p.category }} <span v-if="p.subCategory" class="text-slate-400">/ {{ p.subCategory }}</span>
                    </span>
                    <div v-if="p.tags?.length" class="text-[10px] text-slate-400 max-w-[180px] truncate">
                      {{ p.tags.join(', ') }}
                    </div>
                  </td>

                  <td class="p-4 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2.5 py-1 rounded text-[10px] font-extrabold border',
                        p.status === 'PUBLISHED'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      ]"
                    >
                      {{ p.status }}
                    </span>
                  </td>

                  <td class="p-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        @click="openEditModal(p)"
                        class="px-2.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500 hover:text-slate-950 font-bold cursor-pointer"
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        @click="openPreview(p)"
                        class="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 border-none font-bold cursor-pointer"
                      >
                        Leggi
                      </button>
                      <button
                        type="button"
                        @click="toggleStatus(p.id)"
                        class="px-2.5 py-1.5 rounded-lg bg-slate-800 text-emerald-300 border-none font-bold cursor-pointer"
                      >
                        {{ p.status === 'PUBLISHED' ? 'Bozza' : 'Pubblica' }}
                      </button>
                      <button
                        type="button"
                        @click="toggleFeatured(p.id)"
                        class="px-2 py-1.5 rounded-lg bg-slate-800 text-amber-300 border-none font-bold cursor-pointer"
                      >
                        Top
                      </button>
                      <button
                        type="button"
                        @click="deletePost(p.id)"
                        class="px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-300 hover:bg-rose-500 hover:text-white font-bold cursor-pointer"
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="filteredPosts.length === 0">
                  <td colspan="4" class="p-10 text-center text-slate-400">
                    Nessun articolo trovato in questa vista. Clicca su <strong>+ Nuovo Articolo</strong> per iniziare.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <!-- MODALE CREAZIONE / MODIFICA CATEGORIA E SOTTOCATEGORIA -->
    <Teleport to="body">
      <div
        v-if="showCatModal"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="showCatModal = false"
      >
        <form @submit.prevent="submitCategoryModal" class="bg-[#090d16] border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-white font-bold text-base m-0">
              {{
                catModalMode === 'create_cat'
                  ? 'Nuova Categoria Blog'
                  : catModalMode === 'edit_cat'
                    ? 'Modifica Categoria'
                    : catModalMode === 'create_sub'
                      ? `Nuova Sottocategoria in ${catForm.name}`
                      : `Modifica Sottocategoria (${catForm.name})`
              }}
            </h3>
            <button type="button" @click="showCatModal = false" class="bg-transparent border-none text-slate-400 hover:text-white cursor-pointer font-bold">Chiudi</button>
          </div>

          <template v-if="catModalMode === 'create_cat' || catModalMode === 'edit_cat'">
            <div class="space-y-1">
              <label class="text-[10px] text-slate-400 font-bold uppercase">Nome Categoria *</label>
              <input v-model="catForm.name" type="text" required placeholder="Es. Kernel & Systems" class="w-full bg-[#030712] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl outline-none box-border" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] text-slate-400 font-bold uppercase">Descrizione</label>
              <input v-model="catForm.description" type="text" placeholder="Descrizione breve..." class="w-full bg-[#030712] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl outline-none box-border" />
            </div>
          </template>

          <template v-else>
            <div class="space-y-1">
              <label class="text-[10px] text-slate-400 font-bold uppercase">Nome Sottocategoria *</label>
              <input v-model="catForm.subName" type="text" required placeholder="Es. Pure SQL Benchmarks" class="w-full bg-[#030712] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl outline-none box-border" />
            </div>
          </template>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="showCatModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 border-none font-bold cursor-pointer">Annulla</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold border-none cursor-pointer">Salva</button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- MODALE EDITOR NATIVO DkpEditor + METADATI EDITORIALI -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        @click.self="showModal = false"
      >
        <div class="bg-[#090d16] border border-cyan-500/40 rounded-2xl w-full max-w-5xl p-5 shadow-2xl space-y-4 font-mono text-xs max-h-[95vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <h3 class="text-white font-bold text-lg m-0 font-display">
                {{ editingId ? `Modifica Articolo #${editingId}` : 'Nuovo Articolo Editorial Blog' }}
              </h3>
              <span class="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold">
                DkpEditor + AI Studio
              </span>
            </div>
            <button type="button" @click="showModal = false" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 hover:text-white cursor-pointer">Chiudi</button>
          </div>

          <DkpEditor :key="editingId ?? 'new'" v-model="editorModel" />

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#030712] border border-slate-800 rounded-xl p-3.5">
            <div class="space-y-1">
              <label class="text-[10px] text-slate-400 font-bold uppercase">Slug URL (Opzionale)</label>
              <input v-model="extraMeta.slug" type="text" placeholder="auto-dal-titolo" class="w-full bg-[#030712] border border-slate-700 text-cyan-300 px-3 py-2 rounded-lg outline-none box-border" />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] text-slate-400 font-bold uppercase">URL Copertina</label>
              <input v-model="extraMeta.coverImage" type="url" placeholder="https://..." class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-lg outline-none box-border" />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] text-slate-400 font-bold uppercase">Autore</label>
              <input v-model="extraMeta.author" type="text" class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-lg outline-none box-border" />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] text-slate-400 font-bold uppercase">Stato Pubblicazione</label>
              <select v-model="extraMeta.status" class="w-full bg-[#030712] border border-slate-700 text-emerald-300 font-bold px-3 py-2 rounded-lg cursor-pointer">
                <option value="PUBLISHED">PUBLISHED (Live)</option>
                <option value="DRAFT">DRAFT (Bozza)</option>
              </select>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <label class="flex items-center gap-2 text-slate-200 font-bold cursor-pointer">
              <input v-model="extraMeta.isFeatured" type="checkbox" class="w-4 h-4 accent-emerald-500 cursor-pointer" />
              <span>Metti articolo In Evidenza (Featured in cima al Blog)</span>
            </label>

            <div class="flex gap-2">
              <button type="button" @click="showModal = false" class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 border-none font-bold cursor-pointer">Annulla</button>
              <button type="button" :disabled="isSaving" @click="savePost" class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-extrabold cursor-pointer">
                {{ isSaving ? 'Salvataggio...' : (editingId ? 'Aggiorna Articolo' : 'Pubblica Articolo') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODALE ANTEPRIMA ARTICOLO -->
    <Teleport to="body">
      <div
        v-if="showPreviewModal && previewPost"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="showPreviewModal = false"
      >
        <div class="bg-[#090d16] border border-cyan-500/40 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <span class="font-mono text-xs text-cyan-400 font-bold uppercase">
              {{ previewPost.category }} <span v-if="previewPost.subCategory">/ {{ previewPost.subCategory }}</span> — {{ previewPost.status }}
            </span>
            <button type="button" @click="showPreviewModal = false" class="bg-transparent border-none text-slate-400 hover:text-white text-sm font-bold cursor-pointer">Chiudi</button>
          </div>
          <h2 class="text-white text-2xl font-extrabold m-0">{{ previewPost.title }}</h2>
          <p v-if="previewPost.excerpt" class="text-slate-300 text-sm italic m-0">{{ previewPost.excerpt }}</p>
          <div class="bg-[#030712] border border-slate-800 rounded-xl p-5 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed" v-html="renderedPreviewHtml"></div>
        </div>
      </div>
    </Teleport>
  </DkpAdminShell>
</template>