import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Tag, Sparkles, Calendar, CreditCard, Check } from 'lucide-react-native';
import { CozyModal } from '../ui/CozyModal';
import { CalendarPickerModal } from '../ui/CalendarPickerModal';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic, FONTS } from '../../constants/theme';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';
import { BudgetCardData } from '../cards/BudgetCardModal';

export interface QuickEntryData {
  id?: string;
  title: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  category?: string;
  channel?: 'Cash' | 'UPI' | 'Bank';
  date?: string;
  cardId?: string;
}

interface QuickEntryModalProps {
  visible: boolean;
  type: 'expense' | 'income' | 'transfer';
  onClose: () => void;
  onSave: (entry: QuickEntryData) => void;
  initialData?: QuickEntryData | null;
  currencySymbol?: string;
  cards?: BudgetCardData[];
  onCreateBudget?: () => void;
}

const CHANNELS: ('Cash' | 'UPI' | 'Bank')[] = ['Cash', 'UPI', 'Bank'];

export function QuickEntryModal({
  visible,
  type,
  onClose,
  onSave,
  initialData,
  currencySymbol: propCurrencySymbol,
  cards = [],
  onCreateBudget,
}: QuickEntryModalProps) {
  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const currencySymbol = propCurrencySymbol || getCurrencySymbol(activeCurrency);
  const [formKey, setFormKey] = useState(0);

  // When opening modal, increment form key to force fresh reset for new entries
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setFormKey((prev) => prev + 1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [visible, initialData]);

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
          key={`${initialData?.id || 'new'}_${formKey}`}
          type={type}
          initialData={initialData}
          currencySymbol={currencySymbol}
          cards={cards}
          onClose={onClose}
          onSave={onSave}
          onCreateBudget={onCreateBudget}
        />
      ) : null}
    </CozyModal>
  );
}

interface QuickEntryFormProps {
  type: 'expense' | 'income' | 'transfer';
  initialData?: QuickEntryData | null;
  currencySymbol: string;
  cards?: BudgetCardData[];
  onClose: () => void;
  onSave: (entry: QuickEntryData) => void;
  onCreateBudget?: () => void;
}

