import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Tag, Search, X, Check, MoreHorizontal, Plus } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { CozyModal } from '../ui/CozyModal';
import { useCategoriesLive } from '../../db/queries';
import { CategoryItem, renderCategoryIcon } from './CategoryManagerModal';

interface TagSelectorFieldProps {
  selectedCategoryId?: string | null;
  onSelectCategory: (category: CategoryItem | null) => void;
  label?: string;
  onCreateTagPress?: () => void;
}

export function TagSelectorField({
  selectedCategoryId,
  onSelectCategory,
  label = 'Tag / Category (Optional)',
  onCreateTagPress,
}: TagSelectorFieldProps) {
  const { colors, isDark } = useAppTheme();
  const { data: dbCategories = [] } = useCategoriesLive();

  // Convert raw DB categories to CategoryItem interface
  const categories: CategoryItem[] = useMemo(() => {
    return (dbCategories || []).map((c) => ({
      id: c.id,
      name: c.name,
      iconName: c.icon || 'Tag',
      color: c.color || colors.tangerineDream,
      budget: c.budgetLimit || 0,
      spent: 0,
      type: (c.type as 'expense' | 'income') || 'expense',
    }));
  }, [dbCategories, colors.tangerineDream]);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected category object lookup
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId || c.name === selectedCategoryId) ?? null;
  }, [categories, selectedCategoryId]);

  // Handle toggling category selection
  const handleToggle = (cat: CategoryItem) => {
    triggerHaptic('light');
    if (selectedCategoryId === cat.id || selectedCategoryId === cat.name) {
      onSelectCategory(null);
    } else {
      onSelectCategory(cat);
    }
  };

  // Filtered categories for the search modal
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Maximum 5 suggestions shown directly inline if total > 5
  const inlineSuggestions = useMemo(() => {
    if (categories.length <= 5) return categories;
    return categories.slice(0, 5);
  }, [categories]);

  const hasMore = categories.length > 5;

  return (
    <View style={styles.container}>
      {/* Header Label Row */}
      <View style={styles.labelRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Tag size={13} color={colors.textSecondary} />
          <Text style={[styles.labelText, { color: colors.textSecondary }]}>{label}</Text>
        </View>

        {selectedCategory ? (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              onSelectCategory(null);
            }}
            activeOpacity={0.7}
            style={styles.clearBtn}
          >
            <Text style={[styles.clearBtnText, { color: colors.terracotta }]}>Clear Tag</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Inline Chips Area */}
      {categories.length === 0 ? (
        <View
          style={[
            styles.emptyTagsWrap,
            {
              backgroundColor: colors.cardSecondary,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Text style={[styles.emptyTagsText, { color: colors.textMuted }]}>
            No custom tags created yet.
          </Text>
          {onCreateTagPress ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('medium');
                onCreateTagPress();
              }}
              style={[styles.createTagPill, { backgroundColor: colors.tangerineDream }]}
              activeOpacity={0.8}
            >
              <Plus size={13} color={colors.black} strokeWidth={2.5} />
              <Text style={[styles.createTagPillText, { color: colors.black }]}>Create Tag</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {inlineSuggestions.map((cat) => {
            const isSelected = selectedCategoryId === cat.id || selectedCategoryId === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleToggle(cat)}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(227, 151, 116, 0.22)'
                        : 'rgba(227, 151, 116, 0.15)'
                      : colors.cardSecondary,
                    borderColor: isSelected ? colors.tangerineDream : colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.tagDot,
                    {
                      backgroundColor: cat.color,
                      borderColor: 'rgba(0,0,0,0.1)',
                    },
                  ]}
                >
                  {renderCategoryIcon(cat.iconName, 12, colors.black)}
                </View>
                <Text
                  style={[
                    styles.tagChipText,
                    {
                      color: isSelected ? colors.textPrimary : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.name}
                </Text>
                {isSelected && (
                  <Check size={13} color={colors.tangerineDream} strokeWidth={3} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            );
          })}

          {/* + More Button if > 5 categories */}
          {hasMore && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('medium');
                setSearchQuery('');
                setModalVisible(true);
              }}
              style={[
                styles.tagChip,
                styles.moreChip,
                {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.borderSubtle,
                },
              ]}
              activeOpacity={0.75}
            >
              <MoreHorizontal size={14} color={colors.tangerineDream} />
              <Text style={[styles.moreChipText, { color: colors.tangerineDream }]}>
                +{categories.length - 5} More
              </Text>
            </TouchableOpacity>
          )}

          {/* Quick Create Button */}
          {onCreateTagPress && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onCreateTagPress();
              }}
              style={[
                styles.tagChip,
                {
                  backgroundColor: 'transparent',
                  borderColor: colors.borderSubtle,
                  borderStyle: 'dashed',
                },
              ]}
              activeOpacity={0.7}
            >
              <Plus size={13} color={colors.textMuted} />
              <Text style={[styles.tagChipText, { color: colors.textMuted }]}>New</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ============================================================= */}
      {/* Searchable All Tags Dialog Bottom-Sheet                       */}
      {/* ============================================================= */}
      <CozyModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Select Tag / Category"
        subtitle={`${categories.length} custom tags created`}
        icon={<Tag size={18} color={colors.tangerineDream} />}
      >
        <View style={{ gap: 14, paddingBottom: 16 }}>
          {/* Live Search Input */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search tags..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              autoFocus={false}
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Tag List */}
          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            {searchFiltered.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  No matching tags found for &ldquo;{searchQuery}&rdquo;
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {searchFiltered.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id || selectedCategoryId === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        handleToggle(cat);
                        setModalVisible(false);
                      }}
                      style={[
                        styles.modalTagItem,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(227, 151, 116, 0.18)'
                              : 'rgba(227, 151, 116, 0.12)'
                            : colors.cardSecondary,
                          borderColor: isSelected ? colors.tangerineDream : colors.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={[
                            styles.modalTagIconWrap,
                            {
                              backgroundColor: cat.color,
                            },
                          ]}
                        >
                          {renderCategoryIcon(cat.iconName, 15, colors.black)}
                        </View>
                        <Text
                          style={[
                            styles.modalTagName,
                            {
                              color: colors.textPrimary,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </View>

                      {isSelected ? (
                        <View
                          style={[
                            styles.checkPill,
                            { backgroundColor: colors.tangerineDream },
                          ]}
                        >
                          <Check size={12} color={colors.black} strokeWidth={3} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Quick Actions Row */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            {selectedCategory ? (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  onSelectCategory(null);
                  setModalVisible(false);
                }}
                style={[
                  styles.clearModalBtn,
                  {
                    backgroundColor: colors.cardSecondary,
                    borderColor: colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.terracotta, fontWeight: '700', fontSize: 13 }}>
                  Clear Selected Tag
                </Text>
              </TouchableOpacity>
            ) : null}

            {onCreateTagPress ? (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setModalVisible(false);
                  onCreateTagPress();
                }}
                style={[
                  styles.createModalBtn,
                  {
                    backgroundColor: colors.tangerineDream,
                    flex: selectedCategory ? 1 : 1,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Plus size={15} color={colors.black} strokeWidth={2.5} />
                <Text style={{ color: colors.black, fontWeight: '800', fontSize: 13 }}>
                  Create New Tag
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </CozyModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  clearBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 3,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  moreChip: {
    paddingHorizontal: 12,
  },
  moreChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 12,
  },
  emptyTagsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyTagsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  createTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  createTagPillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  modalTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalTagIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTagName: {
    fontSize: 14,
  },
  checkPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 23,
  },
});
