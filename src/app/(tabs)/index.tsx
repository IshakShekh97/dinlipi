import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Bell,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Users,
  ShieldCheck,
  TrendingUp,
  Repeat,
} from "lucide-react-native";
import { useAppTheme } from "../../context/theme-context";
import { FONTS, triggerHaptic } from "../../constants/theme";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { AmbientGlowBackground } from "../../components/ui/AmbientGlowBackground";
import { BentoFactorCard } from "../../components/ui/BentoFactorCard";
import { AppButton } from "../../components/ui/AppButton";
import { ConfettiCelebration } from "../../components/ui/ConfettiCelebration";
import type { UserProfile } from "../../components/profile/UserProfileModal";
import { PermissionsModal } from "../../components/security/PermissionsModal";
import {
  TransactionDetailModal,
  TransactionItemData,
} from "../../components/ledger/TransactionDetailModal";
import {
  BudgetCardModal,
  BudgetCardData,
} from "../../components/cards/BudgetCardModal";
import {
  CategoryManagerModal,
  CategoryItem,
} from "../../components/categories/CategoryManagerModal";
import {
  RecurringManagerModal,
  RecurringTransaction,
} from "../../components/recurring/RecurringManagerModal";
import { BudgetCardStack } from "../../components/cards/BudgetCardStack";
import {
  TransactionList,
  DashboardTxItem,
} from "../../components/ledger/TransactionList";
import { CategoryCarousel } from "../../components/categories/CategoryCarousel";
import {
  QuickEntryModal,
  QuickEntryData,
} from "../../components/ledger/QuickEntryModal";
import {
  useTransactionsLive,
  useBudgetCardsLive,
  useCategoriesLive,
  useRecurringLive,
  useUserLive,
  usePeopleLive,
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
} from "../../db/queries";
import { useUIStore } from "../../store/ui-store";
import { getCurrencySymbol } from "../../utils/currency";

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
    permissionsModalVisible,
    setPermissionsModalVisible,
    triggerConfetti,
  } = useUIStore();

  const [quickEntryType, setQuickEntryType] = useState<
    "expense" | "income" | "transfer"
  >("expense");

  // Drizzle Reactive Live Queries
  const { data: dbCards = [] } = useBudgetCardsLive();
  const { data: dbTx = [] } = useTransactionsLive();
  const { data: dbCategories = [] } = useCategoriesLive();
  const { data: dbRecurring = [] } = useRecurringLive();
  const { data: dbUsers = [] } = useUserLive();
  const { data: dbPeople = [] } = usePeopleLive();

  // Map Drizzle data to component models - 100% dynamic without static seed fallbacks
  const userProfile: UserProfile = useMemo(() => {
    if (dbUsers && dbUsers.length > 0) {
      const u = dbUsers[0];
      return {
        name: u.name,
        phone: u.phone || "",
        avatar: u.avatar || "avatar_matcha_fox",
        currency: u.currency || "₹ INR",
      };
    }
    return {
      name: "",
      phone: "",
      avatar: "avatar_matcha_fox",
      currency: "₹ INR",
    };
  }, [dbUsers]);

  const budgetCards: BudgetCardData[] = useMemo(() => {
    if (dbCards && dbCards.length > 0) {
      return dbCards.map((c) => {
        let customGradient: [string, string, string] | undefined = undefined;
        let shapePattern: any = undefined;
        let tabLabel = c.title.slice(0, 10);

        if (c.meshGradient) {
          try {
            const parsed = JSON.parse(c.meshGradient);
            if (parsed.customGradient) customGradient = parsed.customGradient;
            if (parsed.shapePattern) shapePattern = parsed.shapePattern;
          } catch {
            // Safe JSON parse fallback
          }
        }

        return {
          id: c.id,
          name: c.title,
          tabLabel,
          limit: c.totalLimit,
          spent: c.spent || 0,
          cardNum: "•••• " + c.id.slice(-4),
          variant: ((c as any).gradientType as any) || "violetGlow",
          customGradient,
          shapePattern,
          holder: userProfile.name || "Personal Vault",
          expiry: "Monthly",
          cardType: ((c as any).cardType as any) || "DEBIT",
        };
      });
    }
    return [];
  }, [dbCards, userProfile.name]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    (dbCategories || []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [dbCategories]);

  const transactions: DashboardTxItem[] = useMemo(() => {
    if (dbTx && dbTx.length > 0) {
      return dbTx.map((t) => {
        let displayTime = "Today";
        try {
          const dateObj = new Date(t.timestamp);
          if (!isNaN(dateObj.getTime())) {
            displayTime = dateObj.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          }
        } catch {
          displayTime = t.timestamp;
        }

        const isOutflow = t.type === "expense" || t.type === "lend";
        const catName = categoryMap.get(t.categoryId || '') || t.categoryId || 'General';
        return {
          id: t.id,
          title: t.title,
          category: catName,
          time: displayTime,
          amount: t.amount,
          isExpense: isOutflow,
          channel: (t.notes as any) || "Cash",
          color: isOutflow ? colors.oxidizedIron : colors.palmLeaf,
        };
      });
    }
    return [];
  }, [dbTx, categoryMap, colors.oxidizedIron, colors.palmLeaf]);

  const categories: CategoryItem[] = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        iconName: c.icon,
        color: c.color,
        budget: c.budgetLimit || 0,
        spent: 0,
        type: (c.type as any) || "expense",
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
        frequency: (r.frequency as any) || "monthly",
        category: r.categoryId || "General",
        nextBillingDate: r.nextDueDate,
        active: Boolean(r.isActive),
        iconName: "tv",
        color: "#CEF04A",
      }));
    }
    return [];
  }, [dbRecurring]);

  // Total balance and utilization calculation
  const totalBalance = useMemo(() => {
    const cardsBalance = budgetCards.reduce((acc, c) => acc + (c.limit - c.spent), 0);
    const unlinkedNet = (dbTx || [])
      .filter((t) => !t.cardId)
      .reduce((acc, t) => {
        if (t.type === 'income' || t.type === 'borrow') return acc + t.amount;
        if (t.type === 'expense' || t.type === 'lend') return acc - t.amount;
        return acc;
      }, 0);
    return cardsBalance + unlinkedNet;
  }, [budgetCards, dbTx]);
  const totalLimit = useMemo(
    () => budgetCards.reduce((acc, c) => acc + c.limit, 0),
    [budgetCards],
  );
  const totalSpent = useMemo(
    () => budgetCards.reduce((acc, c) => acc + c.spent, 0),
    [budgetCards],
  );
  const budgetUtilization =
    totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const currencySymbol = getCurrencySymbol(
    userProfile.currency || activeCurrency,
  );

  // Quick Action handler
  const openQuickEntry = (type: "expense" | "income" | "transfer") => {
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
        type: entry.type === "income" ? "income" : "expense",
        categoryId: entry.categoryId || entry.category,
        tags: entry.tags || (entry.categoryId ? [entry.categoryId] : []),
        cardId: entry.cardId,
        date: entry.date,
        notes: entry.channel,
      });
    } else {
      await addTransaction({
        title: entry.title,
        amount: entry.amount,
        type: entry.type === "income" ? "income" : "expense",
        categoryId: entry.categoryId || entry.category,
        tags: entry.tags || (entry.categoryId ? [entry.categoryId] : []),
        cardId: entry.cardId,
        date: entry.date,
        notes: entry.channel,
      });
      triggerConfetti();
    }
    setEditingTx(null);
  };

  const handleDeleteBudgetCard = async (id: string) => {
    await deleteBudgetCard(id);
    setActiveCardIndex(0);
  };

  const handleEditTransaction = (tx: TransactionItemData) => {
    setEditingTx(tx);
    const normalizedType: "expense" | "income" =
      tx.type === "income" || tx.type === "borrow" ? "income" : "expense";
    setQuickEntryType(normalizedType);
    setEntryModalVisible(true);
  };

  const handleSaveBudgetCard = async (cardData: BudgetCardData) => {
    if (editingBudgetCard) {
      await updateBudgetCard(cardData);
    } else {
      await addBudgetCard(cardData);
      setActiveCardIndex(0);
      triggerConfetti();
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

  const openTxDetail = (tx: DashboardTxItem) => {
    triggerHaptic("light");
    const modalData: TransactionItemData = {
      id: tx.id,
      title: tx.title,
      category: tx.category,
      amount: tx.amount,
      type: tx.isExpense ? "expense" : "income",
      channel: (["Cash", "UPI", "Bank"].includes(tx.channel)
        ? tx.channel
        : "Cash") as "Cash" | "UPI" | "Bank",
      envelope: "General Budget",
      time: tx.time,
      date: "Today",
    };
    setSelectedTx(modalData);
    setDetailModalVisible(true);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgPrimary,
        paddingTop: Math.max(insets.top + 6, 28),
      }}
    >
      {/* Global Confetti Celebration Animation Overlay */}
      <ConfettiCelebration />

      {/* Ambient Diffuse Background Glow */}
      <AmbientGlowBackground />

      {/* Top Bar: Profile avatar, greeting, notifications button (Reference Image 3) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => {
            triggerHaptic("light");
            router.push("/profile" as any);
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
              {userProfile.name ? `Good Morning,` : "Welcome Back,"}
            </Text>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
              {userProfile.name
                ? userProfile.name.split(" ")[0]
                : "Personal Vault"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={[
              styles.topIconBtn,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#FFFFFF",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(0, 0, 0, 0.06)",
              },
            ]}
            onPress={() => {
              triggerHaptic("light");
              setPermissionsModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Bell size={18} color={colors.textPrimary} />
            <View
              style={[
                styles.notifDot,
                { backgroundColor: colors.oxidizedIron },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* "Your Balance" Headline directly from Image 3 Reference */}
      <View style={styles.balanceHeaderWrap}>
        <Text
          style={[styles.balanceHeaderLabel, { color: colors.textSecondary }]}
        >
          Your Balance
        </Text>
        <Text
          style={[styles.balanceHeaderAmount, { color: colors.textPrimary }]}
        >
          {currencySymbol}
          {totalBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Modular Stepped Budget Cards Stack (Vibrant Mesh Credit Card - Image 3) */}
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

        {/* 2 Agile Action Pill Buttons: Receive (Deposit/Income) and Transfer (Withdrawal/Expense) */}
        <View style={styles.actionPillsRow}>
          <AppButton
            title="Receive"
            onPress={() => openQuickEntry("income")}
            variant="pill"
            size="pill"
            iconLeft={
              <ArrowDownLeft size={18} color="#020202" strokeWidth={2.5} />
            }
            style={{ flex: 1 }}
          />

          <AppButton
            title="Transfer"
            onPress={() => openQuickEntry("expense")}
            variant="accent"
            size="pill"
            iconLeft={
              <ArrowUpRight size={18} color="#FFFFFF" strokeWidth={2.5} />
            }
            style={{ flex: 1 }}
          />
        </View>

        {/* 2x2 Bento Factors Grid with 5-tone palette directly from Reference Images */}
        <View style={styles.bentoSectionWrap}>
          <View style={styles.bentoRow}>
            <BentoFactorCard
              title="Budget Spent"
              value={`${budgetUtilization}%`}
              variant="bars"
              accentColor={colors.tangerineDream}
              icon={<CreditCard size={18} color={colors.tangerineDream} />}
            />
            <BentoFactorCard
              title="Active Accounts"
              value={dbPeople.length}
              variant="dots"
              accentColor={colors.blueSlate}
              icon={<Users size={18} color={colors.blueSlate} />}
              onPress={() => router.push("/(tabs)/khata" as any)}
            />
          </View>

          <View style={[styles.bentoRow, { marginTop: 12 }]}>
            <BentoFactorCard
              title="Payment Health"
              value="100%"
              variant="sparkline"
              accentColor={colors.palmLeaf}
              icon={<ShieldCheck size={18} color={colors.palmLeaf} />}
            />
            <BentoFactorCard
              title="Vault Flow"
              value={`${currencySymbol}${Math.round(totalBalance)}`}
              variant="wave"
              accentColor={colors.oxidizedIron}
              icon={<TrendingUp size={18} color={colors.oxidizedIron} />}
              onPress={() => router.push("/(tabs)/analytics" as any)}
            />
          </View>
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
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#F4F4EE",
              },
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
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.10)"
                : "rgba(0, 0, 0, 0.05)",
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
              { backgroundColor: colors.blueSlate },
            ]}
          >
            <Repeat size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.recurringBannerTitle,
                { color: colors.textPrimary },
              ]}
            >
              {recurringList.filter((r) => r.active).length} Active
              Subscriptions
            </Text>
            <Text
              style={[
                styles.recurringBannerSub,
                { color: colors.textSecondary },
              ]}
            >
              Next: {recurringList[0]?.name || "Adobe Cloud"} (
              {userProfile.currency.split(" ")[0]}
              {recurringList[0]?.amount || 59.99})
            </Text>
          </View>
          <View
            style={[
              styles.recurringBadge,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#EDF2F5",
              },
            ]}
          >
            <Text
              style={[styles.recurringBadgeText, { color: colors.blueSlate }]}
            >
              Auto-Pay
            </Text>
          </View>
        </TouchableOpacity>

        {/* Modular Transactions List matching Image 3 Reference (6 Recent Transactions) */}
        <TransactionList
          transactions={transactions}
          timeFilter={dashboardTimeFilter}
          onTimeFilterChange={setDashboardTimeFilter}
          onSelectTx={openTxDetail}
          onAddTx={() => openQuickEntry("expense")}
          onViewMore={() => {
            triggerHaptic("light");
            router.push("/(tabs)/transactions" as any);
          }}
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
        categories={categories}
        onAddCategory={handleSaveCategory}
        onEditCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <RecurringManagerModal
        visible={recurringModalVisible}
        onClose={() => setRecurringModalVisible(false)}
        recurringList={recurringList}
        onSaveList={async (updated) => {
          for (const item of updated) {
            await handleSaveRecurring(item);
          }
        }}
      />

      <PermissionsModal
        visible={permissionsModalVisible}
        onClose={() => setPermissionsModalVisible(false)}
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
        cards={budgetCards}
        onCreateBudget={() => {
          setEntryModalVisible(false);
          setBudgetModalVisible(true);
        }}
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
                type: (editingTx.type === "income" ||
                editingTx.type === "borrow"
                  ? "income"
                  : "expense") as "expense" | "income",
                category: editingTx.category,
                channel: editingTx.channel,
                date: editingTx.date,
                cardId: (editingTx as any).cardId || undefined,
              }
            : null
        }
        currencySymbol={currencySymbol}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greetingSub: {
    fontFamily: FONTS.serifItalic,
    fontSize: 13,
  },
  greetingTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 19,
    letterSpacing: -0.4,
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  notifDot: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  balanceHeaderWrap: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 14,
  },
  balanceHeaderLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  balanceHeaderAmount: {
    fontFamily: FONTS.sansBold,
    fontSize: 34,
    letterSpacing: -1,
    lineHeight: 40,
  },
  actionPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  receivePillBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  transferPillBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#CEF04A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  plusCircleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  actionPillText: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  bentoSectionWrap: {
    marginBottom: 20,
  },
  bentoRow: {
    flexDirection: "row",
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    marginTop: 2,
  },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  seeAllText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
  },
  recurringBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  recurringBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  recurringBannerTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 14,
    marginBottom: 2,
  },
  recurringBannerSub: {
    fontFamily: FONTS.sansRegular,
    fontSize: 12,
  },
  recurringBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recurringBadgeText: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
  },
});
