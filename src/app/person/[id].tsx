import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  PlusCircle,
  CheckCircle2,
  CreditCard,
  Calendar,
  Check,
  TrendingUp,
  TrendingDown,
  Tag,
  Edit3,
  Trash2,
  Search,
  X,
  FileText,
  Receipt,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { CozyModal } from '../../components/ui/CozyModal';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';
import {
  usePeopleLive,
  useBudgetCardsLive,
  usePersonTransactionsLive,
  addPersonEntry,
  updateTransaction,
  deleteTransaction,
} from '../../db/queries';

const MODES = ['Cash', 'UPI', 'Bank'] as const;
const DATE_MODES = ['today', 'yesterday', 'custom'] as const;
const QUICK_TITLES = ['Printing & Scan', 'Form Filling', 'Service Work', 'Merchandise', 'Repair & Support', 'Consultation'];

interface PersonTransactionItem {
  id: string;
  title: string;
  amount: number;
  type: 'lend' | 'income' | 'expense' | 'borrow';
  categoryId?: string | null;
  cardId?: string | null;
  timestamp: string;
  notes?: string | null;
}

export default function PersonLedgerPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { activeCurrency, showConfirmDialog } = useUIStore();
  const currencySymbol = getCurrencySymbol(activeCurrency);

  const { data: dbPeople = [] } = usePeopleLive();
  const { data: dbTransactions = [] } = usePersonTransactionsLive(id);
  const { data: dbCards = [] } = useBudgetCardsLive();

  const person = useMemo(() => dbPeople.find((p) => p.id === id) ?? null, [dbPeople, id]);

  // Card lookup map
  const cardMap = useMemo(() => {
    const map = new Map<string, string>();
    dbCards.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [dbCards]);

  // Filter & Search states
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------
  // Add Entry Modal State
  // -------------------------------------------------------------
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [entryMode, setEntryMode] = useState<'fold' | 'debit' | 'credit'>('fold');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryTotalCost, setEntryTotalCost] = useState('');
  const [entryPaidAmount, setEntryPaidAmount] = useState('');
  const [entryChannel, setEntryChannel] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');
  const [entryDateMode, setEntryDateMode] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [entryCustomDate, setEntryCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryNotes, setEntryNotes] = useState('');
  const [entryLinkedCardId, setEntryLinkedCardId] = useState<string | undefined>();

  // -------------------------------------------------------------
  // Edit Transaction Modal State
  // -------------------------------------------------------------
  const [editingTx, setEditingTx] = useState<PersonTransactionItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'lend' | 'income'>('lend');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCardId, setEditCardId] = useState<string | undefined>();

  // -------------------------------------------------------------
  // Transactions computation
  // -------------------------------------------------------------
  const allPersonTxs: PersonTransactionItem[] = useMemo(() => {
    return (dbTransactions || []).map((t) => ({
      id: t.id,
      title: t.title,
      amount: t.amount,
      type: t.type as any,
      categoryId: t.categoryId,
      cardId: t.cardId,
      timestamp: t.timestamp,
      notes: t.notes,
    }));
  }, [dbTransactions]);

  // Fold Calculations (Debit / Billed vs Credit / Paid)
  const { totalBilled, totalPaid, remainingDue, isSettled, progress } = useMemo(() => {
    let billed = 0;
    let paid = 0;

    const hasOpeningTx = allPersonTxs.some(
      (t) => t.title.toLowerCase().includes('opening') || t.title.toLowerCase().includes('initial')
    );

    allPersonTxs.forEach((t) => {
      if (t.type === 'lend' || t.type === 'expense') {
        billed += t.amount;
      } else if (t.type === 'income' || t.type === 'borrow') {
        paid += t.amount;
      }
    });

    // If person has initial totalLent and no explicit opening transaction was recorded, add it so it is never overshadowed!
    if (!hasOpeningTx && person && (person.totalLent ?? 0) > 0) {
      billed += (person.totalLent ?? 0);
    }

    const remaining = Math.max(0, billed - paid);
    const prog = billed > 0 ? Math.min(1, paid / billed) : 1;
    return {
      totalBilled: billed,
      totalPaid: paid,
      remainingDue: remaining,
      isSettled: remaining <= 0,
      progress: prog,
    };
  }, [allPersonTxs, person]);

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    return allPersonTxs.filter((t) => {
      const isDebit = t.type === 'lend' || t.type === 'expense';
      const isCredit = t.type === 'income' || t.type === 'borrow';

      if (filterType === 'debit' && !isDebit) return false;
      if (filterType === 'credit' && !isCredit) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        return matchTitle || matchNotes;
      }
      return true;
    });
  }, [allPersonTxs, filterType, searchQuery]);

  // -------------------------------------------------------------
  // Open Add Modal
  // -------------------------------------------------------------
  const openAddModal = (mode: 'fold' | 'debit' | 'credit' = 'fold') => {
    triggerHaptic('medium');
    setEntryMode(mode);
    setEntryTitle('');
    setEntryTotalCost('');
    setEntryPaidAmount(mode === 'credit' && remainingDue > 0 ? String(remainingDue) : '');
    setEntryChannel('Cash');
    setEntryDateMode('today');
    setEntryCustomDate(new Date().toISOString().split('T')[0]);
    setEntryNotes('');
    setEntryLinkedCardId((person as any)?.cardId || undefined);
    setAddModalVisible(true);
  };

  // -------------------------------------------------------------
  // Save New Entry
  // -------------------------------------------------------------
  const handleSaveEntry = async () => {
    let finalDate = new Date().toISOString();
    if (entryDateMode === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      finalDate = d.toISOString();
    } else if (entryDateMode === 'custom') {
      const p = new Date(entryCustomDate);
      if (!isNaN(p.getTime())) finalDate = p.toISOString();
    }

    const costNum = parseFloat(entryTotalCost);
    const paidNum = parseFloat(entryPaidAmount);

    const effectiveCardId = entryLinkedCardId || (person as any)?.cardId || undefined;

    if (entryMode === 'fold') {
      if ((isNaN(costNum) || costNum <= 0) && (isNaN(paidNum) || paidNum <= 0)) {
        showConfirmDialog({
          title: 'Amount Required',
          message: 'Please enter a valid Total Cost or Paid Amount.',
          confirmText: 'OK',
          cancelText: 'Cancel',
          onConfirm: () => {},
        });
        return;
      }
      triggerHaptic('success');
      await addPersonEntry({
        personId: id,
        title: entryTitle.trim() || 'Service & Bill',
        totalCost: isNaN(costNum) ? 0 : costNum,
        paidAmount: isNaN(paidNum) ? 0 : paidNum,
        channel: entryChannel,
        date: finalDate,
        notes: entryNotes.trim(),
        cardId: effectiveCardId,
      });
    } else if (entryMode === 'debit') {
      if (isNaN(costNum) || costNum <= 0) {
        showConfirmDialog({
          title: 'Invalid Amount',
          message: 'Please enter a valid cost / billed amount.',
          confirmText: 'OK',
          cancelText: 'Cancel',
          onConfirm: () => {},
        });
        return;
      }
      triggerHaptic('success');
      await addPersonEntry({
        personId: id,
        title: entryTitle.trim() || 'Cost / Billed',
        totalCost: costNum,
        paidAmount: 0,
        channel: entryChannel,
        date: finalDate,
        notes: entryNotes.trim(),
        cardId: effectiveCardId,
      });
    } else {
      // Credit / Payment
      if (isNaN(paidNum) || paidNum <= 0) {
        showConfirmDialog({
          title: 'Invalid Amount',
          message: 'Please enter a valid payment amount.',
          confirmText: 'OK',
          cancelText: 'Cancel',
          onConfirm: () => {},
        });
        return;
      }
      triggerHaptic('success');
      await addPersonEntry({
        personId: id,
        title: entryTitle.trim() || 'Payment Received',
        totalCost: 0,
        paidAmount: paidNum,
        channel: entryChannel,
        date: finalDate,
        notes: entryNotes.trim(),
        cardId: effectiveCardId,
      });
    }

    setAddModalVisible(false);
  };

  // -------------------------------------------------------------
  // Open Edit Modal
  // -------------------------------------------------------------
  const handleOpenEdit = (item: PersonTransactionItem) => {
    triggerHaptic('light');
    setEditingTx(item);
    setEditTitle(item.title);
    setEditAmount(String(item.amount));
    setEditType(item.type === 'income' || item.type === 'borrow' ? 'income' : 'lend');
    setEditNotes(item.notes || '');
    setEditDate(item.timestamp.split('T')[0]);
    setEditCardId(item.cardId || undefined);
  };

  // -------------------------------------------------------------
  // Save Edit
  // -------------------------------------------------------------
  const handleSaveEdit = async () => {
    if (!editingTx) return;
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      showConfirmDialog({
        title: 'Invalid Amount',
        message: 'Enter a valid positive number.',
        confirmText: 'OK',
        cancelText: 'Cancel',
        onConfirm: () => {},
      });
      return;
    }

    let parsedDate = editingTx.timestamp;
    if (editDate) {
      const d = new Date(editDate);
      if (!isNaN(d.getTime())) parsedDate = d.toISOString();
    }

    triggerHaptic('success');
    await updateTransaction({
      id: editingTx.id,
      title: editTitle.trim() || editingTx.title,
      amount: num,
      type: editType,
      categoryId: editingTx.categoryId || 'General',
      personId: id,
      cardId: editCardId,
      date: parsedDate,
      notes: editNotes.trim(),
    });

    setEditingTx(null);
  };

  // -------------------------------------------------------------
  // Delete Transaction
  // -------------------------------------------------------------
  const handleDeleteTx = (txId: string, title: string) => {
    triggerHaptic('warning');
    showConfirmDialog({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete "${title}"? The person's balance and envelope will be updated immediately.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        triggerHaptic('medium');
        await deleteTransaction(txId);
      },
    });
  };

  // -------------------------------------------------------------
  // Quick Contact Actions
  // -------------------------------------------------------------
  const handleCall = useCallback(() => {
    if (!person?.phone) return;
    Linking.openURL('tel:' + person.phone.replace(/[^0-9+]/g, ''));
  }, [person]);

  const handleWhatsApp = useCallback(() => {
    if (!person) return;
    const cleanPhone = (person.phone || '').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hi ${person.name}, regarding your account at dinlipi: your current balance due is ${currencySymbol}${remainingDue.toLocaleString()}. Thank you!`
    );
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
  }, [person, remainingDue, currencySymbol]);

  if (!person) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
        <Text style={{ color: colors.textSecondary }}>Person record not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.matchaLime, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculated Fold delta for the modal
  const modalCost = parseFloat(entryTotalCost) || 0;
  const modalPaid = parseFloat(entryPaidAmount) || 0;
  const modalRemaining = Math.max(0, modalCost - modalPaid);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary, paddingTop: insets.top }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { triggerHaptic('light'); router.back(); }}
          style={[styles.backBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{person.name}</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Khata & Fold Tracker</Text>
        </View>
        <TouchableOpacity
          onPress={() => openAddModal('fold')}
          style={[styles.addIconBtn, { backgroundColor: colors.matchaLime }]}
          activeOpacity={0.8}
        >
          <PlusCircle size={20} color="#141715" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <UserAvatar avatarIdOrUri={person.avatar || 'avatar_matcha_fox'} name={person.name} size="lg" showRing />
            <View style={{ flex: 1 }}>
              <Text style={[styles.personName, { color: colors.textPrimary }]}>{person.name}</Text>
              {Boolean(person.phone) && (
                <Text style={[styles.phoneLine, { color: colors.textSecondary }]}>{person.phone}</Text>
              )}
              {Boolean((person as any).cardId && cardMap.get((person as any).cardId)) && (
                <View style={[styles.cardTag, { marginTop: 4, backgroundColor: isDark ? 'rgba(206,240,74,0.12)' : 'rgba(206,240,74,0.18)', borderColor: colors.matchaLime }]}>
                  <CreditCard size={10} color={colors.matchaLime} />
                  <Text style={[styles.cardTagText, { color: colors.matchaLime, fontWeight: '700' }]}>
                    Budget: {cardMap.get((person as any).cardId)}
                  </Text>
                </View>
              )}
              {Boolean(person.notes) && (
                <Text style={[styles.noteLine, { color: colors.textMuted }]} numberOfLines={2}>{person.notes}</Text>
              )}
            </View>
            <View style={styles.contactActionCol}>
              {Boolean(person.phone) && (
                <>
                  <TouchableOpacity
                    onPress={handleCall}
                    style={[styles.contactCircleBtn, { backgroundColor: colors.cardElevated, borderColor: colors.borderSubtle }]}
                    activeOpacity={0.7}
                  >
                    <Phone size={15} color={colors.matchaLime} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleWhatsApp}
                    style={[styles.contactCircleBtn, { backgroundColor: colors.cardElevated, borderColor: colors.borderSubtle }]}
                    activeOpacity={0.7}
                  >
                    <MessageCircle size={15} color="#25D366" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Fold Balance Hero Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.cardElevated, borderColor: colors.borderSubtle }]}>
          <View style={styles.balanceHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} color={remainingDue > 0 ? colors.terracotta : colors.matchaLime} />
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                {remainingDue > 0 ? 'Remaining Balance Due' : 'Account Settled'}
              </Text>
            </View>
            {isSettled ? (
              <View style={[styles.badge, { backgroundColor: 'rgba(206,240,74,0.16)' }]}>
                <CheckCircle2 size={12} color={colors.matchaLime} />
                <Text style={[styles.badgeText, { color: colors.matchaLime }]}>All Settled</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: 'rgba(224,122,95,0.16)' }]}>
                <Text style={[styles.badgeText, { color: colors.terracotta }]}>Pending Due</Text>
              </View>
            )}
          </View>

          <Text style={[styles.remainingAmount, { color: remainingDue > 0 ? colors.terracotta : colors.matchaLime }]}>
            {currencySymbol}{remainingDue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%` as any,
                  backgroundColor: colors.matchaLime,
                },
              ]}
            />
          </View>

          {/* Fold Breakdown Row */}
          <View style={styles.foldGrid}>
            <View style={[styles.foldCell, { backgroundColor: isDark ? 'rgba(224,122,95,0.08)' : 'rgba(224,122,95,0.05)', borderColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <TrendingDown size={13} color={colors.terracotta} />
                <Text style={[styles.foldCellLabel, { color: colors.textSecondary }]}>Total Billed</Text>
              </View>
              <Text style={[styles.foldCellValue, { color: colors.terracotta }]}>
                {currencySymbol}{totalBilled.toLocaleString()}
              </Text>
              <Text style={[styles.foldCellSub, { color: colors.textMuted }]}>Debit / Service Cost</Text>
            </View>

            <View style={[styles.foldCell, { backgroundColor: isDark ? 'rgba(206,240,74,0.08)' : 'rgba(206,240,74,0.05)', borderColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={13} color={colors.matchaLime} />
                <Text style={[styles.foldCellLabel, { color: colors.textSecondary }]}>Total Received</Text>
              </View>
              <Text style={[styles.foldCellValue, { color: colors.matchaLime }]}>
                {currencySymbol}{totalPaid.toLocaleString()}
              </Text>
              <Text style={[styles.foldCellSub, { color: colors.textMuted }]}>Credit / Paid So Far</Text>
            </View>
          </View>
        </View>

        {/* Two Clear Options for Person Management */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => openAddModal('credit')}
            style={[styles.primaryActionBtn, { backgroundColor: colors.matchaLime }]}
            activeOpacity={0.85}
          >
            <CheckCircle2 size={17} color="#141715" strokeWidth={2.5} />
            <Text style={[styles.primaryActionBtnText, { color: '#141715', fontWeight: '800' }]}>
              Receive Money
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openAddModal('fold')}
            style={[styles.secondaryActionBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}
            activeOpacity={0.75}
          >
            <PlusCircle size={17} color={colors.terracotta} strokeWidth={2.5} />
            <Text style={[styles.secondaryActionBtnText, { color: colors.textPrimary, fontWeight: '800' }]}>
              Add Work / Bill
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Transaction Ledger ({allPersonTxs.length})
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              All debits and credits recorded for this person
            </Text>
          </View>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.filterSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
            <Search size={15} color={colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search transactions, bills, notes..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterPillsRow}>
            {(['all', 'debit', 'credit'] as const).map((ft) => {
              const sel = filterType === ft;
              const label = ft === 'all' ? 'All Ledger' : ft === 'debit' ? 'Billed / Debit' : 'Paid / Credit';
              return (
                <TouchableOpacity
                  key={ft}
                  onPress={() => { triggerHaptic('light'); setFilterType(ft); }}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: sel ? colors.cardElevated : colors.cardSecondary,
                      borderColor: sel ? colors.matchaLime : colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: sel ? colors.matchaLime : colors.textSecondary,
                        fontWeight: sel ? '800' : '600',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Transaction Items List */}
        {filteredTxs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
            <Receipt size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
              No Transactions Found
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
              {searchQuery
                ? 'No transactions match your search filter.'
                : 'Tap "+ Record Service & Bill" above to add the first debit or credit entry for this person.'}
            </Text>
          </View>
        ) : (
          filteredTxs.map((item) => {
            const isDebit = item.type === 'lend' || item.type === 'expense';
            const itemColor = isDebit ? colors.terracotta : colors.matchaLime;
            const itemDate = new Date(item.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const cardName = item.cardId ? cardMap.get(item.cardId) : null;

            return (
              <View
                key={item.id}
                style={[
                  styles.txCard,
                  { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.txMainRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor: isDebit ? 'rgba(224,122,95,0.12)' : 'rgba(206,240,74,0.12)',
                          },
                        ]}
                      >
                        <Text style={[styles.typeBadgeText, { color: itemColor }]}>
                          {isDebit ? 'YOU GAVE / BILLED' : 'YOU GOT / RECEIVED'}
                        </Text>
                      </View>
                      {cardName && (
                        <View style={[styles.cardTag, { backgroundColor: colors.cardElevated, borderColor: colors.borderSubtle }]}>
                          <CreditCard size={10} color={colors.textSecondary} />
                          <Text style={[styles.cardTagText, { color: colors.textSecondary }]}>{cardName}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.txTitle, { color: colors.textPrimary }]}>{item.title}</Text>

                    {Boolean(item.notes) && (
                      <Text style={[styles.txNotes, { color: colors.textMuted }]} numberOfLines={2}>
                        {item.notes}
                      </Text>
                    )}

                    <Text style={[styles.txDate, { color: colors.textMuted }]}>{itemDate}</Text>
                  </View>

                  <View style={styles.txAmountCol}>
                    <Text style={[styles.txAmount, { color: itemColor }]}>
                      {isDebit ? '-' : '+'}{currencySymbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </Text>

                    <View style={styles.txActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleOpenEdit(item)}
                        style={[styles.miniActionBtn, { backgroundColor: colors.cardElevated, borderColor: colors.borderSubtle }]}
                        activeOpacity={0.7}
                        accessibilityLabel="Edit transaction"
                      >
                        <Edit3 size={13} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteTx(item.id, item.title)}
                        style={[styles.miniActionBtn, { backgroundColor: colors.cardElevated, borderColor: colors.borderSubtle }]}
                        activeOpacity={0.7}
                        accessibilityLabel="Delete transaction"
                      >
                        <Trash2 size={13} color={colors.terracotta} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ============================================================= */}
      {/* 1. Add Entry Modal (Fold 2-in-1, Debit, or Credit)            */}
      {/* ============================================================= */}
      <CozyModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        title={entryMode === 'fold' ? 'Record Service & Bill' : entryMode === 'debit' ? 'Add Debit (You Gave)' : 'Record Payment (You Got)'}
        subtitle={`Ledger entry for ${person.name}`}
      >
        <View style={{ gap: 14, paddingBottom: 16 }}>
          {/* Mode Switcher */}
          <View style={[styles.modeTabsRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
            <TouchableOpacity
              onPress={() => { triggerHaptic('light'); setEntryMode('fold'); }}
              style={[styles.modeTab, entryMode === 'fold' && [styles.modeTabActive, { backgroundColor: colors.matchaLime }]]}
              activeOpacity={0.75}
            >
              <Text style={[styles.modeTabText, { color: entryMode === 'fold' ? '#141715' : colors.textSecondary }]}>
                Bill & Pay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { triggerHaptic('light'); setEntryMode('debit'); }}
              style={[styles.modeTab, entryMode === 'debit' && [styles.modeTabActive, { backgroundColor: colors.terracotta }]]}
              activeOpacity={0.75}
            >
              <Text style={[styles.modeTabText, { color: entryMode === 'debit' ? '#FFFFFF' : colors.textSecondary }]}>
                Billed Only
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { triggerHaptic('light'); setEntryMode('credit'); }}
              style={[styles.modeTab, entryMode === 'credit' && [styles.modeTabActive, { backgroundColor: colors.matchaLime }]]}
              activeOpacity={0.75}
            >
              <Text style={[styles.modeTabText, { color: entryMode === 'credit' ? '#141715' : colors.textSecondary }]}>
                Paid Only
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Suggestions for Title */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Title / Description</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <FileText size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={entryTitle}
                onChangeText={setEntryTitle}
                placeholder="e.g. Cyber Cafe Work, Photocopy, Repair"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
              {QUICK_TITLES.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { triggerHaptic('light'); setEntryTitle(t); }}
                  style={[styles.quickChip, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickChipText, { color: colors.textSecondary }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Fold Mode: Both Cost & Paid fields */}
          {entryMode === 'fold' ? (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.terracotta }]}>Total Cost / Bill</Text>
                  <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
                    <Text style={{ color: colors.terracotta, fontSize: 16, fontWeight: '900', marginRight: 6 }}>{currencySymbol}</Text>
                    <TextInput
                      value={entryTotalCost}
                      onChangeText={setEntryTotalCost}
                      keyboardType="numeric"
                      placeholder="500"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.textInput, { color: colors.textPrimary }]}
                    />
                  </View>
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.matchaLime }]}>Paid Now</Text>
                  <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
                    <Text style={{ color: colors.matchaLime, fontSize: 16, fontWeight: '900', marginRight: 6 }}>{currencySymbol}</Text>
                    <TextInput
                      value={entryPaidAmount}
                      onChangeText={setEntryPaidAmount}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.textInput, { color: colors.textPrimary }]}
                    />
                  </View>
                </View>
              </View>

              {/* Dynamic Live Balance preview box */}
              <View style={[styles.previewBox, { backgroundColor: colors.cardElevated, borderColor: colors.borderSubtle }]}>
                <View style={styles.previewRow}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>New Cost:</Text>
                  <Text style={{ color: colors.terracotta, fontWeight: '700', fontSize: 12 }}>{currencySymbol}{modalCost}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Paid by customer:</Text>
                  <Text style={{ color: colors.matchaLime, fontWeight: '700', fontSize: 12 }}>{currencySymbol}{modalPaid}</Text>
                </View>
                <View style={[styles.previewDivider, { backgroundColor: colors.borderSubtle }]} />
                <View style={styles.previewRow}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Remaining to collect:</Text>
                  <Text style={{ color: colors.terracotta, fontWeight: '900', fontSize: 14 }}>
                    {currencySymbol}{modalRemaining}
                  </Text>
                </View>
              </View>
            </View>
          ) : entryMode === 'debit' ? (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.terracotta }]}>Billed / Cost Amount ({currencySymbol})</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
                <Text style={{ color: colors.terracotta, fontSize: 18, fontWeight: '900', marginRight: 8 }}>{currencySymbol}</Text>
                <TextInput
                  value={entryTotalCost}
                  onChangeText={setEntryTotalCost}
                  keyboardType="numeric"
                  placeholder="500.00"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.matchaLime }]}>Payment Amount Received ({currencySymbol})</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
                <Text style={{ color: colors.matchaLime, fontSize: 18, fontWeight: '900', marginRight: 8 }}>{currencySymbol}</Text>
                <TextInput
                  value={entryPaidAmount}
                  onChangeText={setEntryPaidAmount}
                  keyboardType="numeric"
                  placeholder="100.00"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>
          )}

          {/* Payment Method (for fold or credit) */}
          {(entryMode === 'fold' || entryMode === 'credit') && (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {MODES.map((m) => {
                  const sel = entryChannel === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => { triggerHaptic('light'); setEntryChannel(m); }}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: sel ? colors.matchaLime : colors.cardSecondary,
                          borderColor: sel ? colors.matchaLime : colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text style={{ color: sel ? '#141715' : colors.textPrimary, fontWeight: sel ? '800' : '600', fontSize: 12 }}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Date Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Transaction Date</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DATE_MODES.map((dm) => {
                const sel = entryDateMode === dm;
                const label = dm === 'today' ? 'Today' : dm === 'yesterday' ? 'Yesterday' : 'Custom';
                return (
                  <TouchableOpacity
                    key={dm}
                    onPress={() => { triggerHaptic('light'); setEntryDateMode(dm); }}
                    style={[
                      styles.pill,
                      {
                        flex: 1,
                        backgroundColor: sel ? colors.matchaLime : colors.cardSecondary,
                        borderColor: sel ? colors.matchaLime : colors.borderSubtle,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={{ color: sel ? '#141715' : colors.textPrimary, fontWeight: sel ? '800' : '600', fontSize: 12 }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {entryDateMode === 'custom' && (
              <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle, marginTop: 6 }]}>
                <Calendar size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  value={entryCustomDate}
                  onChangeText={setEntryCustomDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
              </View>
            )}
          </View>

          {/* Notes / Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Notes / Memo (Optional)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <Tag size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={entryNotes}
                onChangeText={setEntryNotes}
                placeholder="e.g. 50 color prints, balance due by Friday"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          {/* Budget Envelope Selector */}
          {dbCards && dbCards.length > 0 && (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Link to Budget Envelope (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => { triggerHaptic('light'); setEntryLinkedCardId(undefined); }}
                  style={[
                    styles.cardChip,
                    {
                      backgroundColor: !entryLinkedCardId ? colors.cardElevated : colors.cardSecondary,
                      borderColor: !entryLinkedCardId ? colors.matchaLime : colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>None</Text>
                  {!entryLinkedCardId && <Check size={11} color={colors.matchaLime} strokeWidth={3} />}
                </TouchableOpacity>
                {dbCards.map((card) => {
                  const isSel = entryLinkedCardId === card.id;
                  return (
                    <TouchableOpacity
                      key={card.id}
                      onPress={() => { triggerHaptic('light'); setEntryLinkedCardId(card.id); }}
                      style={[
                        styles.cardChip,
                        {
                          backgroundColor: isSel ? 'rgba(206,240,74,0.14)' : colors.cardSecondary,
                          borderColor: isSel ? colors.matchaLime : colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <CreditCard size={12} color={isSel ? colors.matchaLime : colors.textSecondary} />
                      <Text style={{ color: isSel ? colors.matchaLime : colors.textPrimary, fontSize: 12, fontWeight: isSel ? '800' : '600' }}>
                        {card.title}
                      </Text>
                      {isSel && <Check size={11} color={colors.matchaLime} strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveEntry}
            style={[styles.saveBtn, { backgroundColor: colors.matchaLime }]}
            activeOpacity={0.85}
          >
            <CheckCircle2 size={18} color="#141715" />
            <Text style={styles.saveBtnText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      </CozyModal>

      {/* ============================================================= */}
      {/* 2. Edit Transaction Modal                                     */}
      {/* ============================================================= */}
      <CozyModal
        visible={Boolean(editingTx)}
        onClose={() => setEditingTx(null)}
        title="Edit Transaction"
        subtitle="Update details, amounts, or budget envelope"
      >
        <View style={{ gap: 14, paddingBottom: 16 }}>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Title</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Transaction Title"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Amount ({currencySymbol})</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <Text style={{ color: editType === 'lend' ? colors.terracotta : colors.matchaLime, fontSize: 18, fontWeight: '900', marginRight: 8 }}>
                {currencySymbol}
              </Text>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Transaction Type</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => { triggerHaptic('light'); setEditType('lend'); }}
                style={[
                  styles.pill,
                  {
                    backgroundColor: editType === 'lend' ? colors.terracotta : colors.cardSecondary,
                    borderColor: editType === 'lend' ? colors.terracotta : colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={{ color: editType === 'lend' ? '#FFFFFF' : colors.textPrimary, fontWeight: '800', fontSize: 12 }}>
                  Debit (You Gave)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { triggerHaptic('light'); setEditType('income'); }}
                style={[
                  styles.pill,
                  {
                    backgroundColor: editType === 'income' ? colors.matchaLime : colors.cardSecondary,
                    borderColor: editType === 'income' ? colors.matchaLime : colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={{ color: editType === 'income' ? '#141715' : colors.textPrimary, fontWeight: '800', fontSize: 12 }}>
                  Credit (You Got)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Date (YYYY-MM-DD)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <Calendar size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={editDate}
                onChangeText={setEditDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description / Notes</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <TextInput
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Notes..."
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          {/* Budget Envelope Selector in Edit */}
          {dbCards && dbCards.length > 0 && (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Budget Envelope</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => { triggerHaptic('light'); setEditCardId(undefined); }}
                  style={[
                    styles.cardChip,
                    {
                      backgroundColor: !editCardId ? colors.cardElevated : colors.cardSecondary,
                      borderColor: !editCardId ? colors.matchaLime : colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>None</Text>
                  {!editCardId && <Check size={11} color={colors.matchaLime} strokeWidth={3} />}
                </TouchableOpacity>
                {dbCards.map((card) => {
                  const isSel = editCardId === card.id;
                  return (
                    <TouchableOpacity
                      key={card.id}
                      onPress={() => { triggerHaptic('light'); setEditCardId(card.id); }}
                      style={[
                        styles.cardChip,
                        {
                          backgroundColor: isSel ? 'rgba(206,240,74,0.14)' : colors.cardSecondary,
                          borderColor: isSel ? colors.matchaLime : colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <CreditCard size={12} color={isSel ? colors.matchaLime : colors.textSecondary} />
                      <Text style={{ color: isSel ? colors.matchaLime : colors.textPrimary, fontSize: 12, fontWeight: isSel ? '800' : '600' }}>
                        {card.title}
                      </Text>
                      {isSel && <Check size={11} color={colors.matchaLime} strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSaveEdit}
            style={[styles.saveBtn, { backgroundColor: colors.matchaLime }]}
            activeOpacity={0.85}
          >
            <CheckCircle2 size={18} color="#141715" />
            <Text style={styles.saveBtnText}>Update Transaction</Text>
          </TouchableOpacity>
        </View>
      </CozyModal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  addIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 10,
  },
  personName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  phoneLine: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  noteLine: {
    fontSize: 11,
    marginTop: 2,
  },
  contactActionCol: {
    flexDirection: 'row',
    gap: 8,
  },
  contactCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginVertical: 8,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  remainingAmount: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginVertical: 4,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  foldGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  foldCell: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 2,
  },
  foldCellLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  foldCellValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  foldCellSub: {
    fontSize: 9,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  primaryActionBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 24,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#141715',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  filterSection: {
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    marginVertical: 10,
  },
  txCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  txMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardTagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  txNotes: {
    fontSize: 12,
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    marginTop: 4,
  },
  txAmountCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  txActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  miniActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    elevation: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  formGroup: {
    gap: 5,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDivider: {
    height: 1,
    marginVertical: 2,
  },
  pill: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#141715',
  },
});
