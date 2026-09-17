import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Upload, Download, Compass, Coins, ChevronRight, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic, FONTS } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { useSecurity } from '../../context/security-context';
import { useUIStore } from '../../store/ui-store';
import { CurrencyPickerModal } from './CurrencyPickerModal';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
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

  const handleExportBackup = async () => {
    try {
      triggerHaptic('medium');
      const users = db.select().from(schema.usersTable).all();
      const budgetCards = db.select().from(schema.budgetCardsTable).all();
      const categories = db.select().from(schema.categoriesTable).all();
      const people = db.select().from(schema.peopleTable).all();
      const installments = db.select().from(schema.installmentsTable).all();
      const transactions = db.select().from(schema.transactionsTable).all();
      const recurring = db.select().from(schema.recurringTable).all();

      const backupData = {
        app: 'Dinlipi',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tables: {
          users,
          budgetCards,
          categories,
          people,
          installments,
          transactions,
          recurring,
        },
      };

      const dateTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `dinlipi_backup_${dateTag}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      triggerHaptic('success');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Save Dinlipi Backup',
          UTI: 'public.json',
        });
      } else {
        showConfirm({
          title: 'Backup Exported',
          message: `Backup saved successfully at: ${fileUri}`,
          confirmText: 'Done',
          cancelText: 'Close',
          onConfirm: () => {},
        });
      }
    } catch (err) {
      console.error('Export backup error:', err);
      triggerHaptic('error');
      showConfirm({
        title: 'Export Failed',
        message: 'Could not export database backup. Please check storage permissions.',
        confirmText: 'OK',
        cancelText: '',
        onConfirm: () => {},
      });
    }
  };

  const handleRestoreBackup = async () => {
    try {
      triggerHaptic('light');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let backupObj: any;
      try {
        backupObj = JSON.parse(fileContent);
      } catch {
        showConfirm({
          title: 'Invalid File',
          message: 'The selected file is not a valid Dinlipi JSON backup.',
          confirmText: 'OK',
          cancelText: '',
          onConfirm: () => {},
        });
        return;
      }

      if (!backupObj || (!backupObj.tables && !backupObj.data)) {
        showConfirm({
          title: 'Unrecognized Backup',
          message: 'The selected backup file is missing required table structures.',
          confirmText: 'OK',
          cancelText: '',
          onConfirm: () => {},
        });
        return;
      }

      const tables = backupObj.tables || backupObj.data;

      showConfirm({
        title: 'Restore Ledger Database?',
        message: `This will replace current data with:\n• ${tables.transactions?.length || 0} transactions\n• ${tables.budgetCards?.length || 0} envelopes\n• ${tables.people?.length || 0} contacts\n• ${tables.installments?.length || 0} installments. Continue?`,
        confirmText: 'Restore Now',
        cancelText: 'Cancel',
        isDestructive: true,
        onConfirm: async () => {
          try {
            db.delete(schema.transactionsTable).run();
            db.delete(schema.installmentsTable).run();
            db.delete(schema.peopleTable).run();
            db.delete(schema.budgetCardsTable).run();
            db.delete(schema.categoriesTable).run();
            db.delete(schema.recurringTable).run();
            if (tables.users && tables.users.length > 0) {
              db.delete(schema.usersTable).run();
            }

            if (tables.users && Array.isArray(tables.users)) {
              for (const u of tables.users) {
                db.insert(schema.usersTable).values(u).run();
              }
            }

            if (tables.budgetCards && Array.isArray(tables.budgetCards)) {
              for (const c of tables.budgetCards) {
                db.insert(schema.budgetCardsTable).values(c).run();
              }
            }

            if (tables.categories && Array.isArray(tables.categories)) {
              for (const cat of tables.categories) {
                db.insert(schema.categoriesTable).values(cat).run();
              }
            }

            if (tables.people && Array.isArray(tables.people)) {
              for (const p of tables.people) {
                db.insert(schema.peopleTable).values(p).run();
              }
            }

            if (tables.installments && Array.isArray(tables.installments)) {
              for (const inst of tables.installments) {
                db.insert(schema.installmentsTable).values(inst).run();
              }
            }

            if (tables.transactions && Array.isArray(tables.transactions)) {
              for (const tx of tables.transactions) {
                db.insert(schema.transactionsTable).values(tx).run();
              }
            }

            if (tables.recurring && Array.isArray(tables.recurring)) {
              for (const r of tables.recurring) {
                db.insert(schema.recurringTable).values(r).run();
              }
            }

            triggerHaptic('success');
            showConfirm({
              title: 'Restore Complete',
              message: 'Your offline ledger has been successfully restored from the backup file.',
              confirmText: 'Great',
              cancelText: '',
              onConfirm: () => {},
            });
          } catch (restoreErr) {
            console.error('Error inserting restored backup:', restoreErr);
            triggerHaptic('error');
            showConfirm({
              title: 'Restore Error',
              message: 'Failed to write restored data to database.',
              confirmText: 'OK',
              cancelText: '',
              onConfirm: () => {},
            });
          }
        },
      });
    } catch (err) {
      console.error('Restore document error:', err);
      triggerHaptic('error');
      showConfirm({
        title: 'File Selection Error',
        message: 'Could not access the selected backup file.',
        confirmText: 'OK',
        cancelText: '',
        onConfirm: () => {},
      });
    }
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
    fontSize: 11,
    fontFamily: FONTS.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardBox: {
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 15,
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
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  sqliteBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.monoBold,
    letterSpacing: 0.5,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: FONTS.sansSemiBold,
  },
  settingDesc: {
    fontSize: 12,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
  },
});
