// server/api/news.ts
import { getDb } from '../db';
import { posts } from '../db/schema';
import { desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const db = getDb();

    // Estrae i post da Neon ordinati dal più recente (created_at desc)
    const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));

    // Formatta la risposta per renderla compatibile con la visualizzazione del template
    return allPosts.map(post => ({
      id: post.id,
      title: post.title,
      url: post.url,
      time: Math.floor(new Date(post.createdAt).getTime() / 1000),
      // Mock dei campi opzionali richiesti dal layout originale per evitare errori grafici
      score: 1,
      by: 'Utente',
      descendants: 0, 
      type: 'link'
    }));

  } catch (error) {
    console.error('Errore nel recupero dei post da Neon:', error);
    return [];
  }
});