import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Plus,
  Receipt,
  User,
  Tag,
  ChevronRight,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { FONTS, triggerHaptic } from '../../constants/theme';
import { AmbientGlowBackground } from '../../components/ui/AmbientGlowBackground';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';
import {
  useTransactionsLive,
  useBudgetCardsLive,
  useCategoriesLive,
  usePeopleLive,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '../../db/queries';
import {
  TransactionDetailModal,
  TransactionItemData,
} from '../../components/ledger/TransactionDetailModal';
import {
  QuickEntryModal,
  QuickEntryData,
} from '../../components/ledger/QuickEntryModal';
import { BudgetCardData } from '../../components/cards/BudgetCardModal';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { activeCurrency, showConfirmDialog } = useUIStore();
  const currencySymbol = getCurrencySymbol(activeCurrency);

  // Live Database Queries
  const { data: dbTx = [] } = useTransactionsLive();
  const { data: dbCards = [] } = useBudgetCardsLive();
  const { data: dbCategories = [] } = useCategoriesLive();
  const { data: dbPeople = [] } = usePeopleLive();

  // Optimistic local override states
  // We keep track of local additions, edits, and deletions so UI updates with 0ms delay
  const [localAdded, setLocalAdded] = useState<any[]>([]);
  const [localEdited, setLocalEdited] = useState<Map<string, any>>(new Map());
  const [localDeletedIds, setLocalDeletedIds] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'lend' | 'borrow'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modals
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItemData | null>(null);

  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [editingEntryData, setEditingEntryData] = useState<QuickEntryData | null>(null);
  const [entryType, setEntryType] = useState<'expense' | 'income' | 'transfer'>('expense');

  // Lookup maps
  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    dbPeople.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [dbPeople]);

  const cardsMap = useMemo(() => {
    const map = new Map<string, string>();
    dbCards.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [dbCards]);

  const personCardMap = useMemo(() => {
    const map = new Map<string, string>();
    dbPeople.forEach((p) => {
      if ((p as any).cardId) map.set(p.id, (p as any).cardId);
    });
    return map;
  }, [dbPeople]);

  const budgetCardsData: BudgetCardData[] = useMemo(() => {
    return dbCards.map((c) => ({
      id: c.id,
      name: c.title,
      cardType: (c.icon?.toUpperCase() || 'VAULT') as any,
      limit: c.totalLimit,
      spent: c.spent || 0,
      cardNum: '**** 9743',
      holder: 'Budget Envelope',
      expiry: c.cycleDate || 'Monthly',
      variant: (c.color as any) || 'matchaLime',
    }));
  }, [dbCards]);

  // Combine DB data with optimistic local state
  const rawMergedTransactions = useMemo(() => {
    // 1. Filter out deleted
    const filteredDb = dbTx.filter((t) => !localDeletedIds.has(t.id));

    // 2. Apply edits
    const editedList = filteredDb.map((t) => {
      if (localEdited.has(t.id)) {
        return { ...t, ...localEdited.get(t.id) };
      }
      return t;
    });

    // 3. Prepend newly added (optimistic) that aren't yet in dbTx
    const nonDuplicatedAdded = localAdded.filter(
      (la) => !editedList.some((t) => t.id === la.id)
    );

    return [...nonDuplicatedAdded, ...editedList];
  }, [dbTx, localAdded, localEdited, localDeletedIds]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Start of week (7 days ago)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Start of month (1st day)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return rawMergedTransactions.filter((tx) => {
      // 1. Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'expense' && tx.type !== 'expense') return false;
        if (typeFilter === 'income' && tx.type !== 'income') return false;
        if (typeFilter === 'lend' && tx.type !== 'lend') return false;
        if (typeFilter === 'borrow' && tx.type !== 'borrow') return false;
      }

      // 2. Budget Card filter (matches transaction's cardId OR linked person's cardId)
      if (selectedCardId) {
        const txCardId = tx.cardId;
        const personLinkedCardId = tx.personId ? personCardMap.get(tx.personId) : null;
        if (txCardId !== selectedCardId && personLinkedCardId !== selectedCardId) {
          return false;
        }
      }

      // 3. Category filter
      if (selectedCategory && tx.categoryId !== selectedCategory) {
        return false;
      }

      // 4. Time filter
      if (timeFilter !== 'all') {
        const txDate = new Date(tx.timestamp);
        if (isNaN(txDate.getTime())) return true;

        if (timeFilter === 'today') {
          if (tx.timestamp.split('T')[0] !== todayStr) return false;
        } else if (timeFilter === 'week') {
          if (txDate < weekAgo) return false;
        } else if (timeFilter === 'month') {
          if (txDate < startOfMonth) return false;
        }
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tx.title.toLowerCase().includes(q);
        const matchNotes = (tx.notes || '').toLowerCase().includes(q);
        const matchCategory = (tx.categoryId || '').toLowerCase().includes(q);
        const personName = tx.personId ? (peopleMap.get(tx.personId) || '').toLowerCase() : '';
        const matchPerson = personName.includes(q);

        return matchTitle || matchNotes || matchCategory || matchPerson;
      }

      return true;
    });
  }, [rawMergedTransactions, typeFilter, selectedCardId, selectedCategory, timeFilter, searchQuery, peopleMap, personCardMap]);

  // Summary Metrics
  const { totalInflow, totalOutflow, netBalance } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'income' || t.type === 'borrow') {
        inflow += t.amount;
      } else {
        outflow += t.amount;
      }
    });

    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      netBalance: inflow - outflow,
    };
  }, [filteredTransactions]);

  // Group by Date for cleaner presentation
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: typeof filteredTransactions } = {};

    filteredTransactions.forEach((tx) => {
      let dateKey = 'Recent';
      try {
        const d = new Date(tx.timestamp);
        if (!isNaN(d.getTime())) {
          dateKey = d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        }
      } catch {
        dateKey = 'Recent';
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });

    return Object.entries(groups);
  }, [filteredTransactions]);

  // -------------------------------------------------------------
  // Handlers (Optimistic)
  // -------------------------------------------------------------
  const handleOpenDetail = (tx: any) => {
    triggerHaptic('light');
    let channel: 'Cash' | 'UPI' | 'Bank' = 'Cash';
    if (tx.notes?.includes('UPI')) channel = 'UPI';
    else if (tx.notes?.includes('Bank')) channel = 'Bank';

    const envelopeName = tx.cardId ? cardsMap.get(tx.cardId) || 'Envelope' : 'General';

    let displayTime = tx.timestamp;
    try {
      const d = new Date(tx.timestamp);
      if (!isNaN(d.getTime())) {
        displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {
      displayTime = tx.timestamp;
    }

    const itemData: TransactionItemData = {
      id: tx.id,
      title: tx.title,
      category: tx.categoryId || 'General',
      amount: tx.amount,
      type: tx.type === 'expense' || tx.type === 'lend' ? 'expense' : 'income',
      channel,
      envelope: envelopeName,
      time: displayTime,
      date: tx.timestamp.split('T')[0],
    };

    setSelectedTx(itemData);
    setDetailModalVisible(true);
  };

  const handleOpenAdd = (type: 'expense' | 'income' = 'expense') => {
    triggerHaptic('medium');
    setEntryType(type);
    setEditingEntryData(null);
    setEntryModalVisible(true);
  };

  const handleOpenEdit = (item: TransactionItemData) => {
    setDetailModalVisible(false);
    triggerHaptic('light');
    const existing = rawMergedTransactions.find((t) => t.id === item.id);

    const normalizedType: 'expense' | 'income' =
      item.type === 'income' || item.type === 'borrow' ? 'income' : 'expense';

    const editData: QuickEntryData = {
      id: item.id,
      title: item.title,
      amount: item.amount,
      type: normalizedType,
      category: item.category,
      channel: item.channel,
      date: item.date,
      cardId: existing?.cardId || undefined,
    };

    setEditingEntryData(editData);
    setEntryType(normalizedType);
    setEntryModalVisible(true);
  };

  const handleSaveEntry = useCallback(
    async (entry: QuickEntryData) => {
      setEntryModalVisible(false);
      triggerHaptic('success');

      if (entry.id) {
        // Optimistic Edit
        const updatedObj = {
          id: entry.id,
          title: entry.title,
          amount: entry.amount,
          type: entry.type,
          categoryId: entry.category,
          cardId: entry.cardId,
          timestamp: entry.date ? new Date(entry.date).toISOString() : new Date().toISOString(),
          notes: entry.channel || '',
        };

        setLocalEdited((prev) => {
          const next = new Map(prev);
          next.set(entry.id!, updatedObj);
          return next;
        });

        // Persist in background
        await updateTransaction({
          id: entry.id,
          title: entry.title,
          amount: entry.amount,
          type: entry.type as any,
          categoryId: entry.category,
          cardId: entry.cardId,
          date: entry.date,
          notes: entry.channel,
        });
      } else {
        // Optimistic Add
        const tempId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newObj = {
          id: tempId,
          title: entry.title,
          amount: entry.amount,
          type: entry.type,
          categoryId: entry.category || 'General',
          cardId: entry.cardId,
          timestamp: entry.date ? new Date(entry.date).toISOString() : new Date().toISOString(),
          notes: entry.channel || 'Cash',
          tags: '[]',
        };

        setLocalAdded((prev) => [newObj, ...prev]);

        // Persist in background
        await addTransaction({
          title: entry.title,
          amount: entry.amount,
          type: entry.type as any,
          categoryId: entry.category,
          cardId: entry.cardId,
          date: entry.date,
          notes: entry.channel,
        });
      }
    },
    []
  );

  const handleDeleteTx = useCallback(
    (id: string) => {
      setDetailModalVisible(false);
      triggerHaptic('warning');
      showConfirmDialog({
        title: 'Delete Transaction',
        message: 'Are you sure you want to delete this transaction from the application ledger?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        isDestructive: true,
        onConfirm: async () => {
          // Optimistic Delete
          setLocalDeletedIds((prev) => new Set(prev).add(id));
          triggerHaptic('medium');
          await deleteTransaction(id);
        },
      });
    },
    [showConfirmDialog]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary, paddingTop: insets.top }}>
      {/* Ambient Diffuse Background Glow directly from Reference Image 2 */}
      <AmbientGlowBackground glowColor={colors.terracotta} glowHeight={380} />

      {/* Top App Header matching Reference Image 2: "Activity 🕒" and "Past" */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Activity 🕒
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Past
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => handleOpenAdd('income')}
            style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }]}
            activeOpacity={0.75}
          >
            <TrendingUp size={16} color={colors.matchaLime} />
            <Text style={[styles.headerBtnText, { color: colors.textPrimary }]}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOpenAdd('expense')}
            style={[styles.headerBtn, { backgroundColor: colors.matchaLime, borderColor: colors.matchaLime }]}
            activeOpacity={0.75}
          >
            <Plus size={16} color="#141715" />
            <Text style={[styles.headerBtnText, { color: '#141715', fontWeight: '800' }]}>Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Nested Dark Glass Hero Card directly from Reference Image 2 */}
        <View style={[styles.kpiCard, { backgroundColor: isDark ? 'rgba(22, 25, 24, 0.82)' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Total Inflow</Text>
            <Text style={[styles.kpiAmount, { color: colors.matchaLime }]}>
              +{currencySymbol}{totalInflow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.kpiCol}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Total Outflow</Text>
            <Text style={[styles.kpiAmount, { color: colors.terracotta }]}>
              -{currencySymbol}{totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.kpiCol}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Net Balance</Text>
            <Text style={[styles.kpiAmount, { color: netBalance >= 0 ? colors.matchaLime : colors.terracotta }]}>
              {netBalance >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(netBalance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Real-time Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by title, category, contact, notes..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Time Period Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginVertical: 6 }}
        >
          {(['all', 'today', 'week', 'month'] as const).map((tf) => {
            const isSel = timeFilter === tf;
            const label = tf === 'all' ? 'All Time' : tf === 'today' ? 'Today' : tf === 'week' ? 'Past 7 Days' : 'This Month';
            return (
              <TouchableOpacity
                key={tf}
                onPress={() => { triggerHaptic('light'); setTimeFilter(tf); }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSel ? colors.cardElevated : colors.cardSecondary,
                    borderColor: isSel ? colors.matchaLime : colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, { color: isSel ? colors.matchaLime : colors.textSecondary, fontWeight: isSel ? '800' : '600' }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Type Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 8 }}
        >
          {(['all', 'expense', 'income', 'lend', 'borrow'] as const).map((tp) => {
            const isSel = typeFilter === tp;
            const label =
              tp === 'all'
                ? 'All Types'
                : tp === 'expense'
                ? 'Expenses'
                : tp === 'income'
                ? 'Income'
                : tp === 'lend'
                ? 'Lent (Gave)'
                : 'Borrowed (Got)';
            return (
              <TouchableOpacity
                key={tp}
                onPress={() => { triggerHaptic('light'); setTypeFilter(tp); }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSel ? colors.cardElevated : colors.cardSecondary,
                    borderColor: isSel ? colors.matchaLime : colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, { color: isSel ? colors.matchaLime : colors.textSecondary, fontWeight: isSel ? '800' : '600' }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Budget Envelope Filter Chips */}
        {dbCards.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Filter by Budget Envelope
              </Text>
              {selectedCardId && (
                <TouchableOpacity onPress={() => setSelectedCardId(null)}>
                  <Text style={{ fontSize: 11, color: colors.matchaLime, fontWeight: '800' }}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => { triggerHaptic('light'); setSelectedCardId(null); }}
                style={[
                  styles.envelopeChip,
                  {
                    backgroundColor: !selectedCardId ? colors.cardElevated : colors.cardSecondary,
                    borderColor: !selectedCardId ? colors.matchaLime : colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.75}
              >
                <CreditCard size={11} color={!selectedCardId ? colors.matchaLime : colors.textMuted} />
                <Text style={{ fontSize: 11, fontWeight: !selectedCardId ? '800' : '600', color: !selectedCardId ? colors.matchaLime : colors.textSecondary }}>
                  All Budgets
                </Text>
              </TouchableOpacity>

              {dbCards.map((c) => {
                const isSel = selectedCardId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => { triggerHaptic('light'); setSelectedCardId(isSel ? null : c.id); }}
                    style={[
                      styles.envelopeChip,
                      {
                        backgroundColor: isSel ? 'rgba(206,240,74,0.14)' : colors.cardSecondary,
                        borderColor: isSel ? colors.matchaLime : colors.borderSubtle,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <CreditCard size={11} color={isSel ? colors.matchaLime : colors.textMuted} />
                    <Text style={{ fontSize: 11, fontWeight: isSel ? '800' : '600', color: isSel ? colors.matchaLime : colors.textSecondary }}>
                      {c.title}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>
                      ({currencySymbol}{Math.round(c.spent || 0)}/{currencySymbol}{Math.round(c.totalLimit)})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Category Filter Chips */}
        {dbCategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 12 }}
          >
            <TouchableOpacity
              onPress={() => { triggerHaptic('light'); setSelectedCategory(null); }}
              style={[
                styles.envelopeChip,
                {
                  backgroundColor: !selectedCategory ? colors.cardElevated : colors.cardSecondary,
                  borderColor: !selectedCategory ? colors.matchaLime : colors.borderSubtle,
                },
              ]}
              activeOpacity={0.75}
            >
              <Tag size={11} color={!selectedCategory ? colors.matchaLime : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: !selectedCategory ? '800' : '600', color: !selectedCategory ? colors.matchaLime : colors.textSecondary }}>
                All Categories
              </Text>
            </TouchableOpacity>

            {dbCategories.map((cat) => {
              const isSel = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { triggerHaptic('light'); setSelectedCategory(isSel ? null : cat.name); }}
                  style={[
                    styles.envelopeChip,
                    {
                      backgroundColor: isSel ? 'rgba(206,240,74,0.12)' : colors.cardSecondary,
                      borderColor: isSel ? colors.matchaLime : colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Tag size={11} color={isSel ? colors.matchaLime : colors.textMuted} />
                  <Text style={{ fontSize: 11, fontWeight: isSel ? '800' : '600', color: isSel ? colors.matchaLime : colors.textSecondary }}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Grouped Transactions List */}
        {groupedByDate.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
            <Receipt size={36} color={colors.textMuted} style={{ marginBottom: 10 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 }}>
              No Transactions Found
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', maxWidth: 280 }}>
              {searchQuery || typeFilter !== 'all' || timeFilter !== 'all' || selectedCardId
                ? 'Try adjusting your filters or search terms.'
                : 'No transactions recorded yet. Tap "+ Expense" or "Income" above to record your first transaction.'}
            </Text>
          </View>
        ) : (
          groupedByDate.map(([dateStr, txs]) => (
            <View key={dateStr} style={{ marginBottom: 16 }}>
              <View style={styles.groupHeaderRow}>
                <Text style={[styles.groupDateText, { color: colors.textMuted }]}>{dateStr}</Text>
                <Text style={[styles.groupCountText, { color: colors.textMuted }]}>{txs.length} entries</Text>
              </View>

              {txs.map((t) => {
                const isExpense = t.type === 'expense' || t.type === 'lend';
                const itemColor = isExpense ? colors.terracotta : colors.matchaLime;
                const personName = t.personId ? peopleMap.get(t.personId) : null;
                const cardName = t.cardId ? cardsMap.get(t.cardId) : null;

                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => handleOpenDetail(t)}
                    style={[
                      styles.txRow,
                      {
                        backgroundColor: isDark ? 'rgba(32, 35, 34, 0.85)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                    activeOpacity={0.78}
                  >
                    {/* Rounded Square Badge matching Reference Image 2 */}
                    <View
                      style={[
                        styles.iconSquare,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F4F4EE',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      ]}
                    >
                      {isExpense ? (
                        <TrendingDown size={18} color={colors.terracotta} strokeWidth={2.2} />
                      ) : (
                        <TrendingUp size={18} color={colors.matchaLime} strokeWidth={2.2} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txTitle, { color: colors.textPrimary }]}>{t.title}</Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <Text style={[styles.categoryTag, { color: colors.textSecondary }]}>
                          {t.categoryId || 'General'}
                        </Text>

                        {personName && (
                          <View style={[styles.miniBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0EA', borderColor: colors.borderSubtle }]}>
                            <User size={10} color={colors.matchaLime} />
                            <Text style={[styles.miniBadgeText, { color: colors.matchaLime }]}>{personName}</Text>
                          </View>
                        )}

                        {cardName && (
                          <View style={[styles.miniBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0EA', borderColor: colors.borderSubtle }]}>
                            <CreditCard size={10} color={colors.textSecondary} />
                            <Text style={[styles.miniBadgeText, { color: colors.textSecondary }]}>{cardName}</Text>
                          </View>
                        )}
                      </View>

                      {Boolean(t.notes) && (
                        <Text style={[styles.notesText, { color: colors.textMuted }]} numberOfLines={1}>
                          {t.notes}
                        </Text>
                      )}
                    </View>

                    <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                      <Text style={[styles.amountText, { color: itemColor }]}>
                        {isExpense ? '-' : '+'}{currencySymbol}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </Text>
                      <Text style={[styles.txTypeLabel, { color: colors.textMuted }]}>
                        {t.type.toUpperCase()}
                      </Text>
                    </View>

                    {/* Subtle Right Chevron Pill directly from Image 2 */}
                    <View
                      style={[
                        styles.chevronPill,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F4F4EE',
                        },
                      ]}
                    >
                      <ChevronRight size={14} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        visible={detailModalVisible}
        transaction={selectedTx}
        onClose={() => setDetailModalVisible(false)}
        onDelete={handleDeleteTx}
        onEdit={handleOpenEdit}
      />

      {/* Quick Entry Modal (Add / Edit) */}
      <QuickEntryModal
        visible={entryModalVisible}
        type={entryType}
        initialData={editingEntryData}
        cards={budgetCardsData}
        currencySymbol={currencySymbol}
        onClose={() => setEntryModalVisible(false)}
        onSave={handleSaveEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 24,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontFamily: FONTS.serifItalic,
    fontSize: 14,
    marginTop: 2,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerBtnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
  },
  kpiCard: {
    flexDirection: 'row',
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  kpiDivider: {
    width: 1,
    height: 36,
  },
  kpiLabel: {
    fontFamily: FONTS.sansRegular,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  kpiAmount: {
    fontFamily: FONTS.monoBold,
    fontSize: 15,
    letterSpacing: -0.4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.sansRegular,
    fontSize: 13,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterChipText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
  },
  envelopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 34,
    alignItems: 'center',
    marginTop: 24,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  groupDateText: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  groupCountText: {
    fontFamily: FONTS.sansRegular,
    fontSize: 11,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    padding: 13,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  txTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  categoryTag: {
    fontFamily: FONTS.sansRegular,
    fontSize: 11,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  miniBadgeText: {
    fontFamily: FONTS.sansBold,
    fontSize: 10,
  },
  notesText: {
    fontFamily: FONTS.sansRegular,
    fontSize: 11,
    marginTop: 3,
  },
  amountText: {
    fontFamily: FONTS.monoBold,
    fontSize: 15,
    letterSpacing: -0.4,
  },
  txTypeLabel: {
    fontFamily: FONTS.sansRegular,
    fontSize: 10,
    marginTop: 2,
  },
  chevronPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
