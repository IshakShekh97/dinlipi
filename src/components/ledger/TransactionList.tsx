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
  onViewMore?: () => void;
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
  onViewMore,
  currencySymbol = '₹',
}: TransactionListProps) {
  const { colors, isDark } = useAppTheme();
  const displayTransactions = transactions.slice(0, 6);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recent Transactions
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Latest movements
          </Text>
        </View>

        {onViewMore && (
          <TouchableOpacity
            onPress={onViewMore}
            style={[
              styles.viewMoreHeaderBtn,
              { backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE', borderColor: colors.borderSubtle },
            ]}
            activeOpacity={0.75}
          >
            <Text style={[styles.viewMoreHeaderText, { color: colors.matchaLime }]}>
              View More →
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Transactions Rows */}
      <View style={styles.txList}>
        {isLoading ? (
          <>
            <SkeletonTransactionRow />
            <SkeletonTransactionRow />
            <SkeletonTransactionRow />
          </>
        ) : displayTransactions.length === 0 ? (
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
          displayTransactions.map((tx) => (
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

        {transactions.length > 0 && onViewMore && (
          <TouchableOpacity
            onPress={onViewMore}
            style={[
              styles.bottomViewMoreBtn,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
                borderColor: colors.borderSubtle,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.bottomViewMoreText, { color: colors.textPrimary }]}>
              View All in Activity ({transactions.length}) →
            </Text>
          </TouchableOpacity>
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
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  txCategory: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  txTime: {
    fontSize: 11,
  },
  viewMoreHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewMoreHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomViewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  bottomViewMoreText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
