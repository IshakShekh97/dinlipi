import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CreditCard, Check, Wifi, Sparkles, Trash2, Shuffle } from 'lucide-react-native';
import { CozyModal } from '../ui/CozyModal';
import { CardMeshBackground, CardThemeVariant } from '../ui/CardMeshBackground';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';

export interface BudgetCardData {
  id: string;
  name: string;
  cardType: string;
  limit: number;
  spent: number;
  cardNum: string;
  holder: string;
  expiry: string;
  variant: CardThemeVariant;
  customGradient?: [string, string, string];
  tabLabel?: string;
}

interface BudgetCardModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (card: BudgetCardData) => void;
  onDelete?: (id: string) => void;
  initialData?: BudgetCardData | null;
}

const BACKDROP_THEMES: { id: CardThemeVariant; label: string; previewColor: string }[] = [
  { id: 'matchaLime', label: 'Matcha Lime', previewColor: '#CEF04A' },
  { id: 'terracotta', label: 'Terracotta', previewColor: '#E07A5F' },
  { id: 'mossSage', label: 'Moss Sage', previewColor: '#81B29A' },
  { id: 'goldenHoney', label: 'Golden Honey', previewColor: '#F2CC8F' },
  { id: 'darkGraphite', label: 'Graphite', previewColor: '#262928' },
  { id: 'porcelain', label: 'Porcelain', previewColor: '#F4F4EE' },
];

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function getHexLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 128;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export const BudgetCardModal: React.FC<BudgetCardModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const { colors, isDark } = useAppTheme();
  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const showConfirm = useUIStore((state) => state.showConfirmDialog);
  const currencySymbol = getCurrencySymbol(activeCurrency);

  const [name, setName] = useState(initialData ? initialData.name : '');
  const [limit, setLimit] = useState(initialData ? initialData.limit.toString() : '2000');
  const [cardType, setCardType] = useState(initialData ? initialData.cardType : 'Vault');
  const [holder, setHolder] = useState(initialData ? initialData.holder : 'Cardholder');
  const [variant, setVariant] = useState<CardThemeVariant>(
    initialData ? initialData.variant : 'matchaLime'
  );
  const [customGradient, setCustomGradient] = useState<[string, string, string] | undefined>(
    initialData?.customGradient
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [prevData, setPrevData] = useState(initialData);

  // Sync state if initialData changed
  if (initialData !== prevData) {
    setPrevData(initialData);
    setName(initialData ? initialData.name : '');
    setLimit(initialData ? initialData.limit.toString() : '2000');
    setCardType(initialData ? initialData.cardType : 'Vault');
    setHolder(initialData ? initialData.holder : 'Cardholder');
    setVariant(initialData ? initialData.variant : 'matchaLime');
    setCustomGradient(initialData?.customGradient);
    setErrorMessage('');
  }

  const generateRandomColors = () => {
    triggerHaptic('medium');
    const h1 = Math.floor(Math.random() * 360);
    const s1 = Math.floor(65 + Math.random() * 25);
    const l1 = Math.floor(40 + Math.random() * 24);

    const h2 = (h1 + 35 + Math.floor(Math.random() * 40)) % 360;
    const s2 = Math.floor(60 + Math.random() * 25);
    const l2 = Math.floor(38 + Math.random() * 24);

    const h3 = (h1 + 175 + Math.floor(Math.random() * 40)) % 360;
    const s3 = Math.floor(55 + Math.random() * 25);
    const l3 = Math.floor(32 + Math.random() * 24);

    const newGradient: [string, string, string] = [
      hslToHex(h1, s1, l1),
      hslToHex(h2, s2, l2),
      hslToHex(h3, s3, l3),
    ];
    setCustomGradient(newGradient);
    setVariant('custom');
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('Please give your budget envelope card a title.');
      triggerHaptic('warning');
      return;
    }

    const numLimit = parseFloat(limit) || 1000;
    triggerHaptic('success');

    const cardPayload: BudgetCardData = {
      id: initialData ? initialData.id : `card-${Date.now()}`,
      name: name.trim(),
      cardType: cardType.trim() || 'Vault',
      limit: numLimit,
      spent: initialData ? initialData.spent : 0,
      cardNum: initialData ? initialData.cardNum : `**** ${Math.floor(1000 + Math.random() * 9000)}`,
      holder: holder.trim() || 'Valued Member',
      expiry: initialData ? initialData.expiry : '12/28',
      variant,
      customGradient: variant === 'custom' ? customGradient : undefined,
      tabLabel: name.trim().slice(0, 10),
    };

    onSave(cardPayload);
    onClose();
  };

  const handleDelete = () => {
    if (!initialData || !onDelete) return;
    triggerHaptic('warning');
    showConfirm({
      title: 'Delete Budget Card',
      message: `Are you sure you want to remove "${initialData.name}"? Transactions associated with this envelope will remain in your ledger.`,
      confirmText: 'Delete Card',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        onDelete(initialData.id);
        onClose();
      },
    });
  };

  const isLightText = customGradient
    ? getHexLuminance(customGradient[0]) < 135
    : variant === 'darkGraphite' || variant === 'terracotta' || variant === 'mossSage';
  const cardTextColor = isLightText ? '#FFFFFF' : '#141715';
  const cardSubTextColor = isLightText ? 'rgba(255,255,255,0.7)' : 'rgba(20,23,21,0.65)';

  return (
    <CozyModal
      visible={visible}
      onClose={onClose}
      title={initialData ? 'Customize Budget Card' : 'New Budget Card'}
      subtitle="Design your card & set envelope limit"
      icon={<CreditCard size={18} color={colors.accentPrimary} />}
      headerRight={
        initialData && onDelete ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(224, 122, 95, 0.15)',
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color="#E07A5F" />
          </TouchableOpacity>
        ) : null
      }
    >
      {/* Live Interactive Card Preview */}
      <View style={styles.previewContainer}>
        <View style={[styles.cardPreview, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
          <CardMeshBackground variant={variant} customGradient={customGradient} borderRadius={24} />

          {/* Card Header */}
          <View className="flex-row items-center justify-between">
            <Text style={{ color: cardTextColor, fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>
              {cardType}
            </Text>
            <Wifi size={18} color={cardTextColor} />
          </View>

          {/* Card Center - Budget Limit */}
          <View className="my-3">
            <Text style={{ color: cardSubTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
              {name.trim() || 'Budget Envelope'}
            </Text>
            <Text style={{ color: cardTextColor, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
              {currencySymbol}{(parseFloat(limit) || 0).toLocaleString()}
            </Text>
          </View>

          {/* Card Footer */}
          <View className="flex-row items-center justify-between">
            <Text style={{ color: cardTextColor, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              {holder}
            </Text>
            <Text style={{ color: cardSubTextColor, fontSize: 11, fontWeight: '600' }}>
              02/28
            </Text>
          </View>
        </View>
      </View>

      {/* Validation Error */}
      {errorMessage ? (
        <View
          style={{
            backgroundColor: 'rgba(224, 122, 95, 0.15)',
            borderColor: 'rgba(224, 122, 95, 0.35)',
          }}
          className="p-3 rounded-2xl border mb-2"
        >
          <Text style={{ color: '#E07A5F' }} className="text-xs font-bold text-center">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Backdrop Themes & Random Color Generator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 }}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 0, marginBottom: 0 }]}>
          Backdrop Palette
        </Text>
        <TouchableOpacity
          onPress={generateRandomColors}
          style={[
            styles.randomBtn,
            {
              backgroundColor: isDark ? 'rgba(206, 240, 74, 0.14)' : 'rgba(206, 240, 74, 0.2)',
              borderColor: colors.matchaLime,
            },
          ]}
          activeOpacity={0.75}
        >
          <Shuffle size={12} color={colors.textPrimary} />
          <Text style={[styles.randomBtnText, { color: colors.textPrimary }]}>
            Random Palette
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.swatchGrid}>
        {BACKDROP_THEMES.map((theme) => {
          const isSelected = variant === theme.id && !customGradient;
          return (
            <TouchableOpacity
              key={theme.id}
              onPress={() => {
                triggerHaptic('light');
                setVariant(theme.id);
                setCustomGradient(undefined);
              }}
              style={[
                styles.swatchItem,
                {
                  backgroundColor: theme.previewColor,
                  borderColor: isSelected ? colors.matchaLime : 'transparent',
                },
              ]}
              activeOpacity={0.8}
            >
              {isSelected && (
                <Check
                  size={18}
                  color={theme.id === 'matchaLime' || theme.id === 'goldenHoney' || theme.id === 'porcelain' ? '#141715' : '#FFFFFF'}
                  strokeWidth={3}
                />
              )}
            </TouchableOpacity>
          );
        })}
        {customGradient && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setVariant('custom');
            }}
            style={[
              styles.swatchItem,
              {
                backgroundColor: customGradient[0],
                borderColor: colors.matchaLime,
                borderWidth: 2.5,
              },
            ]}
            activeOpacity={0.8}
          >
            <Check size={18} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Card Details Inputs */}
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        Envelope / Card Title *
      </Text>
      <TextInput
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (errorMessage) setErrorMessage('');
        }}
        placeholder="e.g. Daily Spending / Groceries Vault"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.textInput,
          {
            backgroundColor: isDark ? colors.cardSecondary : '#F7F7F4',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: colors.textPrimary,
          },
        ]}
        returnKeyType="next"
      />

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        Budget Limit ({currencySymbol}) *
      </Text>
      <TextInput
        value={limit}
        onChangeText={setLimit}
        placeholder="2000"
        keyboardType="numeric"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.textInput,
          {
            backgroundColor: isDark ? colors.cardSecondary : '#F7F7F4',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: colors.textPrimary,
          },
        ]}
        returnKeyType="next"
      />

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        Cardholder / Alias Name
      </Text>
      <TextInput
        value={holder}
        onChangeText={setHolder}
        placeholder="Valued Member"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.textInput,
          {
            backgroundColor: isDark ? colors.cardSecondary : '#F7F7F4',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: colors.textPrimary,
          },
        ]}
        returnKeyType="next"
      />

      {/* Custom User-Entered Card Network / Label */}
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        Card Network / Account Label *
      </Text>
      <TextInput
        value={cardType}
        onChangeText={setCardType}
        placeholder="e.g. Vault, Personal Property, Emergency Reserve"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.textInput,
          {
            backgroundColor: isDark ? colors.cardSecondary : '#F7F7F4',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: colors.textPrimary,
          },
        ]}
        returnKeyType="done"
      />
      <View style={styles.tagRow}>
        {['Vault', 'Personal Property', 'Reserve', 'Savings'].map((tag) => {
          const isSelected = cardType.toLowerCase() === tag.toLowerCase();
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => {
                triggerHaptic('light');
                setCardType(tag);
              }}
              style={[
                styles.tagChip,
                {
                  backgroundColor: isSelected
                    ? colors.matchaLime
                    : isDark
                    ? colors.cardSecondary
                    : '#F4F4F0',
                  borderColor: isSelected
                    ? colors.matchaLime
                    : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: isSelected ? '800' : '600',
                  color: isSelected ? '#141715' : colors.textSecondary,
                }}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center gap-3">
        {initialData && onDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            style={[
              styles.deleteButton,
              {
                backgroundColor: 'rgba(224, 122, 95, 0.15)',
                borderColor: 'rgba(224, 122, 95, 0.3)',
              },
            ]}
            activeOpacity={0.8}
          >
            <Trash2 size={18} color="#E07A5F" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveButton,
            {
              backgroundColor: isDark ? '#CEF04A' : '#141715',
              flex: 1,
            },
          ]}
          activeOpacity={0.85}
        >
          <Sparkles size={16} color={isDark ? '#141715' : '#FFFFFF'} />
          <Text style={[styles.saveButtonText, { color: isDark ? '#141715' : '#FFFFFF' }]}>
            {initialData ? 'Update Budget Card' : 'Create Budget Card'}
          </Text>
        </TouchableOpacity>
      </View>
    </CozyModal>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  cardPreview: {
    width: '100%',
    height: 155,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  swatchGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  swatchItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  textInput: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    marginBottom: 4,
  },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  randomBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  saveButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
});
