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

export function usePaymentQRsLive() {
  const query = useMemo(() => db.select().from(schema.paymentQRsTable).orderBy(desc(schema.paymentQRsTable.createdAt)), []);
  return useLiveQuery(query);
}

export function usePersonTransactionsLive(personId?: string) {
  const query = useMemo(() => {
    if (personId) {
      return db
        .select()
        .from(schema.transactionsTable)
        .where(eq(schema.transactionsTable.personId, personId))
        .orderBy(desc(schema.transactionsTable.timestamp));
    }
    return db
      .select()
      .from(schema.transactionsTable)
      .orderBy(desc(schema.transactionsTable.timestamp));
  }, [personId]);
  return useLiveQuery(query, [personId]);
}

// ==========================================
// 2. TRANSACTION MUTATIONS
// ==========================================

export function syncPersonBalances(personId: string) {
  try {
    const txs = db
      .select()
      .from(schema.transactionsTable)
      .where(eq(schema.transactionsTable.personId, personId))
      .all();
    const insts = db
      .select()
      .from(schema.installmentsTable)
      .where(eq(schema.installmentsTable.personId, personId))
      .all();

    let billed = 0;
    let paid = 0;

    for (const t of txs) {
      if (t.type === 'lend' || t.type === 'expense') {
        billed += t.amount;
      } else if (t.type === 'income' || t.type === 'borrow') {
        paid += t.amount;
      }
    }

    if (paid === 0 && insts.length > 0) {
      paid = insts.reduce((sum, i) => sum + i.amount, 0);
    }

    const person = db
      .select()
      .from(schema.peopleTable)
      .where(eq(schema.peopleTable.id, personId))
      .all()[0];
    if (person) {
      // If there are no transactions yet but person has an initial balance, record it as Opening Balance
      if (txs.length === 0 && (person.totalLent || 0) > 0) {
        const opening = person.totalLent || 0;
        addTransaction({
          title: 'Opening Balance',
          amount: opening,
          type: 'lend',
          categoryId: 'Opening Balance',
          personId: person.id,
          cardId: person.cardId || undefined,
          notes: 'Initial balance',
        });
        billed = opening;
      }

      const isReceivable = (person.totalLent || 0) >= (person.totalBorrowed || 0);
      const totalLent = isReceivable ? billed : (person.totalLent || 0);
      const totalBorrowed = !isReceivable ? billed : (person.totalBorrowed || 0);

      db.update(schema.peopleTable)
        .set({
          totalLent,
          totalBorrowed,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.peopleTable.id, personId))
        .run();
    }
  } catch (e) {
    console.warn('[Queries] Failed to sync person balances:', e);
  }
}

export async function addTransaction(data: {
  title: string;
  amount: number;
  type: 'expense' | 'income' | 'lend' | 'borrow';
  categoryId?: string;
  personId?: string;
  cardId?: string;
  date?: string;
  notes?: string;
  tags?: string[];
}) {
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let finalTimestamp = new Date().toISOString();
  if (data.date) {
    const parsed = new Date(data.date);
    if (!isNaN(parsed.getTime())) {
      finalTimestamp = parsed.toISOString();
    }
  }

  db.insert(schema.transactionsTable).values({
    id,
    title: data.title,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId || 'General',
    personId: data.personId,
    cardId: data.cardId,
    timestamp: finalTimestamp,
    notes: data.notes || '',
    tags: JSON.stringify(data.tags || []),
  }).run();

  // If connected to a budget envelope (card), update its spent balance
  if (data.cardId) {
    try {
      const cards = db.select().from(schema.budgetCardsTable).where(eq(schema.budgetCardsTable.id, data.cardId)).all();
      if (cards.length > 0) {
        const card = cards[0];
        const delta = (data.type === 'expense' || data.type === 'lend') ? data.amount : (data.type === 'income' || data.type === 'borrow') ? -data.amount : 0;
        const newSpent = Math.max(0, (card.spent || 0) + delta);
        db.update(schema.budgetCardsTable)
          .set({ spent: newSpent })
          .where(eq(schema.budgetCardsTable.id, data.cardId))
          .run();
      }
    } catch (e) {
      console.warn('[Queries] Failed to update card spent balance:', e);
    }
  }

  // If connected to a person, sync the person balance
  if (data.personId) {
    syncPersonBalances(data.personId);
  }

  return id;
}

