import { useMemo } from 'react';
import { eq, desc, asc } from 'drizzle-orm';
import { db, useLiveQuery } from './client';
import * as schema from './schema';
import { BudgetCardData } from '../components/cards/BudgetCardModal';
import { PersonData } from '../components/khata/PersonManagerModal';
import { CategoryItem } from '../components/categories/CategoryManagerModal';
import { RecurringTransaction } from '../components/recurring/RecurringManagerModal';

// ==========================================
// 1. REACTIVE LIVE QUERY HOOKS (Drizzle ORM)
// ==========================================

export function useTransactionsLive() {
  const query = useMemo(() => db.select().from(schema.transactionsTable).orderBy(desc(schema.transactionsTable.timestamp)), []);
  return useLiveQuery(query);
}

export function useBudgetCardsLive() {
  const query = useMemo(() => db.select().from(schema.budgetCardsTable).orderBy(desc(schema.budgetCardsTable.createdAt)), []);
  return useLiveQuery(query);
}

export function usePeopleLive() {
  const query = useMemo(() => db.select().from(schema.peopleTable).orderBy(asc(schema.peopleTable.name)), []);
  return useLiveQuery(query);
}

export function useCategoriesLive() {
  const query = useMemo(() => db.select().from(schema.categoriesTable).orderBy(asc(schema.categoriesTable.name)), []);
  return useLiveQuery(query);
}

export function useRecurringLive() {
  const query = useMemo(() => db.select().from(schema.recurringTable).orderBy(asc(schema.recurringTable.nextDueDate)), []);
  return useLiveQuery(query);
}

export function useInstallmentsLive(personId?: string) {
  const query = useMemo(() => {
    if (personId) {
      return db.select().from(schema.installmentsTable).where(eq(schema.installmentsTable.personId, personId));
    }
    return db.select().from(schema.installmentsTable).orderBy(desc(schema.installmentsTable.createdAt));
  }, [personId]);
  return useLiveQuery(query, [personId]);
}

export function useUserLive() {
  const query = useMemo(() => db.select().from(schema.usersTable).where(eq(schema.usersTable.id, 'default_user')), []);
  return useLiveQuery(query);
}

// ==========================================
// 2. TRANSACTION MUTATIONS
// ==========================================

export async function addTransaction(data: {
  title: string;
  amount: number;
  type: 'expense' | 'income' | 'lend' | 'borrow';
  categoryId?: string;
  personId?: string;
  cardId?: string;
  notes?: string;
  tags?: string[];
}) {
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  db.insert(schema.transactionsTable).values({
    id,
    title: data.title,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId || 'General',
    personId: data.personId,
    cardId: data.cardId,
    timestamp,
    notes: data.notes || '',
    tags: JSON.stringify(data.tags || []),
  }).run();

  return id;
}

export async function deleteTransaction(id: string) {
  db.delete(schema.transactionsTable).where(eq(schema.transactionsTable.id, id)).run();
}

// ==========================================
// 3. BUDGET CARD MUTATIONS
// ==========================================

export async function addBudgetCard(card: BudgetCardData) {
  db.insert(schema.budgetCardsTable).values({
    id: card.id,
    title: card.name,
    totalLimit: card.limit,
    spent: card.spent,
    color: card.variant || 'matchaLime',
    meshGradient: card.tabLabel || 'Card',
    icon: card.cardType.toLowerCase(),
    cycleDate: card.expiry || '1st of month',
    isDefault: false,
    createdAt: new Date().toISOString(),
  }).run();
}

export async function updateBudgetCard(card: BudgetCardData) {
  db.update(schema.budgetCardsTable)
    .set({
      title: card.name,
      totalLimit: card.limit,
      spent: card.spent,
      color: card.variant || 'matchaLime',
      meshGradient: card.tabLabel || 'Card',
      icon: card.cardType.toLowerCase(),
      cycleDate: card.expiry || '1st of month',
    })
    .where(eq(schema.budgetCardsTable.id, card.id))
    .run();
}

export async function deleteBudgetCard(id: string) {
  db.delete(schema.budgetCardsTable).where(eq(schema.budgetCardsTable.id, id)).run();
}

// ==========================================
// 4. KHATA / PEOPLE MUTATIONS
// ==========================================