function QuickEntryForm({
  type,
  initialData,
  currencySymbol,
  cards = [],
  onClose,
  onSave,
  onCreateBudget,
}: QuickEntryFormProps) {
  const { colors, isDark } = useAppTheme();

  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  const [channel, setChannel] = useState<'Cash' | 'UPI' | 'Bank'>(initialData?.channel || 'Cash');
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(
    initialData?.cardId || (cards.length > 0 ? cards[0].id : undefined)
  );

  // Date selection states
  const [dateMode, setDateMode] = useState<'today' | 'yesterday' | 'custom'>(
    initialData?.date ? 'custom' : 'today'
  );
  const [customDateText, setCustomDateText] = useState(
    initialData?.date
      ? new Date(initialData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const computeFinalDate = (): string => {
    if (dateMode === 'today') {
      return new Date().toISOString();
    }
    if (dateMode === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString();
    }
    // Custom date parsing
    const parsed = new Date(customDateText);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return new Date().toISOString();
  };

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
    if (!selectedCardId) {
      setErrorMessage('Please select a budget envelope for this transaction.');
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
      cardId: selectedCardId,
      date: computeFinalDate(),
    });

    useUIStore.getState().triggerConfetti();

    // Reset local state fields
    setTitle('');
    setAmount('');
    setErrorMessage('');
    setDateMode('today');
    setCustomDateText(new Date().toISOString().split('T')[0]);

    onClose();
  };

  if (!cards || cards.length === 0) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: 'rgba(227, 151, 116, 0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CreditCard size={28} color="#E39774" />
        </View>
        <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: FONTS.sansBold,
              fontSize: 18,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            Budget Envelope Required
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: FONTS.sansMedium,
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            Every transaction must be linked to a budget envelope. Please create a budget first before recording transactions.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('medium');
            onClose();
            onCreateBudget?.();
          }}
          style={{
            backgroundColor: colors.tangerineDream,
            paddingVertical: 14,
            paddingHorizontal: 26,
            borderRadius: 16,
            marginTop: 4,
          }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              color: colors.black,
              fontFamily: FONTS.sansBold,
              fontSize: 14,
            }}
          >
            + Create Budget Envelope
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.entryForm}>
      {/* Error message banner */}
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
            placeholder="e.g. Cyber Cafe Work, Chai, Toner Refill"
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

      {/* Date Selector (Allows backdating past entries) */}
      <View style={styles.inputGroup}>
        <View className="flex-row items-center justify-between">
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Transaction Date
          </Text>
          <Text style={{ color: colors.matchaLime, fontSize: 11, fontWeight: '700' }}>
            Past Dates Allowed
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {(['today', 'yesterday', 'custom'] as const).map((mode) => {
            const isSelected = dateMode === mode;
            const label = mode === 'today' ? 'Today' : mode === 'yesterday' ? 'Yesterday' : 'Custom / Calendar';
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => {
                  triggerHaptic('light');
                  setDateMode(mode);
                  if (mode === 'custom') {
                    setCalendarVisible(true);
                  }
                }}
                style={{
                  backgroundColor: isSelected
                    ? colors.palmLeaf
                    : isDark
                    ? colors.cardSecondary
                    : '#F7F7F4',
                  borderColor: isSelected
                    ? colors.palmLeaf
                    : isDark
                    ? colors.borderSubtle
                    : '#E5E7EB',
                }}
                className="flex-1 h-10 rounded-2xl border items-center justify-center active:opacity-75"
                activeOpacity={0.75}
              >
                <Text
                  style={{
                    color: isSelected ? colors.black : colors.textPrimary,
                    fontFamily: isSelected ? FONTS.sansBold : FONTS.sansMedium,
                  }}
                  className="text-xs"
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {dateMode === 'custom' && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setCalendarVisible(true);
            }}
            style={[
              styles.inputWrapper,
              {
                backgroundColor: isDark ? 'rgba(137, 157, 120, 0.14)' : '#F2F7EA',
                borderColor: colors.palmLeaf,
                marginTop: 6,
                justifyContent: 'space-between',
              },
            ]}
            activeOpacity={0.75}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Calendar size={18} color={colors.palmLeaf} />
              <Text style={{ color: colors.textPrimary, fontFamily: FONTS.monoBold, fontSize: 14 }}>
                {customDateText}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.palmLeaf,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: colors.black, fontFamily: FONTS.sansBold, fontSize: 11 }}>
                Open Calendar
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <CalendarPickerModal
          visible={calendarVisible}
          onClose={() => setCalendarVisible(false)}
          selectedDate={customDateText}
          onSelectDate={(newDate) => {
            setCustomDateText(newDate);
            setDateMode('custom');
          }}
          title="Transaction Date"
        />
      </View>

      {/* Connect to Budget Envelope (Mandatory) */}
      <View style={styles.inputGroup}>
        <View className="flex-row items-center justify-between">
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Budget Envelope *
          </Text>
          <Text style={{ color: colors.matchaLime, fontSize: 11, fontWeight: '700' }}>
            Required
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {cards.map((card) => {
            const isSelected = selectedCardId === card.id;
            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedCardId(card.id);
                  if (errorMessage) setErrorMessage('');
                }}
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(137, 157, 120, 0.20)'
                    : isDark
                    ? colors.cardSecondary
                    : '#F7F7F4',
                  borderColor: isSelected ? colors.matchaLime : isDark ? colors.borderSubtle : '#E5E7EB',
                }}
                className="px-3.5 py-2 rounded-2xl border flex-row items-center gap-1.5"
                activeOpacity={0.75}
              >
                <CreditCard size={13} color={isSelected ? colors.matchaLime : colors.textSecondary} />
                <Text
                  style={{
                    color: isSelected ? colors.matchaLime : colors.textPrimary,
                    fontSize: 12,
                    fontWeight: isSelected ? '800' : '600',
                  }}
                >
                  {card.name} ({currencySymbol}{card.limit.toLocaleString()})
                </Text>
                {isSelected && <Check size={12} color={colors.matchaLime} strokeWidth={3} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Payment Channel */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Channel
        </Text>
        <View className="flex-row gap-2">
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
                    ? colors.tangerineDream
                    : isDark
                    ? colors.cardSecondary
                    : '#F7F7F4',
                  borderColor: isSelected
                    ? colors.tangerineDream
                    : isDark
                    ? colors.borderSubtle
                    : '#E5E7EB',
                }}
                className="flex-1 h-11 rounded-2xl border items-center justify-center active:opacity-75"
                activeOpacity={0.75}
              >
                <Text
                  style={{
                    color: isSelected ? colors.black : colors.textPrimary,
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
            backgroundColor: colors.tangerineDream,
            shadowColor: '#000',
            shadowOpacity: 0.15,
          },
        ]}
        activeOpacity={0.85}
      >
        <Sparkles size={16} color={colors.black} />
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
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.sansMedium,
  },
  saveBtn: {
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: FONTS.sansBold,
    color: '#020202',
    letterSpacing: -0.2,
  },
});
