<!-- app/components/Navbar.vue -->
<script setup lang="ts">
// NuxtLink gestisce automaticamente l'evidenziazione del link attivo con la classe active-class
</script>

<template>
  <header class="navbar-header">
    <div class="navbar-container">
      <!-- Logo e Titolo -->
      <NuxtLink to="/" class="brand">
        <span class="logo">Y</span>
        <span class="brand-title">Hacker News</span>
      </NuxtLink>

      <!-- Menu di Navigazione -->
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
  gap: 10px;
  flex-wrap: wrap;
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

.nav-links {
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

.nav-link.active {
  color: #ffffff;
  font-weight: bold;
}

.separator {
  color: #222222;
  font-size: 0.8rem;
}
</style>