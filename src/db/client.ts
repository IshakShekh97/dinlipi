import * as SQLite from 'expo-sqlite';
import { drizzle, useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const expoDb = SQLite.openDatabaseSync('dinlipi.db', { enableChangeListener: true });
export const db = drizzle(expoDb, { schema });
export { useLiveQuery };

/**
 * Initializes the SQLite database and creates tables if they don't exist yet.
 * Also ensures initial seeds (default user profile, initial categories, cards, transactions, people) are populated.
 */
export async function initializeDatabase() {
  try {
    // 1. Ensure tables exist
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        currency TEXT DEFAULT 'BDT',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS budget_cards (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        total_limit REAL NOT NULL,
        spent REAL DEFAULT 0,
        color TEXT NOT NULL,
        mesh_gradient TEXT,
        icon TEXT DEFAULT 'wallet',
        cycle_date TEXT DEFAULT '1st of month',
        is_default INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        budget_limit REAL DEFAULT 0,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        aliases TEXT DEFAULT '[]',
        avatar TEXT DEFAULT '',
        total_lent REAL DEFAULT 0,
        total_borrowed REAL DEFAULT 0,
        notes TEXT DEFAULT '',
        card_id TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS installments (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        person_id TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        category_id TEXT,
        person_id TEXT,
        card_id TEXT,
        timestamp TEXT NOT NULL,
        notes TEXT DEFAULT '',
        tags TEXT DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS recurring (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        frequency TEXT NOT NULL,
        next_due_date TEXT NOT NULL,
        category_id TEXT,
        is_active INTEGER DEFAULT 1
      );
      DELETE FROM transactions WHERE title IN ('Stripe', 'Payout', 'Broody', 'Spotify', 'Coffee', 'Gym Membership', 'Sample Income', 'Sample Expense');
    `);

    try {
      expoDb.execSync("ALTER TABLE people ADD COLUMN card_id TEXT DEFAULT '';");
    } catch {
      // Column already exists
    }

    console.log('[Drizzle/SQLite] Database tables initialized with zero prefilled data.');
  } catch (err) {
    console.error('[Drizzle/SQLite] Initialization error:', err);
  }
}
