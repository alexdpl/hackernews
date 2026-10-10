// scripts/test-endpoint.mjs
import { getDb } from '../server/utils/db.ts';
import { pulseChatMessages, users } from '../drizzle/schema.ts';

async function test() {
  console.log("🧪 Avvio test manuale connessione DB e tabelle...");
  try {
    const db = await getDb();
    console.log("🟢 Connessione DB riuscita!");
    
    const usersCount = await db.select().from(users).limit(1);
    console.log("🟢 Tabella users interrogata con successo. Risultato:", usersCount);
    
    const messagesCount = await db.select().from(pulseChatMessages).limit(1);
    console.log("🟢 Tabella pulse_chat_messages interrogata con successo. Risultato:", messagesCount);
    
    console.log("✨ Test completato senza errori critici nel DB!");
  } catch (err) {
    console.error("❌ ERRORE CRITICO INTERCETTATO:", err);
  }
}

test();