export async function addPerson(person: PersonData) {
  const totalLent = person.type === 'receivable' ? person.totalDue : 0;
  const totalBorrowed = person.type === 'payable' ? person.totalDue : 0;

  db.insert(schema.peopleTable).values({
    id: person.id,
    name: person.name,
    phone: person.phone || '',
    aliases: JSON.stringify(person.aliases || []),
    avatar: person.avatarPreset || 'avatar_matcha_fox',
    totalLent,
    totalBorrowed,
    notes: person.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).run();
}

export async function updatePerson(person: PersonData) {
  const totalLent = person.type === 'receivable' ? person.totalDue : 0;
  const totalBorrowed = person.type === 'payable' ? person.totalDue : 0;

  db.update(schema.peopleTable)
    .set({
      name: person.name,
      phone: person.phone || '',
      aliases: JSON.stringify(person.aliases || []),
      avatar: person.avatarPreset || 'avatar_matcha_fox',
      totalLent,
      totalBorrowed,
      notes: person.notes || '',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.peopleTable.id, person.id))
    .run();
}

export async function deletePerson(id: string) {
  db.delete(schema.installmentsTable).where(eq(schema.installmentsTable.personId, id)).run();
  db.delete(schema.peopleTable).where(eq(schema.peopleTable.id, id)).run();
}

export async function recordInstallment(personId: string, amount: number, mode: 'UPI' | 'Cash' | 'Bank') {
  const id = `inst_${Date.now()}`;
  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  db.insert(schema.installmentsTable).values({
    id,
    title: `Payment via ${mode}`,
    amount,
    dueDate: nowStr,
    status: 'paid',
    personId,
    createdAt: new Date().toISOString(),
  }).run();
}

// ==========================================
// 5. CATEGORY & RECURRING MUTATIONS
// ==========================================

export async function addCategory(cat: CategoryItem) {
  db.insert(schema.categoriesTable).values({
    id: cat.id,
    name: cat.name,
    icon: cat.iconName,
    color: cat.color,
    budgetLimit: cat.budget,
    type: cat.type,
    createdAt: new Date().toISOString(),
  }).run();
}

export async function updateCategory(cat: CategoryItem) {
  db.update(schema.categoriesTable)
    .set({
      name: cat.name,
      icon: cat.iconName,
      color: cat.color,
      budgetLimit: cat.budget,
      type: cat.type,
    })
    .where(eq(schema.categoriesTable.id, cat.id))
    .run();
}

export async function deleteCategory(id: string) {
  db.delete(schema.categoriesTable).where(eq(schema.categoriesTable.id, id)).run();
}

export async function addRecurring(item: RecurringTransaction) {
  db.insert(schema.recurringTable).values({
    id: item.id,
    title: item.name,
    amount: item.amount,
    frequency: item.frequency,
    nextDueDate: item.nextBillingDate,
    categoryId: item.category,
    isActive: true,
  }).run();
}

export async function toggleRecurringActive(id: string, current: boolean) {
  db.update(schema.recurringTable)
    .set({ isActive: !current })
    .where(eq(schema.recurringTable.id, id))
    .run();
}

export async function deleteRecurring(id: string) {
  db.delete(schema.recurringTable).where(eq(schema.recurringTable.id, id)).run();
}

export async function updateTransaction(data: {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income' | 'lend' | 'borrow';
  categoryId?: string;
  personId?: string;
  cardId?: string;
  notes?: string;
  tags?: string[];
}) {
  db.update(schema.transactionsTable)
    .set({
      title: data.title,
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId || 'General',
      personId: data.personId,
      cardId: data.cardId,
      notes: data.notes || '',
      tags: JSON.stringify(data.tags || []),
    })
    .where(eq(schema.transactionsTable.id, data.id))
    .run();
}

export async function settlePersonDebt(personId: string) {
  // Clear debt by recording a settlement installment matching balance, or zeroing lent/borrowed
  db.update(schema.peopleTable)
    .set({
      totalLent: 0,
      totalBorrowed: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.peopleTable.id, personId))
    .run();
}

// ==========================================
// 6. USER PROFILE MUTATIONS
// ==========================================

export async function updateUserCurrency(currency: string) {
  const existing = db.select().from(schema.usersTable).where(eq(schema.usersTable.id, 'default_user')).all();
  if (existing.length > 0) {
    db.update(schema.usersTable)
      .set({
        currency,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.usersTable.id, 'default_user'))
      .run();
  } else {
    db.insert(schema.usersTable)
      .values({
        id: 'default_user',
        name: 'Valued Member',
        phone: '',
        avatar: 'avatar_matcha_fox',
        currency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();
  }
}

export async function updateUserProfile(data: {
  name: string;
  phone?: string;
  avatar?: string;
  currency?: string;
}) {
  const existing = db.select().from(schema.usersTable).where(eq(schema.usersTable.id, 'default_user')).all();
  if (existing.length > 0) {
    db.update(schema.usersTable)
      .set({
        name: data.name,
        phone: data.phone ?? '',
        avatar: data.avatar ?? 'avatar_matcha_fox',
        currency: data.currency ?? '₹ INR',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.usersTable.id, 'default_user'))
      .run();
  } else {
    db.insert(schema.usersTable)
      .values({
        id: 'default_user',
        name: data.name,
        phone: data.phone ?? '',
        avatar: data.avatar ?? 'avatar_matcha_fox',
        currency: data.currency ?? '₹ INR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();
  }
}
