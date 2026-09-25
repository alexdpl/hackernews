// server/api/news/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '1'

  // Notizie dimostrative ed ecosistema DKP
  const mockStories: Record<string, any> = {
    '1': {
      id: 1,
      title: 'DevKernelPulse v2.0 Released: Modular SaaS Architecture with Nuxt 3 & GCP',
      domain: 'devkernelpulse.org',
      url: 'https://github.com/alexdpl/hackernews',
      user: 'alexdpl',
      points: 184,
      time_ago: '2 ore fa',
      comments_count: 3,
      content: 'Abbiamo rilasciato la versione 2.0 di DevKernelPulse con DKP Auth Core, Vault crittografico, suite di tool integrata e deploy su GCP Compute Engine.',
      comments: [
        { id: 10, user: 'marco_vue', time_ago: '1 ora fa', text: 'Architettura fantastica! La velocità con SSR su GCP è pazzesca.' },
        { id: 11, user: 'ts_master', time_ago: '45 minuti fa', text: 'Come gestite la connessione con Neon PostgreSQL serverless?' },
        { id: 12, user: 'alexdpl', time_ago: '20 minuti fa', text: 'Usiamo Drizzle ORM con pooling ottimizzato e fallback sicuro.' }
      ]
    }
  }

  // Tenta di restituire la storia richiesta o un fallback di default
  const story = mockStories[id] || {
    id: Number(id),
    title: `Notizia Tech DKP #${id}: Ottimizzazioni Full-Stack Nuxt 3`,
    domain: 'devkernelpulse.org',
    url: 'https://devkernelpulse.org',
    user: 'alexdpl',
    points: 42,
    time_ago: 'Di recente',
    comments_count: 1,
    content: 'Discussione relativa alle ultime novità dell\'ecosistema developer DKP.',
    comments: [
      { id: 99, user: 'community_member', time_ago: 'Pochi minuti fa', text: 'Ottimo post! Seguo con interesse lo sviluppo.' }
    ]
  }

  return story
})