export async function deleteTransaction(id: string) {
  try {
    const tx = db.select().from(schema.transactionsTable).where(eq(schema.transactionsTable.id, id)).all()[0];
    if (tx) {
      // Reverse budget card spent
      if (tx.cardId) {
        const cards = db.select().from(schema.budgetCardsTable).where(eq(schema.budgetCardsTable.id, tx.cardId)).all();
        if (cards.length > 0) {
          const card = cards[0];
          const delta = (tx.type === 'expense' || tx.type === 'lend') ? tx.amount : (tx.type === 'income' || tx.type === 'borrow') ? -tx.amount : 0;
          const newSpent = Math.max(0, (card.spent || 0) - delta);
          db.update(schema.budgetCardsTable)
            .set({ spent: newSpent })
            .where(eq(schema.budgetCardsTable.id, tx.cardId))
            .run();
        }
      }

      db.delete(schema.transactionsTable).where(eq(schema.transactionsTable.id, id)).run();

      if (tx.personId) {
        syncPersonBalances(tx.personId);
      }
      return;
    }
  } catch (err) {
    console.warn('[Queries] Failed during deleteTransaction cascade:', err);
  }

  db.delete(schema.transactionsTable).where(eq(schema.transactionsTable.id, id)).run();
}

// ==========================================
// 3. BUDGET CARD MUTATIONS
// ==========================================

export async function addBudgetCard(card: BudgetCardData) {
  const meshPayload = JSON.stringify({
    customGradient: card.customGradient,
    shapePattern: card.shapePattern,
    tabLabel: card.tabLabel,
  });

  db.insert(schema.budgetCardsTable).values({
    id: card.id,
    title: card.name,
    totalLimit: card.limit,
    spent: card.spent,
    color: card.variant || 'matchaLime',
    meshGradient: meshPayload,
    icon: card.cardType.toLowerCase(),
    cycleDate: card.expiry || '1st of month',
    isDefault: false,
    createdAt: new Date().toISOString(),
  }).run();
}

export async function updateBudgetCard(card: BudgetCardData) {
  const meshPayload = JSON.stringify({
    customGradient: card.customGradient,
    shapePattern: card.shapePattern,
    tabLabel: card.tabLabel,
  });

  db.update(schema.budgetCardsTable)
    .set({
      title: card.name,
      totalLimit: card.limit,
      spent: card.spent,
      color: card.variant || 'matchaLime',
      meshGradient: meshPayload,
      icon: card.cardType.toLowerCase(),
      cycleDate: card.expiry || '1st of month',
    })
    .where(eq(schema.budgetCardsTable.id, card.id))
    .run();
}

export async function deleteBudgetCard(id: string) {
  db.delete(schema.budgetCardsTable).where(eq(schema.budgetCardsTable.id, id)).run();
}

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
    cardId: person.budgetCardId || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).run();

  // If there is an initial balance due, record it as an Opening Balance transaction
  // so subsequent new balances increment cleanly on top of it and reflect in the linked budget card
  if (person.totalDue > 0) {
    await addTransaction({
      title: 'Opening Balance',
      amount: person.totalDue,
      type: person.type === 'receivable' ? 'lend' : 'borrow',
      categoryId: 'Opening Balance',
      personId: person.id,
      cardId: person.budgetCardId,
      notes: 'Initial balance when contact was added',
    });
  }
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
      cardId: person.budgetCardId || '',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.peopleTable.id, person.id))
    .run();

  syncPersonBalances(person.id);
}

export async function deletePerson(id: string) {
  db.delete(schema.installmentsTable).where(eq(schema.installmentsTable.personId, id)).run();
  db.delete(schema.peopleTable).where(eq(schema.peopleTable.id, id)).run();
}

