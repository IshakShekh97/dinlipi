import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import {
  RotateCcw,
  PlusCircle,
  ArrowLeft,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic, FONTS } from '../../constants/theme';
import { SadEmptyAnimation } from './SadEmptyAnimation';

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
      animVariant: 'empty' as const,
      defaultAction: '+ Record Expense / Income',
      btnColor: colors.tangerineDream,
      btnTextColor: '#020202',
    },
    no_search_results: {
      defaultTitle: 'No Matching Results',
      defaultDesc: 'We couldn’t find any transaction, person, or category matching your query. Try another keyword.',
      animVariant: 'search' as const,
      defaultAction: 'Clear Search Filter',
      btnColor: colors.blueSlate,
      btnTextColor: '#FFFFFF',
    },
    no_people: {
      defaultTitle: 'No People in Khata',
      defaultDesc: 'Keep track of friends, shopkeepers, and loans with zero awkwardness and friendly reminders.',
      animVariant: 'empty' as const,
      defaultAction: '+ Add First Contact',
      btnColor: colors.palmLeaf,
      btnTextColor: '#FFFFFF',
    },
    error: {
      defaultTitle: 'Unable to Load Data',
      defaultDesc: 'Something unexpected happened while processing your offline data. Please retry or step back.',
      animVariant: 'sad' as const,
      defaultAction: 'Retry Action',
      defaultSecondary: 'Go Back',
      btnColor: colors.oxidizedIron,
      btnTextColor: '#FFFFFF',
    },
    no_budgets: {
      defaultTitle: 'No Spending Limits Set',
      defaultDesc: 'Establish monthly category limits to get mindful alerts before overspending.',
      animVariant: 'empty' as const,
      defaultAction: '+ Set Category Budget',
      btnColor: colors.tangerineDream,
      btnTextColor: '#020202',
    },
  }[type];

  const displayTitle = title || configs.defaultTitle;
  const displayDesc = description || configs.defaultDesc;
  const displayPrimary = primaryActionLabel || configs.defaultAction;
  const displaySecondary = secondaryActionLabel || (type === 'error' ? 'Go Back' : undefined);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
        style,
      ]}
    >
      {/* Expressive Animated Mascot (Gentle Sway & Floating Tear/Pulse) */}
      <View style={styles.animWrap}>
        <SadEmptyAnimation size={105} variant={configs.animVariant} />
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
                backgroundColor: configs.btnColor,
                shadowColor: configs.btnColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 4,
              },
            ]}
            activeOpacity={0.85}
          >
            {type === 'error' ? (
              <RotateCcw size={16} color={configs.btnTextColor} />
            ) : type === 'no_search_results' ? (
              <X size={16} color={configs.btnTextColor} />
            ) : (
              <PlusCircle size={16} color={configs.btnTextColor} />
            )}
            <Text
              style={[
                styles.primaryBtnText,
                { color: configs.btnTextColor },
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
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#EDF2F5',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 28,
    borderWidth: 1.2,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  animWrap: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: FONTS.sansBold,
    fontSize: 18,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  descText: {
    fontFamily: FONTS.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 290,
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
    fontFamily: FONTS.sansBold,
    fontSize: 14,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 13,
  },
});
