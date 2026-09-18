import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Phone,
  MessageCircle,
  Edit3,
  CheckCircle2,
  PlusCircle,
  X,
  Tag,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { UserAvatar } from '../ui/UserAvatar';
import { GlassCard } from '../ui/GlassCard';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';

export interface PersonProfileData {
  id: string;
  name: string;
  phone: string;
  aliases: string[];
  avatar?: string;
  type: 'receivable' | 'payable';
  totalDue: number;
  paidSoFar: number;
  tag?: string;
  notes?: string;
  installments?: { id: string; date: string; amount: number; mode: string }[];
}

interface PersonProfileModalProps {
  visible: boolean;
  person: PersonProfileData | null;
  onClose: () => void;
  onEdit: (person: PersonProfileData) => void;
  onRecordPayment: (person: PersonProfileData) => void;
  onSettle: (personId: string) => void;
}

export function PersonProfileModal({
  visible,
  person,
  onClose,
  onEdit,
  onRecordPayment,
  onSettle,
}: PersonProfileModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const showConfirm = useUIStore((state) => state.showConfirmDialog);
  const currencySymbol = getCurrencySymbol(activeCurrency);

  if (!person) return null;

  const isReceivable = person.type === 'receivable';
  const remaining = Math.max(0, person.totalDue - person.paidSoFar);
  const isSettled = remaining <= 0;
  const progress = person.totalDue > 0 ? Math.min(1, person.paidSoFar / person.totalDue) : 1;

  const handleCall = () => {
    triggerHaptic('medium');
    if (!person.phone) {
      showConfirm({
        title: 'No Phone Saved',
        message: 'No phone number is saved for this contact.',
        confirmText: 'Understood',
        cancelText: 'Dismiss',
        onConfirm: () => {},
      });
      return;
    }
    const cleanPhone = person.phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      showConfirm({
        title: 'Error',
        message: 'Unable to initiate phone call.',
        confirmText: 'Close',
        cancelText: 'Dismiss',
        onConfirm: () => {},
      });
    });
  };

  const handleWhatsApp = () => {
    triggerHaptic('medium');
    if (!person.phone) {
      showConfirm({
        title: 'No Phone Saved',
        message: 'No phone number is saved for this contact.',
        confirmText: 'Understood',
        cancelText: 'Dismiss',
        onConfirm: () => {},
      });
      return;
    }
    const cleanPhone = person.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hi ${person.name}, regarding our Dinlipi ledger balance: remaining amount is ${currencySymbol}${remaining.toLocaleString()}.`
    );
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${message}`).catch(() => {
      showConfirm({
        title: 'WhatsApp Unavailable',
        message: 'Could not launch WhatsApp on this device.',
        confirmText: 'Understood',
        cancelText: 'Dismiss',
        onConfirm: () => {},
      });
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bgSecondary,
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
        >
          {/* Top Bar with Close and Edit */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onClose();
                onEdit(person);
              }}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
              ]}
            >
              <Edit3 size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.sheetTitle, { color: colors.textSecondary }]}>Person Profile</Text>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Avatar & Main Identity */}
            <View style={styles.heroSection}>
              <UserAvatar
                avatarIdOrUri={person.avatar || 'avatar_matcha_fox'}
                name={person.name}
                size="xl"
                showRing
              />

              <Text style={[styles.personName, { color: colors.textPrimary }]}>{person.name}</Text>

              {/* Aliases Badges */}
              {person.aliases && person.aliases.length > 0 ? (
                <View style={styles.aliasesRow}>
                  {person.aliases.map((alias, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.aliasBadge,
                        {
                          backgroundColor: 'rgba(206, 240, 74, 0.15)',
                          borderColor: 'rgba(206, 240, 74, 0.3)',
                        },
                      ]}
                    >
                      <Tag size={10} color={colors.matchaLime} />
                      <Text style={[styles.aliasText, { color: colors.matchaLime }]}>
                        {alias.startsWith('#') ? alias : `#${alias}`}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Phone number */}
              <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                {person.phone || 'No phone provided'}
              </Text>

              {/* Quick Communication Actions */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  onPress={handleCall}
                  style={[
                    styles.quickActionBtn,
                    {
                      backgroundColor: colors.cardPrimary,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Phone size={18} color={colors.matchaLime} />
                  <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleWhatsApp}
                  style={[
                    styles.quickActionBtn,
                    {
                      backgroundColor: colors.cardPrimary,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <MessageCircle size={18} color="#25D366" />
                  <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Financial Status GlassCard */}
            <GlassCard style={styles.statusCard} intensity="medium">
              <View style={styles.statusCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {person.type === 'receivable' ? (
                    <TrendingUp size={18} color={colors.palmLeaf} />
                  ) : (
                    <TrendingDown size={18} color={colors.oxidizedIron} />
                  )}
                  <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
                    {person.type === 'receivable' ? 'You Will Receive' : 'You Need To Give'}
                  </Text>
                </View>
                {isSettled && (
                  <View
                    style={[
                      styles.settledBadge,
                      { backgroundColor: 'rgba(137, 157, 120, 0.16)' },
                    ]}
                  >
                    <CheckCircle2 size={12} color={colors.palmLeaf} />
                    <Text style={[styles.settledText, { color: colors.palmLeaf }]}>Settled</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.dueAmount,
                  {
                    color: isSettled
                      ? colors.palmLeaf
                      : isReceivable
                      ? colors.palmLeaf
                      : colors.oxidizedIron,
                  },
                ]}
              >
                {currencySymbol}{remaining.toLocaleString()}
              </Text>

              {/* Progress Bar */}
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(progress * 100)}%`,
                      backgroundColor: isReceivable ? colors.palmLeaf : colors.oxidizedIron,
                    },
                  ]}
                />
              </View>

              <View style={styles.progressMetrics}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Paid: {currencySymbol}{person.paidSoFar.toLocaleString()}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Total: {currencySymbol}{person.totalDue.toLocaleString()}
                </Text>
              </View>
            </GlassCard>

            {/* Notes Section if available */}
            {person.notes ? (
              <View
                style={[
                  styles.notesCard,
                  {
                    backgroundColor: colors.cardPrimary,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.notesHeader}>
                  <FileText size={15} color={colors.textSecondary} />
                  <Text style={[styles.notesTitle, { color: colors.textSecondary }]}>
                    Private Note
                  </Text>
                </View>
                <Text style={[styles.notesBody, { color: colors.textPrimary }]}>
                  {person.notes}
                </Text>
              </View>
            ) : null}

            {/* Installment History Section */}
            <View style={styles.historySection}>
              <View style={styles.historyHeaderRow}>
                <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
                  Installment Records
                </Text>
                <Text style={[styles.historyCount, { color: colors.textMuted }]}>
                  {(person.installments || []).length} logged
                </Text>
              </View>

              {(!person.installments || person.installments.length === 0) ? (
                <View style={[styles.emptyHistory, { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>
                    No partial installments recorded yet.
                  </Text>
                </View>
              ) : (
                person.installments.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.historyItem,
                      {
                        backgroundColor: colors.cardSecondary,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.historyItemLeft}>
                      <View style={[styles.historyDot, { backgroundColor: colors.palmLeaf }]} />
                      <View>
                        <Text style={[styles.historyMode, { color: colors.textPrimary }]}>
                          Payment via {item.mode}
                        </Text>
                        <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                          {item.date}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.historyAmount, { color: colors.palmLeaf }]}>
                      +{currencySymbol}{item.amount.toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Primary Action Buttons */}
            <View style={styles.bottomButtons}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  onClose();
                  onRecordPayment(person);
                }}
                style={[styles.recordBtn, { backgroundColor: colors.tangerineDream }]}
                activeOpacity={0.85}
              >
                <PlusCircle size={20} color={colors.black} />
                <Text style={styles.recordBtnText}>Record Payment</Text>
              </TouchableOpacity>

              {!isSettled && (
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('medium');
                    showConfirm({
                      title: 'Settle Entire Balance',
                      message: `Mark all ${currencySymbol}${remaining.toLocaleString()} as fully settled with ${person.name}?`,
                      confirmText: 'Confirm Settle',
                      cancelText: 'Cancel',
                      onConfirm: () => {
                        onSettle(person.id);
                        useUIStore.getState().triggerConfetti();
                        onClose();
                      },
                    });
                  }}
                  style={[
                    styles.settleBtn,
                    {
                      backgroundColor: colors.cardSecondary,
                      borderColor: colors.borderMedium,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={18} color={colors.textPrimary} />
                  <Text style={[styles.settleBtnText, { color: colors.textPrimary }]}>
                    Settle Account
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '90%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  personName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 12,
  },
  aliasesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
  },
  aliasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  aliasText: {
    fontSize: 11,
    fontWeight: '700',
  },
  phoneText: {
    fontSize: 13,
    marginTop: 6,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusCard: {
    padding: 18,
    borderRadius: 22,
    marginTop: 16,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  settledText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dueAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginVertical: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
  },
  notesCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notesContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  notesBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  historySection: {
    marginTop: 18,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyHistory: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 6,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  historyMode: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  bottomButtons: {
    gap: 10,
    marginTop: 20,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
  },
  recordBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#020202',
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  settleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
