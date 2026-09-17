import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { useSecurity } from '../../context/security-context';
import { useAppTheme } from '../../context/theme-context';
import { PasscodeModal } from '../../components/security/PasscodeModal';
import { ThemeSwitcher } from '../../components/settings/ThemeSwitcher';
import { SecuritySection } from '../../components/settings/SecuritySection';
import { DataSection } from '../../components/settings/DataSection';
import { triggerHaptic } from '../../constants/theme';
import { useUIStore } from '../../store/ui-store';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const showConfirm = useUIStore((state) => state.showConfirmDialog);
  const {
    settings,
    setupPasscode,
    lockNow,
  } = useSecurity();

  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'change'>('create');

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
        {/* Section 1: Appearance & Theme Switcher */}
        <ThemeSwitcher />

        {/* Section 2: Security & Authentication */}
        <SecuritySection
          onOpenPasscodeModal={(mode) => {
            setModalMode(mode);
            setPasscodeModalVisible(true);
          }}
        />

        {/* Section 3 & 4: Offline Storage, Backup & Preferences */}
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
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
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
    fontWeight: '700',
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
    fontWeight: '800',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  brandSub: {
    fontSize: 11,
  },
});
