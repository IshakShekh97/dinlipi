import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Linking,
} from 'react-native';
import {
  ShieldCheck,
  Image,
  Fingerprint,
  Vibrate,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Play,
  Database,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { CozyModal } from '../ui/CozyModal';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { useSecurity } from '../../context/security-context';
import { useUIStore } from '../../store/ui-store';

interface PermissionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PermissionsModal({ visible, onClose }: PermissionsModalProps) {
  const { colors, isDark } = useAppTheme();
  const { settings, capabilities, enableBiometrics, disableBiometrics } = useSecurity();
  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const [photoGranted, setPhotoGranted] = useState(false);
  const [activeHapticPulse, setActiveHapticPulse] = useState<string | null>(null);

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

  const handleTestPicker = async () => {
    triggerHaptic('medium');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        triggerHaptic('success');
        showConfirm({
          title: 'Gallery Test Successful',
          message: 'Successfully accessed image gallery and picked a profile asset.',
          confirmText: 'Great',
          cancelText: '',
          onConfirm: () => {},
        });
      }
    } catch (err) {
      console.error(err);
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

  const handleTestBiometrics = async () => {
    triggerHaptic('medium');
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Dinlipi Biometric Sensor Test',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (auth.success) {
        triggerHaptic('success');
        showConfirm({
          title: 'Sensor Verified',
          message: 'Biometric fingerprint/face sensor authenticated successfully.',
          confirmText: 'Awesome',
          cancelText: '',
          onConfirm: () => {},
        });
      } else {
        triggerHaptic('warning');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const testPulse = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => {
    setActiveHapticPulse(type);
    triggerHaptic(type);
    setTimeout(() => setActiveHapticPulse(null), 300);
  };

  return (
    <CozyModal
      visible={visible}
      onClose={onClose}
      title="Hardware & Sensors"
      subtitle="Permissions, tactile engine & biometrics"
      icon={<ShieldCheck size={18} color={colors.accentPrimary} />}
    >
      <View style={styles.content}>
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
            Dinlipi runs 100% locally on your phone. Hardware sensors are never accessed by remote servers.
          </Text>
        </View>

        {/* 1. Photo Library */}
        <View
          style={[
            styles.permCard,
            { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
          ]}
        >
          <View style={styles.permRow}>
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
                  Photo Gallery Access
                </Text>
                <Text style={[styles.permDesc, { color: colors.textSecondary }]}>
                  {"Select custom profile avatar from your phone's photo library"}
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

          {photoGranted && (
            <TouchableOpacity
              onPress={handleTestPicker}
              style={[styles.subActionBtn, { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' }]}
              activeOpacity={0.7}
            >
              <Play size={13} color={colors.matchaLime} />
              <Text style={[styles.subActionText, { color: colors.textPrimary }]}>
                Test Photo Picker
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Biometrics */}
        <View
          style={[
            styles.permCard,
            { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
          ]}
        >
          <View style={styles.permRow}>
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
                  {capabilities.biometricName || 'Fingerprint / Face ID'} lock protection
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

          {capabilities.hasHardware && (
            <TouchableOpacity
              onPress={handleTestBiometrics}
              style={[styles.subActionBtn, { backgroundColor: isDark ? colors.cardElevated : '#F4F4EE' }]}
              activeOpacity={0.7}
            >
              <Sparkles size={13} color={colors.mossSage} />
              <Text style={[styles.subActionText, { color: colors.textPrimary }]}>
                Test Biometric Sensor
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Tactile Haptic Engine */}
        <View
          style={[
            styles.permCard,
            { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
          ]}
        >
          <View style={styles.permRow}>
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
                  Tactile Heartbeats Engine
                </Text>
                <Text style={[styles.permDesc, { color: colors.textSecondary }]}>
                  Physical sensory feedback when entering PIN and navigating
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.activeBadge,
                { backgroundColor: 'rgba(206, 240, 74, 0.18)' },
              ]}
            >
              <Text style={[styles.activeBadgeText, { color: colors.matchaLime }]}>Online</Text>
            </View>
          </View>

          {/* Interactive Haptic Test Buttons */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Test Haptic Pulses
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(['light', 'medium', 'heavy', 'success', 'warning'] as const).map((t) => {
                const isActive = activeHapticPulse === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => testPulse(t)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: isActive ? colors.matchaLime : isDark ? colors.cardElevated : '#F4F4EE',
                      borderWidth: 1,
                      borderColor: isDark ? colors.borderSubtle : '#EAEAE2',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        textTransform: 'capitalize',
                        color: isActive ? '#141715' : colors.textPrimary,
                      }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 4. Local Database Storage */}
        <View
          style={[
            styles.permCard,
            { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
          ]}
        >
          <View style={styles.permRow}>
            <View style={styles.permLeft}>
              <View
                style={[
                  styles.permIconBox,
                  { backgroundColor: 'rgba(206, 240, 74, 0.16)' },
                ]}
              >
                <Database size={20} color={colors.matchaLime} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permTitle, { color: colors.textPrimary }]}>
                  Encrypted SQLite Storage
                </Text>
                <Text style={[styles.permDesc, { color: colors.textSecondary }]}>
                  All ledger records stay isolated on your internal phone storage
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.activeBadge,
                { backgroundColor: 'rgba(206, 240, 74, 0.18)' },
              ]}
            >
              <Text style={[styles.activeBadgeText, { color: colors.matchaLime }]}>Secure</Text>
            </View>
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
              borderColor: colors.borderSubtle,
            },
          ]}
          activeOpacity={0.8}
        >
          <ExternalLink size={16} color={colors.textPrimary} />
          <Text style={[styles.systemBtnText, { color: colors.textPrimary }]}>
            Open Android System Settings
          </Text>
        </TouchableOpacity>
      </View>
    </CozyModal>
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
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  subActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  subActionText: {
    fontSize: 12,
    fontWeight: '700',
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
