import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { SkeletonTransactionRow } from '../ui/SkeletonLoader';
import { EmptyStateView } from '../ui/EmptyStateView';

export interface DashboardTxItem {
  id: string;
  title: string;
  category: string;
  time: string;
  amount: number;
  isExpense: boolean;
  channel: string;
  color: string;
}

interface TransactionListProps {
  transactions: DashboardTxItem[];
  isLoading?: boolean;
  timeFilter: 'today' | 'week' | 'all';
  onTimeFilterChange: (filter: 'today' | 'week' | 'all') => void;
  searchQuery: string;
  onClearSearch: () => void;
  onSelectTx: (tx: DashboardTxItem) => void;
  onAddTx: () => void;
  currencySymbol?: string;
}

export function TransactionList({
  transactions,
  isLoading = false,
  timeFilter,
  onTimeFilterChange,
  searchQuery,
  onClearSearch,
  onSelectTx,
  onAddTx,
  currencySymbol = '₹',
}: TransactionListProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            All Transactions
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Recent account movements
          </Text>
        </View>
        <View style={styles.timeFilterRow}>
          {(['today', 'week', 'all'] as const).map((tf) => (
            <TouchableOpacity
              key={tf}
              onPress={() => {
                triggerHaptic();
                onTimeFilterChange(tf);
              }}
              style={[
                styles.filterPill,
                timeFilter === tf && {
                  backgroundColor: colors.matchaLime,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color: timeFilter === tf ? '#141715' : colors.textMuted,
                    fontWeight: timeFilter === tf ? '700' : '500',
                  },
                ]}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transactions Rows */}
      <View style={styles.txList}>
        {isLoading ? (
          <>
            <SkeletonTransactionRow />
            <SkeletonTransactionRow />
            <SkeletonTransactionRow />
          </>
        ) : transactions.length === 0 ? (
          searchQuery ? (
            <EmptyStateView
              type="no_search_results"
              onPrimaryAction={onClearSearch}
            />
          ) : (
            <EmptyStateView
              type="no_transactions"
              onPrimaryAction={onAddTx}
            />
          )
        ) : (
          transactions.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={[
                styles.txCard,
                {
                  backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
                  borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
                },
              ]}
              onPress={() => {
                triggerHaptic('light');
                onSelectTx(tx);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.txIconBox,
                  { backgroundColor: tx.color || colors.matchaLime },
                ]}
              >
                {tx.isExpense ? (
                  <ArrowUpRight size={18} color="#141715" />
                ) : (
                  <ArrowDownLeft size={18} color="#141715" />
                )}
              </View>

              <View style={styles.txDetails}>
                <Text style={[styles.txTitle, { color: colors.textPrimary }]}>
                  {tx.title}
                </Text>
                <Text style={[styles.txCategory, { color: colors.textSecondary }]}>
                  {tx.category} • {tx.channel}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.txAmount,
                    {
                      color: tx.isExpense ? colors.terracotta : colors.matchaLime,
                    },
                  ]}
                >
                  {tx.isExpense ? '-' : '+'}{currencySymbol} {tx.amount.toFixed(2)}
                </Text>
                <Text style={[styles.txTime, { color: colors.textMuted }]}>
                  {tx.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  timeFilterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterPillText: {
    fontSize: 12,
  },
  txList: {
    gap: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  txCategory: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  txTime: {
    fontSize: 11,
  },
});
