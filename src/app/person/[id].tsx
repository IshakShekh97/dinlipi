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
  Banknote,
  Hammer,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { FONTS, triggerHaptic } from '../../constants/theme';
import { AmbientGlowBackground } from '../../components/ui/AmbientGlowBackground';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { CozyModal } from '../../components/ui/CozyModal';
import { CalendarPickerModal } from '../../components/ui/CalendarPickerModal';
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
import { TagSelectorField } from '../../components/categories/TagSelectorField';

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
  // Receive Money Modal State
  // -------------------------------------------------------------
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveChannel, setReceiveChannel] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');
  const [receiveDateMode, setReceiveDateMode] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [receiveCustomDate, setReceiveCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiveCalendarVisible, setReceiveCalendarVisible] = useState(false);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveLinkedCardId, setReceiveLinkedCardId] = useState<string | undefined>();
  const [receiveCategoryId, setReceiveCategoryId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Add Work / Bill Modal State
  // -------------------------------------------------------------
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [billTitle, setBillTitle] = useState('');
  const [billTotalCost, setBillTotalCost] = useState('');
  const [billAdvancePaid, setBillAdvancePaid] = useState('');
  const [billShowAdvance, setBillShowAdvance] = useState(false);
  const [billChannel, setBillChannel] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');
  const [billDateMode, setBillDateMode] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [billCustomDate, setBillCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [billCalendarVisible, setBillCalendarVisible] = useState(false);
  const [billNotes, setBillNotes] = useState('');
  const [billLinkedCardId, setBillLinkedCardId] = useState<string | undefined>();
  const [billCategoryId, setBillCategoryId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Edit Transaction Modal State
  // -------------------------------------------------------------
  const [editingTx, setEditingTx] = useState<PersonTransactionItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'lend' | 'income'>('lend');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCalendarVisible, setEditCalendarVisible] = useState(false);
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

    allPersonTxs.forEach((t) => {
      if (t.type === 'lend' || t.type === 'expense') {
        billed += t.amount;
      } else if (t.type === 'income' || t.type === 'borrow') {
        paid += t.amount;
      }
    });

    const remaining = Math.max(0, billed - paid);
    const prog = billed > 0 ? Math.min(1, paid / billed) : 1;
    return {
      totalBilled: billed,
      totalPaid: paid,
      remainingDue: remaining,
      isSettled: remaining <= 0,
      progress: prog,
    };
  }, [allPersonTxs]);

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
  // Open Receive Money Modal
  // -------------------------------------------------------------
  const openReceiveModal = () => {
    triggerHaptic('medium');
    setReceiveAmount(remainingDue > 0 ? String(remainingDue) : '');
    setReceiveChannel('Cash');
    setReceiveDateMode('today');
    setReceiveCustomDate(new Date().toISOString().split('T')[0]);
    setReceiveNotes('');
    setReceiveLinkedCardId((person as any)?.cardId || (dbCards.length > 0 ? dbCards[0].id : undefined));
    setReceiveCategoryId(null);
    setReceiveModalVisible(true);
  };

  // -------------------------------------------------------------
  // Open Add Work / Bill Modal
  // -------------------------------------------------------------
  const openBillModal = () => {
    triggerHaptic('medium');
    setBillTitle('');
    setBillTotalCost('');
    setBillAdvancePaid('');
    setBillShowAdvance(false);
    setBillChannel('Cash');
    setBillDateMode('today');
    setBillCustomDate(new Date().toISOString().split('T')[0]);
    setBillNotes('');
    setBillLinkedCardId((person as any)?.cardId || (dbCards.length > 0 ? dbCards[0].id : undefined));
    setBillCategoryId(null);
    setBillModalVisible(true);
  };

  // -------------------------------------------------------------
  // Save Receive Money Entry
  // -------------------------------------------------------------
  const handleSaveReceive = async () => {
    const paidNum = parseFloat(receiveAmount);
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

    const effectiveCardId = receiveLinkedCardId || (person as any)?.cardId || (dbCards.length > 0 ? dbCards[0].id : undefined);

    let finalDate = new Date().toISOString();
    if (receiveDateMode === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      finalDate = d.toISOString();
    } else if (receiveDateMode === 'custom') {
      const p = new Date(receiveCustomDate);
      if (!isNaN(p.getTime())) finalDate = p.toISOString();
    }

    triggerHaptic('success');
    await addPersonEntry({
      personId: id,
      title: receiveNotes.trim() ? receiveNotes.trim() : 'Payment Received',
      totalCost: 0,
      paidAmount: paidNum,
      channel: receiveChannel,
      date: finalDate,
      notes: receiveNotes.trim() || `Payment via ${receiveChannel}`,
      cardId: effectiveCardId,
      categoryId: receiveCategoryId || 'Khata Settlement',
    });

    setReceiveModalVisible(false);
  };

  // -------------------------------------------------------------
  // Save Add Work / Bill Entry
  // -------------------------------------------------------------
  const handleSaveBill = async () => {
    const costNum = parseFloat(billTotalCost);
    if (isNaN(costNum) || costNum <= 0) {
      showConfirmDialog({
        title: 'Invalid Amount',
        message: 'Please enter a valid bill / cost amount.',
        confirmText: 'OK',
        cancelText: 'Cancel',
        onConfirm: () => {},
      });
      return;
    }

    const effectiveCardId = billLinkedCardId || (person as any)?.cardId || (dbCards.length > 0 ? dbCards[0].id : undefined);

    let finalDate = new Date().toISOString();
    if (billDateMode === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      finalDate = d.toISOString();
    } else if (billDateMode === 'custom') {
      const p = new Date(billCustomDate);
      if (!isNaN(p.getTime())) finalDate = p.toISOString();
    }

    const advanceNum = billShowAdvance ? (parseFloat(billAdvancePaid) || 0) : 0;

    triggerHaptic('success');
    await addPersonEntry({
      personId: id,
      title: billTitle.trim() || 'service and goods',
      totalCost: costNum,
      paidAmount: advanceNum,
      channel: billChannel,
      date: finalDate,
      notes: billNotes.trim(),
      cardId: effectiveCardId,
      categoryId: billCategoryId || 'service and goods',
    });

    setBillModalVisible(false);
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
    setEditCardId(item.cardId || (person as any)?.cardId || (dbCards.length > 0 ? dbCards[0].id : undefined));
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

  // Calculated Fold delta for the Bill modal
  const billCost = parseFloat(billTotalCost) || 0;
  const billAdvance = billShowAdvance ? (parseFloat(billAdvancePaid) || 0) : 0;
  const billRemaining = Math.max(0, billCost - billAdvance);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary, paddingTop: insets.top }}>
      {/* Ambient Diffuse Background Glow */}
      <AmbientGlowBackground glowColor={colors.mossSage} glowHeight={360} />

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
          onPress={openBillModal}
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
            onPress={openReceiveModal}
            style={[styles.primaryActionBtn, { backgroundColor: colors.matchaLime }]}
            activeOpacity={0.85}
          >
            <CheckCircle2 size={17} color="#141715" strokeWidth={2.5} />
            <Text style={[styles.primaryActionBtnText, { color: '#141715', fontWeight: '800' }]}>
              Receive Money
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openBillModal}
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
      {/* 1. Receive Money Modal                                        */}
      {/* ============================================================= */}
      <CozyModal
        visible={receiveModalVisible}
        onClose={() => setReceiveModalVisible(false)}
        title={`Receive Money from ${person.name}`}
        subtitle="Record a payment you received"
        icon={<Banknote size={20} color={colors.matchaLime} />}
      >
        <View style={{ gap: 14, paddingBottom: 16 }}>
          {/* Amount Received */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.matchaLime }]}>Amount Received ({currencySymbol})</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <Text style={{ color: colors.matchaLime, fontSize: 18, fontWeight: '900', marginRight: 8 }}>{currencySymbol}</Text>
              <TextInput
                value={receiveAmount}
                onChangeText={setReceiveAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
            {/* Quick Full Due Settlement Pill */}
            {remainingDue > 0 && (
              <TouchableOpacity
                onPress={() => { triggerHaptic('light'); setReceiveAmount(String(remainingDue)); }}
                style={[styles.quickDuePill, { backgroundColor: isDark ? 'rgba(206,240,74,0.12)' : 'rgba(206,240,74,0.15)', borderColor: colors.matchaLime }]}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.matchaLime, fontWeight: '800', fontSize: 12 }}>
                  Settle Full Due: {currencySymbol}{remainingDue.toLocaleString()}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Payment Method</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MODES.map((m) => {
                const sel = receiveChannel === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => { triggerHaptic('light'); setReceiveChannel(m); }}
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

          {/* Date Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Transaction Date</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DATE_MODES.map((dm) => {
                const sel = receiveDateMode === dm;
                const label = dm === 'today' ? 'Today' : dm === 'yesterday' ? 'Yesterday' : 'Custom';
                return (
                  <TouchableOpacity
                    key={dm}
                    onPress={() => { triggerHaptic('light'); setReceiveDateMode(dm); }}
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
            {receiveDateMode === 'custom' && (
              <TouchableOpacity
                onPress={() => { triggerHaptic('light'); setReceiveCalendarVisible(true); }}
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: isDark ? 'rgba(206, 240, 74, 0.08)' : '#F2F7EA',
                    borderColor: colors.matchaLime,
                    marginTop: 6,
                    justifyContent: 'space-between',
                  },
                ]}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Calendar size={15} color={colors.matchaLime} />
                  <Text style={[styles.textInput, { color: colors.textPrimary, fontFamily: FONTS.monoBold }]}>
                    {receiveCustomDate}
                  </Text>
                </View>
                <View style={{ backgroundColor: colors.matchaLime, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#141715', fontFamily: FONTS.sansBold, fontSize: 11 }}>
                    Pick Date
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <CalendarPickerModal
              visible={receiveCalendarVisible}
              onClose={() => setReceiveCalendarVisible(false)}
              selectedDate={receiveCustomDate}
              onSelectDate={(newDate) => {
                setReceiveCustomDate(newDate);
                setReceiveDateMode('custom');
              }}
              title="Select Payment Date"
            />
          </View>

          {/* Tag / Category Selector */}
          <TagSelectorField
            selectedCategoryId={receiveCategoryId}
            onSelectCategory={(cat) => setReceiveCategoryId(cat?.name || cat?.id || null)}
            label="Tag / Category (Optional)"
          />

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Private Notes (Optional)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <Tag size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={receiveNotes}
                onChangeText={setReceiveNotes}
                placeholder="e.g. partial payment, cash collected at shop"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          {/* Budget Envelope Selector */}
          {dbCards && dbCards.length > 0 && (
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Link to Budget Envelope *</Text>
                <Text style={{ color: colors.matchaLime, fontSize: 11, fontWeight: '700' }}>Required</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {dbCards.map((card) => {
                  const isSel = receiveLinkedCardId === card.id;
                  return (
                    <TouchableOpacity
                      key={card.id}
                      onPress={() => { triggerHaptic('light'); setReceiveLinkedCardId(card.id); }}
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
            onPress={handleSaveReceive}
            style={[styles.saveBtn, { backgroundColor: colors.matchaLime }]}
            activeOpacity={0.85}
          >
            <CheckCircle2 size={18} color="#141715" />
            <Text style={styles.saveBtnText}>Confirm Payment Received</Text>
          </TouchableOpacity>
        </View>
      </CozyModal>

      {/* ============================================================= */}
      {/* 2. Add Work / Bill Modal                                      */}
      {/* ============================================================= */}
      <CozyModal
        visible={billModalVisible}
        onClose={() => setBillModalVisible(false)}
        title={`Add Work / Bill for ${person.name}`}
        subtitle="Record a service, cost, or bill"
        icon={<Hammer size={20} color={colors.terracotta} />}
      >
        <View style={{ gap: 14, paddingBottom: 16 }}>
          {/* Title / Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Title / Description</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <FileText size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={billTitle}
                onChangeText={setBillTitle}
                placeholder="e.g. Cyber Cafe Work, Photocopy, Repair"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
              {QUICK_TITLES.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { triggerHaptic('light'); setBillTitle(t); }}
                  style={[styles.quickChip, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickChipText, { color: colors.textSecondary }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Total Bill / Cost */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.terracotta }]}>Total Bill / Cost ({currencySymbol})</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <Text style={{ color: colors.terracotta, fontSize: 18, fontWeight: '900', marginRight: 8 }}>{currencySymbol}</Text>
              <TextInput
                value={billTotalCost}
                onChangeText={setBillTotalCost}
                keyboardType="numeric"
                placeholder="500.00"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          {/* Optional Advance Payment Toggle */}
          <TouchableOpacity
            onPress={() => { triggerHaptic('light'); setBillShowAdvance(!billShowAdvance); }}
            style={[
              styles.advanceToggle,
              {
                backgroundColor: billShowAdvance
                  ? isDark ? 'rgba(206,240,74,0.10)' : 'rgba(206,240,74,0.12)'
                  : colors.cardSecondary,
                borderColor: billShowAdvance ? colors.matchaLime : colors.borderSubtle,
              },
            ]}
            activeOpacity={0.75}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[
                styles.advanceCheck,
                {
                  backgroundColor: billShowAdvance ? colors.matchaLime : 'transparent',
                  borderColor: billShowAdvance ? colors.matchaLime : colors.textMuted,
                },
              ]}>
                {billShowAdvance && <Check size={11} color="#141715" strokeWidth={3} />}
              </View>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                Customer paid advance / partial
              </Text>
            </View>
          </TouchableOpacity>

          {billShowAdvance && (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.matchaLime }]}>Advance / Partial Paid ({currencySymbol})</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
                <Text style={{ color: colors.matchaLime, fontSize: 18, fontWeight: '900', marginRight: 8 }}>{currencySymbol}</Text>
                <TextInput
                  value={billAdvancePaid}
                  onChangeText={setBillAdvancePaid}
                  keyboardType="numeric"
                  placeholder="100.00"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>
          )}

          {/* Live Bill Preview Box */}
          {billCost > 0 && (
            <View style={[styles.previewBox, { backgroundColor: colors.cardElevated, borderColor: colors.borderSubtle }]}>
              <View style={styles.previewRow}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Total Bill:</Text>
                <Text style={{ color: colors.terracotta, fontWeight: '700', fontSize: 12 }}>{currencySymbol}{billCost}</Text>
              </View>
              {billShowAdvance && billAdvance > 0 && (
                <View style={styles.previewRow}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Advance Paid:</Text>
                  <Text style={{ color: colors.matchaLime, fontWeight: '700', fontSize: 12 }}>{currencySymbol}{billAdvance}</Text>
                </View>
              )}
              <View style={[styles.previewDivider, { backgroundColor: colors.borderSubtle }]} />
              <View style={styles.previewRow}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Remaining to collect:</Text>
                <Text style={{ color: colors.terracotta, fontWeight: '900', fontSize: 14 }}>
                  {currencySymbol}{billRemaining}
                </Text>
              </View>
            </View>
          )}

          {/* Payment Method (if advance is being paid) */}
          {billShowAdvance && (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {MODES.map((m) => {
                  const sel = billChannel === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => { triggerHaptic('light'); setBillChannel(m); }}
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
                const sel = billDateMode === dm;
                const label = dm === 'today' ? 'Today' : dm === 'yesterday' ? 'Yesterday' : 'Custom';
                return (
                  <TouchableOpacity
                    key={dm}
                    onPress={() => { triggerHaptic('light'); setBillDateMode(dm); }}
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
            {billDateMode === 'custom' && (
              <TouchableOpacity
                onPress={() => { triggerHaptic('light'); setBillCalendarVisible(true); }}
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: isDark ? 'rgba(206, 240, 74, 0.08)' : '#F2F7EA',
                    borderColor: colors.matchaLime,
                    marginTop: 6,
                    justifyContent: 'space-between',
                  },
                ]}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Calendar size={15} color={colors.matchaLime} />
                  <Text style={[styles.textInput, { color: colors.textPrimary, fontFamily: FONTS.monoBold }]}>
                    {billCustomDate}
                  </Text>
                </View>
                <View style={{ backgroundColor: colors.matchaLime, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#141715', fontFamily: FONTS.sansBold, fontSize: 11 }}>
                    Pick Date
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <CalendarPickerModal
              visible={billCalendarVisible}
              onClose={() => setBillCalendarVisible(false)}
              selectedDate={billCustomDate}
              onSelectDate={(newDate) => {
                setBillCustomDate(newDate);
                setBillDateMode('custom');
              }}
              title="Select Bill Date"
            />
          </View>

          {/* Tag / Category Selector */}
          <TagSelectorField
            selectedCategoryId={billCategoryId}
            onSelectCategory={(cat) => setBillCategoryId(cat?.name || cat?.id || null)}
            label="Tag / Category (Optional)"
          />

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Notes / Memo (Optional)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
              <Tag size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={billNotes}
                onChangeText={setBillNotes}
                placeholder="e.g. 50 color prints, balance due by Friday"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          {/* Budget Envelope Selector */}
          {dbCards && dbCards.length > 0 && (
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Link to Budget Envelope *</Text>
                <Text style={{ color: colors.matchaLime, fontSize: 11, fontWeight: '700' }}>Required</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {dbCards.map((card) => {
                  const isSel = billLinkedCardId === card.id;
                  return (
                    <TouchableOpacity
                      key={card.id}
                      onPress={() => { triggerHaptic('light'); setBillLinkedCardId(card.id); }}
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
            onPress={handleSaveBill}
            style={[styles.saveBtn, { backgroundColor: colors.terracotta }]}
            activeOpacity={0.85}
          >
            <Hammer size={18} color="#FFFFFF" />
            <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>Record Work / Bill</Text>
          </TouchableOpacity>
        </View>
      </CozyModal>

      {/* ============================================================= */}
      {/* 3. Edit Transaction Modal                                     */}
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
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Date</Text>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setEditCalendarVisible(true);
              }}
              style={[
                styles.inputRow,
                {
                  backgroundColor: isDark ? 'rgba(206, 240, 74, 0.08)' : '#F2F7EA',
                  borderColor: colors.matchaLime,
                  justifyContent: 'space-between',
                },
              ]}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar size={15} color={colors.matchaLime} />
                <Text style={[styles.textInput, { color: colors.textPrimary, fontFamily: FONTS.monoBold }]}>
                  {editDate || 'Select Date'}
                </Text>
              </View>
              <View style={{ backgroundColor: colors.matchaLime, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ color: '#141715', fontFamily: FONTS.sansBold, fontSize: 11 }}>
                  Open Calendar
                </Text>
              </View>
            </TouchableOpacity>

            <CalendarPickerModal
              visible={editCalendarVisible}
              onClose={() => setEditCalendarVisible(false)}
              selectedDate={editDate}
              onSelectDate={(newDate) => {
                setEditDate(newDate);
              }}
              title="Edit Transaction Date"
            />
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

          {/* Budget Envelope Selector in Edit (Mandatory) */}
          {dbCards && dbCards.length > 0 && (
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Budget Envelope *</Text>
                <Text style={{ color: colors.matchaLime, fontSize: 11, fontWeight: '700' }}>Required</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  addIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginVertical: 10,
  },
  personName: {
    fontSize: 18,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.3,
  },
  phoneLine: {
    fontSize: 13,
    fontFamily: FONTS.mono,
    marginTop: 2,
  },
  noteLine: {
    fontSize: 12,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
  },
  contactActionCol: {
    flexDirection: 'row',
    gap: 8,
  },
  contactCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
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
    fontFamily: FONTS.sansMedium,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  remainingAmount: {
    fontSize: 34,
    fontFamily: FONTS.monoBold,
    letterSpacing: -1.2,
    marginVertical: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 16,
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 3,
  },
  foldCellLabel: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
    letterSpacing: -0.2,
  },
  foldCellValue: {
    fontSize: 18,
    fontFamily: FONTS.monoBold,
    letterSpacing: -0.5,
  },
  foldCellSub: {
    fontSize: 10,
    fontFamily: FONTS.sansRegular,
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
    height: 50,
    borderRadius: 25,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontFamily: FONTS.sansBold,
    color: '#141715',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontFamily: FONTS.sansSemiBold,
  },
  sectionHeaderRow: {
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.sansRegular,
    marginTop: 1,
  },
  filterSection: {
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    marginVertical: 10,
  },
  txCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  txMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.sansBold,
    letterSpacing: 0.3,
  },
  cardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardTagText: {
    fontSize: 10,
    fontFamily: FONTS.sansSemiBold,
  },
  txTitle: {
    fontSize: 15,
    fontFamily: FONTS.sansSemiBold,
    marginTop: 4,
  },
  txNotes: {
    fontSize: 12,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    marginTop: 4,
  },
  txAmountCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  txAmount: {
    fontSize: 16,
    fontFamily: FONTS.monoBold,
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
  quickDuePill: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  advanceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  advanceCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
