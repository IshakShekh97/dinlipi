import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  Sparkles,
  ArrowDownLeft,
  FileText,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { useTransactionsLive, useUserLive } from '../../db/queries';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';

function parseTxDate(timestampStr: string): Date {
  if (!timestampStr) return new Date();
  const d = new Date(timestampStr);
  if (!isNaN(d.getTime())) return d;
  const match = timestampStr.match(/([A-Za-z]+)\s+(\d+)/);
  if (match) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const mIdx = monthNames.indexOf(match[1].toLowerCase().slice(0, 3));
    const day = parseInt(match[2], 10);
    if (mIdx !== -1 && !isNaN(day)) {
      const year = new Date().getFullYear();
      return new Date(year, mIdx, day);
    }
  }
  return new Date();
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const { data: dbTransactions = [] } = useTransactionsLive();
  const { data: dbUsers = [] } = useUserLive();

  const currencySymbol =
    dbUsers && dbUsers.length > 0 && dbUsers[0].currency
      ? getCurrencySymbol(dbUsers[0].currency)
      : getCurrencySymbol(activeCurrency);

  // Available categories list
  const availableCategories = React.useMemo(() => {
    const set = new Set<string>();
    dbTransactions.forEach((t) => {
      if (t.categoryId) set.add(t.categoryId);
    });
    return ['All', ...Array.from(set)];
  }, [dbTransactions]);

  // Filter transactions by selected category
  const activeTx = React.useMemo(() => {
    if (selectedCategory === 'All') return dbTransactions;
    return dbTransactions.filter((t) => (t.categoryId || 'General') === selectedCategory);
  }, [dbTransactions, selectedCategory]);

  // Calculate live spending and income for the active category filter
  const totalSpending = React.useMemo(() => {
    if (activeTx && activeTx.length > 0) {
      const expenses = activeTx.filter((t) => t.type === 'expense' || t.type === 'lend');
      return expenses.reduce((acc, t) => acc + t.amount, 0);
    }
    return 0;
  }, [activeTx]);

  const totalIncome = React.useMemo(() => {
    if (activeTx && activeTx.length > 0) {
      const income = activeTx.filter((t) => t.type === 'income' || t.type === 'borrow');
      return income.reduce((acc, t) => acc + t.amount, 0);
    }
    return 0;
  }, [activeTx]);

  // Compute category breakdown
  const categories = React.useMemo(() => {
    if (dbTransactions && dbTransactions.length > 0 && totalSpending > 0) {
      const expenseMap: Record<string, number> = {};
      dbTransactions
        .filter((t) => t.type === 'expense' || t.type === 'lend')
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

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Dynamic bar data based on selected category & selected period
  const barData = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (period === 'week') {
      // Show the weeks of this month (W1, W2, W3, W4, W5)
      const currentDay = now.getDate();
      const weeks = [
        { label: 'W1 (1-7)', start: 1, end: 7 },
        { label: 'W2 (8-14)', start: 8, end: 14 },
        { label: 'W3 (15-21)', start: 15, end: 21 },
        { label: 'W4 (22-28)', start: 22, end: 28 },
        { label: 'W5 (29+)', start: 29, end: 31 },
      ];

      const weekResults = weeks.map((w) => {
        const sum = activeTx
          .filter((t) => {
            if (t.type !== 'expense') return false;
            const d = parseTxDate(t.timestamp);
            return (
              d.getFullYear() === currentYear &&
              d.getMonth() === currentMonth &&
              d.getDate() >= w.start &&
              d.getDate() <= w.end
            );
          })
          .reduce((acc, t) => acc + t.amount, 0);

        const isActive = currentDay >= w.start && currentDay <= w.end;
        return {
          month: w.label,
          amount: sum,
          active: isActive,
        };
      });

      const maxAmount = Math.max(...weekResults.map((r) => r.amount), 1);
      return weekResults.map((r) => ({
        month: r.month,
        height: r.amount > 0 ? Math.max(16, Math.min(95, Math.round((r.amount / maxAmount) * 90))) : 8,
        active: r.active,
        amount: r.amount,
      }));
    } else if (period === 'month') {
      // Show interval blocks across this month
      const currentDay = now.getDate();
      const intervals = [
        { label: '1-5', start: 1, end: 5 },
        { label: '6-10', start: 6, end: 10 },
        { label: '11-15', start: 11, end: 15 },
        { label: '16-20', start: 16, end: 20 },
        { label: '21-25', start: 21, end: 25 },
        { label: '26-31', start: 26, end: 31 },
      ];

      const intervalResults = intervals.map((inv) => {
        const sum = activeTx
          .filter((t) => {
            if (t.type !== 'expense') return false;
            const d = parseTxDate(t.timestamp);
            return (
              d.getFullYear() === currentYear &&
              d.getMonth() === currentMonth &&
              d.getDate() >= inv.start &&
              d.getDate() <= inv.end
            );
          })
          .reduce((acc, t) => acc + t.amount, 0);

        const isActive = currentDay >= inv.start && currentDay <= inv.end;
        return {
          month: inv.label,
          amount: sum,
          active: isActive,
        };
      });

      const maxAmount = Math.max(...intervalResults.map((r) => r.amount), 1);
      return intervalResults.map((r) => ({
        month: r.month,
        height: r.amount > 0 ? Math.max(16, Math.min(95, Math.round((r.amount / maxAmount) * 90))) : 8,
        active: r.active,
        amount: r.amount,
      }));
    } else {
      // Year: Show the 12 months of this year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yearResults = monthNames.map((mName, mIdx) => {
        const sum = activeTx
          .filter((t) => {
            if (t.type !== 'expense') return false;
            const d = parseTxDate(t.timestamp);
            return d.getFullYear() === currentYear && d.getMonth() === mIdx;
          })
          .reduce((acc, t) => acc + t.amount, 0);

        return {
          month: mName,
          amount: sum,
          active: mIdx === currentMonth,
        };
      });

      const maxAmount = Math.max(...yearResults.map((r) => r.amount), 1);
      return yearResults.map((r) => ({
        month: r.month,
        height: r.amount > 0 ? Math.max(16, Math.min(95, Math.round((r.amount / maxAmount) * 90))) : 8,
        active: r.active,
        amount: r.amount,
      }));
    }
  }, [activeTx, period]);

  const handleDownloadStatement = async () => {
    try {
      setIsGeneratingPdf(true);
      triggerHaptic('medium');

      const userName = dbUsers && dbUsers.length > 0 && dbUsers[0].name ? dbUsers[0].name : 'Dinlipi Account';
      const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const periodLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const netSavings = totalIncome - totalSpending;

      const rowsHtml = activeTx.slice(0, 80).map((t) => {
        const isExp = t.type === 'expense' || t.type === 'lend';
        const color = isExp ? '#E07A5F' : '#354E38';
        const prefix = isExp ? '-' : '+';
        const parsed = parseTxDate(t.timestamp);
        const formattedDate = parsed.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        return `
          <tr style="border-bottom: 1px solid #EBECE8;">
            <td style="padding: 10px 8px; font-size: 13px; color: #555;">${formattedDate}</td>
            <td style="padding: 10px 8px; font-size: 13px; font-weight: 600; color: #111;">${t.title || 'Transaction'}</td>
            <td style="padding: 10px 8px; font-size: 12px; color: #777;">${t.categoryId || 'General'}</td>
            <td style="padding: 10px 8px; font-size: 12px; text-transform: capitalize; color: #666;">${t.type}</td>
            <td style="padding: 10px 8px; font-size: 13px; font-weight: 700; text-align: right; color: ${color};">
              ${prefix}${currencySymbol}${t.amount.toFixed(2)}
            </td>
          </tr>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Dinlipi Statement - ${periodLabel}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #141715;
              background-color: #FFFFFF;
              padding: 36px 30px;
              margin: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #141715;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .brand-title {
              font-size: 26px;
              font-weight: 900;
              letter-spacing: -0.5px;
              margin: 0 0 4px 0;
              color: #141715;
            }
            .brand-sub {
              font-size: 13px;
              color: #666;
              margin: 0;
            }
            .meta-box {
              text-align: right;
              font-size: 12px;
              color: #555;
            }
            .meta-box strong {
              color: #111;
            }
            .summary-grid {
              display: flex;
              gap: 16px;
              margin-bottom: 28px;
            }
            .summary-card {
              flex: 1;
              padding: 16px;
              border-radius: 12px;
              background-color: #F8F9F6;
              border: 1px solid #EBECE8;
            }
            .summary-label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #666;
              margin-bottom: 6px;
            }
            .summary-value {
              font-size: 20px;
              font-weight: 800;
              margin: 0;
            }
            .income { color: #2E7D32; }
            .expense { color: #C62828; }
            .balance { color: #1565C0; }
            .table-title {
              font-size: 16px;
              font-weight: 700;
              margin: 24px 0 12px 0;
              color: #141715;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              text-align: left;
              padding: 8px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #888;
              border-bottom: 1px solid #DDD;
            }
            .footer {
              margin-top: 40px;
              padding-top: 16px;
              border-top: 1px solid #EAEAEA;
              font-size: 11px;
              color: #888;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="brand-title">DINLIPI</h1>
              <p class="brand-sub">Private Personal Financial Ledger</p>
            </div>
            <div class="meta-box">
              <p style="margin: 0 0 4px 0;"><strong>Statement Period:</strong> ${periodLabel}</p>
              <p style="margin: 0 0 4px 0;"><strong>Account Holder:</strong> ${userName}</p>
              <p style="margin: 0;"><strong>Generated:</strong> ${reportDate}</p>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total Income</div>
              <div class="summary-value income">${currencySymbol}${totalIncome.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Spending</div>
              <div class="summary-value expense">${currencySymbol}${totalSpending.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Net Balance</div>
              <div class="summary-value balance">${currencySymbol}${netSavings.toFixed(2)}</div>
            </div>
          </div>

          <div class="table-title">Recent Activity (${dbTransactions.length} Transactions)</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 24px; color:#888;">No transactions recorded in this cycle.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Dinlipi &bull; Local-first encrypted offline ledger &bull; Generated from on-device SQLite database
          </div>
        </body>
        </html>
      `;

      const file = await Print.printToFileAsync({ html });
      triggerHaptic('success');

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Dinlipi Statement - ${periodLabel}`,
        });
      } else {
        showConfirm({
          title: 'Statement Generated',
          message: `PDF file created successfully at ${file.uri}`,
          confirmText: 'OK',
          cancelText: '',
          onConfirm: () => {},
        });
      }
    } catch (err) {
      console.error('Failed to export statement:', err);
      triggerHaptic('warning');
      showConfirm({
        title: 'Export Error',
        message: 'Could not complete statement generation. Please check storage permissions and try again.',
        confirmText: 'OK',
        cancelText: '',
        isDestructive: true,
        onConfirm: () => {},
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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

        {/* Dynamic Category Filter Chips */}
        <View style={{ marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          >
            {availableCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    triggerHaptic('light');
                    setSelectedCategory(cat);
                  }}
                  style={{
                    backgroundColor: isSelected
                      ? colors.matchaLime
                      : isDark
                      ? colors.cardSecondary
                      : '#F4F4EE',
                    borderColor: isSelected
                      ? colors.matchaLime
                      : isDark
                      ? colors.borderSubtle
                      : '#EAEAE2',
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={{
                      color: isSelected ? '#141715' : colors.textPrimary,
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: 12,
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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

          {categories.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: isDark ? colors.cardElevated : '#F4F4EE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <TrendingUp size={22} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
                No Expense Breakdown
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                Categorize your expenses in the ledger to view live proportional distribution.
              </Text>
            </View>
          ) : (
            <>
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
                    {/* Segment 1: Matcha Lime */}
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
                    {/* Segment 2: Golden Honey */}
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
                    {/* Segment 3: Terracotta */}
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
                    {/* Segment 4: Moss Sage */}
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
                    {/* Segment 5: Dark Graphite */}
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
                    {currencySymbol}{totalSpending >= 1000 ? `${(totalSpending / 1000).toFixed(1)}k` : totalSpending.toFixed(0)}
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
            </>
          )}
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
                handleDownloadStatement();
              },
            });
          }}
          disabled={isGeneratingPdf}
          style={[
            styles.statementBtn,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
              opacity: isGeneratingPdf ? 0.7 : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.statementLeft}>
            {isGeneratingPdf ? (
              <ActivityIndicator size="small" color={colors.matchaLime} />
            ) : (
              <FileText size={18} color={colors.matchaLime} />
            )}
            <Text style={[styles.statementText, { color: colors.textPrimary }]}>
              {isGeneratingPdf ? 'Generating PDF Statement...' : 'Download Monthly Statement (PDF)'}
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
