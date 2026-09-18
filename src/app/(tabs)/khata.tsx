import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  X,
  Calendar,
  CreditCard,
  Check,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { FONTS, triggerHaptic } from '../../constants/theme';
import { AmbientGlowBackground } from '../../components/ui/AmbientGlowBackground';
import {
  PersonManagerModal,
  PersonData,
} from '../../components/khata/PersonManagerModal';
import { PersonProfileModal, PersonProfileData } from '../../components/khata/PersonProfileModal';
import { ContactCardItem } from '../../components/khata/ContactCardItem';
import { EmptyStateView } from '../../components/ui/EmptyStateView';
import { CozyModal } from '../../components/ui/CozyModal';
import {
  usePeopleLive,
  useInstallmentsLive,
  useBudgetCardsLive,
  addPerson,
  updatePerson,
  deletePerson,
  recordInstallment,
} from '../../db/queries';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';

export interface ContactInstallment {
  id: string;
  date: string;
  amount: number;
  mode: 'UPI' | 'Cash' | 'Bank';
}

export interface ContactLedger {
  id: string;
  name: string;
  phone: string;
  aliases: string[];
  avatar: string;
  tag: string;
  type: 'receivable' | 'payable';
  totalDue: number;
  paidSoFar: number;
  notes?: string;
  installments: ContactInstallment[];
}

