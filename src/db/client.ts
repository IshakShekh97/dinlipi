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

      CREATE TABLE IF NOT EXISTS payment_qrs (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        upi_id TEXT DEFAULT '',
        image_uri TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );
      DELETE FROM transactions WHERE title IN ('Stripe', 'Payout', 'Broody', 'Spotify', 'Coffee', 'Gym Membership', 'Sample Income', 'Sample Expense');
    `);

    try {
      expoDb.execSync("ALTER TABLE people ADD COLUMN card_id TEXT DEFAULT '';");
    } catch {
      // Column already exists
    }

    try {
      expoDb.execSync("ALTER TABLE users ADD COLUMN upi_id TEXT DEFAULT '';");
    } catch {
      // Column already exists
    }

    try {
      expoDb.execSync("ALTER TABLE users ADD COLUMN qr_code_uri TEXT DEFAULT '';");
    } catch {
      // Column already exists
    }

    // Automatically self-heal budget cards and people balances from actual transactions on start
    try {
      expoDb.execSync(`
        UPDATE budget_cards
        SET spent = COALESCE((
          SELECT SUM(CASE WHEN type IN ('expense', 'lend') THEN amount WHEN type IN ('income', 'borrow') THEN -amount ELSE 0 END)
          FROM transactions
          WHERE transactions.card_id = budget_cards.id
        ), 0);

        UPDATE people
        SET total_lent = COALESCE((
          SELECT SUM(amount) FROM transactions WHERE transactions.person_id = people.id AND transactions.type IN ('lend', 'expense')
        ), 0),
        total_borrowed = COALESCE((
          SELECT SUM(amount) FROM transactions WHERE transactions.person_id = people.id AND transactions.type IN ('income', 'borrow')
        ), 0);
      `);
    } catch (e) {
      console.warn('[Drizzle/SQLite] Database balance self-healing skipped:', e);
    }

    console.log('[Drizzle/SQLite] Database tables initialized and balances synchronized.');
  } catch (err) {
    console.error('[Drizzle/SQLite] Initialization error:', err);
  }
}
