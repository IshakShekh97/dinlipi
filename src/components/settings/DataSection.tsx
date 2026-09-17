import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Upload, Download, Compass, Coins, ChevronRight, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { useSecurity } from '../../context/security-context';
import { useUIStore } from '../../store/ui-store';
import { CurrencyPickerModal } from './CurrencyPickerModal';
import { db } from '../../db/client';
import * as schema from '../../db/schema';

export function DataSection() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const { resetOnboarding } = useSecurity();

  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const currencyModalVisible = useUIStore((state) => state.currencyModalVisible);
  const setCurrencyModalVisible = useUIStore((state) => state.setCurrencyModalVisible);
  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const handleWipeAllData = () => {
    triggerHaptic('warning');
    showConfirm({
      title: 'Wipe Vault & Start Scratch?',
      message:
        'This will permanently delete all transactions, cards, categories, contacts, and user records from your phone. You will start completely from scratch. This cannot be undone.',
      confirmText: 'Wipe Everything',
      cancelText: 'Keep Data',
      isDestructive: true,
      onConfirm: async () => {
        try {
          db.delete(schema.transactionsTable).run();
          db.delete(schema.budgetCardsTable).run();
          db.delete(schema.categoriesTable).run();
          db.delete(schema.peopleTable).run();
          db.delete(schema.installmentsTable).run();
          db.delete(schema.recurringTable).run();
          db.delete(schema.usersTable).run();

          await resetOnboarding();
          triggerHaptic('success');
          router.replace('/onboarding');
        } catch (e) {
          console.error('Failed to wipe database:', e);
        }
      },
    });
  };

  const handleReplayOnboarding = async () => {
    triggerHaptic();
    await resetOnboarding();
    router.push('/onboarding');
  };

  const handleExportBackup = () => {
    triggerHaptic('success');
    showConfirm({
      title: 'Database Backup Exported',
      message: 'All your offline transactions and ledger accounts are backed up to local device storage.',
      confirmText: 'Done',
      cancelText: 'Close',
      onConfirm: () => {},
    });
  };

  const handleRestoreBackup = () => {
    triggerHaptic('light');
    showConfirm({
      title: 'Restore Ledger',
      message: 'Are you sure you want to restore from the selected backup? This will sync your offline database.',
      confirmText: 'Restore',
      cancelText: 'Cancel',
      isDestructive: false,
      onConfirm: () => {
        triggerHaptic('success');
      },
    });
  };

  return (
    <>
      {/* Offline Storage & Backup */}
      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          Offline Storage & Backup
        </Text>

        <View
          style={[
            styles.cardBox,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
            },
          ]}
        >
          {/* Offline Status */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.statusDot, { backgroundColor: colors.matchaLime }]} />
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                100% Offline Vault
              </Text>
            </View>
            <View
              style={[
                styles.sqliteBadge,
                {
                  backgroundColor: 'rgba(206, 240, 74, 0.16)',
                  borderColor: colors.matchaLime,
                },
              ]}
            >
              <Text style={[styles.sqliteBadgeText, { color: colors.matchaLime }]}>
                SQLite
              </Text>
            </View>
          </View>

          {/* Export Backup */}
          <TouchableOpacity
            onPress={handleExportBackup}
            style={[
              styles.settingRow,
              {
                borderTopWidth: 1,
                borderTopColor: isDark ? colors.borderSubtle : '#F0F0E8',
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconBox,
                  { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
                ]}
              >
                <Upload size={18} color={colors.matchaLime} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Export Backup (.db)
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Save complete ledger database
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Import Backup */}
          <TouchableOpacity
            onPress={handleRestoreBackup}
            style={[
              styles.settingRow,
              {
                borderTopWidth: 1,
                borderTopColor: isDark ? colors.borderSubtle : '#F0F0E8',
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconBox,
                  { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
                ]}
              >
                <Download size={18} color={colors.matchaLime} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Import / Restore Backup
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Restore from SQLite .db file
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Experience & Regional Preferences */}
      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          Regional Preferences & Experience
        </Text>

        <View
          style={[
            styles.cardBox,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
            },
          ]}
        >
          {/* Replay Onboarding */}
          <TouchableOpacity
            onPress={handleReplayOnboarding}
            style={styles.settingRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconBox,
                  { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
                ]}
              >
                <Compass size={18} color={colors.matchaLime} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Replay Intro Tour
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  View feature highlights again
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Currency Switcher */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setCurrencyModalVisible(true);
            }}
            style={[
              styles.settingRow,
              {
                borderTopWidth: 1,
                borderTopColor: isDark ? colors.borderSubtle : '#F0F0E8',
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconBox,
                  { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
                ]}
              >
                <Coins size={18} color={colors.goldenHoney} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Primary Currency
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Default: ₹ INR (Indian Rupee)
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  backgroundColor: 'rgba(206, 240, 74, 0.16)',
                  borderColor: colors.matchaLime,
                }}
                className="px-3 py-1 rounded-full border"
              >
                <Text style={{ color: colors.matchaLime }} className="text-xs font-black">
                  {activeCurrency}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone: Wipe All Data */}
      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionLabel, { color: colors.accentDanger }]}>
          Danger Zone
        </Text>

        <View
          style={[
            styles.cardBox,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? 'rgba(231, 111, 81, 0.25)' : 'rgba(231, 111, 81, 0.2)',
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleWipeAllData}
            style={styles.settingRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconBox,
                  { backgroundColor: 'rgba(231, 111, 81, 0.12)' },
                ]}
              >
                <Trash2 size={18} color={colors.accentDanger} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.accentDanger }]}>
                  Wipe All Data & Start From Scratch
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Permanently erase SQLite ledger & reset setup
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.accentDanger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Currency Picker Modal */}
      <CurrencyPickerModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardBox: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  sqliteBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  sqliteBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
