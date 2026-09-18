import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tag, PlusCircle, MessageCircle, Edit2, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic, FONTS } from '../../constants/theme';
import { UserAvatar } from '../ui/UserAvatar';
import { ContactLedger } from '../../app/(tabs)/khata';

interface ContactCardItemProps {
  contact: ContactLedger;
  onOpenProfile: (contact: ContactLedger) => void;
  onRecordPayment: (contact: ContactLedger) => void;
  onSendWhatsApp: (contact: ContactLedger) => void;
  onEdit: (contact: ContactLedger) => void;
  onDelete: (contact: ContactLedger) => void;
  currencySymbol?: string;
}

export function ContactCardItem({
  contact,
  onOpenProfile,
  onRecordPayment,
  onSendWhatsApp,
  onEdit,
  onDelete,
  currencySymbol = '₹',
}: ContactCardItemProps) {
  const { colors, isDark } = useAppTheme();
  const isReceivable = contact.type === 'receivable';
  const remaining = Math.max(0, contact.totalDue - contact.paidSoFar);
  const isSettled = remaining <= 0;
  const accentCol = isReceivable ? colors.palmLeaf : colors.oxidizedIron;

  return (
    <TouchableOpacity
      style={[
        styles.contactCard,
        {
          backgroundColor: isDark ? '#11171A' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.95)',
          borderWidth: 1,
        },
      ]}
      onPress={() => onOpenProfile(contact)}
      activeOpacity={0.75}
    >
      {/* Top row: Avatar, Info, Status */}
      <View style={styles.contactTopRow}>
        <UserAvatar
          avatarIdOrUri={contact.avatar || 'avatar_matcha_fox'}
          name={contact.name}
          size="md"
        />

        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.textPrimary }]}>
            {contact.name}
          </Text>

          {contact.aliases && contact.aliases.length > 0 ? (
            <View style={styles.aliasRow}>
              {contact.aliases.slice(0, 2).map((a, i) => (
                <View
                  key={i}
                  style={[
                    styles.aliasPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(137, 157, 120, 0.18)'
                        : 'rgba(137, 157, 120, 0.22)',
                    },
                  ]}
                >
                  <Tag size={9} color={colors.palmLeaf} />
                  <Text style={[styles.aliasText, { color: colors.palmLeaf }]}>
                    {a}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.contactTag, { color: colors.textSecondary }]}>
              {contact.tag}
            </Text>
          )}
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.remainingAmount, { color: accentCol }]}>
            {isSettled ? 'Settled' : `${currencySymbol}${remaining.toLocaleString()}`}
          </Text>
          <Text style={[styles.remainingLabel, { color: colors.textMuted }]}>
            {isSettled ? 'All clear' : isReceivable ? 'to collect' : 'to pay'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.progressBarTrack,
          { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: accentCol,
              width: `${Math.min(
                (contact.paidSoFar / (contact.totalDue || 1)) * 100,
                100
              )}%`,
            },
          ]}
        />
      </View>

      {/* Bottom Action Row */}
      <View style={styles.contactActionRow}>
        <Text style={[styles.phoneNote, { color: colors.textMuted }]}>
          {contact.phone || 'No phone set'}
        </Text>

        <View style={styles.actionButtons}>
          {/* Record payment */}
          {!isSettled && (
            <TouchableOpacity
              style={[
                styles.actionMiniBtn,
                { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
              ]}
              onPress={() => {
                triggerHaptic();
                onRecordPayment(contact);
              }}
              activeOpacity={0.7}
            >
              <PlusCircle size={14} color={accentCol} />
              <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>
                Pay
              </Text>
            </TouchableOpacity>
          )}

          {/* WhatsApp Reminder */}
          {isReceivable && !isSettled && (
            <TouchableOpacity
              style={[
                styles.actionMiniBtn,
                { backgroundColor: 'rgba(37, 211, 102, 0.12)' },
              ]}
              onPress={() => {
                triggerHaptic();
                onSendWhatsApp(contact);
              }}
              activeOpacity={0.7}
            >
              <MessageCircle size={14} color="#25D366" />
            </TouchableOpacity>
          )}

          {/* Edit */}
          <TouchableOpacity
            style={[
              styles.actionMiniBtn,
              { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
            ]}
            onPress={() => {
              triggerHaptic();
              onEdit(contact);
            }}
            activeOpacity={0.7}
          >
            <Edit2 size={13} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            style={[
              styles.actionMiniBtn,
              { backgroundColor: 'rgba(231, 111, 81, 0.12)' },
            ]}
            onPress={() => {
              triggerHaptic();
              onDelete(contact);
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={13} color={colors.terracotta} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  contactCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 15,
    fontFamily: FONTS.sansBold,
    marginBottom: 4,
  },
  aliasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  aliasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aliasText: {
    fontSize: 10,
    fontFamily: FONTS.sansMedium,
  },
  contactTag: {
    fontSize: 12,
    fontFamily: FONTS.sansRegular,
  },
  remainingAmount: {
    fontSize: 16,
    fontFamily: FONTS.monoBold,
  },
  remainingLabel: {
    fontSize: 10,
    fontFamily: FONTS.sansMedium,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  contactActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  phoneNote: {
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  actionMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