export default function KhataScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  // Zustand UI Store
  const {
    activeCurrency,
    showConfirmDialog,
    khataFilter,
    setKhataFilter,
    khataSearchQuery,
    setKhataSearchQuery,
    personModalVisible,
    setPersonModalVisible,
    editingPerson,
    setEditingPerson,
    khataProfileModalVisible,
    setKhataProfileModalVisible,
    profilePerson,
    installmentModalVisible,
    setInstallmentModalVisible,
    selectedKhataContact,
    setSelectedKhataContact,
  } = useUIStore();

  const currencySymbol = getCurrencySymbol(activeCurrency);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentMode, setInstallmentMode] = useState<'UPI' | 'Cash' | 'Bank'>('UPI');
  const [installmentDateMode, setInstallmentDateMode] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [installmentCustomDate, setInstallmentCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [installmentEnvelopeId, setInstallmentEnvelopeId] = useState<string | undefined>(undefined);

  // Drizzle Reactive Live Queries
  const { data: dbPeople = [] } = usePeopleLive();
  const { data: dbInstallments = [] } = useInstallmentsLive();
  const { data: dbCards = [] } = useBudgetCardsLive();

  // Map Drizzle people to ContactLedger[] - 100% dynamic without static seed fallbacks
  const contacts: ContactLedger[] = useMemo(() => {
    if (dbPeople && dbPeople.length > 0) {
      return dbPeople.map((p) => {
        let aliases: string[] = [];
        try {
          aliases = p.aliases ? JSON.parse(p.aliases) : [];
        } catch {
          aliases = [];
        }

        const isReceivable = (p.totalLent || 0) >= (p.totalBorrowed || 0);
        const totalDue = isReceivable ? p.totalLent || 0 : p.totalBorrowed || 0;

        // Find installments for this person
        const personInstallments: ContactInstallment[] = dbInstallments
          ? dbInstallments
              .filter((i) => i.personId === p.id)
              .map((i) => ({
                id: i.id,
                date: i.dueDate || 'Recent',
                amount: i.amount,
                mode: (i.title.includes('Cash') ? 'Cash' : i.title.includes('Bank') ? 'Bank' : 'UPI') as any,
              }))
          : [];

        const installmentsPaid = personInstallments.reduce((acc, i) => acc + i.amount, 0);
        const paidSoFar = Math.max(p.totalBorrowed || 0, installmentsPaid);

        return {
          id: p.id,
          name: p.name,
          phone: p.phone || '',
          aliases,
          avatar: p.avatar || 'avatar_sage_owl',
          tag: p.notes || (isReceivable ? 'Receivable Khata' : 'Payable Khata'),
          type: isReceivable ? 'receivable' : 'payable',
          totalDue,
          paidSoFar,
          notes: p.notes || '',
          installments: personInstallments,
        };
      });
    }

    return [];
  }, [dbPeople, dbInstallments]);

  // Aggregate stats
  const totalReceivable = useMemo(
    () =>
      contacts
        .filter((c) => c.type === 'receivable')
        .reduce((acc, c) => acc + Math.max(0, c.totalDue - c.paidSoFar), 0),
    [contacts]
  );

  const totalPayable = useMemo(
    () =>
      contacts
        .filter((c) => c.type === 'payable')
        .reduce((acc, c) => acc + Math.max(0, c.totalDue - c.paidSoFar), 0),
    [contacts]
  );

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesFilter =
        khataFilter === 'all' ||
        (khataFilter === 'receivable' && c.type === 'receivable') ||
        (khataFilter === 'payable' && c.type === 'payable');

      if (!matchesFilter) return false;
      if (!khataSearchQuery.trim()) return true;

      const q = khataSearchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone.toLowerCase().includes(q);
      const matchTag = c.tag.toLowerCase().includes(q);
      const matchAlias = c.aliases?.some((a) => a.toLowerCase().includes(q));

      return matchName || matchPhone || matchTag || matchAlias;
    });
  }, [contacts, khataFilter, khataSearchQuery]);

  const handleOpenPersonProfile = (contact: ContactLedger) => {
    triggerHaptic('light');
    // Navigate to full-screen person ledger page
    router.push(`/person/${contact.id}` as any);
  };

  const handleOpenAddPerson = () => {
    triggerHaptic();
    setEditingPerson(null);
    setPersonModalVisible(true);
  };

  const handleEditPerson = (contact: ContactLedger | PersonProfileData) => {
    triggerHaptic();
    const personData: PersonData = {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      aliases: contact.aliases || [],
      tag: contact.tag || 'Khata Contact',
      type: contact.type,
      totalDue: contact.totalDue,
      paidSoFar: contact.paidSoFar,
      avatarPreset: contact.avatar || 'avatar_matcha_fox',
      avatarColor: contact.type === 'receivable' ? colors.palmLeaf : colors.oxidizedIron,
      notes: contact.notes,
    };
    setEditingPerson(personData);
    setPersonModalVisible(true);
  };

  const handleDeletePerson = (id: string, name: string) => {
    triggerHaptic('warning');
    showConfirmDialog({
      title: 'Delete Contact Ledger',
      message: `Are you sure you want to remove "${name}" and all their recorded transactions & installments?`,
      confirmText: 'Delete Contact',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await deletePerson(id);
      },
    });
  };

  const handleSavePerson = async (person: PersonData) => {
    if (editingPerson) {
      await updatePerson(person);
    } else {
      await addPerson(person);
      useUIStore.getState().triggerConfetti();
    }
  };

  const handleWhatsAppReminder = (contact: ContactLedger) => {
    triggerHaptic();
    const balance = contact.totalDue - contact.paidSoFar;
    const msg = `Hello ${contact.name}, this is a gentle reminder regarding the pending balance of ${currencySymbol}${balance.toLocaleString()} for ${contact.tag}. Settle at your convenience. Thank you!`;
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          showConfirmDialog({
            title: 'WhatsApp Unavailable',
            message: 'WhatsApp is not installed on this device. You can call the contact directly.',
            confirmText: 'Understood',
            cancelText: 'Dismiss',
            onConfirm: () => {},
          });
        }
      })
      .catch(() => {
        showConfirmDialog({
          title: 'Error',
          message: 'Could not open WhatsApp.',
          confirmText: 'Close',
          cancelText: 'Dismiss',
          onConfirm: () => {},
        });
      });
  };

  const handleSettleContact = async (contactId: string) => {
    triggerHaptic('success');
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    const remaining = contact.totalDue - contact.paidSoFar;
    if (remaining > 0) {
      await recordInstallment(contactId, remaining, 'Cash');
    }
  };

  const handleOpenAddInstallment = (contact: ContactLedger) => {
    triggerHaptic();
    setSelectedKhataContact(contact);
    const balance = contact.totalDue - contact.paidSoFar;
    setInstallmentAmount(balance > 0 ? Math.min(balance, 500).toString() : '0');
    setInstallmentMode('UPI');
    setInstallmentDateMode('today');
    setInstallmentCustomDate(new Date().toISOString().split('T')[0]);
    setInstallmentEnvelopeId(undefined);
    setInstallmentModalVisible(true);
  };

  const handleSaveInstallment = async () => {
    if (!selectedKhataContact) return;
    const num = parseFloat(installmentAmount);
    if (isNaN(num) || num <= 0) {
      showConfirmDialog({
        title: 'Invalid Amount',
        message: 'Please enter a valid positive payment amount.',
        confirmText: 'Try Again',
        cancelText: 'Cancel',
        onConfirm: () => {},
      });
      return;
    }

    let finalDate = new Date().toISOString();
    if (installmentDateMode === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      finalDate = d.toISOString();
    } else if (installmentDateMode === 'custom') {
      const parsed = new Date(installmentCustomDate);
      if (!isNaN(parsed.getTime())) {
        finalDate = parsed.toISOString();
      }
    }

    triggerHaptic('success');
    useUIStore.getState().triggerConfetti();
    await recordInstallment(
      selectedKhataContact.id,
      num,
      installmentMode,
      finalDate,
      installmentEnvelopeId
    );
    setInstallmentModalVisible(false);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgPrimary,
        paddingTop: Math.max(insets.top + 6, 28),
      }}
    >
      {/* Ambient Diffuse Background Glow */}
      <AmbientGlowBackground glowColor={colors.goldenHoney} glowHeight={380} />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Khata & Ledger
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Track peer credits, lendings & customer tabs
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addPersonBtn, { backgroundColor: colors.tangerineDream }]}
          onPress={handleOpenAddPerson}
          activeOpacity={0.8}
        >
          <UserPlus size={16} color={colors.black} />
          <Text style={styles.addPersonBtnText}>New Person</Text>
        </TouchableOpacity>
      </View>

      {/* Real-Time Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View
          style={[
            styles.searchBarBox,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE',
              borderColor: isDark ? colors.borderSubtle : '#E8E8E0',
            },
          ]}
        >
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={khataSearchQuery}
            onChangeText={setKhataSearchQuery}
            placeholder="Search by name, #tag, or phone number..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInputText, { color: colors.textPrimary }]}
          />
          {khataSearchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setKhataSearchQuery('');
              }}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Aggregate Overview Cards with 3D Claymorphic Depth */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? '#11171A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.statIconBoxReceivable}>
            <ArrowDownLeft size={16} color={colors.palmLeaf} />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            You Will Get
          </Text>
          <Text style={[styles.statAmount, { color: colors.palmLeaf }]}>
            {currencySymbol}{totalReceivable.toLocaleString()}
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDark ? '#11171A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.statIconBoxPayable}>
            <ArrowUpRight size={16} color={colors.oxidizedIron} />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            You Will Give
          </Text>
          <Text style={[styles.statAmount, { color: colors.oxidizedIron }]}>
            {currencySymbol}{totalPayable.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'receivable', 'payable'] as const).map((tab) => {
          const isActive = khataFilter === tab;
          const label =
            tab === 'all'
              ? 'All People'
              : tab === 'receivable'
              ? 'To Collect'
              : 'To Pay';
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive
                    ? colors.matchaLime
                    : isDark
                    ? colors.cardSecondary
                    : '#F4F4EE',
                  borderColor: isActive ? colors.matchaLime : colors.borderSubtle,
                },
              ]}
              onPress={() => {
                triggerHaptic();
                setKhataFilter(tab);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color: isActive ? '#141715' : colors.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contacts List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredContacts.length === 0 ? (
          khataSearchQuery ? (
            <EmptyStateView
              type="no_search_results"
              onPrimaryAction={() => setKhataSearchQuery('')}
            />
          ) : (
            <EmptyStateView
              type="no_people"
              onPrimaryAction={handleOpenAddPerson}
            />
          )
        ) : (
          filteredContacts.map((contact) => (
            <ContactCardItem
              key={contact.id}
              contact={contact}
              onOpenProfile={handleOpenPersonProfile}
              onRecordPayment={handleOpenAddInstallment}
              onSendWhatsApp={handleWhatsAppReminder}
              onEdit={handleEditPerson}
              onDelete={(c) => handleDeletePerson(c.id, c.name)}
              currencySymbol={currencySymbol}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <PersonManagerModal
        visible={personModalVisible}
        onClose={() => setPersonModalVisible(false)}
        onSave={handleSavePerson}
        initialData={editingPerson}
      />

      {/* Record Installment Modal */}
      <CozyModal
        visible={installmentModalVisible}
        onClose={() => setInstallmentModalVisible(false)}
        title={
          selectedKhataContact
            ? `Record Payment for ${selectedKhataContact.name}`
            : 'Record Payment Entry'
        }
        subtitle={
          selectedKhataContact
            ? `Remaining balance: ${currencySymbol}${Math.max(
                0,
                selectedKhataContact.totalDue - selectedKhataContact.paidSoFar
              ).toLocaleString()}`
            : 'Record payment entry'
        }
      >
        <View style={styles.installmentForm}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Installment Amount ({currencySymbol})
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
                  fontSize: 16,
                  fontWeight: '900',
                  marginRight: 8,
                }}
              >
                {currencySymbol}
              </Text>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={installmentAmount}
                onChangeText={setInstallmentAmount}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Settlement Method
            </Text>
            <View style={styles.modeRow}>
              {(['UPI', 'Cash', 'Bank'] as const).map((m) => {
                const isSel = installmentMode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modePill,
                      {
                        backgroundColor: isSel
                          ? colors.matchaLime
                          : isDark
                          ? colors.cardSecondary
                          : '#F7F7F4',
                        borderColor: isSel ? colors.matchaLime : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      setInstallmentMode(m);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.modeText,
                        {
                          color: isSel ? '#141715' : colors.textPrimary,
                          fontWeight: isSel ? '700' : '500',
                        },
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Selector (Allows recording past installments) */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Payment Date
              </Text>
              <Text style={{ color: colors.matchaLime, fontSize: 11, fontWeight: '700' }}>
                Past Dates Allowed
              </Text>
            </View>
            <View style={styles.modeRow}>
              {(['today', 'yesterday', 'custom'] as const).map((dm) => {
                const isSel = installmentDateMode === dm;
                const label = dm === 'today' ? 'Today' : dm === 'yesterday' ? 'Yesterday' : 'Custom / Past';
                return (
                  <TouchableOpacity
                    key={dm}
                    style={[
                      styles.modePill,
                      {
                        backgroundColor: isSel
                          ? colors.matchaLime
                          : isDark
                          ? colors.cardSecondary
                          : '#F7F7F4',
                        borderColor: isSel ? colors.matchaLime : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      setInstallmentDateMode(dm);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.modeText,
                        {
                          color: isSel ? '#141715' : colors.textPrimary,
                          fontWeight: isSel ? '700' : '500',
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {installmentDateMode === 'custom' && (
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? colors.cardSecondary : '#F7F7F4',
                    borderColor: isDark ? colors.borderSubtle : '#E5E7EB',
                    marginTop: 6,
                  },
                ]}
              >
                <Calendar size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="YYYY-MM-DD (e.g. 2026-03-10)"
                  placeholderTextColor={colors.textMuted}
                  value={installmentCustomDate}
                  onChangeText={setInstallmentCustomDate}
                />
              </View>
            )}
          </View>

          {/* Link to Budget Envelope (Optional) */}
          {dbCards && dbCards.length > 0 && (
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Link to Budget Envelope (Optional)
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                  {installmentEnvelopeId ? 'Linked' : 'None'}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setInstallmentEnvelopeId(undefined);
                  }}
                  style={{
                    backgroundColor: !installmentEnvelopeId
                      ? isDark
                        ? colors.cardElevated
                        : '#E5E7EB'
                      : isDark
                      ? colors.cardSecondary
                      : '#F7F7F4',
                    borderColor: !installmentEnvelopeId ? colors.matchaLime : 'transparent',
                    borderWidth: 1,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                    None (General)
                  </Text>
                  {!installmentEnvelopeId && <Check size={12} color={colors.matchaLime} strokeWidth={3} />}
                </TouchableOpacity>

                {dbCards.map((card) => {
                  const isSelected = installmentEnvelopeId === card.id;
                  return (
                    <TouchableOpacity
                      key={card.id}
                      onPress={() => {
                        triggerHaptic('light');
                        setInstallmentEnvelopeId(card.id);
                      }}
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(206, 240, 74, 0.16)'
                          : isDark
                          ? colors.cardSecondary
                          : '#F7F7F4',
                        borderColor: isSelected ? colors.matchaLime : isDark ? colors.borderSubtle : '#E5E7EB',
                        borderWidth: 1,
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
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
                        {card.title} ({currencySymbol}{card.totalLimit.toLocaleString()})
                      </Text>
                      {isSelected && <Check size={12} color={colors.matchaLime} strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={[styles.recordBtn, { backgroundColor: colors.tangerineDream }]}
            onPress={handleSaveInstallment}
            activeOpacity={0.8}
          >
            <Text style={styles.recordBtnText}>Save Installment</Text>
          </TouchableOpacity>
        </View>
      </CozyModal>

      {/* Person Profile Modal */}
      <PersonProfileModal
        visible={khataProfileModalVisible}
        person={profilePerson}
        onClose={() => setKhataProfileModalVisible(false)}
        onEdit={(p: PersonProfileData) => {
          handleEditPerson(p);
          setKhataProfileModalVisible(false);
        }}
        onRecordPayment={(p: PersonProfileData) => {
          const contact = contacts.find((c) => c.id === p.id);
          if (contact) {
            handleOpenAddInstallment(contact);
          }
        }}
        onSettle={(id: string) => handleSettleContact(id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 24,
    letterSpacing: -0.6,
  },
  headerSub: {
    fontFamily: FONTS.serifItalic,
    fontSize: 13,
    marginTop: 2,
  },
  addPersonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  addPersonBtnText: {
    fontFamily: FONTS.sansBold,
    color: '#020202',
    fontSize: 13,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInputText: {
    flex: 1,
    fontFamily: FONTS.sansRegular,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  statIconBoxReceivable: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(137, 157, 120, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statIconBoxPayable: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(176, 46, 12, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontFamily: FONTS.sansRegular,
    fontSize: 11,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statAmount: {
    fontFamily: FONTS.monoBold,
    fontSize: 18,
    letterSpacing: -0.4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  filterTabText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
  },
  installmentForm: {
    gap: 16,
    paddingTop: 8,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  modeText: {
    fontSize: 13,
  },
  recordBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  recordBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#020202',
  },
});
