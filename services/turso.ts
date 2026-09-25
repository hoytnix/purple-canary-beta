import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const turso = createClient({
  url,
  authToken,
});

export const db = drizzle(turso, { schema });

export async function initDatabase(): Promise<void> {
  // 1. Drop deprecated subscriptions table if present
  try {
    await turso.execute(`DROP TABLE IF EXISTS subscriptions;`);
  } catch {
    // Ignore error if table cannot be dropped
  }

  // 2. Migrate users table to remove deprecated email, subscription_status, and credits
  try {
    const tableInfo = await turso.execute(`PRAGMA table_info(users)`);
    const cols = tableInfo.rows.map((r: any) => r.name);
    if (cols.includes('subscription_status') || cols.includes('credits') || (cols.includes('id') && !cols.includes('public_key'))) {
      await turso.execute(`PRAGMA foreign_keys = OFF;`);
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS users_clean (
          public_key TEXT PRIMARY KEY,
          nonce INTEGER DEFAULT 0,
          stripe_customer_id TEXT,
          username TEXT DEFAULT 'Shaggy',
          tier TEXT DEFAULT 'free',
          access TEXT DEFAULT 'Alpha',
          shipping_name TEXT,
          shipping_address TEXT,
          shipping_city TEXT,
          shipping_zip TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const keyCol = cols.includes('public_key') ? 'public_key' : 'id';
      const lastLoginCol = cols.includes('last_login') ? 'last_login' : 'created_at';
      await turso.execute(`
        INSERT OR IGNORE INTO users_clean (public_key, stripe_customer_id, username, tier, access, shipping_name, shipping_address, shipping_city, shipping_zip, created_at, last_login)
        SELECT ${keyCol}, stripe_customer_id, username, tier, access, shipping_name, shipping_address, shipping_city, shipping_zip, created_at, COALESCE(${lastLoginCol}, created_at) FROM users;
      `);
      await turso.execute(`DROP TABLE users;`);
      await turso.execute(`ALTER TABLE users_clean RENAME TO users;`);
      await turso.execute(`PRAGMA foreign_keys = ON;`);
    }
  } catch {
    // Proceed if table doesn't exist yet
  }

  // 3. Ensure clean users table exists
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      public_key TEXT PRIMARY KEY,
      private_key_hash TEXT,
      nonce INTEGER DEFAULT 0,
      stripe_customer_id TEXT,
      username TEXT DEFAULT 'Shaggy',
      tier TEXT DEFAULT 'free',
      access TEXT DEFAULT 'Alpha',
      shipping_name TEXT,
      shipping_address TEXT,
      shipping_city TEXT,
      shipping_zip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Ensure scans table exists
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      substance_name TEXT,
      result_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(public_key)
    );
  `);

  // 5. Ensure transactions table exists
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stripe_session_id TEXT UNIQUE,
      amount INTEGER,
      currency TEXT DEFAULT 'usd',
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(public_key)
    );
  `);
}
