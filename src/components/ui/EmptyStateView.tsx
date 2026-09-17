import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import {
  SearchX,
  Receipt,
  Users,
  AlertTriangle,
  PieChart,
  RotateCcw,
  PlusCircle,
  ArrowLeft,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';

export type EmptyStateType =
  | 'no_transactions'
  | 'no_search_results'
  | 'no_people'
  | 'error'
  | 'no_budgets';

interface EmptyStateViewProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

export function EmptyStateView({
  type = 'no_transactions',
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}: EmptyStateViewProps) {
  const { colors, isDark } = useAppTheme();

  // Configurations based on type
  const configs = {
    no_transactions: {
      defaultTitle: 'No Transactions Yet',
      defaultDesc: 'Your ledger is peaceful and clean. Tap below to log your first coffee, grocery, or salary entry.',
      icon: Receipt,
      iconColor: colors.matchaLime,
      iconBg: 'rgba(206, 240, 74, 0.14)',
      defaultAction: '+ Record Expense / Income',
    },
    no_search_results: {
      defaultTitle: 'No Matching Results',
      defaultDesc: 'We couldn’t find any transaction, person, or category matching your query. Try another keyword.',
      icon: SearchX,
      iconColor: colors.goldenHoney,
      iconBg: 'rgba(242, 204, 143, 0.16)',
      defaultAction: 'Clear Search Filter',
    },
    no_people: {
      defaultTitle: 'No People in Khata',
      defaultDesc: 'Keep track of friends, shopkeepers, and loans with zero awkwardness and friendly reminders.',
      icon: Users,
      iconColor: colors.mossSage,
      iconBg: 'rgba(129, 178, 154, 0.16)',
      defaultAction: '+ Add First Contact',
    },
    error: {
      defaultTitle: 'Unable to Load Data',
      defaultDesc: 'Something unexpected happened while processing your offline data. Please retry or step back.',
      icon: AlertTriangle,
      iconColor: colors.terracotta,
      iconBg: 'rgba(224, 122, 95, 0.16)',
      defaultAction: 'Retry Action',
      defaultSecondary: 'Go Back',
    },
    no_budgets: {
      defaultTitle: 'No Spending Limits Set',
      defaultDesc: 'Establish monthly category limits to get mindful alerts before overspending.',
      icon: PieChart,
      iconColor: colors.matchaLime,
      iconBg: 'rgba(206, 240, 74, 0.14)',
      defaultAction: '+ Set Category Budget',
    },
  }[type];

  const displayTitle = title || configs.defaultTitle;
  const displayDesc = description || configs.defaultDesc;
  const displayPrimary = primaryActionLabel || configs.defaultAction;
  const displaySecondary = secondaryActionLabel || (type === 'error' ? 'Go Back' : undefined);

  const IconComp = configs.icon;

  return (
    <View style={[styles.container, style]}>
      {/* Illustrated Icon Aura */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: configs.iconBg,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(18,20,19,0.06)',
          },
        ]}
      >
        <IconComp size={36} color={configs.iconColor} strokeWidth={1.8} />
      </View>

      <Text style={[styles.titleText, { color: colors.textPrimary }]}>{displayTitle}</Text>

      <Text style={[styles.descText, { color: colors.textSecondary }]}>{displayDesc}</Text>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {onPrimaryAction && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              onPrimaryAction();
            }}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: type === 'error' ? colors.terracotta : colors.matchaLime,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
              },
            ]}
            activeOpacity={0.85}
          >
            {type === 'error' ? (
              <RotateCcw size={16} color="#FFFFFF" />
            ) : type === 'no_search_results' ? (
              <X size={16} color="#121413" />
            ) : (
              <PlusCircle size={16} color="#121413" />
            )}
            <Text
              style={[
                styles.primaryBtnText,
                { color: type === 'error' ? '#FFFFFF' : '#121413' },
              ]}
            >
              {displayPrimary}
            </Text>
          </TouchableOpacity>
        )}

        {displaySecondary && onSecondaryAction && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              onSecondaryAction();
            }}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.borderMedium,
              },
            ]}
            activeOpacity={0.8}
          >
            <ArrowLeft size={16} color={colors.textPrimary} />
            <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
              {displaySecondary}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  descText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 300,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
