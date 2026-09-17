import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { useUIStore } from '../../store/ui-store';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  Calendar,
  DollarSign,
  Tv,
  Music,
  Cloud,
  Home,
  Dumbbell,
  Tag,
  ArrowRight,
} from 'lucide-react-native';
import { CozyModal } from '../ui/CozyModal';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  category: string;
  nextBillingDate: string;
  active: boolean;
  iconName: string;
  color: string;
}

export const INITIAL_RECURRING: RecurringTransaction[] = [
  {
    id: 'rec-1',
    name: 'Adobe Creative Cloud',
    amount: 59.99,
    frequency: 'monthly',
    category: 'Work & Tools',
    nextBillingDate: 'Oct 02, 2026',
    active: true,
    iconName: 'Cloud',
    color: '#E07A5F',
  },
  {
    id: 'rec-2',
    name: 'Spotify Premium',
    amount: 10.99,
    frequency: 'monthly',
    category: 'Entertainment',
    nextBillingDate: 'Oct 08, 2026',
    active: true,
    iconName: 'Music',
    color: '#CEF04A',
  },
  {
    id: 'rec-3',
    name: 'Gym & Wellness Club',
    amount: 45.0,
    frequency: 'monthly',
    category: 'Health',
    nextBillingDate: 'Oct 15, 2026',
    active: true,
    iconName: 'Dumbbell',
    color: '#81B29A',
  },
  {
    id: 'rec-4',
    name: 'Netflix 4K UHD',
    amount: 19.99,
    frequency: 'monthly',
    category: 'Entertainment',
    nextBillingDate: 'Oct 20, 2026',
    active: false,
    iconName: 'Tv',
    color: '#F2CC8F',
  },
  {
    id: 'rec-5',
    name: 'Apartment Studio Lease',
    amount: 1200.0,
    frequency: 'monthly',
    category: 'Housing',
    nextBillingDate: 'Nov 01, 2026',
    active: true,
    iconName: 'Home',
    color: '#E76F51',
  },
];

interface RecurringManagerModalProps {
  visible: boolean;
  onClose: () => void;
  recurringList: RecurringTransaction[];
  onSaveList: (updated: RecurringTransaction[]) => void;
}

