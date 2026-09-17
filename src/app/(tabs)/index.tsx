import React, { useState, useMemo } from 'react';
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
  Bell,
  Search,
  X,
  ArrowDownLeft,
  ArrowLeftRight,
  FolderOpen,
  Repeat,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { UserProfileModal, UserProfile } from '../../components/profile/UserProfileModal';
import { PermissionsModal } from '../../components/security/PermissionsModal';
import {
  TransactionDetailModal,
  TransactionItemData,
} from '../../components/ledger/TransactionDetailModal';
import {
  BudgetCardModal,
  BudgetCardData,
} from '../../components/cards/BudgetCardModal';
import {
  CategoryManagerModal,
  CategoryItem,
} from '../../components/categories/CategoryManagerModal';
import {
  RecurringManagerModal,
  RecurringTransaction,
} from '../../components/recurring/RecurringManagerModal';
import { BudgetCardStack } from '../../components/cards/BudgetCardStack';
import { TransactionList, DashboardTxItem } from '../../components/ledger/TransactionList';
import { CategoryCarousel } from '../../components/categories/CategoryCarousel';
import { QuickEntryModal, QuickEntryData } from '../../components/ledger/QuickEntryModal';
import {
  useTransactionsLive,
  useBudgetCardsLive,
  useCategoriesLive,
  useRecurringLive,
  useUserLive,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addBudgetCard,
  updateBudgetCard,
  deleteBudgetCard,
  addCategory,
  updateCategory,
  deleteCategory,
  addRecurring,
  updateUserProfile,
} from '../../db/queries';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';

