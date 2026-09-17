import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { FONTS, triggerHaptic } from '../../constants/theme';
import { EmptyStateView } from '../ui/EmptyStateView';
import { SkeletonTransactionRow } from '../ui/SkeletonLoader';

export interface DashboardTxItem {
  id: string;
  title: string;
  category: string;
  time: string;
  amount: number;
  isExpense: boolean;
  channel: string;
  color?: string;
}

interface TransactionListProps {
  transactions: DashboardTxItem[];
  timeFilter: 'all' | 'today' | 'week' | 'month';
  onTimeFilterChange: (f: 'all' | 'today' | 'week' | 'month') => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onSelectTx: (tx: DashboardTxItem) => void;
  onAddTx?: () => void;
  onViewMore?: () => void;
  isLoading?: boolean;
  currencySymbol?: string;
}

export function TransactionList({
  transactions,
  timeFilter,
  onTimeFilterChange,
  searchQuery,
  onClearSearch,
  onSelectTx,
  onAddTx,
  onViewMore,
  isLoading,
  currencySymbol = '₹',
}: TransactionListProps) {
  const { colors, isDark } = useAppTheme();

  // Show a maximum of 6 recent transactions on the dashboard
  const displayTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  return (
    <View style={styles.container}>
      {/* Section Header matching Image 3 Reference: "Transaction" & "See all" */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Transaction
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Recent movements
          </Text>
        </View>

        {onViewMore && transactions.length > 0 && (
          <TouchableOpacity
            onPress={onViewMore}
            activeOpacity={0.7}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>
              See all
            </Text>
            <ChevronRight size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Transactions List */}
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
          displayTransactions.map((tx) => {
            const isExp = tx.isExpense;
            return (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.txCard,
                  {
                    backgroundColor: isDark ? 'rgba(32, 35, 34, 0.82)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  onSelectTx(tx);
                }}
                activeOpacity={0.78}
              >
                {/* Circular Icon Badge matching Reference Image 3 */}
                <View
                  style={[
                    styles.txIconCircle,
                    {
                      backgroundColor: isDark ? '#232725' : '#F4F4EE',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}
                >
                  {isExp ? (
                    <ArrowUpRight size={18} color={isDark ? '#E5E7EB' : '#141715'} strokeWidth={2.2} />
                  ) : (
                    <ArrowDownLeft size={18} color={colors.matchaLime} strokeWidth={2.2} />
                  )}
                </View>

                {/* Details */}
                <View style={styles.txDetails}>
                  <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {tx.title}
                  </Text>
                  <Text style={[styles.txSubtitle, { color: colors.textSecondary }]}>
                    {tx.time} &bull; {tx.channel}
                  </Text>
                </View>

                {/* Amount & Type Tag on the right */}
                <View style={styles.txAmountCol}>
                  <Text
                    style={[
                      styles.txAmountText,
                      {
                        color: isExp ? colors.terracotta : colors.matchaLime,
                      },
                    ]}
                  >
                    {isExp ? '-' : '+'}{currencySymbol}{tx.amount.toFixed(2)}
                  </Text>
                  <Text style={[styles.txTypeLabel, { color: colors.textMuted }]}>
                    {isExp ? 'Transfer' : 'Received'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {transactions.length > 0 && onViewMore && (
          <TouchableOpacity
            onPress={onViewMore}
            style={[
              styles.bottomViewMoreBtn,
              {
                backgroundColor: isDark ? 'rgba(32, 35, 34, 0.65)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.bottomViewMoreText, { color: colors.textPrimary }]}>
              View All in Activity ({transactions.length})
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 19,
    letterSpacing: -0.4,
  },
  sectionSub: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  seeAllText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
  },
  txList: {
    gap: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  txIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  txSubtitle: {
    fontFamily: FONTS.sansRegular,
    fontSize: 12,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontFamily: FONTS.monoBold,
    fontSize: 15,
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  txTypeLabel: {
    fontFamily: FONTS.sansRegular,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  bottomViewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  bottomViewMoreText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
