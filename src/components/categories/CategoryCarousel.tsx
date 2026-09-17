import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Tag } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { CategoryItem } from './CategoryManagerModal';

interface CategoryCarouselProps {
  categories: CategoryItem[];
  onManage: () => void;
  currencySymbol?: string;
}

export function CategoryCarousel({
  categories,
  onManage,
  currencySymbol = '$',
}: CategoryCarouselProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Categories
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Monthly Budget Envelopes
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            onManage();
          }}
          style={[
            styles.seeAllBtn,
            { backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE' },
          ]}
        >
          <Text style={[styles.seeAllText, { color: colors.textPrimary }]}>
            Manage
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.slice(0, 6).map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.catTile,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
                borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
              },
            ]}
            onPress={() => {
              triggerHaptic();
              onManage();
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.catIconWrap,
                { backgroundColor: cat.color },
              ]}
            >
              <Tag size={16} color="#141715" />
            </View>
            <Text
              style={[styles.catName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
            <Text style={[styles.catSpent, { color: colors.textPrimary }]}>
              {currencySymbol}{cat.spent.toFixed(0)}
            </Text>
            <Text style={[styles.catBudget, { color: colors.textMuted }]}>
              of {currencySymbol}{cat.budget.toFixed(0)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryScroll: {
    gap: 12,
    paddingRight: 20,
  },
  catTile: {
    width: 110,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  catName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  catSpent: {
    fontSize: 14,
    fontWeight: '700',
  },
  catBudget: {
    fontSize: 10,
    marginTop: 2,
  },
});
