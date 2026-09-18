import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useUIStore } from '../../store/ui-store';
import {
  FolderPlus,
  Plus,
  Trash2,
  Edit2,
  Check,
  Coffee,
  ShoppingBag,
  Utensils,
  Wine,
  Apple,
  Pizza,
  Car,
  Plane,
  Fuel,
  Bus,
  Train,
  Bike,
  Home,
  Zap,
  Wifi,
  Tv,
  Flame,
  Wrench,
  Heart,
  Dumbbell,
  Activity,
  Pill,
  Smile,
  Smartphone,
  Laptop,
  Camera,
  Film,
  Music,
  Gamepad2,
  ShoppingCart,
  Gift,
  Tag,
  Scissors,
  Shirt,
  Sparkles,
  DollarSign,
  Briefcase,
  CreditCard,
  Wallet,
  Landmark,
  Receipt,
  BookOpen,
  GraduationCap,
  Building,
  Key,
  MapPin,
  Shield,
} from 'lucide-react-native';
import { CozyModal } from '../ui/CozyModal';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';

export interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
  color: string;
  budget: number;
  spent: number;
  type: 'expense' | 'income';
}

export const INITIAL_CATEGORIES: CategoryItem[] = [];

interface CategoryManagerModalProps {
  visible: boolean;
  onClose: () => void;
  categories?: CategoryItem[];
  categoryList?: CategoryItem[];
  onAddCategory?: (category: CategoryItem) => void;
  onEditCategory?: (category: CategoryItem) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onSaveList?: (categories: CategoryItem[]) => void;
}

export const CATEGORY_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  ShoppingBag,
  Coffee,
  Utensils,
  Wine,
  Apple,
  Pizza,
  Car,
  Plane,
  Fuel,
  Bus,
  Train,
  Bike,
  Home,
  Zap,
  Wifi,
  Tv,
  Flame,
  Wrench,
  Heart,
  Dumbbell,
  Activity,
  Pill,
  Smile,
  Smartphone,
  Laptop,
  Camera,
  Film,
  Music,
  Gamepad2,
  ShoppingCart,
  Gift,
  Tag,
  Scissors,
  Shirt,
  Sparkles,
  DollarSign,
  Briefcase,
  CreditCard,
  Wallet,
  Landmark,
  Receipt,
  BookOpen,
  GraduationCap,
  Building,
  Key,
  MapPin,
  Shield,
};

export const renderCategoryIcon = (iconName: string, size = 18, color = '#020202') => {
  const IconComponent = CATEGORY_ICONS[iconName] || Tag;
  return <IconComponent size={size} color={color} />;
};

