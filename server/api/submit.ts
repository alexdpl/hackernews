// server/api/submit.ts
import { getDb } from '../db';
import { posts } from '../db/schema';

export default defineEventHandler(async (event) => {
  assertMethod(event, ['POST']);

  try {
    const body = await readBody(event);
	
	if (!body.title || !body.url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Titolo e URL sono campi obbligatori.',
      });
    }

    // Inizializziamo il database in modo sicuro all'interno della richiesta
    const db = getDb();

    const [newPost] = await db.insert(posts).values({
      title: body.title,
      url: body.url,
    }).returning();

    return {
      success: true,
      message: 'Link salvato correttamente nel database!',
      post: newPost
    };

  } catch (error: any) {
    console.error('Errore durante il salvataggio su Neon:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Errore interno del server.',
    });
  }
});