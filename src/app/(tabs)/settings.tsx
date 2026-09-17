import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Sparkles, ChevronRight, Wallet } from 'lucide-react-native';
import { useSecurity } from '../../context/security-context';
import { useAppTheme } from '../../context/theme-context';
import { PasscodeModal } from '../../components/security/PasscodeModal';
import { ThemeSwitcher } from '../../components/settings/ThemeSwitcher';
import { SecuritySection } from '../../components/settings/SecuritySection';
import { DataSection } from '../../components/settings/DataSection';
import { triggerHaptic, FONTS } from '../../constants/theme';
import { AmbientGlowBackground } from '../../components/ui/AmbientGlowBackground';
import { useUIStore } from '../../store/ui-store';
import { useUserLive } from '../../db/queries';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { UserProfileModal, UserProfile } from '../../components/profile/UserProfileModal';
import { db } from '../../db/client';
import * as schema from '../../db/schema';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const showConfirm = useUIStore((state) => state.showConfirmDialog);
  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const setCurrencyModalVisible = useUIStore((state) => state.setCurrencyModalVisible);

  const {
    settings,
    setupPasscode,
    lockNow,
  } = useSecurity();

  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'change'>('create');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [defaultPaymentChannel, setDefaultPaymentChannel] = useState<'cash' | 'upi' | 'bank' | 'card'>('cash');

  const { data: dbUsers = [] } = useUserLive();
  const userProfile: UserProfile = React.useMemo(() => {
    if (dbUsers && dbUsers.length > 0) {
      const u = dbUsers[0];
      return {
        name: u.name || 'Valued User',
        phone: u.phone || '',
        avatar: u.avatar || 'avatar_matcha_fox',
        currency: u.currency || activeCurrency,
      };
    }
    return {
      name: 'Valued Member',
      phone: '',
      avatar: 'avatar_matcha_fox',
      currency: activeCurrency,
    };
  }, [dbUsers, activeCurrency]);

  const handleSaveProfile = (profile: UserProfile) => {
    try {
      db.insert(schema.usersTable)
        .values({
          id: 'default_user',
          name: profile.name,
          phone: profile.phone,
          avatar: profile.avatar,
          currency: profile.currency,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: schema.usersTable.id,
          set: {
            name: profile.name,
            phone: profile.phone,
            avatar: profile.avatar,
            currency: profile.currency,
            updatedAt: new Date().toISOString(),
          },
        })
        .run();
      triggerHaptic('success');
      setProfileModalVisible(false);
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  };

  const handlePasscodeSuccess = async (pin: string) => {
    await setupPasscode(pin);
    setPasscodeModalVisible(false);
    showConfirm({
      title: 'Passcode Saved',
      message: 'Your 4-digit passcode is now active and protecting your vault.',
      confirmText: 'Done',
      cancelText: '',
      isDestructive: false,
      onConfirm: () => {},
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgPrimary,
        paddingTop: Math.max(insets.top + 6, 32),
      }}
    >
      <AmbientGlowBackground glowColor={colors.mossSage} />

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Vault & Settings
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Appearance, Security & Database
          </Text>
        </View>

        {(settings.biometricEnabled || settings.passcodeEnabled) && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              lockNow();
            }}
            style={[
              styles.lockNowBtn,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE',
                borderColor: isDark ? colors.borderSubtle : '#EAEAE2',
              },
            ]}
            activeOpacity={0.8}
          >
            <Lock size={13} color={colors.matchaLime} />
            <Text style={[styles.lockNowText, { color: colors.matchaLime }]}>
              Lock Now
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 0: User Identity & Profile Banner */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Account & Identity
          </Text>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setProfileModalVisible(true);
            }}
            style={[
              styles.profileCard,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
                borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
              },
            ]}
            activeOpacity={0.8}
          >
            <UserAvatar avatarIdOrUri={userProfile.avatar} size="md" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {userProfile.name}
                </Text>
                <Sparkles size={13} color={colors.matchaLime} />
              </View>
              <Text style={[styles.profileRole, { color: colors.textSecondary }]} numberOfLines={1}>
                {userProfile.phone ? userProfile.phone : 'Offline Ledger Vault Owner'}
              </Text>
              <Text style={[styles.profileCurrency, { color: colors.matchaLime }]}>
                Default: {activeCurrency}
              </Text>
            </View>
            <View
              style={[
                styles.editPill,
                { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
              ]}
            >
              <Text style={[styles.editPillText, { color: colors.textPrimary }]}>Edit</Text>
              <ChevronRight size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 1: Appearance & 5-Tone Color Theme Switcher */}
        <ThemeSwitcher />

        {/* Section 2: Ledger Defaults & Preferences */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Ledger Defaults & Channels
          </Text>
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
                borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
                padding: 16,
              },
            ]}
          >
            {/* Currency Option */}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setCurrencyModalVisible(true);
              }}
              style={styles.prefRow}
              activeOpacity={0.7}
            >
              <View style={styles.prefLeft}>
                <View
                  style={[
                    styles.prefIconBox,
                    { backgroundColor: 'rgba(137, 157, 120, 0.16)' },
                  ]}
                >
                  <Wallet size={18} color={colors.palmLeaf} />
                </View>
                <View>
                  <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>
                    Active Currency
                  </Text>
                  <Text style={[styles.prefSub, { color: colors.textSecondary }]}>
                    Current: {activeCurrency}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' },
                ]}
              >
                <Text style={[styles.badgePillText, { color: colors.palmLeaf }]}>
                  {activeCurrency.split(' ')[0]} Change
                </Text>
              </View>
            </TouchableOpacity>

            {/* Default Payment Method Chips */}
            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: isDark ? colors.borderSubtle : '#F0F0E8' }}>
              <Text style={[styles.prefTitle, { color: colors.textPrimary, marginBottom: 8 }]}>
                Default Payment Channel
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { key: 'cash', label: 'Cash' },
                  { key: 'upi', label: 'UPI' },
                  { key: 'bank', label: 'Bank' },
                  { key: 'card', label: 'Card' },
                ].map((item) => {
                  const isSelected = defaultPaymentChannel === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => {
                        triggerHaptic('light');
                        setDefaultPaymentChannel(item.key as any);
                      }}
                      style={[
                        styles.chipBtn,
                        {
                          backgroundColor: isSelected
                            ? colors.matchaLime
                            : isDark
                            ? colors.cardElevated
                            : '#F4F4EE',
                          borderColor: isSelected
                            ? colors.matchaLime
                            : isDark
                            ? colors.borderSubtle
                            : '#EAEAE2',
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipBtnText,
                          {
                            color: isSelected ? '#141715' : colors.textSecondary,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Section 3: Security & Authentication */}
        <SecuritySection
          onOpenPasscodeModal={(mode) => {
            setModalMode(mode);
            setPasscodeModalVisible(true);
          }}
        />

        {/* Section 4: Offline Storage, Backup & Database Stats */}
        <DataSection />

        {/* Brand Footer */}
        <View style={styles.footerBox}>
          <View
            style={[
              styles.brandIconWrap,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#F4F4EE',
                borderColor: isDark ? colors.borderSubtle : '#EAEAE2',
              },
            ]}
          >
            <Text style={[styles.brandBangla, { color: colors.matchaLime }]}>
              দ
            </Text>
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            Dinlipi (দিনলিপি)
          </Text>
          <Text style={[styles.brandSub, { color: colors.textMuted }]}>
            Cozy Pastel FinTech Daybook & Khata • v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* User Profile Modal */}
      <UserProfileModal
        visible={profileModalVisible}
        profile={userProfile}
        onSave={handleSaveProfile}
        onClose={() => setProfileModalVisible(false)}
      />

      {/* Passcode Modal */}
      <PasscodeModal
        visible={passcodeModalVisible}
        title={modalMode === 'change' ? 'Enter New 4-Digit Passcode' : 'Set 4-Digit Passcode'}
        onSuccess={handlePasscodeSuccess}
        onCancel={() => setPasscodeModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
  },
  lockNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  lockNowText: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  footerBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  brandIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  brandBangla: {
    fontSize: 22,
    fontFamily: FONTS.sansBold,
  },
  brandTitle: {
    fontSize: 15,
    fontFamily: FONTS.sansBold,
  },
  brandSub: {
    fontSize: 11,
    fontFamily: FONTS.sansRegular,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  profileName: {
    fontSize: 16,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.3,
  },
  profileRole: {
    fontSize: 12,
    fontFamily: FONTS.sansRegular,
    marginTop: 1,
  },
  profileCurrency: {
    fontSize: 11,
    fontFamily: FONTS.sansSemiBold,
    marginTop: 2,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editPillText: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  cardBox: {
    borderRadius: 24,
    borderWidth: 1,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  prefIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTitle: {
    fontSize: 14,
    fontFamily: FONTS.sansBold,
  },
  prefSub: {
    fontSize: 12,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgePillText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBtnText: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
});