export default function DaybookScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  // Zustand UI Store
  const {
    activeCurrency,
    activeCardIndex,
    setActiveCardIndex,
    dashboardTimeFilter,
    setDashboardTimeFilter,
    dashboardSearchQuery,
    setDashboardSearchQuery,
    selectedTx,
    setSelectedTx,
    detailModalVisible,
    setDetailModalVisible,
    editingTx,
    setEditingTx,
    budgetModalVisible,
    setBudgetModalVisible,
    editingBudgetCard,
    setEditingBudgetCard,
    categoryModalVisible,
    setCategoryModalVisible,
    recurringModalVisible,
    setRecurringModalVisible,
    entryModalVisible,
    setEntryModalVisible,
    profileModalVisible,
    setProfileModalVisible,
    permissionsModalVisible,
    setPermissionsModalVisible,
  } = useUIStore();

  const [quickEntryType, setQuickEntryType] = useState<'expense' | 'income' | 'transfer'>('expense');

  // Drizzle Reactive Live Queries
  const { data: dbCards = [] } = useBudgetCardsLive();
  const { data: dbTx = [] } = useTransactionsLive();
  const { data: dbCategories = [] } = useCategoriesLive();
  const { data: dbRecurring = [] } = useRecurringLive();
  const { data: dbUsers = [] } = useUserLive();

  // Map Drizzle data to component models - 100% dynamic without static seed fallbacks
  const userProfile: UserProfile = useMemo(() => {
    if (dbUsers && dbUsers.length > 0) {
      const u = dbUsers[0];
      return {
        name: u.name,
        phone: u.phone || '',
        avatar: u.avatar || 'avatar_matcha_fox',
        currency: u.currency || '₹ INR',
      };
    }
    return {
      name: 'Valued Member',
      phone: '',
      avatar: 'avatar_matcha_fox',
      currency: '₹ INR',
    };
  }, [dbUsers]);

  const budgetCards: BudgetCardData[] = useMemo(() => {
    if (dbCards && dbCards.length > 0) {
      return dbCards.map((c) => ({
        id: c.id,
        name: c.title,
        cardType: (c.icon?.toUpperCase() || 'VISA') as any,
        limit: c.totalLimit,
        spent: c.spent || 0,
        cardNum: '**** 9743',
        holder: userProfile.name || 'Valued Member',
        expiry: c.cycleDate || 'Monthly',
        variant: (c.color as any) || 'matchaLime',
        tabLabel: c.meshGradient || c.title.slice(0, 10),
      }));
    }
    return [];
  }, [dbCards, userProfile.name]);

  const transactions: DashboardTxItem[] = useMemo(() => {
    if (dbTx && dbTx.length > 0) {
      return dbTx.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.categoryId || 'General',
        time: t.timestamp,
        amount: t.amount,
        isExpense: t.type === 'expense',
        channel: (t.notes as any) || 'Cash',
        color: t.type === 'expense' ? '#E07A5F' : '#CEF04A',
      }));
    }
    return [];
  }, [dbTx]);

  const categories: CategoryItem[] = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        iconName: c.icon,
        color: c.color,
        budget: c.budgetLimit || 0,
        spent: 0,
        type: (c.type as any) || 'expense',
      }));
    }
    return [];
  }, [dbCategories]);

  const recurringList: RecurringTransaction[] = useMemo(() => {
    if (dbRecurring && dbRecurring.length > 0) {
      return dbRecurring.map((r) => ({
        id: r.id,
        name: r.title,
        amount: r.amount,
        frequency: (r.frequency as any) || 'monthly',
        category: r.categoryId || 'General',
        nextBillingDate: r.nextDueDate,
        active: Boolean(r.isActive),
        iconName: 'tv',
        color: '#CEF04A',
      }));
    }
    return [];
  }, [dbRecurring]);

  // Total balance calculation
  const totalBalance = useMemo(
    () => budgetCards.reduce((acc, c) => acc + (c.limit - c.spent), 0),
    [budgetCards]
  );

  // Search filtered transactions
  const filteredTx = useMemo(() => {
    if (!dashboardSearchQuery.trim()) return transactions;
    const q = dashboardSearchQuery.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.title.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.channel.toLowerCase().includes(q)
    );
  }, [transactions, dashboardSearchQuery]);

  const currencySymbol = getCurrencySymbol(userProfile.currency || activeCurrency);

  // Quick Action handler
  const openQuickEntry = (type: 'expense' | 'income' | 'transfer') => {
    triggerHaptic();
    setEditingTx(null);
    setQuickEntryType(type);
    setEntryModalVisible(true);
  };

  const handleSaveQuickEntry = async (entry: QuickEntryData) => {
    if (entry.id) {
      await updateTransaction({
        id: entry.id,
        title: entry.title,
        amount: entry.amount,
        type: entry.type === 'income' ? 'income' : 'expense',
        categoryId: entry.category,
        notes: entry.channel,
      });
    } else {
      await addTransaction({
        title: entry.title,
        amount: entry.amount,
        type: entry.type === 'income' ? 'income' : 'expense',
        categoryId: entry.category,
        notes: entry.channel,
      });
    }
    setEditingTx(null);
  };

  const handleDeleteBudgetCard = async (id: string) => {
    await deleteBudgetCard(id);
    setActiveCardIndex(0);
  };

  const handleEditTransaction = (tx: TransactionItemData) => {
    setEditingTx(tx);
    setQuickEntryType(tx.type);
    setEntryModalVisible(true);
  };

  const handleSaveBudgetCard = async (cardData: BudgetCardData) => {
    if (editingBudgetCard) {
      await updateBudgetCard(cardData);
    } else {
      await addBudgetCard(cardData);
      setActiveCardIndex(0);
    }
    setEditingBudgetCard(null);
  };

  const handleSaveCategory = async (cat: CategoryItem) => {
    const exists = categories.some((c) => c.id === cat.id);
    if (exists) {
      await updateCategory(cat);
    } else {
      await addCategory(cat);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
  };

  const handleSaveRecurring = async (rec: RecurringTransaction) => {
    await addRecurring(rec);
  };

  const handleSaveProfile = async (newProfile: UserProfile) => {
    await updateUserProfile({
      name: newProfile.name,
      phone: newProfile.phone,
      avatar: newProfile.avatar,
      currency: newProfile.currency,
    });
  };

  const openTxDetail = (tx: DashboardTxItem) => {
    triggerHaptic('light');
    const modalData: TransactionItemData = {
      id: tx.id,
      title: tx.title,
      category: tx.category,
      amount: tx.amount,
      type: tx.isExpense ? 'expense' : 'income',
      channel: (['Cash', 'UPI', 'Bank'].includes(tx.channel) ? tx.channel : 'Cash') as 'Cash' | 'UPI' | 'Bank',
      envelope: 'General Budget',
      time: tx.time,
      date: 'Today',
    };
    setSelectedTx(modalData);
    setDetailModalVisible(true);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgPrimary,
        paddingTop: Math.max(insets.top + 6, 32),
      }}
    >
      {/* Top Bar: Profile avatar, greeting, notifications toggle */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => {
            triggerHaptic('light');
            setProfileModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <UserAvatar
            avatarIdOrUri={userProfile.avatar}
            name={userProfile.name}
            size="md"
            showRing
          />
          <View>
            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
              Hi, {userProfile.name.split(' ')[0]} • Available {userProfile.currency} {totalBalance.toLocaleString()}
            </Text>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
              Welcome Back!
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={[
              styles.topIconBtn,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE',
                borderColor: isDark ? colors.borderSubtle : '#EAEAE2',
              },
            ]}
            onPress={() => {
              triggerHaptic('light');
              setPermissionsModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Bell size={18} color={colors.textPrimary} />
            <View
              style={[
                styles.notifDot,
                { backgroundColor: colors.matchaLime },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Real-time Search Input Bar */}
      <View style={styles.searchBarWrapper}>
        <View
          style={[
            styles.searchBarBox,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE',
              borderColor: isDark ? colors.borderSubtle : '#E8E8E0',
            },
          ]}
        >
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={dashboardSearchQuery}
            onChangeText={setDashboardSearchQuery}
            placeholder="Search payments, transactions, channels..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInputText, { color: colors.textPrimary }]}
          />
          {dashboardSearchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setDashboardSearchQuery('');
              }}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Modular Stepped Budget Cards Stack */}
        <BudgetCardStack
          cards={budgetCards}
          activeIndex={activeCardIndex}
          onSelectIndex={setActiveCardIndex}
          onAddCard={() => {
            setEditingBudgetCard(null);
            setBudgetModalVisible(true);
          }}
          onEditCard={(card) => {
            setEditingBudgetCard(card);
            setBudgetModalVisible(true);
          }}
          currencySymbol={currencySymbol}
        />

        {/* 4 Agile Action Buttons */}
        <View
          style={[
            styles.agileBar,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.agileBtn}
            onPress={() => openQuickEntry('income')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.agileIconBox,
                { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
              ]}
            >
              <ArrowDownLeft size={20} color={colors.matchaLime} />
            </View>
            <Text style={[styles.agileLabel, { color: colors.textPrimary }]}>
              Deposit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.agileBtn}
            onPress={() => openQuickEntry('transfer')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.agileIconBox,
                { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
              ]}
            >
              <ArrowLeftRight size={20} color={colors.goldenHoney} />
            </View>
            <Text style={[styles.agileLabel, { color: colors.textPrimary }]}>
              Transfer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.agileBtn}
            onPress={() => openQuickEntry('expense')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.agileIconBox,
                { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
              ]}
            >
              <ArrowDownLeft
                size={20}
                color={colors.terracotta}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </View>
            <Text style={[styles.agileLabel, { color: colors.textPrimary }]}>
              Withdraw
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.agileBtn}
            onPress={() => {
              triggerHaptic();
              setCategoryModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.agileIconBox,
                { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
              ]}
            >
              <FolderOpen size={20} color={colors.mossSage} />
            </View>
            <Text style={[styles.agileLabel, { color: colors.textPrimary }]}>
              More
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modular Categories Carousel */}
        <CategoryCarousel
          categories={categories}
          onManage={() => setCategoryModalVisible(true)}
          currencySymbol={currencySymbol}
        />

        {/* Recurring Subscriptions Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Recurring Bills
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              Subscriptions & Scheduled Outflows
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              setRecurringModalVisible(true);
            }}
            style={[
              styles.seeAllBtn,
              { backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE' },
            ]}
          >
            <Text style={[styles.seeAllText, { color: colors.textPrimary }]}>
              Manage All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recurring Quick Preview Card */}
        <TouchableOpacity
          style={[
            styles.recurringBanner,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
            },
          ]}
          onPress={() => {
            triggerHaptic();
            setRecurringModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.recurringBannerIcon,
              { backgroundColor: colors.matchaLime },
            ]}
          >
            <Repeat size={18} color="#141715" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.recurringBannerTitle, { color: colors.textPrimary }]}>
              {recurringList.filter((r) => r.active).length} Active Subscriptions
            </Text>
            <Text style={[styles.recurringBannerSub, { color: colors.textSecondary }]}>
              Next: {recurringList[0]?.name || 'Adobe Cloud'} ({userProfile.currency.split(' ')[0]}{recurringList[0]?.amount || 59.99})
            </Text>
          </View>
          <View
            style={[
              styles.recurringBadge,
              { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
            ]}
          >
            <Text style={[styles.recurringBadgeText, { color: colors.matchaLime }]}>
              Auto-Pay
            </Text>
          </View>
        </TouchableOpacity>

        {/* Modular Transactions List with Live Data & Filter Pills */}
        <TransactionList
          transactions={filteredTx}
          timeFilter={dashboardTimeFilter}
          onTimeFilterChange={setDashboardTimeFilter}
          searchQuery={dashboardSearchQuery}
          onClearSearch={() => setDashboardSearchQuery('')}
          onSelectTx={openTxDetail}
          onAddTx={() => openQuickEntry('expense')}
          currencySymbol={currencySymbol}
        />
      </ScrollView>

      {/* Modals */}
      <BudgetCardModal
        visible={budgetModalVisible}
        onClose={() => setBudgetModalVisible(false)}
        onSave={handleSaveBudgetCard}
        onDelete={handleDeleteBudgetCard}
        initialData={editingBudgetCard}
      />

      <CategoryManagerModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        categoryList={categories}
        onAddCategory={handleSaveCategory}
        onEditCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <RecurringManagerModal
        visible={recurringModalVisible}
        onClose={() => setRecurringModalVisible(false)}
        recurringList={recurringList}
        onSaveList={(newList) => {
          for (const item of newList) {
            handleSaveRecurring(item);
          }
        }}
      />

      <TransactionDetailModal
        visible={detailModalVisible}
        transaction={selectedTx}
        onClose={() => setDetailModalVisible(false)}
        onDelete={(id) => deleteTransaction(id)}
        onEdit={handleEditTransaction}
      />

      <QuickEntryModal
        visible={entryModalVisible}
        type={quickEntryType}
        onClose={() => {
          setEntryModalVisible(false);
          setEditingTx(null);
        }}
        onSave={handleSaveQuickEntry}
        initialData={
          editingTx
            ? {
                id: editingTx.id,
                title: editingTx.title,
                amount: editingTx.amount,
                type: editingTx.type,
                category: editingTx.category,
                channel: editingTx.channel,
              }
            : null
        }
        currencySymbol={currencySymbol}
      />

      <UserProfileModal
        visible={profileModalVisible}
        profile={userProfile}
        onSave={handleSaveProfile}
        onClose={() => setProfileModalVisible(false)}
      />

      <PermissionsModal
        visible={permissionsModalVisible}
        onClose={() => setPermissionsModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBarWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  agileBar: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    justifyContent: 'space-around',
  },
  agileBtn: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  agileIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agileLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recurringBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  recurringBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  recurringBannerSub: {
    fontSize: 12,
  },
  recurringBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recurringBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
