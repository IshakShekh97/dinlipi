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
  Car,
  Plane,
  Home,
  Heart,
  Dumbbell,
  Smartphone,
  Laptop,
  Sparkles,
  Film,
  DollarSign,
  Wallet,
  Tag,
  Gift,
  Book,
  Briefcase,
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

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Investments',
    iconName: 'Home',
    color: '#CEF04A',
    budget: 5000,
    spent: 3607.0,
    type: 'expense',
  },
  {
    id: 'cat-2',
    name: 'Travelling',
    iconName: 'Car',
    color: '#81B29A',
    budget: 6000,
    spent: 4207.01,
    type: 'expense',
  },
  {
    id: 'cat-3',
    name: 'Groceries',
    iconName: 'ShoppingBag',
    color: '#F2CC8F',
    budget: 1000,
    spent: 604.36,
    type: 'expense',
  },
  {
    id: 'cat-4',
    name: 'Cafes & Dining',
    iconName: 'Utensils',
    color: '#E07A5F',
    budget: 500,
    spent: 296.65,
    type: 'expense',
  },
  {
    id: 'cat-5',
    name: 'Sport & Gym',
    iconName: 'Dumbbell',
    color: '#CEF04A',
    budget: 300,
    spent: 187.5,
    type: 'expense',
  },
];

interface CategoryManagerModalProps {
  visible: boolean;
  onClose: () => void;
  categories?: CategoryItem[];
  categoryList?: CategoryItem[];
  onAddCategory?: (category: CategoryItem) => void;
  onEditCategory?: (category: CategoryItem) => void;
  onDeleteCategory?: (id: string) => void;
  onSaveList?: (categories: CategoryItem[]) => void;
}

export const CATEGORY_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Coffee,
  ShoppingBag,
  Utensils,
  Car,
  Plane,
  Home,
  Heart,
  Dumbbell,
  Smartphone,
  Laptop,
  Sparkles,
  Film,
  DollarSign,
  Wallet,
  Tag,
  Gift,
  Book,
  Briefcase,
};

const PASTEL_COLORS = [
  '#CEF04A', // Matcha Lime
  '#E07A5F', // Terracotta
  '#81B29A', // Moss Sage
  '#F2CC8F', // Golden Honey
  '#E76F51', // Coral Rose
  '#A8D21E', // Chartreuse
  '#588157', // Forest
  '#262928', // Dark Graphite
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

  const activeCategories = categoryList || categories || INITIAL_CATEGORIES;

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('500');
  const [selectedIcon, setSelectedIcon] = useState('ShoppingBag');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const handleResetForm = () => {
    setName('');
    setBudget('500');
    setSelectedIcon('ShoppingBag');
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
    setBudget(cat.budget.toString());
    setSelectedIcon(cat.iconName);
    setSelectedColor(cat.color);
    setType(cat.type);
    setMode('edit');
  };

  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const handleSave = () => {
    if (!name.trim()) {
      showConfirm({
        title: 'Missing Title',
        message: 'Please enter a category title before saving.',
        confirmText: 'Understood',
        cancelText: 'Dismiss',
        onConfirm: () => {},
      });
      return;
    }

    const numBudget = parseFloat(budget) || 200;
    triggerHaptic('success');

    if (mode === 'create') {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        iconName: selectedIcon,
        color: selectedColor,
        budget: numBudget,
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
        budget: numBudget,
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
      title: 'Delete Category',
      message: `Are you sure you want to remove "${cat.name}"? Existing transactions will not be deleted.`,
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        triggerHaptic('error');
        if (onDeleteCategory) onDeleteCategory(cat.id);
        if (onSaveList) onSaveList(activeCategories.filter((c) => c.id !== cat.id));
      },
    });
  };

  const renderIcon = (iconName: string, size = 18, color = '#141715') => {
    const IconComponent = CATEGORY_ICONS[iconName] || Tag;
    return <IconComponent size={size} color={color} />;
  };

  return (
    <CozyModal
      visible={visible}
      onClose={() => {
        handleResetForm();
        onClose();
      }}
      title={mode === 'list' ? 'Manage Categories' : mode === 'create' ? 'New Category' : 'Edit Category'}
      subtitle={mode === 'list' ? `${activeCategories.length} custom categories configured` : 'Customize category icon & budget'}
      icon={<FolderPlus size={18} color={colors.accentPrimary} />}
      headerRight={
        mode === 'list' ? (
          <TouchableOpacity
            onPress={startCreate}
            style={[
              styles.headerAddBtn,
              { backgroundColor: isDark ? '#CEF04A' : '#141715' },
            ]}
            activeOpacity={0.8}
          >
            <Plus size={16} color={isDark ? '#141715' : '#FFFFFF'} />
            <Text style={[styles.headerAddBtnText, { color: isDark ? '#141715' : '#FFFFFF' }]}>
              Add
            </Text>
          </TouchableOpacity>
        ) : undefined
      }
    >
      {mode === 'list' ? (
        <View className="space-y-3 pt-1">
          {activeCategories.map((cat) => {
            const pct = cat.budget > 0 ? Math.min(Math.round((cat.spent / cat.budget) * 100), 100) : 0;
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
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className="flex-row items-center gap-3">
                    <View
                      style={[
                        styles.catIconWrap,
                        { backgroundColor: cat.color, borderColor: 'rgba(0,0,0,0.06)' },
                      ]}
                    >
                      {renderIcon(cat.iconName, 18, '#141715')}
                    </View>
                    <View>
                      <Text style={[styles.catName, { color: colors.textPrimary }]}>
                        {cat.name}
                      </Text>
                      <Text style={[styles.catBudget, { color: colors.textMuted }]}>
                        ${cat.spent} of ${cat.budget} budget
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

                {/* Progress Bar */}
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#181A19' : '#EDECE6' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: cat.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        /* Create / Edit Form */
        <View className="pt-2">
          {/* Category Name */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Fine Dining, Gym & Fitness"
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

          {/* Monthly Budget Cap */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Monthly Budget Limit ($)</Text>
          <TextInput
            value={budget}
            onChangeText={setBudget}
            placeholder="500"
            keyboardType="numeric"
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
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Accent Color</Text>
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
                      borderColor: selected ? (isDark ? '#FFFFFF' : '#141715') : 'transparent',
                    },
                  ]}
                >
                  {selected && <Check size={14} color="#141715" strokeWidth={3} />}
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
                      borderColor: isSelected ? (isDark ? '#FFFFFF' : '#141715') : colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  {renderIcon(iconKey, 18, isSelected ? '#141715' : colors.textPrimary)}
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
                { backgroundColor: isDark ? '#CEF04A' : '#141715' },
              ]}
              activeOpacity={0.85}
            >
              <Text style={{ color: isDark ? '#141715' : '#FFFFFF', fontWeight: '800' }}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
