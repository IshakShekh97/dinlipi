import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSecurityStore } from '../store/security-store';
import { triggerHaptic } from '../constants/theme';
import { SecuritySettings, BiometricCapabilities } from '../services/security';

interface SecurityContextType {
  isLoading: boolean;
  isLocked: boolean;
  settings: SecuritySettings;
  capabilities: BiometricCapabilities;
  hasCompletedOnboarding: boolean;
  failedAttempts: number;
  lockoutRemainingSeconds: number;
  refreshSettings: () => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  unlockWithPasscode: (passcode: string) => Promise<boolean>;
  enableBiometrics: () => Promise<{ success: boolean; error?: string }>;
  disableBiometrics: () => Promise<void>;
  setPreferredMethod: (method: 'passcode' | 'biometric') => Promise<void>;
  setupPasscode: (pin: string) => Promise<void>;
  disablePasscode: () => Promise<void>;
  setLockOnBackground: (enabled: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  lockNow: () => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useSecurityStore();
  const init = useSecurityStore((s) => s.init);
  const updateLockout = useSecurityStore((s) => s.updateLockout);
  const lock = useSecurityStore((s) => s.lock);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Initialize security store once on mount
  useEffect(() => {
    init();
  }, [init]);

  // Lockout countdown interval if locked out
  useEffect(() => {
    if (store.lockoutRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      updateLockout();
    }, 1000);
    return () => clearInterval(interval);
  }, [store.lockoutRemainingSeconds, updateLockout]);

  // AppState listener to lock when backgrounded
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      const isNowActive = nextAppState === 'active';

      if (wasBackground && isNowActive) {
        if (
          (store.settings.biometricEnabled || store.settings.passcodeEnabled) &&
          store.settings.lockOnBackground
        ) {
          lock();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [store.settings, lock]);

  const unlockWithPasscode = async (pin: string): Promise<boolean> => {
    const result = await store.verifyPasscode(pin);
    if (result.success) {
      triggerHaptic('success');
      return true;
    } else {
      triggerHaptic('error');
      return false;
    }
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    const ok = await store.authenticateBiometric();
    if (ok) {
      triggerHaptic('success');
      return true;
    } else {
      triggerHaptic('error');
      return false;
    }
  };

  const enableBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    const res = await store.verifyBiometricForSetup();
    if (!res.success) {
      return res;
    }
    await store.setBiometricEnabled(true);
    triggerHaptic('success');
    return { success: true };
  };

  const disableBiometrics = async () => {
    await store.setBiometricEnabled(false);
    triggerHaptic('light');
  };

  const defaultCaps: BiometricCapabilities = store.biometricCapabilities || {
    hasHardware: false,
    isEnrolled: false,
    supportedTypes: [],
    biometricName: 'Biometrics',
  };

  const value: SecurityContextType = {
    isLoading: store.isLoading,
    isLocked: store.isLocked,
    settings: store.settings,
    capabilities: defaultCaps,
    hasCompletedOnboarding: store.hasCompletedOnboarding,
    failedAttempts: store.failedAttempts,
    lockoutRemainingSeconds: store.lockoutRemainingSeconds,
    refreshSettings: store.refreshSettings,
    unlockWithBiometrics,
    unlockWithPasscode,
    enableBiometrics,
    disableBiometrics,
    setPreferredMethod: store.setPreferredMethod,
    setupPasscode: store.setPasscode,
    disablePasscode: store.disablePasscode,
    setLockOnBackground: store.setLockOnBackground,
    completeOnboarding: () => store.setOnboardingCompleted(true),
    resetOnboarding: () => store.setOnboardingCompleted(false),
    lockNow: store.lock,
  };

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
