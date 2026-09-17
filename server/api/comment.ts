// server/api/comment.ts
import { getDb } from '../db';
import { comments } from '../db/schema';

export default defineEventHandler(async (event) => {
  // 1. Permetti solo richieste di tipo POST
  assertMethod(event, ['POST']);

  try {
    // 2. Leggi il corpo della richiesta inviata dal frontend
    const body = await readBody(event);

    // Validazione dei dati obbligatori
    if (!body.postId || !body.content) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID del post e contenuto del commento sono obbligatori.',
      });
    }

    // 3. Inizializziamo il database in modo sicuro
    const db = getDb();

    // 4. Inseriamo il commento nella tabella
    const [newComment] = await db.insert(comments).values({
      postId: Number(body.postId),
      parentId: body.parentId ? Number(body.parentId) : null, // Se è una risposta a un altro commento
      content: body.content,
    }).returning();

    // 5. Invia la risposta di successo
    return {
      success: true,
      message: 'Commento aggiunto con successo!',
      comment: newComment
    };

  } catch (error: any) {
    console.error('Errore durante il salvataggio del commento su Neon:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Errore interno del server durante il salvataggio del commento.',
    });
  }
});