export async function recordInstallment(
  personId: string,
  amount: number,
  mode: 'UPI' | 'Cash' | 'Bank',
  customDate?: string,
  linkedCardId?: string
) {
  const id = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let instDate = new Date().toISOString();
  if (customDate) {
    const parsed = new Date(customDate);
    if (!isNaN(parsed.getTime())) {
      instDate = parsed.toISOString();
    }
  }

  const formattedDueDate = new Date(instDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  db.insert(schema.installmentsTable).values({
    id,
    title: `Payment via ${mode}`,
    amount,
    dueDate: formattedDueDate,
    status: 'paid',
    personId,
    createdAt: instDate,
  }).run();

  // Decrement person's outstanding balance after each payment installment
  // ponytail: naive clamp to 0 — keeps balances non-negative; negative overpayments not tracked
  try {
    const person = db.select().from(schema.peopleTable).where(eq(schema.peopleTable.id, personId)).all()[0];
    if (person) {
      const isReceivable = (person.totalLent || 0) >= (person.totalBorrowed || 0);
      if (isReceivable) {
        db.update(schema.peopleTable)
          .set({
            totalLent: Math.max(0, (person.totalLent || 0) - amount),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.peopleTable.id, personId))
          .run();
      } else {
        db.update(schema.peopleTable)
          .set({
            totalBorrowed: Math.max(0, (person.totalBorrowed || 0) - amount),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.peopleTable.id, personId))
          .run();
      }
    }
  } catch (err) {
    console.warn('[Queries] Failed to update person balance after installment:', err);
  }

  // If linked to a budget envelope, mirror as a transaction so envelope spent tracks it
  if (linkedCardId) {
    try {
      const person = db.select().from(schema.peopleTable).where(eq(schema.peopleTable.id, personId)).all()[0];
      const personName = person?.name || 'Khata Contact';
      const isReceivable = person ? (person.totalLent || 0) >= (person.totalBorrowed || 0) : true;

      await addTransaction({
        title: `${isReceivable ? 'Received from' : 'Paid to'} ${personName}`,
        amount,
        type: isReceivable ? 'income' : 'expense',
        categoryId: 'Khata Settlement',
        personId,
        cardId: linkedCardId,
        date: instDate,
        notes: mode,
      });
    } catch (err) {
      console.warn('[Queries] Error linking installment to budget card:', err);
    }
  }
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
  date?: string;
  notes?: string;
  tags?: string[];
}) {
  let oldTx: any = null;
  try {
    oldTx = db.select().from(schema.transactionsTable).where(eq(schema.transactionsTable.id, data.id)).all()[0];
    if (oldTx?.cardId) {
      const oldCards = db.select().from(schema.budgetCardsTable).where(eq(schema.budgetCardsTable.id, oldTx.cardId)).all();
      if (oldCards.length > 0) {
        const oldDelta = (oldTx.type === 'expense' || oldTx.type === 'lend') ? oldTx.amount : (oldTx.type === 'income' || oldTx.type === 'borrow') ? -oldTx.amount : 0;
        const reversed = Math.max(0, (oldCards[0].spent || 0) - oldDelta);
        db.update(schema.budgetCardsTable).set({ spent: reversed }).where(eq(schema.budgetCardsTable.id, oldTx.cardId)).run();
      }
    }
  } catch (err) {
    console.warn('[Queries] Failed to reverse old envelope delta on edit:', err);
  }

  const updatePayload: Record<string, unknown> = {
    title: data.title,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId || 'General',
    personId: data.personId,
    cardId: data.cardId,
    notes: data.notes || '',
    tags: JSON.stringify(data.tags || []),
  };

  if (data.date) {
    const parsed = new Date(data.date);
    if (!isNaN(parsed.getTime())) {
      updatePayload.timestamp = parsed.toISOString();
    }
  }

  db.update(schema.transactionsTable)
    .set(updatePayload)
    .where(eq(schema.transactionsTable.id, data.id))
    .run();

  // Apply new envelope delta if a card is linked
  if (data.cardId) {
    try {
      const newCards = db.select().from(schema.budgetCardsTable).where(eq(schema.budgetCardsTable.id, data.cardId)).all();
      if (newCards.length > 0) {
        const newDelta = (data.type === 'expense' || data.type === 'lend') ? data.amount : (data.type === 'income' || data.type === 'borrow') ? -data.amount : 0;
        const newSpent = Math.max(0, (newCards[0].spent || 0) + newDelta);
        db.update(schema.budgetCardsTable).set({ spent: newSpent }).where(eq(schema.budgetCardsTable.id, data.cardId)).run();
      }
    } catch (err) {
      console.warn('[Queries] Failed to apply new envelope delta on edit:', err);
    }
  }

  // Sync person balance
  const targetPersonId = data.personId || oldTx?.personId;
  if (targetPersonId) {
    syncPersonBalances(targetPersonId);
  }
}

