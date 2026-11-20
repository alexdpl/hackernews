<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

interface UserRow {
  id: number
  username: string
  email: string
  role: string
  karma: number
  isBanned: boolean
  createdAt?: string
}

const users = ref<UserRow[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const feedbackMsg = ref('')

async function fetchUsers() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/admin/users?_t=${Date.now()}`)
    if (res?.success) users.value = res.data || []
  } finally {
    isLoading.value = false
  }
}

const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return users.value
  return users.value.filter(u =>
    (u.username || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q) ||
    (u.role || '').toLowerCase().includes(q)
  )
})

async function changeRole(u: UserRow, role: string) {
  const res: any = await $fetch('/api/admin/users', { method: 'POST', body: { action: 'set_role', id: u.id, role } }).catch(() => null)
  if (res?.success) {
    u.role = role
    feedbackMsg.value = res.message
  }
}

async function toggleBan(u: UserRow) {
  const res: any = await $fetch('/api/admin/users', { method: 'POST', body: { action: 'toggle_ban', id: u.id } }).catch(() => null)
  if (res?.success) {
    u.isBanned = !u.isBanned
    feedbackMsg.value = res.message
  }
}

onMounted(fetchUsers)
</script>

<template>
  <DkpAdminShell
    title="Utenti & RBAC Access Control"
    subtitle="Gestisci ruoli amministrativi (ADMIN, MODERATOR, BUILDER, USER), karma e moderazione account."
    badge="IAM & RBAC v2.6"
    seo-title="Utenti & RBAC — DKP Admin v2.6"
  >
    <template #actions>
      <button type="button" @click="fetchUsers" class="px-4 py-2.5 rounded-xl bg-dkp-bg border border-dkp-border text-cyan-400 font-bold cursor-pointer">
         Aggiorna Lista
      </button>
    </template>

    <div v-if="feedbackMsg" class="bg-emerald-500/15 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold px-4 py-3 rounded-xl">
       {{ feedbackMsg }}
    </div>

    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Filtra utenti per username, email o ruolo..."
        class="w-full bg-dkp-bg border border-dkp-border text-white px-4 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-cyan-400 box-border"
      />
    </section>

    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow font-mono text-xs">
      <div v-if="isLoading" class="p-8 text-center text-cyan-400">Caricamento utenti da Neon DB...</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-dkp-bg border-b border-dkp-border text-slate-400 uppercase text-[11px]">
              <th class="p-4">Utente</th>
              <th class="p-4">Email</th>
              <th class="p-4">Karma</th>
              <th class="p-4">Ruolo RBAC</th>
              <th class="p-4 text-right">Moderazione</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dkp-border/60">
            <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-slate-900/50">
              <td class="p-4 font-bold text-white">@{{ u.username }}</td>
              <td class="p-4 text-slate-300">{{ u.email }}</td>
              <td class="p-4 text-emerald-400 font-bold">{{ u.karma }}</td>
              <td class="p-4">
                <select
                  :value="u.role || 'USER'"
                  @change="changeRole(u, ($event.target as HTMLSelectElement).value)"
                  class="bg-dkp-bg border border-dkp-border text-cyan-300 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="BUILDER">BUILDER</option>
                  <option value="USER">USER</option>
                </select>
              </td>
              <td class="p-4 text-right">
                <button
                  type="button"
                  @click="toggleBan(u)"
                  :class="[
                    'px-3 py-1.5 rounded-lg border font-bold cursor-pointer',
                    u.isBanned ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  ]"
                >
                  {{ u.isBanned ? 'Riabilita' : 'Sospendi' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </DkpAdminShell>
</template>