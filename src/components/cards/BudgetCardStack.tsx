import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Wifi, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { CardMeshBackground } from '../ui/CardMeshBackground';
import { BudgetCardData } from './BudgetCardModal';

interface BudgetCardStackProps {
  cards: BudgetCardData[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onAddCard: () => void;
  onEditCard: (card: BudgetCardData) => void;
  currencySymbol?: string;
}

function getHexLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 128;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function BudgetCardStack({
  cards,
  activeIndex,
  onSelectIndex,
  onAddCard,
  onEditCard,
  currencySymbol = '₹',
}: BudgetCardStackProps) {
  const { colors, isDark } = useAppTheme();

  // If there are no budget cards, show an inviting empty state card
  if (cards.length === 0) {
    return (
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            onAddCard();
          }}
          style={[
            styles.emptyCard,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: colors.matchaLime,
            },
          ]}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.emptyIconBadge,
              {
                backgroundColor: 'rgba(206, 240, 74, 0.16)',
                borderColor: colors.matchaLime,
              },
            ]}
          >
            <Plus size={24} color={colors.matchaLime} strokeWidth={2.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Create Budget Envelope
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Segment cash and track spending without rigid limits
          </Text>
          <View
            style={[
              styles.emptyAddBtn,
              { backgroundColor: colors.matchaLime },
            ]}
          >
            <Text style={styles.emptyAddBtnText}>+ Add First Card</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const activeCard = cards[activeIndex] || cards[0];

  return (
    <View style={styles.cardsContainer}>
      {/* Card Tabs Header */}
      <View style={styles.cardTabsRow}>
        {cards.map((card, idx) => {
          const isActive = activeIndex === idx;
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.cardTabPill,
                {
                  backgroundColor: isActive
                    ? isDark
                      ? colors.cardElevated
                      : '#FFFFFF'
                    : isDark
                    ? colors.cardSecondary
                    : '#EFEFEA',
                  borderColor: isActive ? colors.matchaLime : 'transparent',
                },
              ]}
              onPress={() => {
                triggerHaptic('light');
                onSelectIndex(idx);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cardTabText,
                  {
                    color: isActive ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {card.tabLabel || card.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Plus Button */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            onAddCard();
          }}
          style={[
            styles.plusBtn,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#EFEFEA',
              borderColor: isDark ? colors.borderSubtle : '#E5E7EB',
            },
          ]}
          activeOpacity={0.7}
        >
          <Plus size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Main Active Card (Pillar-Style) */}
      <View style={styles.cardStackWrapper}>
        {/* Background Card Offset Peek (if multiple cards) */}
        {cards.length > 1 && (
          <View
            style={[
              styles.cardPeekBackdrop,
              {
                backgroundColor: isDark ? '#141715' : '#D5D5CF',
              },
            ]}
          />
        )}

        {/* The Foreground Card */}
        {(() => {
          const isLightText = activeCard.customGradient
            ? getHexLuminance(activeCard.customGradient[0]) < 135
            : activeCard.variant === 'darkGraphite' || activeCard.variant === 'terracotta' || activeCard.variant === 'mossSage';
          const cardTextColor = isLightText ? '#FFFFFF' : '#141715';
          const cardSubTextColor = isLightText ? 'rgba(255, 255, 255, 0.75)' : 'rgba(20, 23, 21, 0.75)';

          return (
            <View
              style={[
                styles.activeCardOuter,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.35 : 0.12,
                },
              ]}
            >
              <CardMeshBackground
                variant={activeCard.variant}
                customGradient={activeCard.customGradient}
                borderRadius={28}
              />

              <View style={styles.cardContent}>
                {/* Card Header: Type Badge, Contactless, Edit Pill */}
                <View style={styles.cardHeaderRow}>
                  <View className="flex-row items-center gap-2">
                    <Text style={[styles.cardTypeText, { color: cardTextColor }]}>
                      {activeCard.cardType}
                    </Text>
                    <Wifi size={18} color={cardTextColor} />
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('light');
                        onEditCard(activeCard);
                      }}
                      style={styles.editCardPill}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.editCardText}>Customize</Text>
                      <Sparkles size={14} color="#141715" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Card Envelope Title & Limit */}
                <View style={styles.cardNumBox}>
                  <Text style={[styles.cardEnvelopeName, { color: cardTextColor }]} numberOfLines={1}>
                    {activeCard.name}
                  </Text>
                  <Text style={[styles.cardLimitText, { color: cardSubTextColor }]}>
                    Limit: {currencySymbol}{activeCard.limit.toLocaleString()}
                  </Text>
                </View>

                {/* Card Footer: Holder, Expiry & Available Balance */}
                <View style={styles.cardFooterRow}>
                  <View>
                    <Text style={[styles.cardFootLabel, { color: cardSubTextColor }]}>Holder</Text>
                    <Text style={[styles.cardFootVal, { color: cardTextColor }]}>{activeCard.holder}</Text>
                  </View>
                  <View>
                    <Text style={[styles.cardFootLabel, { color: cardSubTextColor }]}>Cycle</Text>
                    <Text style={[styles.cardFootVal, { color: cardTextColor }]}>{activeCard.expiry || 'Monthly'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.cardFootLabel, { color: cardSubTextColor }]}>Available</Text>
                    <Text style={[styles.cardFootBalance, { color: cardTextColor }]}>
                      {currencySymbol}{(activeCard.limit - activeCard.spent).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  cardTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardTabText: {
    fontSize: 12,
  },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardStackWrapper: {
    position: 'relative',
  },
  cardPeekBackdrop: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: 8,
    height: 195,
    borderRadius: 28,
    opacity: 0.5,
  },
  activeCardOuter: {
    width: '100%',
    height: 205,
    borderRadius: 28,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTypeText: {
    color: '#141715',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.2,
  },
  editCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editCardText: {
    color: '#141715',
    fontSize: 11,
    fontWeight: '800',
  },
  cardNumBox: {
    marginVertical: 4,
  },
  cardEnvelopeName: {
    color: '#141715',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  cardLimitText: {
    color: 'rgba(20, 23, 21, 0.75)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardFootLabel: {
    color: 'rgba(20, 23, 21, 0.65)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardFootVal: {
    color: '#141715',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  cardFootBalance: {
    color: '#141715',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 240,
  },
  emptyAddBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyAddBtnText: {
    color: '#141715',
    fontSize: 13,
    fontWeight: '800',
  },
});
