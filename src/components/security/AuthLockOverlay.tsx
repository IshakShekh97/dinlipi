import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  KeyRound,
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

/**
 * Internal modal content rendered only when isLocked is true.
 * Automatically initializes fresh state and cleans up on unlock without cascading setState in effects.
 */
const AuthLockContent: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const {
    settings,
    lockoutRemainingSeconds,
    unlockWithBiometrics,
    unlockWithPasscode,
  } = useSecurity();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMode, setAuthMode] = useState<'pin' | 'biometric'>(() =>
    settings.passcodeEnabled ? 'pin' : 'biometric'
  );

  const hasAutoPromptedRef = useRef(false);

  // Reanimated values for biometric pulsing rings
  const ringScale1 = useSharedValue(1);
  const ringOpacity1 = useSharedValue(0.6);
  const ringScale2 = useSharedValue(1);
  const ringOpacity2 = useSharedValue(0.4);

  useEffect(() => {
    if (settings.biometricEnabled) {
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
  }, [settings.biometricEnabled, ringOpacity1, ringOpacity2, ringScale1, ringScale2]);

  const handleBiometricPress = useCallback(async () => {
    if (!settings.biometricEnabled || isAuthenticating) return;
    setIsAuthenticating(true);
    triggerHaptic('medium');
    try {
      const ok = await unlockWithBiometrics();
      if (ok) {
        triggerHaptic('success');
      }
    } catch (e) {
      console.warn('Biometric auth error:', e);
    } finally {
      setIsAuthenticating(false);
    }
  }, [settings.biometricEnabled, isAuthenticating, unlockWithBiometrics]);

  // If biometric is the only enabled method (no passcode), trigger prompt once on mount
  useEffect(() => {
    if (settings.biometricEnabled && !settings.passcodeEnabled && !hasAutoPromptedRef.current) {
      hasAutoPromptedRef.current = true;
      const timer = setTimeout(() => {
        handleBiometricPress();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [settings.biometricEnabled, settings.passcodeEnabled, handleBiometricPress]);

  const animatedRing1 = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: ringOpacity1.value,
  }));

  const animatedRing2 = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: ringOpacity2.value,
  }));

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

  const handleUnlockPill = async () => {
    if (authMode === 'pin' && pin.length === 4) {
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
      {/* Top Header & Visual Indicator */}
      <View style={styles.topSection}>
        {authMode === 'biometric' && settings.biometricEnabled ? (
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
            <Lock size={26} color={colors.matchaLime} strokeWidth={2.5} />
          </View>
        )}

        <View style={styles.badgeRow}>
          <Sparkles size={12} color={colors.matchaLime} />
          <Text style={[styles.appName, { color: colors.matchaLime }]}>DINLIPI SECURED VAULT</Text>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {authMode === 'pin' ? 'Enter Passcode' : 'Fingerprint Unlock'}
        </Text>

        {/* Manual Switcher Tabs for PIN vs Biometrics */}
        {settings.passcodeEnabled && settings.biometricEnabled && (
          <View
            style={[
              styles.switchBar,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#EFEFE8',
                borderColor: isDark ? colors.borderSubtle : '#E0E0D8',
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setAuthMode('pin');
              }}
              style={[
                styles.switchTab,
                authMode === 'pin' && [
                  styles.switchTabActive,
                  { backgroundColor: isDark ? colors.cardElevated : '#FFFFFF' },
                ],
              ]}
              activeOpacity={0.8}
            >
              <KeyRound size={13} color={authMode === 'pin' ? colors.matchaLime : colors.textMuted} />
              <Text
                style={[
                  styles.switchTabText,
                  {
                    color: authMode === 'pin' ? colors.textPrimary : colors.textMuted,
                    fontWeight: authMode === 'pin' ? '700' : '500',
                  },
                ]}
              >
                Enter PIN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setAuthMode('biometric');
                handleBiometricPress();
              }}
              style={[
                styles.switchTab,
                authMode === 'biometric' && [
                  styles.switchTabActive,
                  { backgroundColor: isDark ? colors.cardElevated : '#FFFFFF' },
                ],
              ]}
              activeOpacity={0.8}
            >
              <Fingerprint size={13} color={authMode === 'biometric' ? colors.matchaLime : colors.textMuted} />
              <Text
                style={[
                  styles.switchTabText,
                  {
                    color: authMode === 'biometric' ? colors.textPrimary : colors.textMuted,
                    fontWeight: authMode === 'biometric' ? '700' : '500',
                  },
                ]}
              >
                Fingerprint
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {lockoutRemainingSeconds > 0 ? (
          <Text style={[styles.errorText, { color: colors.terracotta }]}>
            Too many attempts. Locked for {lockoutRemainingSeconds}s
          </Text>
        ) : errorMsg ? (
          <Text style={[styles.errorText, { color: colors.terracotta }]}>{errorMsg}</Text>
        ) : (
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            {authMode === 'pin'
              ? 'Enter your 4-digit PIN to access the ledger'
              : 'Tap scanner to authenticate with Fingerprint'}
          </Text>
        )}

        {/* Animated PIN Dots Indicator */}
        {authMode === 'pin' && settings.passcodeEnabled && (
          <AnimatedPinDots pinLength={pin.length} maxLength={4} hasError={hasError} />
        )}
      </View>

      {/* PIN Keypad or Biometric Prompt Action Area */}
      {authMode === 'pin' && settings.passcodeEnabled ? (
        <View style={styles.keypadWrapper}>
          <PhonePinKeypad
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onBiometricPress={handleBiometricPress}
            showBiometric={settings.biometricEnabled}
            disabled={lockoutRemainingSeconds > 0}
          />
        </View>
      ) : (
        <View style={styles.biometricPromptWrapper}>
          <TouchableOpacity
            onPress={handleBiometricPress}
            style={[
              styles.biometricLargeTapCard,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
                borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={[styles.biometricIconBox, { backgroundColor: 'rgba(206, 240, 74, 0.16)' }]}>
              <Fingerprint size={36} color={colors.matchaLime} strokeWidth={2} />
            </View>
            <Text style={[styles.biometricCardTitle, { color: colors.textPrimary }]}>
              Authenticate with Fingerprint
            </Text>
            <Text style={[styles.biometricCardSub, { color: colors.textSecondary }]}>
              Touch fingerprint sensor to unlock instantly
            </Text>
          </TouchableOpacity>

          {settings.passcodeEnabled && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setAuthMode('pin');
              }}
              style={styles.switchModeLink}
              activeOpacity={0.7}
            >
              <KeyRound size={16} color={colors.matchaLime} />
              <Text style={[styles.switchModeLinkText, { color: colors.matchaLime }]}>
                Or Switch to 4-Digit PIN
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
            {authMode === 'biometric'
              ? 'Scan Fingerprint'
              : pin.length === 4
              ? 'Unlock Vault'
              : settings.biometricEnabled
              ? 'Use Fingerprint'
              : 'Enter 4 Digits'}
          </Text>
          <ChevronsRight size={20} color="#141715" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const AuthLockOverlay: React.FC = () => {
  const { isLocked, settings } = useSecurity();

  // Absolute security rule: if neither passcode nor biometric is enabled, NEVER prompt!
  if (!isLocked || (!settings.biometricEnabled && !settings.passcodeEnabled)) {
    return null;
  }

  return (
    <Modal visible={isLocked} animationType="fade" transparent={false} statusBarTranslucent>
      <AuthLockContent />
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
    marginBottom: 10,
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
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 6,
  },
  switchBar: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    marginTop: 14,
    width: 240,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 17,
  },
  switchTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  switchTabText: {
    fontSize: 12,
  },
  hintText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  keypadWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  biometricPromptWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  biometricLargeTapCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  biometricIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  biometricCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  biometricCardSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  switchModeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  switchModeLinkText: {
    fontSize: 13,
    fontWeight: '600',
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