const PASTEL_COLORS = [
  '#899D78', // Palm Leaf Green
  '#326273', // Blue Slate
  '#E39774', // Tangerine Dream
  '#B02E0C', // Oxidized Iron
  '#020202', // Obsidian Black
  '#5D875F', // Forest Sage
  '#487D91', // Nordic Frost
  '#F0B195', // Soft Tangerine
  '#E07A5F', // Terracotta
  '#E9C46A', // Golden Honey
  '#2A9D8F', // Deep Teal
  '#E76F51', // Coral Red
  '#7209B7', // Plum Violet
  '#4361EE', // Electric Indigo
  '#52B788', // Mint Jade
  '#F4A261', // Warm Amber
  '#4682B4', // Steel Blue
  '#E5989B', // Rose Quartz
  '#DDA15E', // Sunset Ochre
  '#606C38', // Olive Bark
  '#9B2226', // Crimson Velvet
  '#1D3557', // Midnight Blue
  '#A370F7', // Dusty Lavender
  '#B7A99A', // Warm Taupe
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  visible,
  onClose,
  categories,
  categoryList,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onSaveList,
}) => {
  const { colors, isDark } = useAppTheme();

  const activeCategories = categoryList || categories || [];

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const handleResetForm = () => {
    setName('');
    setSelectedIcon('Tag');
    setSelectedColor(PASTEL_COLORS[0]);
    setType('expense');
    setEditingId(null);
    setMode('list');
  };

  const startCreate = () => {
    handleResetForm();
    setMode('create');
  };

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSelectedIcon(cat.iconName);
    setSelectedColor(cat.color);
    setType(cat.type);
    setMode('edit');
  };

  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const handleSave = () => {
    if (!name.trim()) {
      showConfirm({
        title: 'Missing Tag Name',
        message: 'Please enter a tag name before saving.',
        confirmText: 'Understood',
        cancelText: 'Dismiss',
        onConfirm: () => {},
      });
      return;
    }

    triggerHaptic('success');

    if (mode === 'create') {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        iconName: selectedIcon,
        color: selectedColor,
        budget: 0,
        spent: 0,
        type,
      };
      if (onAddCategory) onAddCategory(newCat);
      if (onSaveList) onSaveList([newCat, ...activeCategories]);
    } else if (mode === 'edit' && editingId) {
      const existing = activeCategories.find((c) => c.id === editingId);
      const updatedCat: CategoryItem = {
        id: editingId,
        name: name.trim(),
        iconName: selectedIcon,
        color: selectedColor,
        budget: 0,
        spent: existing ? existing.spent : 0,
        type,
      };
      if (onEditCategory) onEditCategory(updatedCat);
      if (onSaveList) onSaveList(activeCategories.map((c) => (c.id === editingId ? updatedCat : c)));
    }

    handleResetForm();
  };

  const handleDelete = (cat: CategoryItem) => {
    triggerHaptic('warning');
    showConfirm({
      title: 'Delete Tag',
      message: `Are you sure you want to remove the "${cat.name}" tag? Existing transactions with this tag will not be deleted.`,
      confirmText: 'Delete Tag',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        triggerHaptic('error');
        if (onDeleteCategory) onDeleteCategory(cat.id);
        if (onSaveList) onSaveList(activeCategories.filter((c) => c.id !== cat.id));
      },
    });
  };

  const renderIcon = renderCategoryIcon;

  return (
    <CozyModal
      visible={visible}
      onClose={() => {
        handleResetForm();
        onClose();
      }}
      title={mode === 'list' ? 'Transaction Tags' : mode === 'create' ? 'New Tag' : 'Edit Tag'}
      subtitle={mode === 'list' ? `${activeCategories.length} tags configured for filtering` : 'Customize tag name, icon & color'}
      icon={<FolderPlus size={18} color={colors.accentPrimary} />}
      headerRight={
        mode === 'list' ? (
            <TouchableOpacity
              onPress={startCreate}
              style={[
                styles.headerAddBtn,
                { backgroundColor: isDark ? colors.tangerineDream : colors.black },
              ]}
              activeOpacity={0.8}
            >
              <Plus size={16} color={isDark ? colors.black : '#FFFFFF'} />
              <Text style={[styles.headerAddBtnText, { color: isDark ? colors.black : '#FFFFFF' }]}>
                Add
              </Text>
            </TouchableOpacity>
        ) : undefined
      }
    >
      {mode === 'list' ? (
        <View className="space-y-3 pt-1">
          {activeCategories.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 }}>
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: isDark ? 'rgba(227, 151, 116, 0.16)' : '#F4F4EE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <FolderPlus size={26} color={colors.tangerineDream} />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>
                No Tags Created Yet
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 22 }}>
                Custom tags allow you to group, categorize, and filter your income, expenses, and Khata ledger entries.
              </Text>

              <TouchableOpacity
                onPress={startCreate}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.tangerineDream,
                  paddingHorizontal: 22,
                  paddingVertical: 13,
                  borderRadius: 20,
                }}
                activeOpacity={0.8}
              >
                <Plus size={16} color={colors.black} strokeWidth={2.5} />
                <Text style={{ color: colors.black, fontWeight: '800', fontSize: 14 }}>
                  Create First Tag
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeCategories.map((cat) => {
              return (
                <View
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: colors.cardSecondary,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View
                        style={[
                          styles.catIconWrap,
                          { backgroundColor: cat.color, borderColor: 'rgba(0,0,0,0.06)' },
                        ]}
                      >
                        {renderIcon(cat.iconName, 18, colors.black)}
                      </View>
                      <View>
                        <Text style={[styles.catName, { color: colors.textPrimary }]}>
                          {cat.name}
                        </Text>
                        <Text style={[styles.catBudget, { color: colors.textMuted }]}>
                          Tag for filtering & grouping
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View className="flex-row items-center gap-1.5">
                      <TouchableOpacity
                        onPress={() => startEdit(cat)}
                        style={[styles.smallActionBtn, { backgroundColor: colors.cardElevated }]}
                      >
                        <Edit2 size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(cat)}
                        style={[styles.smallActionBtn, { backgroundColor: 'rgba(231, 111, 81, 0.12)' }]}
                      >
                        <Trash2 size={14} color={colors.accentDanger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
            );
          }))}
        </View>
      ) : (
        /* Create / Edit Form */
        <View className="pt-2">
          {/* Tag Name */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tag Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Xerox, Walk, Coffee, Service"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.cardSecondary,
                color: colors.textPrimary,
                borderColor: colors.borderSubtle,
              },
            ]}
          />

          {/* Color Palette Picker */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tag Color</Text>
          <View style={styles.colorGrid}>
            {PASTEL_COLORS.map((col) => {
              const selected = selectedColor === col;
              return (
                <TouchableOpacity
                  key={col}
                  onPress={() => {
                    triggerHaptic('light');
                    setSelectedColor(col);
                  }}
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: col,
                      borderColor: selected ? (isDark ? '#FFFFFF' : colors.black) : 'transparent',
                    },
                  ]}
                >
                  {selected && <Check size={14} color={colors.black} strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pre-Built Icon Picker Grid */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Icon</Text>
          <View style={styles.iconPickerGrid}>
            {Object.keys(CATEGORY_ICONS).map((iconKey) => {
              const isSelected = selectedIcon === iconKey;
              return (
                <TouchableOpacity
                  key={iconKey}
                  onPress={() => {
                    triggerHaptic('light');
                    setSelectedIcon(iconKey);
                  }}
                  style={[
                    styles.iconPickerBtn,
                    {
                      backgroundColor: isSelected ? selectedColor : colors.cardSecondary,
                      borderColor: isSelected ? (isDark ? '#FFFFFF' : colors.black) : colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  {renderIcon(iconKey, 18, isSelected ? colors.black : colors.textPrimary)}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form Actions */}
          <View className="flex-row gap-2.5 mt-5">
            <TouchableOpacity
              onPress={handleResetForm}
              style={[
                styles.cancelBtn,
                { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveBtn,
                { backgroundColor: isDark ? colors.tangerineDream : colors.black },
              ]}
              activeOpacity={0.85}
            >
              <Text style={{ color: isDark ? colors.black : '#FFFFFF', fontWeight: '800' }}>
                {mode === 'create' ? 'Add Category' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </CozyModal>
  );
};

const styles = StyleSheet.create({
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  headerAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoryCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  catIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  catName: {
    fontSize: 14,
    fontWeight: '800',
  },
  catBudget: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  smallActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  iconPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  iconPickerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
