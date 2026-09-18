import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import {
  CreditCard,
  Check,
  Wifi,
  Sparkles,
  Trash2,
  Shuffle,
  Layers,
} from 'lucide-react-native';
import { CozyModal } from '../ui/CozyModal';
import { CardMeshBackground, CardThemeVariant, ShapePatternType } from '../ui/CardMeshBackground';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic, FONTS } from '../../constants/theme';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';
import {
  CURATED_MESH_PRESETS,
  generateRandomMeshPalette,
  generateRandomVibrantGradient,
  generateRandomShapeOnly,
  ALL_SHAPE_PATTERNS,
  getHexLuminance,
} from '../../utils/meshGenerator';

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
  onDelete?: (cardId: string) => void;
  initialData?: BudgetCardData | null;
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

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('2000');
  const [cardType, setCardType] = useState('Vault');
  const [holder, setHolder] = useState('Cardholder');
  const [variant, setVariant] = useState<CardThemeVariant>('tangerineAurora');
  const [customGradient, setCustomGradient] = useState<[string, string, string] | undefined>(undefined);
  const [shapePattern, setShapePattern] = useState<ShapePatternType>('aurora');
  const [randomPaletteName, setRandomPaletteName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state whenever visible toggles or initialData changes
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (initialData) {
          setName(initialData.name);
          setLimit(initialData.limit.toString());
          setCardType(initialData.cardType);
          setHolder(initialData.holder);
          setVariant(initialData.variant);
          setCustomGradient(initialData.customGradient);
          setShapePattern(initialData.shapePattern || 'aurora');
          setRandomPaletteName('');
          setErrorMessage('');
        } else {
          // Reset all form inputs to clean default values for new budget card creation
          setName('');
          setLimit('2000');
          setCardType('Vault');
          setHolder('Cardholder');
          setVariant('tangerineAurora');
          setCustomGradient(undefined);
          setShapePattern('aurora');
          setRandomPaletteName('');
          setErrorMessage('');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [visible, initialData]);

  // Full-spectrum vibrant color generator
  const handleGenerateRandomColors = () => {
    triggerHaptic('medium');
    const result = generateRandomVibrantGradient();
    setCustomGradient(result.gradient);
    setVariant('custom');
    setRandomPaletteName(result.name);
  };

  // Random shape pattern generator
  const handleGenerateRandomShape = () => {
    triggerHaptic('light');
    const newShape = generateRandomShapeOnly();
    setShapePattern(newShape);
    if (!customGradient) {
      const currentPreset = CURATED_MESH_PRESETS.find((p) => p.id === variant);
      setCustomGradient(currentPreset ? currentPreset.gradient : generateRandomVibrantGradient().gradient);
      setVariant('custom');
    }
  };

  // Algorithmic Random Mesh Palette Generator (Color + Shape)
  const handleGenerateRandomPalette = () => {
    triggerHaptic('medium');
    const result = generateRandomMeshPalette();
    setCustomGradient(result.gradient);
    setShapePattern(result.shape);
    setVariant('custom');
    setRandomPaletteName(result.name);
  };

  // Select specific shape directly
  const handleSelectShape = (shape: ShapePatternType) => {
    triggerHaptic('light');
    setShapePattern(shape);
    if (!customGradient) {
      const currentPreset = CURATED_MESH_PRESETS.find((p) => p.id === variant);
      setCustomGradient(currentPreset ? currentPreset.gradient : generateRandomVibrantGradient().gradient);
      setVariant('custom');
    }
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
    useUIStore.getState().triggerConfetti();

    // Reset inputs so next creation starts completely clean
    setName('');
    setLimit('2000');
    setCardType('Vault');
    setHolder('Cardholder');
    setVariant('tangerineAurora');
    setCustomGradient(undefined);
    setShapePattern('aurora');
    setRandomPaletteName('');
    setErrorMessage('');
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

  // Determine optimal card text contrast
  const isLightText = customGradient
    ? getHexLuminance(customGradient[0]) < 140
    : variant !== 'porcelain';
  const cardTextColor = isLightText ? '#FFFFFF' : '#020202';
  const cardSubTextColor = isLightText ? 'rgba(255, 255, 255, 0.72)' : 'rgba(2, 2, 2, 0.65)';

  return (
    <CozyModal
      visible={visible}
      onClose={onClose}
      title={initialData ? 'Customize Budget Card' : 'New Budget Card'}
      subtitle="Design your card & set envelope limit"
      icon={<CreditCard size={18} color={colors.tangerineDream} />}
      headerRight={
        initialData && onDelete ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={[
              styles.deleteIconBtn,
              {
                backgroundColor: 'rgba(176, 46, 12, 0.15)',
                borderColor: 'rgba(176, 46, 12, 0.3)',
              },
            ]}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={colors.oxidizedIron} />
          </TouchableOpacity>
        ) : null
      }
    >
      {/* Live Interactive Card Preview matching Mockup 2 & 4 */}
      <View style={styles.previewContainer}>
        <View style={[styles.cardPreview, { borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)' }]}>
          <CardMeshBackground
            variant={variant}
            customGradient={customGradient}
            shapePattern={shapePattern}
            borderRadius={26}
          />

          {/* Card Header: Type Badge, Mastercard Circles, Wifi */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {/* Mastercard circles indicator from Mockup 2 */}
              <View style={styles.mastercardBadge}>
                <View style={[styles.mastercardCircle, { backgroundColor: '#EB001B', zIndex: 1 }]} />
                <View style={[styles.mastercardCircle, { backgroundColor: '#FF5F00', marginLeft: -8, zIndex: 2 }]} />
              </View>
              <Text style={{ color: cardTextColor, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>
                {cardType}
              </Text>
            </View>
            <Wifi size={18} color={cardTextColor} />
          </View>

          {/* Card Center - Budget Limit & Envelope Title */}
          <View className="my-2">
            <Text style={{ color: cardSubTextColor, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {name.trim() || 'Budget Envelope'}
            </Text>
            <Text style={{ color: cardTextColor, fontSize: 26, fontWeight: '900', letterSpacing: -0.6 }}>
              {currencySymbol}{(parseFloat(limit) || 0).toLocaleString()}
            </Text>
          </View>

          {/* Card Footer: Holder, Expiry & Chip */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: cardTextColor, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {holder}
              </Text>
              <Text style={{ color: cardSubTextColor, fontSize: 10, fontWeight: '600' }}>
                Monthly Envelope
              </Text>
            </View>
            {/* Minimal EMV Chip simulator */}
            <View style={styles.emvChip} />
          </View>
        </View>
      </View>

      {/* Validation Error */}
      {errorMessage ? (
        <View
          style={{
            backgroundColor: 'rgba(176, 46, 12, 0.15)',
            borderColor: 'rgba(176, 46, 12, 0.35)',
          }}
          className="p-3 rounded-2xl border mb-3"
        >
          <Text style={{ color: colors.oxidizedIron }} className="text-xs font-bold text-center">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Section Header: Mesh Backdrop Palette & Multi-Generator Controls */}
      <View style={{ marginTop: 10, marginBottom: 6 }}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 0, marginBottom: 2 }]}>
          Generative Mesh Card Design
        </Text>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          Full-spectrum multi-tone glass gradients & dynamic vector shapes
        </Text>

        {/* 3 Dedicated Random Generator Buttons */}
        <View style={styles.generatorButtonsRow}>
          <TouchableOpacity
            onPress={handleGenerateRandomColors}
            style={[
              styles.generatorBtn,
              {
                backgroundColor: isDark ? 'rgba(227, 151, 116, 0.16)' : 'rgba(227, 151, 116, 0.22)',
                borderColor: colors.tangerineDream,
              },
            ]}
            activeOpacity={0.75}
          >
            <Sparkles size={12} color={colors.tangerineDream} />
            <Text style={[styles.generatorBtnText, { color: colors.tangerineDream }]}>
              Random Color
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGenerateRandomShape}
            style={[
              styles.generatorBtn,
              {
                backgroundColor: isDark ? 'rgba(92, 118, 141, 0.18)' : 'rgba(92, 118, 141, 0.16)',
                borderColor: colors.textSecondary,
              },
            ]}
            activeOpacity={0.75}
          >
            <Layers size={12} color={colors.textSecondary} />
            <Text style={[styles.generatorBtnText, { color: colors.textSecondary }]}>
              Random Shape
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGenerateRandomPalette}
            style={[
              styles.generatorBtn,
              {
                backgroundColor: isDark ? 'rgba(137, 157, 120, 0.18)' : 'rgba(137, 157, 120, 0.20)',
                borderColor: colors.palmLeaf,
              },
            ]}
            activeOpacity={0.75}
          >
            <Shuffle size={12} color={colors.palmLeaf} />
            <Text style={[styles.generatorBtnText, { color: colors.palmLeaf }]}>
              Surprise Me
            </Text>
          </TouchableOpacity>
        </View>

        {/* Shape Pattern Selection Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shapeChipsScroll}
        >
          {ALL_SHAPE_PATTERNS.map((pattern) => {
            const isSelected = shapePattern === pattern.id;
            return (
              <TouchableOpacity
                key={pattern.id}
                onPress={() => handleSelectShape(pattern.id)}
                style={[
                  styles.shapeChip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(227, 151, 116, 0.25)'
                        : 'rgba(227, 151, 116, 0.22)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : '#FFFFFF',
                    borderColor: isSelected
                      ? colors.tangerineDream
                      : isDark
                      ? 'rgba(255, 255, 255, 0.10)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.shapeChipText,
                    {
                      color: isSelected ? colors.tangerineDream : colors.textMuted,
                      fontFamily: isSelected ? FONTS.sansBold : FONTS.sansMedium,
                    },
                  ]}
                >
                  {pattern.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Random Palette Active Status Banner */}
      {customGradient && (
        <View
          style={[
            styles.customPaletteBanner,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F8F9',
              borderColor: colors.tangerineDream,
            },
          ]}
        >
          <View className="flex-row items-center gap-2">
            <Layers size={14} color={colors.tangerineDream} />
            <Text style={[styles.customBannerTitle, { color: colors.textPrimary }]}>
              {randomPaletteName || 'Custom Mesh'}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'capitalize' }}>
              ({shapePattern})
            </Text>
          </View>

          {/* Color swatches preview */}
          <View className="flex-row items-center gap-1.5">
            {customGradient.map((hex, i) => (
              <View
                key={`custom-stop-${i}`}
                style={[styles.colorDot, { backgroundColor: hex }]}
              />
            ))}
            <TouchableOpacity
              onPress={handleGenerateRandomPalette}
              style={styles.rerollBtn}
              activeOpacity={0.7}
            >
              <Shuffle size={12} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Curated Pre-Built Mesh Presets Heading */}
      <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 4, marginBottom: 6 }]}>
        Curated Presets
      </Text>

      {/* Curated Pre-Built Mesh Backdrop Swatches */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.meshSwatchesScroll}
      >
        {CURATED_MESH_PRESETS.map((preset) => {
          const isSelected = variant === preset.id && !customGradient;
          const [c1, c2, c3] = preset.gradient;

          return (
            <TouchableOpacity
              key={preset.id}
              onPress={() => {
                triggerHaptic('light');
                setVariant(preset.id);
                setShapePattern(preset.shape);
                setCustomGradient(undefined);
                setRandomPaletteName('');
              }}
              style={[
                styles.meshSwatchCard,
                {
                  borderColor: isSelected ? colors.tangerineDream : isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)',
                  borderWidth: isSelected ? 2 : 1,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                },
              ]}
              activeOpacity={0.8}
            >
              {/* Mini SVG Mesh Gradient */}
              <View style={styles.miniMeshPreview}>
                <Svg width="100%" height="100%" viewBox="0 0 60 40">
                  <Defs>
                    <LinearGradient id={`presetGrad-${preset.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={c1} />
                      <Stop offset="50%" stopColor={c2} />
                      <Stop offset="100%" stopColor={c3} />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="60" height="40" rx="8" fill={`url(#presetGrad-${preset.id})`} />
                </Svg>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.meshSwatchLabel,
                  {
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Card Details Inputs */}
      <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>
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
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F4F7F9',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F4F7F9',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F4F7F9',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
        placeholder="e.g. Vault, Property, Emergency, Savings"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.textInput,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F4F7F9',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            color: colors.textPrimary,
          },
        ]}
        returnKeyType="done"
      />
      <View style={styles.tagRow}>
        {['Vault', 'Property', 'Reserve', 'Savings', 'Mastercard'].map((tag) => {
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
                    ? colors.blueSlate
                    : isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : '#EDF2F5',
                  borderColor: isSelected
                    ? colors.blueSlate
                    : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: isSelected ? '800' : '600',
                  color: isSelected ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center gap-3 mt-2">
        {initialData && onDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            style={[
              styles.deleteButton,
              {
                backgroundColor: 'rgba(176, 46, 12, 0.15)',
                borderColor: 'rgba(176, 46, 12, 0.3)',
              },
            ]}
            activeOpacity={0.8}
          >
            <Trash2 size={18} color={colors.oxidizedIron} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveButton,
            {
              backgroundColor: isDark ? colors.tangerineDream : colors.black,
              flex: 1,
            },
          ]}
          activeOpacity={0.85}
        >
          <Sparkles size={16} color={isDark ? '#020202' : '#FFFFFF'} />
          <Text style={[styles.saveButtonText, { color: isDark ? '#020202' : '#FFFFFF' }]}>
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
    marginVertical: 8,
  },
  cardPreview: {
    width: '100%',
    height: 165,
    borderRadius: 26,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  mastercardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 28,
  },
  mastercardCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.9,
  },
  emvChip: {
    width: 26,
    height: 20,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  generatorButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  generatorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  generatorBtnText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  shapeChipsScroll: {
    gap: 6,
    paddingVertical: 4,
    marginBottom: 8,
  },
  shapeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  shapeChipText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  randomBtnText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  customPaletteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  customBannerTitle: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  rerollBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 4,
  },
  meshSwatchesScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  meshSwatchCard: {
    width: 90,
    padding: 6,
    borderRadius: 14,
    alignItems: 'center',
  },
  miniMeshPreview: {
    width: 76,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 6,
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(2, 2, 2, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meshSwatchLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  textInput: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: FONTS.sansMedium,
    borderWidth: 1,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.2,
  },
  deleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
