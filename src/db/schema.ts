import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').default(''),
  avatar: text('avatar').default(''),
  currency: text('currency').default('BDT'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const budgetCardsTable = sqliteTable('budget_cards', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  totalLimit: real('total_limit').notNull(),
  spent: real('spent').default(0),
  color: text('color').notNull(),
  meshGradient: text('mesh_gradient'),
  icon: text('icon').default('wallet'),
  cycleDate: text('cycle_date').default('1st of month'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

export const categoriesTable = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  budgetLimit: real('budget_limit').default(0),
  type: text('type').notNull(), // 'expense' | 'income'
  createdAt: text('created_at').notNull(),
});

export const peopleTable = sqliteTable('people', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').default(''),
  aliases: text('aliases').default('[]'), // JSON array of aliases e.g. ["Chhotu", "Shopkeeper"]
  avatar: text('avatar').default(''),
  totalLent: real('total_lent').default(0),
  totalBorrowed: real('total_borrowed').default(0),
  notes: text('notes').default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const installmentsTable = sqliteTable('installments', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').default('pending'), // 'pending' | 'paid'
  personId: text('person_id'),
  createdAt: text('created_at').notNull(),
});

export const transactionsTable = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'expense' | 'income' | 'lend' | 'borrow'
  categoryId: text('category_id'),
  personId: text('person_id'),
  cardId: text('card_id'),
  timestamp: text('timestamp').notNull(),
  notes: text('notes').default(''),
  tags: text('tags').default('[]'), // JSON array of tags
});

export const recurringTable = sqliteTable('recurring', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  frequency: text('frequency').notNull(), // 'daily' | 'weekly' | 'monthly'
  nextDueDate: text('next_due_date').notNull(),
  categoryId: text('category_id'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

export type UserRow = typeof usersTable.$inferSelect;
export type BudgetCardRow = typeof budgetCardsTable.$inferSelect;
export type CategoryRow = typeof categoriesTable.$inferSelect;
export type PersonRow = typeof peopleTable.$inferSelect;
export type InstallmentRow = typeof installmentsTable.$inferSelect;
export type TransactionRow = typeof transactionsTable.$inferSelect;
export type RecurringRow = typeof recurringTable.$inferSelect;
