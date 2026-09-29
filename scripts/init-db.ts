// scripts/init-db.ts
import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL mancante nel file .env!')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function initTables() {
  console.log('⚡ Creazione sicura delle tabelle orders e licenses su Neon DB...')

  try {
    // 1. Creazione Tipi Enum (se non esistono già)
    await sql`
      DO $$ BEGIN
        CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
        CREATE TYPE license_status AS ENUM ('active', 'suspended', 'revoked', 'expired');
        CREATE TYPE payment_provider AS ENUM ('stripe', 'paypal');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    // 2. Creazione Tabella Orders
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_email VARCHAR(255) NOT NULL,
        product_id VARCHAR(100) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'EUR' NOT NULL,
        payment_provider payment_provider NOT NULL,
        payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
        status order_status DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `

    // 3. Creazione Tabella Licenses
    await sql`
      CREATE TABLE IF NOT EXISTS licenses (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        license_key VARCHAR(64) UNIQUE NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        product_id VARCHAR(100) NOT NULL,
        status license_status DEFAULT 'active' NOT NULL,
        downloads_count INT DEFAULT 0 NOT NULL,
        max_downloads INT DEFAULT 10 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NULL
      );
    `

    console.log('✅ Tabelle orders e licenses create con successo senza toccare i dati della Chat/XP!')
  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione delle tabelle:', error)
  }
}

initTables()