export const RecurringManagerModal: React.FC<RecurringManagerModalProps> = ({
  visible,
  onClose,
  recurringList,
  onSaveList,
}) => {
  const { colors, isDark } = useAppTheme();

  // Mode: 'list' | 'create' | 'edit'
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [filterFreq, setFilterFreq] = useState<'all' | RecurringFrequency>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [category, setCategory] = useState('Subscription');
  const [nextBillingDate, setNextBillingDate] = useState('Oct 28, 2026');
  const [active, setActive] = useState(true);
  const [selectedColor, setSelectedColor] = useState('#CEF04A');
  const [selectedIcon, setSelectedIcon] = useState('Cloud');

  const startCreate = () => {
    triggerHaptic();
    setEditingId(null);
    setName('');
    setAmount('');
    setFrequency('monthly');
    setCategory('Subscription');
    setNextBillingDate('Oct 28, 2026');
    setActive(true);
    setSelectedColor('#CEF04A');
    setSelectedIcon('Cloud');
    setMode('create');
  };

  const startEdit = (item: RecurringTransaction) => {
    triggerHaptic();
    setEditingId(item.id);
    setName(item.name);
    setAmount(item.amount.toString());
    setFrequency(item.frequency);
    setCategory(item.category);
    setNextBillingDate(item.nextBillingDate);
    setActive(item.active);
    setSelectedColor(item.color);
    setSelectedIcon(item.iconName);
    setMode('edit');
  };

  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const handleDelete = (id: string, itemName: string) => {
    triggerHaptic('warning');
    showConfirm({
      title: 'Delete Subscription',
      message: `Are you sure you want to remove "${itemName}" from scheduled recurring bills?`,
      confirmText: 'Delete Bill',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        const updated = recurringList.filter((item) => item.id !== id);
        onSaveList(updated);
      },
    });
  };

  const handleToggleActive = (id: string) => {
    triggerHaptic();
    const updated = recurringList.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    onSaveList(updated);
  };

  const handleSaveForm = () => {
    if (!name.trim()) {
      showConfirm({
        title: 'Missing Title',
        message: 'Please enter a subscription or bill title.',
        confirmText: 'Understood',
        cancelText: 'Dismiss',
        onConfirm: () => {},
      });
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showConfirm({
        title: 'Invalid Amount',
        message: 'Please enter a positive recurring amount.',
        confirmText: 'Understood',
        cancelText: 'Dismiss',
        onConfirm: () => {},
      });
      return;
    }

    triggerHaptic('success');

    if (mode === 'edit' && editingId) {
      const updated = recurringList.map((item) =>
        item.id === editingId
          ? {
              ...item,
              name: name.trim(),
              amount: parsedAmount,
              frequency,
              category,
              nextBillingDate,
              active,
              color: selectedColor,
              iconName: selectedIcon,
            }
          : item
      );
      onSaveList(updated);
    } else {
      const newItem: RecurringTransaction = {
        id: `rec-${Date.now()}`,
        name: name.trim(),
        amount: parsedAmount,
        frequency,
        category,
        nextBillingDate,
        active,
        color: selectedColor,
        iconName: selectedIcon,
      };
      onSaveList([newItem, ...recurringList]);
    }

    setMode('list');
  };

  const renderIcon = (nameKey: string, size = 18, color = '#141715') => {
    switch (nameKey) {
      case 'Music':
        return <Music size={size} color={color} />;
      case 'Tv':
        return <Tv size={size} color={color} />;
      case 'Home':
        return <Home size={size} color={color} />;
      case 'Dumbbell':
        return <Dumbbell size={size} color={color} />;
      case 'Cloud':
      default:
        return <Cloud size={size} color={color} />;
    }
  };

  const filteredItems = recurringList.filter((item) => {
    if (filterFreq === 'all') return true;
    return item.frequency === filterFreq;
  });

  const totalMonthlySpend = recurringList
    .filter((it) => it.active)
    .reduce((acc, it) => {
      if (it.frequency === 'monthly') return acc + it.amount;
      if (it.frequency === 'yearly') return acc + it.amount / 12;
      if (it.frequency === 'weekly') return acc + it.amount * 4.33;
      if (it.frequency === 'daily') return acc + it.amount * 30;
      return acc;
    }, 0);

  const colorsPalette = ['#CEF04A', '#E07A5F', '#81B29A', '#F2CC8F', '#E76F51', '#262928'];
  const iconChoices = ['Cloud', 'Music', 'Tv', 'Dumbbell', 'Home'];

  return (
    <CozyModal
      visible={visible}
      onClose={() => {
        setMode('list');
        onClose();
      }}
      title={
        mode === 'create'
          ? 'Add Subscription'
          : mode === 'edit'
          ? 'Edit Subscription'
          : 'Recurring Bills'
      }
      subtitle={
        mode === 'list'
          ? `Total Active: $${totalMonthlySpend.toFixed(2)}/month`
          : 'Keep tabs on recurring renewals & automated charges'
      }
    >
      {mode === 'list' ? (
        <View style={styles.listContainer}>
          {/* Frequency Filters */}
          <View style={styles.filterRow}>
            {(['all', 'monthly', 'yearly', 'weekly'] as const).map((freq) => {
              const isSelected = filterFreq === freq;
              return (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected
                        ? colors.matchaLime
                        : isDark
                        ? colors.cardElevated
                        : colors.cardSecondary,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setFilterFreq(freq);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isSelected
                          ? '#141715'
                          : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Action Banner */}
          <TouchableOpacity
            style={[
              styles.addBanner,
              {
                backgroundColor: isDark ? colors.cardElevated : colors.cardSecondary,
                borderColor: isDark ? colors.borderSubtle : '#E5E7EB',
              },
            ]}
            onPress={startCreate}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.addIconWrap,
                { backgroundColor: colors.matchaLime },
              ]}
            >
              <Plus size={16} color="#141715" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.addBannerTitle, { color: colors.textPrimary }]}>
                Add New Subscription
              </Text>
              <Text style={[styles.addBannerSub, { color: colors.textMuted }]}>
                Track Netflix, Gym, Rent, or Hosting
              </Text>
            </View>
            <ArrowRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* List items */}
          <View style={styles.cardsWrap}>
            {filteredItems.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.recurringCard,
                  {
                    backgroundColor: isDark ? colors.cardElevated : colors.cardSecondary,
                    borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
                    opacity: item.active ? 1 : 0.6,
                  },
                ]}
              >
                <View
                  style={[
                    styles.itemIconBox,
                    { backgroundColor: item.color },
                  ]}
                >
                  {renderIcon(item.iconName, 18, '#141715')}
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.itemName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.itemAmount, { color: colors.textPrimary }]}>
                      ${item.amount.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText}>{item.frequency}</Text>
                    </View>
                    <Text style={[styles.nextBillingText, { color: colors.textMuted }]}>
                      Due: {item.nextBillingDate}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.itemActions}>
                  <Switch
                    value={item.active}
                    onValueChange={() => handleToggleActive(item.id)}
                    trackColor={{
                      false: isDark ? '#333835' : '#D1D5DB',
                      true: colors.matchaLime,
                    }}
                    thumbColor={item.active ? '#141715' : '#F9FAFB'}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <TouchableOpacity
                    onPress={() => startEdit(item)}
                    style={styles.actionMiniBtn}
                    activeOpacity={0.7}
                  >
                    <Edit2 size={15} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.name)}
                    style={styles.actionMiniBtn}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={15} color={colors.terracotta} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        /* Create / Edit Form */
        <View style={styles.formContainer}>
          {/* Name input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Subscription / Bill Name
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? colors.cardElevated : colors.cardSecondary,
                  borderColor: isDark ? colors.borderSubtle : '#E2E8F0',
                },
              ]}
            >
              <Tag size={16} color={colors.textMuted} style={styles.inputPrefixIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="e.g. Netflix, Studio Rent, Gym"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Amount input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Recurring Amount ($)
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? colors.cardElevated : colors.cardSecondary,
                  borderColor: isDark ? colors.borderSubtle : '#E2E8F0',
                },
              ]}
            >
              <DollarSign size={16} color={colors.textMuted} style={styles.inputPrefixIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="29.99"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Frequency picker */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Billing Cycle
            </Text>
            <View style={styles.freqRow}>
              {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map(
                (f) => {
                  const isSel = frequency === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.freqBtn,
                        {
                          backgroundColor: isSel
                            ? colors.matchaLime
                            : isDark
                            ? colors.cardElevated
                            : colors.cardSecondary,
                          borderColor: isSel ? colors.matchaLime : isDark ? colors.borderSubtle : '#E2E8F0',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setFrequency(f);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.freqBtnText,
                          {
                            color: isSel ? '#141715' : colors.textPrimary,
                            fontWeight: isSel ? '700' : '500',
                          },
                        ]}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>

          {/* Next Due Date & Status */}
          <View style={styles.rowTwoCols}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Next Billing Date
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? colors.cardElevated : colors.cardSecondary,
                    borderColor: isDark ? colors.borderSubtle : '#E2E8F0',
                  },
                ]}
              >
                <Calendar size={15} color={colors.textMuted} style={styles.inputPrefixIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="e.g. Oct 28, 2026"
                  placeholderTextColor={colors.textMuted}
                  value={nextBillingDate}
                  onChangeText={setNextBillingDate}
                />
              </View>
            </View>

            <View style={[styles.fieldGroup, { width: 100 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Active
              </Text>
              <View
                style={[
                  styles.toggleWrap,
                  {
                    backgroundColor: isDark ? colors.cardElevated : colors.cardSecondary,
                    borderColor: isDark ? colors.borderSubtle : '#E2E8F0',
                  },
                ]}
              >
                <Switch
                  value={active}
                  onValueChange={(val) => {
                    triggerHaptic();
                    setActive(val);
                  }}
                  trackColor={{
                    false: isDark ? '#333835' : '#D1D5DB',
                    true: colors.matchaLime,
                  }}
                  thumbColor={active ? '#141715' : '#F9FAFB'}
                />
              </View>
            </View>
          </View>

          {/* Color & Icon Presets */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Cozy Accent Color
            </Text>
            <View style={styles.colorSwatchesRow}>
              {colorsPalette.map((col) => {
                const isPicked = selectedColor === col;
                return (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: col },
                      isPicked && styles.colorCirclePicked,
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedColor(col);
                    }}
                    activeOpacity={0.8}
                  >
                    {isPicked && <Check size={14} color="#141715" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Icon
            </Text>
            <View style={styles.iconChoiceRow}>
              {iconChoices.map((ic) => {
                const isPicked = selectedIcon === ic;
                return (
                  <TouchableOpacity
                    key={ic}
                    style={[
                      styles.iconChoiceBtn,
                      {
                        backgroundColor: isPicked
                          ? colors.matchaLime
                          : isDark
                          ? colors.cardElevated
                          : colors.cardSecondary,
                        borderColor: isPicked ? colors.matchaLime : isDark ? colors.borderSubtle : '#E2E8F0',
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedIcon(ic);
                    }}
                    activeOpacity={0.8}
                  >
                    {renderIcon(ic, 18, isPicked ? '#141715' : colors.textPrimary)}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save & Cancel Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? colors.cardElevated : '#F3F4F6',
                },
              ]}
              onPress={() => setMode('list')}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.matchaLime },
              ]}
              onPress={handleSaveForm}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {mode === 'create' ? 'Create Subscription' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </CozyModal>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    gap: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
  },
  addBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  addIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  addBannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cardsWrap: {
    gap: 10,
    marginTop: 4,
  },
  recurringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  itemIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#6B7280',
  },
  nextBillingText: {
    fontSize: 12,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionMiniBtn: {
    padding: 6,
  },
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputPrefixIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleWrap: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqBtnText: {
    fontSize: 12,
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCirclePicked: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconChoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconChoiceBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.6,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141715',
  },
});
