import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Tag, Sparkles } from 'lucide-react-native';
import { CozyModal } from '../ui/CozyModal';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';

export interface QuickEntryData {
  id?: string;
  title: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  category?: string;
  channel?: 'Cash' | 'UPI' | 'Bank';
}

interface QuickEntryModalProps {
  visible: boolean;
  type: 'expense' | 'income' | 'transfer';
  onClose: () => void;
  onSave: (entry: QuickEntryData) => void;
  initialData?: QuickEntryData | null;
  currencySymbol?: string;
}

const CHANNELS: ('Cash' | 'UPI' | 'Bank')[] = ['Cash', 'UPI', 'Bank'];

export function QuickEntryModal({
  visible,
  type,
  onClose,
  onSave,
  initialData,
  currencySymbol: propCurrencySymbol,
}: QuickEntryModalProps) {
  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const currencySymbol = propCurrencySymbol || getCurrencySymbol(activeCurrency);

  const titleText = initialData
    ? 'Edit Ledger Entry'
    : type === 'income'
    ? 'Add Deposit / Income'
    : type === 'transfer'
    ? 'Record Transfer'
    : 'Add Expense / Withdrawal';

  return (
    <CozyModal
      visible={visible}
      onClose={onClose}
      title={titleText}
      subtitle="Dynamic entry saved into your offline SQLite database"
    >
      {visible ? (
        <QuickEntryForm
          key={initialData?.id || 'new_entry'}
          type={type}
          initialData={initialData}
          currencySymbol={currencySymbol}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </CozyModal>
  );
}

interface QuickEntryFormProps {
  type: 'expense' | 'income' | 'transfer';
  initialData?: QuickEntryData | null;
  currencySymbol: string;
  onClose: () => void;
  onSave: (entry: QuickEntryData) => void;
}

function QuickEntryForm({
  type,
  initialData,
  currencySymbol,
  onClose,
  onSave,
}: QuickEntryFormProps) {
  const { colors, isDark } = useAppTheme();

  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  const [channel, setChannel] = useState<'Cash' | 'UPI' | 'Bank'>(initialData?.channel || 'Cash');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setErrorMessage('Please enter a description for this entry.');
      triggerHaptic('warning');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount.');
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('success');
    onSave({
      id: initialData?.id,
      title: title.trim(),
      amount: parsedAmount,
      type: initialData ? initialData.type : type,
      category: initialData?.category || (type === 'income' ? 'Income' : 'General'),
      channel,
    });

    onClose();
  };

  return (
    <View style={styles.entryForm}>
        {/* Error message banner */}
        {errorMessage ? (
          <View
            style={{
              backgroundColor: 'rgba(224, 122, 95, 0.15)',
              borderColor: 'rgba(224, 122, 95, 0.35)',
            }}
            className="p-3 rounded-2xl border mb-3"
          >
            <Text style={{ color: '#E07A5F' }} className="text-xs font-bold text-center">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Description *
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#F7F7F4',
                borderColor: isDark ? colors.borderSubtle : '#E5E7EB',
              },
            ]}
          >
            <Tag size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="e.g. Chai, Groceries, Monthly Rent"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary }]}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Amount ({currencySymbol}) *
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#F7F7F4',
                borderColor: isDark ? colors.borderSubtle : '#E5E7EB',
              },
            ]}
          >
            <Text
              style={{
                color: colors.matchaLime,
                fontSize: 18,
                fontWeight: '900',
                marginRight: 8,
              }}
            >
              {currencySymbol}
            </Text>
            <TextInput
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary }]}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Payment Mode (Channel) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Payment Channel
          </Text>
          <View className="flex-row items-center gap-2">
            {CHANNELS.map((ch) => {
              const isSelected = channel === ch;
              return (
                <TouchableOpacity
                  key={ch}
                  onPress={() => {
                    triggerHaptic('light');
                    setChannel(ch);
                  }}
                  style={{
                    backgroundColor: isSelected
                      ? colors.matchaLime
                      : isDark
                      ? colors.cardSecondary
                      : '#F7F7F4',
                    borderColor: isSelected
                      ? colors.matchaLime
                      : isDark
                      ? colors.borderSubtle
                      : '#E5E7EB',
                  }}
                  className="flex-1 h-11 rounded-2xl border items-center justify-center active:opacity-75"
                  activeOpacity={0.75}
                >
                  <Text
                    style={{
                      color: isSelected ? '#141715' : colors.textPrimary,
                      fontWeight: isSelected ? '900' : '600',
                    }}
                    className="text-xs"
                  >
                    {ch}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveBtn,
            {
              backgroundColor: colors.matchaLime,
              shadowColor: '#000',
              shadowOpacity: 0.15,
            },
          ]}
          activeOpacity={0.85}
        >
          <Sparkles size={16} color="#141715" />
          <Text style={styles.saveBtnText}>
            {initialData ? 'Update Entry' : 'Record Transaction'}
          </Text>
        </TouchableOpacity>
      </View>
    );
}

const styles = StyleSheet.create({
  entryForm: {
    paddingBottom: 24,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#141715',
    letterSpacing: -0.2,
  },
});
