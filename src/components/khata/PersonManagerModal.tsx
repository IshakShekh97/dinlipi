import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { UserCheck, Sparkles, Tag, Image as ImageIcon, CreditCard, Check } from 'lucide-react-native';
import { CozyModal } from '../ui/CozyModal';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic, FONTS } from '../../constants/theme';
import { UserAvatar } from '../ui/UserAvatar';
import { AvatarPickerModal } from '../ui/AvatarPickerModal';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol, getCountryCodeForCurrency } from '../../utils/currency';
import { useBudgetCardsLive } from '../../db/queries';

export interface PersonData {
  id: string;
  name: string;
  phone: string;
  aliases: string[];
  tag: string;
  type: 'receivable' | 'payable';
  totalDue: number;
  paidSoFar: number;
  avatarPreset: string;
  avatarColor: string;
  notes?: string;
  budgetCardId?: string;
}

interface PersonManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (person: PersonData) => void;
  initialData?: PersonData | null;
}

export const PersonManagerModal: React.FC<PersonManagerModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  const { colors } = useAppTheme();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [tag, setTag] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'receivable' | 'payable'>('receivable');
  const [amount, setAmount] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('avatar_matcha_fox');
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);

  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const showConfirm = useUIStore((state) => state.showConfirmDialog);
  const currencySymbol = getCurrencySymbol(activeCurrency);
  const dialCode = getCountryCodeForCurrency(activeCurrency);

  const { data: dbCards = [] } = useBudgetCardsLive();
  const [budgetCardId, setBudgetCardId] = useState<string | undefined>(initialData?.budgetCardId);

  // Sync state whenever visible or initialData changes
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (initialData) {
          setName(initialData.name);
          setPhone(initialData.phone);
          setAliases(initialData.aliases || []);
          setAliasInput('');
          setTag(initialData.tag);
          setNotes(initialData.notes || '');
          setType(initialData.type);
          setAmount(initialData.totalDue && initialData.totalDue > 0 ? initialData.totalDue.toString() : '');
          setSelectedAvatarId(initialData.avatarPreset || 'avatar_matcha_fox');
          setBudgetCardId(initialData.budgetCardId || (dbCards.length > 0 ? dbCards[0].id : undefined));
        } else {
          // Reset to clean default values for new person entry
          setName('');
          setPhone(dialCode);
          setAliases([]);
          setAliasInput('');
          setTag('');
          setNotes('');
          setType('receivable');
          setAmount('');
          setSelectedAvatarId('avatar_matcha_fox');
          setBudgetCardId(dbCards.length > 0 ? dbCards[0].id : undefined);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [visible, initialData, dialCode, dbCards]);

  const handleAddAlias = () => {
    if (!aliasInput.trim()) return;
    const formatted = aliasInput.trim().startsWith('#') ? aliasInput.trim() : `#${aliasInput.trim()}`;
    if (!aliases.includes(formatted)) {
      triggerHaptic('light');
      setAliases([...aliases, formatted]);
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (toRemove: string) => {
    triggerHaptic('light');
    setAliases(aliases.filter((a) => a !== toRemove));
  };

  const handleSave = () => {
    if (!name.trim()) {
      showConfirm({
        title: 'Missing Name',
        message: 'Please enter the contact name.',
        confirmText: 'Understood',
        cancelText: 'Dismiss',
        onConfirm: () => {},
      });
      return;
    }

    const effectiveBudgetCardId = budgetCardId || (dbCards.length > 0 ? dbCards[0].id : undefined);

    const numAmount = parseFloat(amount) || 0;
    triggerHaptic('success');

    // Include any typed alias
    let finalAliases = [...aliases];
    if (aliasInput.trim()) {
      const formatted = aliasInput.trim().startsWith('#') ? aliasInput.trim() : `#${aliasInput.trim()}`;
      if (!finalAliases.includes(formatted)) {
        finalAliases.push(formatted);
      }
    }

    const personPayload: PersonData = {
      id: initialData ? initialData.id : `p-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      aliases: finalAliases,
      tag: tag.trim() || 'General Ledger',
      notes: notes.trim(),
      type,
      totalDue: numAmount,
      paidSoFar: initialData ? initialData.paidSoFar : 0,
      avatarPreset: selectedAvatarId,
      avatarColor: type === 'receivable' ? colors.palmLeaf : colors.oxidizedIron,
      budgetCardId: effectiveBudgetCardId,
    };

    onSave(personPayload);
    useUIStore.getState().triggerConfetti();

    // Reset inputs so next creation starts completely clean
    setName('');
    setPhone(dialCode);
    setAliases([]);
    setAliasInput('');
    setTag('');
    setNotes('');
    setType('receivable');
    setAmount('');
    onClose();
  };

  return (
    <>
      <CozyModal
        visible={visible}
        onClose={onClose}
        title={initialData ? 'Edit Person' : 'Add Person to Khata'}
        subtitle="Manage personal loans, aliases, and contact info"
        icon={<UserCheck size={18} color={colors.matchaLime} />}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Avatar Selector Preview */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setAvatarPickerVisible(true);
              }}
              activeOpacity={0.8}
              style={styles.avatarPressable}
            >
              <UserAvatar avatarIdOrUri={selectedAvatarId} name={name || 'User'} size="lg" showRing />
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.matchaLime },
                ]}
              >
                <ImageIcon size={14} color="#121413" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setAvatarPickerVisible(true);
              }}
            >
              <Text style={[styles.avatarChangeText, { color: colors.matchaLime }]}>
                Change Avatar or Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Direction Switch (You Will Get vs You Will Give) */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Ledger Direction
          </Text>
          <View
            style={[
              styles.directionRow,
              { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setType('receivable');
              }}
              style={[
                styles.directionBtn,
                {
                  backgroundColor: type === 'receivable' ? colors.matchaLime : 'transparent',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: type === 'receivable' ? '#121413' : colors.textSecondary,
                  fontWeight: '800',
                  fontSize: 12,
                }}
              >
                You Will Get (+)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setType('payable');
              }}
              style={[
                styles.directionBtn,
                {
                  backgroundColor: type === 'payable' ? colors.terracotta : 'transparent',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: type === 'payable' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: '800',
                  fontSize: 12,
                }}
              >
                You Will Give (-)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Name Input */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            Full Name *
          </Text>
          <View
            style={[
              styles.inputBox,
              { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
            ]}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Tanvir Ahmed, Chhotu Bhai"
              placeholderTextColor={colors.textMuted}
              style={[styles.inputText, { color: colors.textPrimary }]}
            />
          </View>

          {/* Aliases / Nicknames Input & Badges */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            Aliases & Nicknames (e.g. #Chhotu, #Shopkeeper)
          </Text>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.borderSubtle,
                flexDirection: 'row',
                alignItems: 'center',
                paddingRight: 8,
              },
            ]}
          >
            <TextInput
              value={aliasInput}
              onChangeText={setAliasInput}
              onSubmitEditing={handleAddAlias}
              placeholder="Type alias and press Add"
              placeholderTextColor={colors.textMuted}
              style={[styles.inputText, { color: colors.textPrimary, flex: 1 }]}
            />
            <TouchableOpacity
              onPress={handleAddAlias}
              style={[
                styles.addAliasBtn,
                { backgroundColor: 'rgba(206, 240, 74, 0.2)' },
              ]}
            >
              <Text style={[styles.addAliasText, { color: colors.matchaLime }]}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Aliases Badges Preview */}
          {aliases.length > 0 && (
            <View style={styles.aliasesContainer}>
              {aliases.map((a) => (
                <TouchableOpacity
                  key={a}
                  onPress={() => handleRemoveAlias(a)}
                  style={[
                    styles.aliasChip,
                    {
                      backgroundColor: 'rgba(206, 240, 74, 0.16)',
                      borderColor: 'rgba(206, 240, 74, 0.35)',
                    },
                  ]}
                >
                  <Tag size={10} color={colors.matchaLime} />
                  <Text style={[styles.aliasChipText, { color: colors.matchaLime }]}>{a}</Text>
                  <Text style={{ color: colors.matchaLime, fontSize: 12, marginLeft: 2 }}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Phone Number Input */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            Phone / WhatsApp Number
          </Text>
          <View
            style={[
              styles.inputBox,
              { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
            ]}
          >
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              placeholderTextColor={colors.textMuted}
              style={[styles.inputText, { color: colors.textPrimary }]}
            />
          </View>

          {/* Starting Balance (Optional) */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            Starting Balance ({currencySymbol}) - Optional
          </Text>
          <View
            style={[
              styles.inputBox,
              { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
            ]}
          >
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00 (leave empty to start with 0)"
              placeholderTextColor={colors.textMuted}
              style={[styles.inputText, { color: colors.textPrimary }]}
            />
          </View>

          {/* Link to Budget Envelope */}
          {dbCards && dbCards.length > 0 && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Connect Budget Envelope
                </Text>
                <Text style={{ color: colors.matchaLime, fontSize: 11, fontWeight: '700' }}>
                  Connected
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {dbCards.map((card) => {
                  const isSel = budgetCardId === card.id;
                  return (
                    <TouchableOpacity
                      key={card.id}
                      onPress={() => { triggerHaptic('light'); setBudgetCardId(card.id); }}
                      style={[
                        styles.inputBox,
                        {
                          height: 38,
                          backgroundColor: isSel ? 'rgba(206,240,74,0.14)' : colors.cardSecondary,
                          borderColor: isSel ? colors.matchaLime : colors.borderSubtle,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 12,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <CreditCard size={12} color={isSel ? colors.matchaLime : colors.textSecondary} />
                      <Text style={{ color: isSel ? colors.matchaLime : colors.textPrimary, fontSize: 12, fontWeight: isSel ? '800' : '600' }}>
                        {card.title}
                      </Text>
                      {isSel && <Check size={11} color={colors.matchaLime} strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            Private Note (Optional)
          </Text>
          <View
            style={[
              styles.notesBox,
              { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
            ]}
          >
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Loan for laptop repair, promised to return in installments"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={[styles.notesInput, { color: colors.textPrimary }]}
            />
          </View>

          {/* Save Action Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.tangerineDream,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
              },
            ]}
            activeOpacity={0.85}
          >
            <Sparkles size={18} color={colors.black} />
            <Text style={[styles.saveButtonText, { color: colors.black }]}>
              {initialData ? 'Update Person' : 'Save Person to Khata'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </CozyModal>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={avatarPickerVisible}
        currentAvatar={selectedAvatarId}
        onSelectAvatar={(newId) => setSelectedAvatarId(newId)}
        onClose={() => setAvatarPickerVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarPressable: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarChangeText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  directionRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 14,
    fontFamily: FONTS.sansMedium,
  },
  addAliasBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addAliasText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  aliasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  aliasChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  aliasChipText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  notesBox: {
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  notesInput: {
    fontSize: 13,
    fontFamily: FONTS.sansRegular,
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  saveButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.2,
  },
});
