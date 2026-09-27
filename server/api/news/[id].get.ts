// server/api/news/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'

export default defineEventHandler(async (event) => {
  // 1. Estrazione e validazione sicura del parametro 'id'
  const rawId = getRouterParam(event, 'id')
  const id = rawId || '1'
  const numericId = Number(id)

  if (!rawId || isNaN(numericId) || numericId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID notizia non valido o mancante.'
    })
  }

  // 2. Notizie d'ecosistema e mock stories allineate a Kernel v2.3
  const mockStories: Record<string, any> = {
    '101': {
      id: 101,
      title: 'DevKernelPulse v2.3 Released: Modular SaaS Architecture with Nuxt 4 & GCP',
      domain: 'devkernelpulse.org',
      url: 'https://github.com/alexdpl/hackernews',
      user: 'alexdpl',
      points: 184,
      time_ago: '2 ore fa',
      comments_count: 3,
      content: 'Abbiamo rilasciato la versione 2.3 di DevKernelPulse con DKP Auth Core, agente Pulse Nexus AI, suite di DKP Tools integrata, Neon Postgres serverless e deploy su GCP Compute Engine.',
      comments: [
        { id: 10, user: 'marco_vue', time_ago: '1 ora fa', text: 'Architettura fantastica! La velocità con SSR su GCP e Nuxt 4 è pazzesca.' },
        { id: 11, user: 'ts_master', time_ago: '45 minuti fa', text: 'Come gestite la connessione con Neon PostgreSQL serverless?' },
        { id: 12, user: 'alexdpl', time_ago: '20 minuti fa', text: 'Usiamo Drizzle ORM con connection pooling e fallback isolato per la massima resilienza.' }
      ]
    },
    '1': {
      id: 1,
      title: 'Ollaya – Ollama for open-source, Jev-style decision models',
      domain: 'ollaya.dev',
      url: 'https://ollaya.dev',
      user: 'alexdpl',
      points: 18,
      time_ago: '22h fa',
      comments_count: 2,
      content: 'Integrazione di modelli decisionali open source e supporto Ollama nell ecosistema DKP.',
      comments: [
        { id: 201, user: 'dev_guru', time_ago: '2 ore fa', text: 'Ispirante! Come integrerete questi modelli in Pulse Nexus?' },
        { id: 202, user: 'alexdpl', time_ago: '1 ora fa', text: 'Tramite l architettura ad agenti modulari di DKP Tools.' }
      ]
    }
  }

  // 3. Restituisce la storia richiesta se presente, altrimenti genera un fallback dinamico v2.3
  const story = mockStories[id] || {
    id: numericId,
    title: `Notizia Tech DKP #${numericId}: Ottimizzazioni Full-Stack Kernel v2.3`,
    domain: 'devkernelpulse.org',
    url: 'https://devkernelpulse.org',
    user: 'alexdpl',
    points: 42,
    time_ago: 'Di recente',
    comments_count: 1,
    content: 'Discussione e aggiornamenti di sistema legati all ecosistema developer DevKernelPulse.',
    comments: [
      { id: 99, user: 'kernel_agent', time_ago: 'Pochi minuti fa', text: 'Notizia verificata dal DKP Crawler v2.3 e sincronizzata con il DB Neon.' }
    ]
  }

  return story
})