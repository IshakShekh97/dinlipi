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
    `);

    // 2. Check and seed default user profile if empty
    const existingUsers = db.select().from(schema.usersTable).all();
    if (existingUsers.length === 0) {
      db.insert(schema.usersTable).values({
        id: 'default_user',
        name: 'Valued Member',
        phone: '',
        avatar: 'avatar_matcha_fox',
        currency: '₹ INR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();
    }

    // 3. Seed initial categories if empty
    const existingCategories = db.select().from(schema.categoriesTable).all();
    if (existingCategories.length === 0) {
      const defaultCategories = [
        { id: 'cat_groceries', name: 'Groceries', icon: 'shopping-bag', color: '#CEF04A', budgetLimit: 12000, type: 'expense' },
        { id: 'cat_dining', name: 'Dining Out', icon: 'utensils', color: '#E07A5F', budgetLimit: 5000, type: 'expense' },
        { id: 'cat_rent', name: 'Housing & Rent', icon: 'home', color: '#81B29A', budgetLimit: 22000, type: 'expense' },
        { id: 'cat_bills', name: 'Utilities & Bills', icon: 'zap', color: '#F2CC8F', budgetLimit: 4000, type: 'expense' },
        { id: 'cat_salary', name: 'Salary', icon: 'briefcase', color: '#CEF04A', budgetLimit: 0, type: 'income' },
        { id: 'cat_freelance', name: 'Freelance & Bonus', icon: 'dollar-sign', color: '#81B29A', budgetLimit: 0, type: 'income' },
      ];

      for (const cat of defaultCategories) {
        db.insert(schema.categoriesTable).values({
          ...cat,
          createdAt: new Date().toISOString(),
        }).run();
      }
    }

    console.log('[Drizzle/SQLite] Database initialized dynamically with zero mock data.');
  } catch (err) {
    console.error('[Drizzle/SQLite] Initialization error:', err);
  }
}
