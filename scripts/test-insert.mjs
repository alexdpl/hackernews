// test-insert.mjs
import postgres from 'postgres';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente dal file .env
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERRORE: DATABASE_URL non trovata nelle variabili d'ambiente o nel file .env!");
  process.exit(1);
}

// Inizializza il client postgres (lo stesso motore usato da Neon)
const sql = postgres(connectionString, { ssl: 'require' });

async function runDiagnostic() {
  console.log("🔌 Connessione a Neon PostgreSQL in corso...");
  
  try {
    // 1. Controlliamo se esiste un utente (Autore)
    const users = await sql`SELECT id, username FROM users LIMIT 1`;
    let authorId;
    
    if (users.length === 0) {
      console.log("⚠️ Tabella 'users' vuota. Creo un utente amministratore di test...");
      const newAdmin = await sql`
        INSERT INTO users (username, email, role, xp) 
        VALUES ('Admin Diagnostico', 'admin@diagnostic.com', 'admin', 500) 
        RETURNING id;
      `;
      authorId = newAdmin[0].id;
      console.log(`✅ Utente creato con ID: ${authorId}`);
    } else {
      authorId = users[0].id;
      console.log(`✅ Autore trovato nel DB: ID ${authorId} (${users[0].username})`);
    }

    // 2. Controlliamo se esiste almeno una categoria
    const categories = await sql`SELECT id, name FROM blog_categories LIMIT 1`;
    if (categories.length === 0) {
      console.error("❌ ERRORE CRITICO: La tabella 'blog_categories' è completamente vuota! Crea prima una categoria.");
      process.exit(1);
    }
    const categoryId = categories[0].id;
    console.log(`✅ Categoria trovata nel DB: ID ${categoryId} (${categories[0].name})`);

    // 3. Tentiamo l'inserimento diretto di un post di test
    console.log("🔄 Tentativo di inserimento post di test nel database...");
    
    const title = "Post di Test Diagnostico " + Date.now();
    const slug = "post-test-diagnostico-" + Date.now();

    const insertedPost = await sql`
      INSERT INTO blog_posts (
        title, slug, content, excerpt, category_id, author_id, status, is_verified, views, likes
      ) VALUES (
        ${title}, ${slug}, 'Contenuto di prova diagnostica', 'Estratto di prova', ${categoryId}, ${authorId}, 'published', true, 0, 0
      ) 
      RETURNING id, title, slug, status;
    `;

    console.log("\n🎉 SUCCESSO ASSOLUTO! Il post è stato salvato nel database:");
    console.log(insertedPost[0]);

  } catch (error) {
    console.error("\n💥 IL DATABASE HA RESPINTO L'INSERIMENTO:");
    console.error("Codice Errore Postgres:", error.code);
    console.error("Messaggio:", error.message);
    console.error("Dettagli completi:", error);
  } finally {
    await sql.end();
    console.log("\n🔌 Connessione chiusa.");
  }
}

runDiagnostic();