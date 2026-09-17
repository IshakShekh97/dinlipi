import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import {
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  ChevronRight,
  Sparkles,
  ArrowDownLeft,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { useTransactionsLive, useUserLive } from '../../db/queries';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const { data: dbTransactions = [] } = useTransactionsLive();
  const { data: dbUsers = [] } = useUserLive();

  const currencySymbol =
    dbUsers && dbUsers.length > 0 && dbUsers[0].currency
      ? getCurrencySymbol(dbUsers[0].currency)
      : getCurrencySymbol(activeCurrency);

  // Calculate live spending and income - 100% dynamic
  const totalSpending = React.useMemo(() => {
    if (dbTransactions && dbTransactions.length > 0) {
      const expenses = dbTransactions.filter((t) => t.type === 'expense');
      return expenses.reduce((acc, t) => acc + t.amount, 0);
    }
    return 0;
  }, [dbTransactions]);

  const totalIncome = React.useMemo(() => {
    if (dbTransactions && dbTransactions.length > 0) {
      const income = dbTransactions.filter((t) => t.type === 'income');
      return income.reduce((acc, t) => acc + t.amount, 0);
    }
    return 0;
  }, [dbTransactions]);

  // Compute category breakdown
  const categories = React.useMemo(() => {
    if (dbTransactions && dbTransactions.length > 0 && totalSpending > 0) {
      const expenseMap: Record<string, number> = {};
      dbTransactions
        .filter((t) => t.type === 'expense')
        .forEach((t) => {
          const cat = t.categoryId || 'General';
          expenseMap[cat] = (expenseMap[cat] || 0) + t.amount;
        });

      const entries = Object.entries(expenseMap);
      if (entries.length > 0) {
        const palette = [
          colors.matchaLime,
          colors.goldenHoney,
          colors.terracotta,
          colors.mossSage,
          colors.darkGraphite,
        ];
        return entries.slice(0, 5).map(([name, amount], index) => {
          const percent = ((amount / totalSpending) * 100).toFixed(1) + '%';
          return {
            name,
            amount: `${currencySymbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
            percent,
            color: palette[index % palette.length],
          };
        });
      }
    }

    return [];
  }, [dbTransactions, totalSpending, currencySymbol, colors]);

  const barData = [
    { month: 'Feb', height: 42, active: false },
    { month: 'Mar', height: 68, active: false },
    { month: 'Apr', height: 50, active: false },
    { month: 'May', height: 85, active: true },
    { month: 'Jun', height: 60, active: false },
    { month: 'Jul', height: 74, active: false },
  ];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgPrimary,
        paddingTop: Math.max(insets.top + 6, 32),
      }}
    >
      {/* Screen Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Activity & Spending
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Cashflow & Category Breakdown
          </Text>
        </View>

        <View
          style={[
            styles.badgePill,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE',
              borderColor: isDark ? colors.borderSubtle : '#EAEAE2',
            },
          ]}
        >
          <Sparkles size={13} color={colors.matchaLime} />
          <Text style={[styles.badgeText, { color: colors.matchaLime }]}>
            March 2026
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector Pills (Week, Month, Year) */}
        <View
          style={[
            styles.periodContainer,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE',
              borderColor: isDark ? colors.borderSubtle : '#EAEAE2',
            },
          ]}
        >
          {(['week', 'month', 'year'] as const).map((p) => {
            const isActive = period === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => {
                  triggerHaptic();
                  setPeriod(p);
                }}
                style={[
                  styles.periodTab,
                  isActive && {
                    backgroundColor: isDark ? colors.cardElevated : '#FFFFFF',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    {
                      color: isActive ? colors.textPrimary : colors.textMuted,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Total Spending Stat Hero (Inspired by Image 2 & 4) */}
        <View
          style={[
            styles.heroSpendCard,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
            },
          ]}
        >
          <View style={styles.spendHeader}>
            <View>
              <Text style={[styles.spendLabel, { color: colors.textSecondary }]}>
                Total Spending
              </Text>
              <Text style={[styles.spendAmount, { color: colors.textPrimary }]}>
                {currencySymbol}{totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View
              style={[
                styles.trendBadge,
                { backgroundColor: 'rgba(206, 240, 74, 0.18)' },
              ]}
            >
              <TrendingUp size={13} color={colors.matchaLime} />
              <Text style={[styles.trendText, { color: colors.matchaLime }]}>
                2.46% this month
              </Text>
            </View>
          </View>

          {/* Bar Chart (Inspired by Image 4 Activity View) */}
          <View style={styles.chartContainer}>
            <View style={styles.barsRow}>
              {barData.map((b) => (
                <View key={b.month} style={styles.barCol}>
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${b.height}%`,
                          backgroundColor: b.active
                            ? colors.matchaLime
                            : isDark
                            ? '#3D4441'
                            : '#D1D5DB',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      {
                        color: b.active ? colors.textPrimary : colors.textMuted,
                        fontWeight: b.active ? '700' : '500',
                      },
                    ]}
                  >
                    {b.month}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Dual Cashflow Cards: Income & Expense (Image 4) */}
        <View style={styles.cashflowRow}>
          {/* Income */}
          <View
            style={[
              styles.cashflowCard,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
                borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
              },
            ]}
          >
            <View
              style={[
                styles.cashflowIconBox,
                { backgroundColor: 'rgba(206, 240, 74, 0.18)' },
              ]}
            >
              <ArrowDownLeft size={16} color={colors.matchaLime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cashflowLabel, { color: colors.textSecondary }]}>
                Income
              </Text>
              <Text style={[styles.cashflowVal, { color: colors.textPrimary }]}>
                {currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Expense */}
          <View
            style={[
              styles.cashflowCard,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
                borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
              },
            ]}
          >
            <View
              style={[
                styles.cashflowIconBox,
                { backgroundColor: 'rgba(224, 122, 95, 0.18)' },
              ]}
            >
              <ArrowUpRight size={16} color={colors.terracotta} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cashflowLabel, { color: colors.textSecondary }]}>
                Expense
              </Text>
              <Text style={[styles.cashflowVal, { color: colors.textPrimary }]}>
                {currencySymbol}{totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Multi-Colored Donut Breakdown (Image 2 & 3) */}
        <View
          style={[
            styles.donutCard,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
            },
          ]}
        >
          <Text style={[styles.donutSectionTitle, { color: colors.textPrimary }]}>
            Category Distribution
          </Text>

          <View style={styles.donutSvgWrap}>
            <Svg width={180} height={180} viewBox="0 0 180 180">
              <G rotation="-90" origin="90, 90">
                {/* Background Ring */}
                <Circle
                  cx="90"
                  cy="90"
                  r="66"
                  stroke={isDark ? colors.cardElevated : '#F4F4EE'}
                  strokeWidth="16"
                  fill="none"
                />
                {/* Segment 1: Matcha Lime (33%) */}
                <Circle
                  cx="90"
                  cy="90"
                  r="66"
                  stroke={colors.matchaLime}
                  strokeWidth="16"
                  strokeDasharray="136 278"
                  strokeDashoffset="0"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Segment 2: Golden Honey (16%) */}
                <Circle
                  cx="90"
                  cy="90"
                  r="66"
                  stroke={colors.goldenHoney}
                  strokeWidth="16"
                  strokeDasharray="66 348"
                  strokeDashoffset="-140"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Segment 3: Terracotta (15%) */}
                <Circle
                  cx="90"
                  cy="90"
                  r="66"
                  stroke={colors.terracotta}
                  strokeWidth="16"
                  strokeDasharray="62 352"
                  strokeDashoffset="-210"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Segment 4: Moss Sage (11%) */}
                <Circle
                  cx="90"
                  cy="90"
                  r="66"
                  stroke={colors.mossSage}
                  strokeWidth="16"
                  strokeDasharray="45 369"
                  strokeDashoffset="-276"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Segment 5: Dark Graphite (8%) */}
                <Circle
                  cx="90"
                  cy="90"
                  r="66"
                  stroke={isDark ? '#4B5563' : '#374151'}
                  strokeWidth="16"
                  strokeDasharray="33 381"
                  strokeDashoffset="-325"
                  fill="none"
                  strokeLinecap="round"
                />
              </G>
            </Svg>

            <View style={styles.donutCenterText}>
              <Text style={[styles.donutCenterLabel, { color: colors.textMuted }]}>
                Spend
              </Text>
              <Text style={[styles.donutCenterAmount, { color: colors.textPrimary }]}>
                $1,842
              </Text>
            </View>
          </View>

          {/* Categories List */}
          <View style={styles.catListWrap}>
            {categories.map((cat, i) => (
              <View
                key={i}
                style={[
                  styles.catRow,
                  {
                    borderTopColor: i === 0 ? 'transparent' : isDark ? colors.borderSubtle : '#F0F0E8',
                    borderTopWidth: i === 0 ? 0 : 1,
                  },
                ]}
              >
                <View style={styles.catRowLeft}>
                  <View style={[styles.catBullet, { backgroundColor: cat.color }]} />
                  <Text style={[styles.catRowName, { color: colors.textPrimary }]}>
                    {cat.name}
                  </Text>
                </View>
                <View style={styles.catRowRight}>
                  <Text style={[styles.catRowAmount, { color: colors.textSecondary }]}>
                    {cat.amount}
                  </Text>
                  <Text style={[styles.catRowPercent, { color: cat.color }]}>
                    {cat.percent}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Download Statement Option */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            showConfirm({
              title: 'Export Statement',
              message: 'Generate and download monthly financial summary statement in PDF format?',
              confirmText: 'Download',
              cancelText: 'Cancel',
              isDestructive: false,
              onConfirm: () => {
                triggerHaptic();
              },
            });
          }}
          style={[
            styles.statementBtn,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
            },
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.statementLeft}>
            <CreditCard size={18} color={colors.matchaLime} />
            <Text style={[styles.statementText, { color: colors.textPrimary }]}>
              Download Monthly Statement (PDF)
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  periodContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodTabText: {
    fontSize: 12,
  },
  heroSpendCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    gap: 16,
  },
  spendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  spendAmount: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartContainer: {
    height: 120,
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barCol: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  barTrack: {
    width: 24,
    height: 80,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 11,
  },
  cashflowRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  cashflowCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  cashflowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashflowLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  cashflowVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  donutCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: 'center',
  },
  donutSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  donutSvgWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  donutCenterText: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutCenterLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  donutCenterAmount: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  catListWrap: {
    width: '100%',
    marginTop: 14,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  catRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catRowName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catRowAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  catRowPercent: {
    fontSize: 12,
    fontWeight: '800',
    width: 44,
    textAlign: 'right',
  },
  statementBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  statementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statementText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
