<!-- app/pages/[feed]/[page].vue -->
<script setup lang="ts">
// Esegue la chiamata verso la nostra nuova API interna connessa a Neon
const { data: items, error } = await useFetch('/api/news')
</script>

<template>
  <div class="view">
    <div v-if="error" class="error-msg">
      Errore nel caricamento dei dati dal database.
    </div>

    <div v-else-if="!items || items.length === 0" class="empty-msg">
      Nessun link presente. Usa il tasto "Invia Link" in alto per aggiungere il primo!
    </div>

    <div v-else class="item-list">
      <ul>
        <li v-for="(item, index) in items" :key="item.id" class="news-item">
          <span class="index">{{ index + 1 }}.</span>
          <div class="main-text">
            <a :href="item.url" target="_blank" class="title-link">
              {{ item.title }}
            </a>
            <span class="url-domain">({{ item.url.replace('https://','').replace('http://','').split('/')[0] }})</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.view {
  padding: 10px 20px;
  background-color: #f6f6ef;
}
.news-item {
  display: flex;
  align-items: flex-start;
  margin-top: 10px;
  font-family: sans-serif;
  font-size: 0.95rem;
}
.index {
  color: #828282;
  margin-right: 5px;
  min-width: 20px;
  text-align: right;
}
.title-link {
  color: #000;
  text-decoration: none;
}
.title-link:hover {
  text-decoration: underline;
}
.url-domain {
  font-size: 0.75rem;
  color: #828282;
  margin-left: 5px;
}
.error-msg, .empty-msg {
  padding: 20px;
  text-align: center;
  font-family: sans-serif;
  color: #555;
}
</style>