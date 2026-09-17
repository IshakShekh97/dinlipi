import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Coins } from 'lucide-react-native';
import { CozyModal } from '../ui/CozyModal';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { SUPPORTED_CURRENCIES, CurrencyOption } from '../../utils/currency';
import { useUIStore } from '../../store/ui-store';
import { updateUserCurrency } from '../../db/queries';

interface CurrencyPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useAppTheme();
  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const setActiveCurrency = useUIStore((state) => state.setActiveCurrency);

  const handleSelect = async (curr: CurrencyOption) => {
    triggerHaptic('success');
    setActiveCurrency(curr.display);
    await updateUserCurrency(curr.display);
    onClose();
  };

  return (
    <CozyModal
      visible={visible}
      onClose={onClose}
      title="Primary Currency"
      subtitle="Select the currency symbol for your offline ledger"
      icon={<Coins size={18} color={colors.accentPrimary} />}
    >
      <View style={styles.container}>
        {SUPPORTED_CURRENCIES.map((curr) => {
          const isSelected =
            activeCurrency === curr.display ||
            activeCurrency.startsWith(curr.symbol) ||
            activeCurrency.includes(curr.code);

          return (
            <TouchableOpacity
              key={curr.code}
              onPress={() => handleSelect(curr)}
              style={[
                styles.itemRow,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(206, 240, 74, 0.12)'
                      : 'rgba(206, 240, 74, 0.2)'
                    : colors.cardSecondary,
                  borderColor: isSelected ? colors.matchaLime : colors.borderSubtle,
                },
              ]}
              activeOpacity={0.75}
            >
              <View className="flex-row items-center gap-3.5">
                {/* Symbol Chip */}
                <View
                  style={[
                    styles.symbolBadge,
                    {
                      backgroundColor: isSelected
                        ? colors.matchaLime
                        : isDark
                        ? '#242725'
                        : '#EDEDE8',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.symbolText,
                      { color: isSelected ? '#121413' : colors.textPrimary },
                    ]}
                  >
                    {curr.symbol}
                  </Text>
                </View>

                {/* Currency details */}
                <View>
                  <View className="flex-row items-center gap-2">
                    <Text
                      style={[
                        styles.currencyLabel,
                        { color: colors.textPrimary, fontWeight: isSelected ? '800' : '700' },
                      ]}
                    >
                      {curr.label}
                    </Text>
                    {curr.code === 'INR' && (
                      <View
                        style={{
                          backgroundColor: 'rgba(206, 240, 74, 0.2)',
                          borderColor: 'rgba(206, 240, 74, 0.4)',
                        }}
                        className="px-2 py-0.5 rounded-full border"
                      >
                        <Text
                          style={{ color: colors.matchaLime }}
                          className="text-[10px] font-black tracking-wider"
                        >
                          DEFAULT
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.codeText, { color: colors.textSecondary }]}>
                    {curr.display}
                  </Text>
                </View>
              </View>

              {isSelected && (
                <View
                  style={[
                    styles.checkBadge,
                    { backgroundColor: colors.matchaLime },
                  ]}
                >
                  <Check size={14} color="#121413" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </CozyModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  symbolBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 18,
    fontWeight: '900',
  },
  currencyLabel: {
    fontSize: 15,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