export async function addPersonEntry(data: {
  personId: string;
  title: string;
  totalCost?: number;     // Debit / Billed amount
  paidAmount?: number;    // Credit / Paid amount
  channel?: 'Cash' | 'UPI' | 'Bank';
  date?: string;
  notes?: string;
  cardId?: string;
  categoryId?: string;
  tags?: string[];
}) {
  const finalDate = data.date || new Date().toISOString();
  const person = db.select().from(schema.peopleTable).where(eq(schema.peopleTable.id, data.personId)).all()[0];
  const personName = person?.name || 'Customer';
  const targetCardId = data.cardId || (person?.cardId ? person.cardId : undefined);

  // 1. If there's a billed amount / total cost, record a debit entry ('lend')
  if (data.totalCost && data.totalCost > 0) {
    await addTransaction({
      title: data.title,
      amount: data.totalCost,
      type: 'lend',
      categoryId: data.categoryId || 'Service / Goods',
      tags: data.tags || (data.categoryId ? [data.categoryId] : []),
      personId: data.personId,
      cardId: targetCardId,
      date: finalDate,
      notes: data.notes || '',
    });
  }

  // 2. If there's a paid amount, record a credit entry ('income')
  if (data.paidAmount && data.paidAmount > 0) {
    const payTitle = data.totalCost && data.totalCost > 0
      ? `Payment for ${data.title}`
      : `Payment: ${data.title}`;
    const mode = data.channel || 'Cash';
    const memo = data.notes ? `${mode} - ${data.notes}` : `Paid via ${mode}`;

    await addTransaction({
      title: payTitle,
      amount: data.paidAmount,
      type: 'income',
      categoryId: data.categoryId || 'Khata Settlement',
      tags: data.tags || (data.categoryId ? [data.categoryId] : []),
      personId: data.personId,
      cardId: targetCardId,
      date: finalDate,
      notes: memo,
    });

    // Also record installment for complete backward-compatibility
    const formattedDueDate = new Date(finalDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    db.insert(schema.installmentsTable).values({
      id: `inst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `Payment via ${mode} (${personName})`,
      amount: data.paidAmount,
      dueDate: formattedDueDate,
      status: 'paid',
      personId: data.personId,
      createdAt: finalDate,
    }).run();
  }

  // 3. Keep person balance synchronized
  syncPersonBalances(data.personId);
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
  upiId?: string;
  qrCodeUri?: string;
}) {
  const existing = db.select().from(schema.usersTable).where(eq(schema.usersTable.id, 'default_user')).all();
  if (existing.length > 0) {
    db.update(schema.usersTable)
      .set({
        name: data.name,
        phone: data.phone ?? '',
        avatar: data.avatar ?? 'avatar_matcha_fox',
        currency: data.currency ?? '₹ INR',
        upiId: data.upiId ?? '',
        qrCodeUri: data.qrCodeUri ?? '',
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
        upiId: data.upiId ?? '',
        qrCodeUri: data.qrCodeUri ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();
  }
}

// ==========================================
// 7. PAYMENT QR CODE MUTATIONS
// ==========================================

export async function addPaymentQR(data: {
  title: string;
  upiId?: string;
  imageUri: string;
  isDefault?: boolean;
}) {
  const id = `qr-${Date.now()}`;
  if (data.isDefault) {
    db.update(schema.paymentQRsTable).set({ isDefault: false }).run();
  }
  db.insert(schema.paymentQRsTable).values({
    id,
    title: data.title,
    upiId: data.upiId || '',
    imageUri: data.imageUri,
    isDefault: data.isDefault ?? false,
    createdAt: new Date().toISOString(),
  }).run();
  return id;
}

export async function deletePaymentQR(id: string) {
  db.delete(schema.paymentQRsTable).where(eq(schema.paymentQRsTable.id, id)).run();
}

export async function setDefaultPaymentQR(id: string) {
  db.update(schema.paymentQRsTable).set({ isDefault: false }).run();
  db.update(schema.paymentQRsTable).set({ isDefault: true }).where(eq(schema.paymentQRsTable.id, id)).run();
}
