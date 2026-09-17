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
import { CardMeshBackground, CardThemeVariant, ShapePatternType } from '../ui/CardMeshBackground';
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
  shapePattern?: ShapePatternType;
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
  { id: 'palmLeaf', label: 'Palm Leaf', previewColor: '#899D78' },
  { id: 'blueSlate', label: 'Blue Slate', previewColor: '#326273' },
  { id: 'tangerine', label: 'Tangerine', previewColor: '#E39774' },
  { id: 'oxidizedIron', label: 'Oxidized Iron', previewColor: '#B02E0C' },
  { id: 'obsidian', label: 'Obsidian Black', previewColor: '#020202' },
  { id: 'matchaLime', label: 'Matcha Lime', previewColor: '#CEF04A' },
  { id: 'terracotta', label: 'Terracotta', previewColor: '#E07A5F' },
  { id: 'mossSage', label: 'Moss Sage', previewColor: '#81B29A' },
];

const CURATED_AESTHETIC_PALETTES: [string, string, string][] = [
  ['#899D78', '#A2B591', '#4D5F3F'], // Palm Leaf Sage Frosted Glass
  ['#326273', '#487D91', '#1B3B47'], // Blue Slate Nordic Frost
  ['#E39774', '#F0B195', '#B55B32'], // Tangerine Glow Glass
  ['#B02E0C', '#D04620', '#631500'], // Oxidized Iron Velvet
  ['#181C1A', '#2E3531', '#020202'], // Obsidian Minimal Glass
  ['#536F63', '#799C8E', '#2B3C35'], // Deep Pine Fog Glass
  ['#3E5968', '#5E7F91', '#1F3440'], // Pacific Slate Glass
  ['#D48B6A', '#EBB096', '#944728'], // Warm Terracotta Dawn
  ['#688A6F', '#8FB096', '#3E5743'], // Matcha Eucalyptus Frost
  ['#222B29', '#3D4D48', '#0E1312'], // Smoked Carbon Glass
  ['#7A6F5D', '#A19480', '#4A4134'], // Khaki Linen Glass
  ['#3D6B78', '#6398A8', '#21424C'], // Polar Ice Glass
];

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
    initialData ? initialData.variant : 'palmLeaf'
  );
  const [customGradient, setCustomGradient] = useState<[string, string, string] | undefined>(
    initialData?.customGradient
  );
  const [shapePattern, setShapePattern] = useState<ShapePatternType>(
    initialData?.shapePattern || 'waves'
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
    setVariant(initialData ? initialData.variant : 'palmLeaf');
    setCustomGradient(initialData?.customGradient);
    setShapePattern(initialData?.shapePattern || 'waves');
    setErrorMessage('');
  }

  const generateRandomColors = () => {
    triggerHaptic('medium');

    // Pick from aesthetic harmonious palettes inspired by the 5-tone palette
    const randomIndex = Math.floor(Math.random() * CURATED_AESTHETIC_PALETTES.length);
    const selectedPalette = CURATED_AESTHETIC_PALETTES[randomIndex];

    const shapeOptions: ShapePatternType[] = ['waves', 'orbs', 'geometry', 'arcs', 'ribbons'];
    const nextShape = shapeOptions[Math.floor(Math.random() * shapeOptions.length)];

    setCustomGradient(selectedPalette);
    setShapePattern(nextShape);
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
      shapePattern: variant === 'custom' ? shapePattern : undefined,
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
          <CardMeshBackground
            variant={variant}
            customGradient={customGradient}
            shapePattern={shapePattern}
            borderRadius={24}
          />

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
