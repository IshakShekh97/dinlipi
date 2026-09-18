import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Wifi, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic, FONTS } from '../../constants/theme';
import { CardMeshBackground } from '../ui/CardMeshBackground';
import { BudgetCardData } from './BudgetCardModal';
import { getHexLuminance } from '../../utils/meshGenerator';

interface BudgetCardStackProps {
  cards: BudgetCardData[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onAddCard: () => void;
  onEditCard: (card: BudgetCardData) => void;
  currencySymbol?: string;
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

  // Empty state card
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
              borderColor: colors.blueSlate,
            },
          ]}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.emptyIconBadge,
              {
                backgroundColor: isDark ? 'rgba(50, 98, 115, 0.16)' : 'rgba(50, 98, 115, 0.12)',
                borderColor: colors.blueSlate,
              },
            ]}
          >
            <Plus size={24} color={colors.tangerineDream} strokeWidth={2.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Create Budget Envelope
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Segment cash and track spending with dynamic mesh cards
          </Text>
          <View
            style={[
              styles.emptyAddBtn,
              { backgroundColor: colors.tangerineDream },
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
                      ? 'rgba(255, 255, 255, 0.12)'
                      : '#FFFFFF'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : '#EDF2F5',
                  borderColor: isActive ? colors.tangerineDream : 'transparent',
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
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EDF2F5',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
          activeOpacity={0.7}
        >
          <Plus size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Main Active Card (Pillar-Style Stack from Mockup 2) */}
      <View style={styles.cardStackWrapper}>
        {/* Background Card Offset Peek (if multiple cards) */}
        {cards.length > 1 && (
          <View
            style={[
              styles.cardPeekBackdrop,
              {
                backgroundColor: isDark ? '#141A1E' : '#D0D8DC',
              },
            ]}
          />
        )}

        {/* Foreground Card */}
        {(() => {
          const isLightText = activeCard.customGradient
            ? getHexLuminance(activeCard.customGradient[0]) < 140
            : activeCard.variant !== 'porcelain';
          const cardTextColor = isLightText ? '#FFFFFF' : '#020202';
          const cardSubTextColor = isLightText ? 'rgba(255, 255, 255, 0.75)' : 'rgba(2, 2, 2, 0.65)';

          return (
            <View
              style={[
                styles.activeCardOuter,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.40 : 0.14,
                },
              ]}
            >
              <CardMeshBackground
                variant={activeCard.variant}
                customGradient={activeCard.customGradient}
                shapePattern={activeCard.shapePattern}
                borderRadius={28}
              />

              <View style={styles.cardContent}>
                {/* Card Header: Type Badge, Mastercard Circles, Contactless, Customize Pill */}
                <View style={styles.cardHeaderRow}>
                  <View className="flex-row items-center gap-2">
                    <View style={styles.mastercardBadge}>
                      <View style={[styles.mastercardCircle, { backgroundColor: '#EB001B', zIndex: 1 }]} />
                      <View style={[styles.mastercardCircle, { backgroundColor: '#FF5F00', marginLeft: -7, zIndex: 2 }]} />
                    </View>
                    <Text style={[styles.cardTypeText, { color: cardTextColor }]}>
                      {activeCard.cardType}
                    </Text>
                    <Wifi size={17} color={cardTextColor} />
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      onEditCard(activeCard);
                    }}
                    style={[
                      styles.editCardPill,
                      {
                        backgroundColor: isLightText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)',
                        borderColor: isLightText ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.15)',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.editCardText, { color: cardTextColor }]}>Customize</Text>
                    <Sparkles size={13} color={cardTextColor} />
                  </TouchableOpacity>
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

                {/* Card Footer: Holder, Cycle & Available Balance */}
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
    marginTop: 6,
    marginBottom: 18,
  },
  cardTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardTabText: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
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
    height: 200,
    borderRadius: 28,
    opacity: 0.55,
  },
  activeCardOuter: {
    width: '100%',
    height: 210,
    borderRadius: 28,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
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
  mastercardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 24,
  },
  mastercardCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cardTypeText: {
    fontFamily: FONTS.sansBold,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  editCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  editCardText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  cardNumBox: {
    marginVertical: 4,
  },
  cardEnvelopeName: {
    fontSize: 22,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.6,
  },
  cardLimitText: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardFootLabel: {
    fontSize: 10,
    fontFamily: FONTS.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardFootVal: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
    marginTop: 2,
  },
  cardFootBalance: {
    fontSize: 20,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.4,
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1.5,
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
    fontFamily: FONTS.sansBold,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: FONTS.sansRegular,
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
    color: '#020202',
    fontSize: 13,
    fontFamily: FONTS.sansBold,
  },
});
