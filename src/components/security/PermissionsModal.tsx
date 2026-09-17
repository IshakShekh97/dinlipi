import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Image,
  Fingerprint,
  Vibrate,
  CheckCircle2,
  ExternalLink,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { useSecurity } from '../../context/security-context';
import { useUIStore } from '../../store/ui-store';

interface PermissionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PermissionsModal({ visible, onClose }: PermissionsModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { settings, capabilities, enableBiometrics, disableBiometrics } = useSecurity();
  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const [photoGranted, setPhotoGranted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkPerms = async () => {
      const media = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (isMounted) setPhotoGranted(media.granted);
    };
    if (visible) checkPerms();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  const handleTogglePhotos = async () => {
    triggerHaptic('light');
    if (!photoGranted) {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const granted = status === 'granted';
      setPhotoGranted(granted);
      if (!granted) {
        showConfirm({
          title: 'Photos Access Needed',
          message: 'To upload your custom profile photo, allow Dinlipi read access to your photos library in system settings.',
          confirmText: 'Open Settings',
          cancelText: 'Cancel',
          isDestructive: false,
          onConfirm: () => {
            Linking.openSettings();
          },
        });
      }
    }
  };

  const handleToggleBiometrics = async () => {
    triggerHaptic('light');
    if (!settings.biometricEnabled) {
      if (!capabilities.hasHardware || !capabilities.isEnrolled) {
        showConfirm({
          title: 'Biometrics Unavailable',
          message: 'No biometric hardware or enrolled fingerprint/face found on this device.',
          confirmText: 'OK',
          cancelText: '',
          isDestructive: false,
          onConfirm: () => {},
        });
        return;
      }
      const res = await enableBiometrics();
      if (!res.success) {
        showConfirm({
          title: 'Verification Cancelled',
          message: res.error || 'Biometric authentication was cancelled or failed.',
          confirmText: 'OK',
          cancelText: '',
          isDestructive: false,
          onConfirm: () => {},
        });
      }
    } else {
      await disableBiometrics();
    }
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: 'rgba(206, 240, 74, 0.16)', borderColor: colors.borderMedium },
                ]}
              >
                <ShieldCheck size={20} color={colors.matchaLime} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Device Permissions
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Manage local permissions for Dinlipi
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Privacy Guarantee Banner */}
            <View
              style={[
                styles.privacyBanner,
                {
                  backgroundColor: isDark ? 'rgba(206, 240, 74, 0.08)' : 'rgba(206, 240, 74, 0.16)',
                  borderColor: 'rgba(206, 240, 74, 0.25)',
                },
              ]}
            >
              <CheckCircle2 size={16} color={colors.matchaLime} />
              <Text style={[styles.privacyBannerText, { color: colors.textPrimary }]}>
                Dinlipi works 100% locally. Permissions are never shared or sent to any remote server.
              </Text>
            </View>

            {/* 1. Photo Library */}
            <View
              style={[
                styles.permCard,
                { backgroundColor: colors.cardPrimary, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.permLeft}>
                <View
                  style={[
                    styles.permIconBox,
                    { backgroundColor: 'rgba(224, 122, 95, 0.16)' },
                  ]}
                >
                  <Image size={20} color={colors.terracotta} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permTitle, { color: colors.textPrimary }]}>
                    Photos & Gallery
                  </Text>
                  <Text style={[styles.permDesc, { color: colors.textSecondary }]}>
                    Choose custom avatars for your personal profile
                  </Text>
                </View>
              </View>
              <Switch
                value={photoGranted}
                onValueChange={handleTogglePhotos}
                trackColor={{ false: isDark ? '#333' : '#ddd', true: colors.matchaLime }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 2. Biometrics */}
            <View
              style={[
                styles.permCard,
                { backgroundColor: colors.cardPrimary, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.permLeft}>
                <View
                  style={[
                    styles.permIconBox,
                    { backgroundColor: 'rgba(129, 178, 154, 0.16)' },
                  ]}
                >
                  <Fingerprint size={20} color={colors.mossSage} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permTitle, { color: colors.textPrimary }]}>
                    Biometric Sensor
                  </Text>
                  <Text style={[styles.permDesc, { color: colors.textSecondary }]}>
                    Unlock ledger securely using {capabilities.biometricName}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.biometricEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: isDark ? '#333' : '#ddd', true: colors.matchaLime }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 3. Haptic Feedback */}
            <View
              style={[
                styles.permCard,
                { backgroundColor: colors.cardPrimary, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.permLeft}>
                <View
                  style={[
                    styles.permIconBox,
                    { backgroundColor: 'rgba(242, 204, 143, 0.16)' },
                  ]}
                >
                  <Vibrate size={20} color={colors.goldenHoney} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permTitle, { color: colors.textPrimary }]}>
                    Tactile Haptics
                  </Text>
                  <Text style={[styles.permDesc, { color: colors.textSecondary }]}>
                    Apple-like haptic feedback when typing PIN and saving
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: 'rgba(206, 240, 74, 0.16)' },
                ]}
              >
                <Text style={[styles.activeBadgeText, { color: colors.matchaLime }]}>Active</Text>
              </View>
            </View>

            {/* Open Phone System Settings Button */}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                Linking.openSettings();
              }}
              style={[
                styles.systemBtn,
                {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.borderMedium,
                },
              ]}
              activeOpacity={0.8}
            >
              <ExternalLink size={16} color={colors.textPrimary} />
              <Text style={[styles.systemBtnText, { color: colors.textPrimary }]}>
                Open System App Settings
              </Text>
            </TouchableOpacity>
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
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 12,
    paddingBottom: 20,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  privacyBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  permLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  permIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  permDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 15,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  systemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 8,
  },
  systemBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
