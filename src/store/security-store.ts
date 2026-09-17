import { create } from "zustand";
import {
  SecurityService,
  SecuritySettings,
  BiometricCapabilities,
} from "../services/security";

interface SecurityState {
  isLocked: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  biometricCapabilities: BiometricCapabilities | null;
  settings: SecuritySettings;
  failedAttempts: number;
  lockoutRemainingSeconds: number;

  // Actions
  init: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  unlock: () => void;
  lock: () => void;
  verifyBiometricForSetup: () => Promise<{ success: boolean; error?: string }>;
  authenticateBiometric: () => Promise<boolean>;
  verifyPasscode: (
    pin: string,
  ) => Promise<{ success: boolean; lockoutSeconds: number }>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setPreferredMethod: (method: "passcode" | "biometric") => Promise<void>;
  setPasscode: (pin: string) => Promise<void>;
  disablePasscode: () => Promise<void>;
  setLockOnBackground: (enabled: boolean) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  updateLockout: () => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isLocked: false,
  isLoading: true,
  hasCompletedOnboarding: false,
  biometricCapabilities: null,
  settings: {
    biometricEnabled: false,
    passcodeEnabled: false,
    preferredMethod: "passcode",
    lockOnBackground: true,
    hasPasscodeSet: false,
  },
  failedAttempts: 0,
  lockoutRemainingSeconds: 0,

  init: async () => {
    try {
      const [capabilities, currentSettings, onboardingDone] = await Promise.all(
        [
          SecurityService.checkBiometricCapabilities(),
          SecurityService.getSettings(),
          SecurityService.isOnboardingCompleted(),
        ],
      );

      const shouldLock =
        onboardingDone &&
        (currentSettings.biometricEnabled || currentSettings.passcodeEnabled);

      set({
        biometricCapabilities: capabilities,
        settings: currentSettings,
        hasCompletedOnboarding: onboardingDone,
        isLocked: shouldLock,
        isLoading: false,
        failedAttempts: SecurityService.getFailedAttempts(),
        lockoutRemainingSeconds: SecurityService.getLockoutRemainingSeconds(),
      });
    } catch (err) {
      console.warn("[SecurityStore] Init error:", err);
      set({ isLoading: false });
    }
  },

  refreshSettings: async () => {
    try {
      const currentSettings = await SecurityService.getSettings();
      const capabilities = await SecurityService.checkBiometricCapabilities();
      set({
        biometricCapabilities: capabilities,
        settings: currentSettings,
        failedAttempts: SecurityService.getFailedAttempts(),
        lockoutRemainingSeconds: SecurityService.getLockoutRemainingSeconds(),
      });
    } catch (err) {
      console.warn("[SecurityStore] Refresh error:", err);
    }
  },

  unlock: () => {
    SecurityService.resetFailedAttempts();
    set({
      isLocked: false,
      failedAttempts: 0,
      lockoutRemainingSeconds: 0,
    });
  },

  lock: () => {
    const { settings, hasCompletedOnboarding } = get();
    if (
      hasCompletedOnboarding &&
      (settings.biometricEnabled || settings.passcodeEnabled)
    ) {
      set({ isLocked: true });
    }
  },

  verifyBiometricForSetup: async () => {
    const capabilities = await SecurityService.checkBiometricCapabilities();
    set({ biometricCapabilities: capabilities });
    if (!capabilities.hasHardware) {
      return {
        success: false,
        error: "Your device hardware does not support biometric scanning.",
      };
    }
    if (!capabilities.isEnrolled) {
      return {
        success: false,
        error:
          "No fingerprint or Face ID enrolled. Please register biometrics in your phone system settings first.",
      };
    }
    const result = await SecurityService.authenticateWithBiometrics(
      `Confirm ${capabilities.biometricName} to protect Dinlipi`,
    );
    if (result.success) {
      return { success: true };
    }
    return {
      success: false,
      error: result.error || "Biometric authentication was not completed.",
    };
  },

  authenticateBiometric: async () => {
    const { biometricCapabilities } = get();
    const result = await SecurityService.authenticateWithBiometrics(
      `Unlock Dinlipi with ${biometricCapabilities?.biometricName || "Biometrics"}`,
    );

    if (result.success) {
      get().unlock();
      return true;
    }
    return false;
  },

  verifyPasscode: async (pin: string) => {
    const result = await SecurityService.verifyPasscode(pin);
    if (result.success) {
      get().unlock();
    } else {
      set({
        failedAttempts: SecurityService.getFailedAttempts(),
        lockoutRemainingSeconds: result.lockoutSeconds,
      });
    }
    return result;
  },

  setBiometricEnabled: async (enabled: boolean) => {
    await SecurityService.setBiometricEnabled(enabled);
    await get().refreshSettings();
  },

  setPreferredMethod: async (method: "passcode" | "biometric") => {
    await SecurityService.setPreferredMethod(method);
    await get().refreshSettings();
  },

  setPasscode: async (pin: string) => {
    await SecurityService.setPasscode(pin);
    await get().refreshSettings();
  },

  disablePasscode: async () => {
    await SecurityService.disablePasscode();
    await get().refreshSettings();
  },

  setLockOnBackground: async (enabled: boolean) => {
    await SecurityService.setLockOnBackground(enabled);
    await get().refreshSettings();
  },

  setOnboardingCompleted: async (completed: boolean) => {
    await SecurityService.setOnboardingCompleted(completed);
    set({ hasCompletedOnboarding: completed });
  },

  updateLockout: () => {
    set({
      lockoutRemainingSeconds: SecurityService.getLockoutRemainingSeconds(),
      failedAttempts: SecurityService.getFailedAttempts(),
    });
  },
}));
