import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Tag, Plus, Sparkles } from 'lucide-react-native';
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
            Transaction Tags
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Filter & categorize ledger movements
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
            {categories.length === 0 ? 'Create' : 'Manage'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories Content or Guided Empty State */}
      {categories.length === 0 ? (
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('medium');
            onManage();
          }}
          style={[
            styles.emptyGuidedBox,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
            },
          ]}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: isDark ? 'rgba(137, 157, 120, 0.15)' : 'rgba(137, 157, 120, 0.25)' },
            ]}
          >
            <Sparkles size={18} color={colors.palmLeaf} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Custom Tags Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Create tags like Xerox, Walk, Service, or Tea to label and filter entries.
            </Text>
          </View>
          <View
            style={[
              styles.addPill,
              { backgroundColor: colors.palmLeaf },
            ]}
          >
            <Plus size={14} color="#141715" />
            <Text style={styles.addPillText}>New Tag</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
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
                <Tag size={15} color="#141715" />
              </View>
              <Text
                style={[styles.catName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
              <Text style={[styles.catBudget, { color: colors.textMuted }]}>
                Tag
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  emptyGuidedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  emptyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addPillText: {
    color: '#141715',
    fontWeight: '800',
    fontSize: 12,
  },
});
