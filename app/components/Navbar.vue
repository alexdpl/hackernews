<!-- app/components/Navbar.vue -->
<script setup lang="ts">
// Cookie persistenti di Nuxt per mantenere il login tra i cambi pagina
const isLoggedIn = useCookie('dkp_logged_in')
const currentUser = useCookie('dkp_user')

function handleLogout() {
  isLoggedIn.value = false
  currentUser.value = null
  navigateTo('/')
}
</script>

<template>
  <header class="navbar-header">
    <div class="navbar-container">
      <!-- Logo e Titolo -->
      <NuxtLink to="/" class="brand">
        <span class="logo">Y</span>
        <span class="brand-title">DevKernelPulse</span>
      </NuxtLink>

      <!-- Menu di Navigazione Principale -->
      <nav class="nav-links">
        <NuxtLink to="/newest" class="nav-link" active-class="active">new</NuxtLink>
        <span class="separator">|</span>
        <NuxtLink to="/ask" class="nav-link" active-class="active">ask</NuxtLink>
        <span class="separator">|</span>
        <NuxtLink to="/show" class="nav-link" active-class="active">show</NuxtLink>
        <span class="separator">|</span>
        <NuxtLink to="/jobs" class="nav-link" active-class="active">jobs</NuxtLink>
        <span class="separator">|</span>
        <NuxtLink to="/submit" class="nav-link" active-class="active">submit</NuxtLink>
      </nav>

      <!-- Sezione Autenticazione (Gestione Cookie) -->
      <div class="nav-auth">
        <span class="separator">|</span>
        <template v-if="isLoggedIn">
          <NuxtLink :to="`/user/${currentUser}`" class="nav-link active-user">@{{ currentUser }}</NuxtLink>
          <span class="separator">|</span>
          <button @click="handleLogout" class="logout-btn">logout</button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="nav-link" active-class="active">login</NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar-header {
  background-color: #ff6600;
  padding: 6px 12px;
  font-family: Verdana, Geneva, sans-serif;
}

.navbar-container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  font-weight: bold;
}

.logo {
  border: 1px solid #ffffff;
  color: #ffffff;
  font-weight: bold;
  padding: 1px 5px;
  font-size: 0.85rem;
  line-height: 1;
}

.brand-title {
  font-size: 0.95rem;
  color: #222222;
}

.nav-links, .nav-auth {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.nav-link {
  color: #222222;
  text-decoration: none;
}

.nav-link:hover {
  text-decoration: underline;
}

.nav-link.active, .active-user {
  color: #ffffff;
  font-weight: bold;
}

.separator {
  color: #222222;
  font-size: 0.8rem;
}

.logout-btn {
  background: none;
  border: none;
  color: #222222;
  cursor: pointer;
  font-family: Verdana, Geneva, sans-serif;
  font-size: 0.85rem;
  padding: 0;
}

.logout-btn:hover {
  text-decoration: underline;
}
</style>