import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Lock,
  Fingerprint,
  ChevronsRight,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSecurity } from '../../context/security-context';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { PhonePinKeypad } from './PhonePinKeypad';
import { AnimatedPinDots } from './AnimatedPinDots';

export const AuthLockOverlay: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const {
    isLocked,
    settings,
    capabilities,
    lockoutRemainingSeconds,
    unlockWithBiometrics,
    unlockWithPasscode,
  } = useSecurity();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Reanimated values for biometric pulsing rings
  const ringScale1 = useSharedValue(1);
  const ringOpacity1 = useSharedValue(0.6);
  const ringScale2 = useSharedValue(1);
  const ringOpacity2 = useSharedValue(0.4);

  useEffect(() => {
    if (isLocked && settings.biometricEnabled) {
      ringScale1.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 1800, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 1800, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      ringOpacity1.value = withRepeat(
        withSequence(
          withTiming(0.1, { duration: 1800 }),
          withTiming(0.6, { duration: 1800 })
        ),
        -1,
        true
      );

      ringScale2.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 2400, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 2400, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      ringOpacity2.value = withRepeat(
        withSequence(
          withTiming(0.05, { duration: 2400 }),
          withTiming(0.4, { duration: 2400 })
        ),
        -1,
        true
      );
    }
  }, [isLocked, settings.biometricEnabled, ringOpacity1, ringOpacity2, ringScale1, ringScale2]);

  const animatedRing1 = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: ringOpacity1.value,
  }));

  const animatedRing2 = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: ringOpacity2.value,
  }));

  // Absolute security rule: if neither passcode nor biometric is enabled, NEVER prompt!
  if (!isLocked || (!settings.biometricEnabled && !settings.passcodeEnabled)) {
    return null;
  }

  const handleKeyPress = async (num: string) => {
    if (lockoutRemainingSeconds > 0) {
      triggerHaptic('error');
      return;
    }
    if (pin.length >= 4) return;
    const nextPin = pin + num;
    setPin(nextPin);
    setErrorMsg('');
    setHasError(false);

    if (nextPin.length === 4) {
      const ok = await unlockWithPasscode(nextPin);
      if (!ok) {
        triggerHaptic('error');
        setErrorMsg(
          lockoutRemainingSeconds > 0
            ? `Locked for ${lockoutRemainingSeconds}s`
            : 'Incorrect Passcode'
        );
        setHasError(true);
        setTimeout(() => {
          setPin('');
          setHasError(false);
        }, 400);
      } else {
        triggerHaptic('success');
        setPin('');
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
      setHasError(false);
    }
  };

  const handleBiometricPress = async () => {
    if (!settings.biometricEnabled || isAuthenticating) return;
    setIsAuthenticating(true);
    triggerHaptic('medium');
    try {
      const ok = await unlockWithBiometrics();
      if (ok) {
        triggerHaptic('success');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleUnlockPill = async () => {
    if (pin.length === 4) {
      const ok = await unlockWithPasscode(pin);
      if (!ok) {
        triggerHaptic('error');
        setErrorMsg('Incorrect Passcode');
        setHasError(true);
        setPin('');
      } else {
        triggerHaptic('success');
      }
    } else if (settings.biometricEnabled) {
      await handleBiometricPress();
    }
  };

  return (
    <Modal visible={isLocked} animationType="fade" transparent={false} statusBarTranslucent>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bgPrimary,
            paddingTop: Math.max(insets.top + 16, 44),
            paddingBottom: Math.max(insets.bottom + 16, 28),
          },
        ]}
      >
        {/* Top Header & Animated Biometric Indicator */}
        <View style={styles.topSection}>
          {settings.biometricEnabled ? (
            <View style={styles.biometricAuraContainer}>
              <Animated.View
                style={[
                  styles.auraRing,
                  { borderColor: colors.matchaLime },
                  animatedRing2,
                ]}
              />
              <Animated.View
                style={[
                  styles.auraRing,
                  { borderColor: colors.matchaLime },
                  animatedRing1,
                ]}
              />
              <TouchableOpacity
                onPress={handleBiometricPress}
                activeOpacity={0.8}
                style={[
                  styles.biometricCenterPad,
                  {
                    backgroundColor: colors.cardSecondary,
                    borderColor: colors.matchaLime,
                  },
                ]}
              >
                <Fingerprint size={32} color={colors.matchaLime} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.lockIconBox,
                {
                  backgroundColor: 'rgba(206, 240, 74, 0.16)',
                  borderColor: colors.borderMedium,
                },
              ]}
            >
              <Lock size={28} color={colors.matchaLime} strokeWidth={2.5} />
            </View>
          )}

          <View style={styles.badgeRow}>
            <Sparkles size={12} color={colors.matchaLime} />
            <Text style={[styles.appName, { color: colors.matchaLime }]}>DINLIPI SECURED VAULT</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {settings.passcodeEnabled ? 'Enter Passcode' : 'Vault Locked'}
          </Text>

          {lockoutRemainingSeconds > 0 ? (
            <Text style={[styles.errorText, { color: colors.terracotta }]}>
              Too many attempts. Locked for {lockoutRemainingSeconds}s
            </Text>
          ) : errorMsg ? (
            <Text style={[styles.errorText, { color: colors.terracotta }]}>{errorMsg}</Text>
          ) : (
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              {settings.biometricEnabled
                ? `Tap scanner for ${capabilities.biometricName} or enter PIN`
                : 'Enter your 4-digit PIN to access the ledger'}
            </Text>
          )}

          {/* Animated PIN Dots Indicator */}
          {settings.passcodeEnabled && (
            <AnimatedPinDots pinLength={pin.length} maxLength={4} hasError={hasError} />
          )}
        </View>

        {/* Generic Phone Keypad with Typing Letters and Animations */}
        <View style={styles.keypadWrapper}>
          <PhonePinKeypad
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onBiometricPress={handleBiometricPress}
            showBiometric={settings.biometricEnabled}
            disabled={!settings.passcodeEnabled || lockoutRemainingSeconds > 0}
          />
        </View>

        {/* High-Contrast Bottom Action Pill Button */}
        <View style={styles.actionWrapper}>
          <TouchableOpacity
            style={[
              styles.actionPillBtn,
              {
                backgroundColor: colors.matchaLime,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
              },
            ]}
            onPress={handleUnlockPill}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionPillText, { color: '#141715' }]}>
              {settings.biometricEnabled && pin.length === 0
                ? `Unlock with ${capabilities.biometricName}`
                : 'Unlock Vault'}
            </Text>
            <ChevronsRight size={20} color="#141715" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  biometricAuraContainer: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  auraRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1.5,
  },
  biometricCenterPad: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  lockIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  appName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  hintText: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  keypadWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionWrapper: {
    width: '100%',
  },
  actionPillBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionPillText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
