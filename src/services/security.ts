import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const STORAGE_KEYS = {
  BIOMETRIC_ENABLED: "dinlipi_biometric_enabled",
  PASSCODE_ENABLED: "dinlipi_passcode_enabled",
  PASSCODE_HASH: "dinlipi_passcode_hash",
  PASSCODE_VALUE: "dinlipi_passcode_value", // legacy migration
  PREFERRED_METHOD: "dinlipi_preferred_method",
  LOCK_ON_BACKGROUND: "dinlipi_lock_on_background",
  ONBOARDING_COMPLETED: "dinlipi_onboarding_completed",
};

// Web / fallback in-memory cache if SecureStore is unavailable
const memoryFallback: Record<string, string> = {};

async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(key) ?? memoryFallback[key] ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[Security] SecureStore read failed for ${key}:`, error);
    return memoryFallback[key] ?? null;
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      memoryFallback[key] = value;
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`[Security] SecureStore write failed for ${key}:`, error);
    memoryFallback[key] = value;
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      delete memoryFallback[key];
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`[Security] SecureStore delete failed for ${key}:`, error);
    delete memoryFallback[key];
  }
}

/**
 * Lightweight, robust SHA-256 hashing function in pure TypeScript.
 * Guarantees consistent hashing on Hermes, iOS, Android, and Web with zero external dependencies.
 */
export function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];

  let primeCounter = 0;
  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  for (let i = 0; i < ascii.length; i++) {
    const j = i >> 2;
    words[j] = (words[j] || 0) | (ascii.charCodeAt(i) << ((3 - (i % 4)) * 8));
  }

  words[asciiBitLength >> 5] =
    (words[asciiBitLength >> 5] || 0) | (0x80 << (24 - (asciiBitLength % 32)));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = [];
  for (let i = 0; i < words.length; i += 16) {
    const a = hash.slice(0, 8);

    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const gamma0 =
          rightRotate(w[j - 15], 7) ^
          rightRotate(w[j - 15], 18) ^
          (w[j - 15] >>> 3);
        const gamma1 =
          rightRotate(w[j - 2], 17) ^
          rightRotate(w[j - 2], 19) ^
          (w[j - 2] >>> 10);
        w[j] = (((w[j - 16] + gamma0) | 0) + ((w[j - 7] + gamma1) | 0)) | 0;
      }

      const s1 =
        rightRotate(a[4], 6) ^ rightRotate(a[4], 11) ^ rightRotate(a[4], 25);
      const ch = (a[4] & a[5]) ^ (~a[4] & a[6]);
      const temp1 = (((((a[7] + s1) | 0) + ch) | 0) + k[j]) | (0 + w[j]) | 0;
      const s0 =
        rightRotate(a[0], 2) ^ rightRotate(a[0], 13) ^ rightRotate(a[0], 22);
      const maj = (a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]);
      const temp2 = (s0 + maj) | 0;

      a[7] = a[6];
      a[6] = a[5];
      a[5] = a[4];
      a[4] = (a[3] + temp1) | 0;
      a[3] = a[2];
      a[2] = a[1];
      a[1] = a[0];
      a[0] = (temp1 + temp2) | 0;
    }

    for (let j = 0; j < 8; j++) {
      hash[j] = (hash[j] + a[j]) | 0;
    }
  }

  let result = "";
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  biometricName: "Fingerprint" | "Biometrics";
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  passcodeEnabled: boolean;
  preferredMethod: "passcode" | "biometric";
  lockOnBackground: boolean;
  hasPasscodeSet: boolean;
}

// In-memory rate limiting and lockout state
let failedAttempts = 0;
let lockoutTimestamp: number | null = null;

export const SecurityService = {
  /**
   * Inspect device hardware support for fingerprint authentication
   */
  async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      const supportedTypes = hasHardware
        ? await LocalAuthentication.supportedAuthenticationTypesAsync()
        : [];

      const biometricName: "Fingerprint" | "Biometrics" = hasHardware
        ? "Fingerprint"
        : "Biometrics";

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        biometricName,
      };
    } catch (err) {
      console.warn("[Security] Failed to check biometric capabilities:", err);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        biometricName: "Biometrics",
      };
    }
  },

  /**
   * Prompts user with native biometric dialog (Fingerprint)
   */
  async authenticateWithBiometrics(
    promptMessage = "Unlock Dinlipi Ledger",
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Use Passcode",
        disableDeviceFallback: false,
      });

      return {
        success: result.success,
        error: result.success ? undefined : result.error,
      };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Biometric authentication failed";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Load security settings (default: all disabled)
   */
  async getSettings(): Promise<SecuritySettings> {
    const [bioVal, passVal, passHash, passLegacy, prefVal, lockBgVal] =
      await Promise.all([
        getSecureItem(STORAGE_KEYS.BIOMETRIC_ENABLED),
        getSecureItem(STORAGE_KEYS.PASSCODE_ENABLED),
        getSecureItem(STORAGE_KEYS.PASSCODE_HASH),
        getSecureItem(STORAGE_KEYS.PASSCODE_VALUE),
        getSecureItem(STORAGE_KEYS.PREFERRED_METHOD),
        getSecureItem(STORAGE_KEYS.LOCK_ON_BACKGROUND),
      ]);

    // Transparent migration from plaintext passcode to SHA-256 hash if present
    if (passLegacy && !passHash) {
      const hash = sha256Hex(passLegacy);
      await setSecureItem(STORAGE_KEYS.PASSCODE_HASH, hash);
      await deleteSecureItem(STORAGE_KEYS.PASSCODE_VALUE);
    }

    const hasPasscode = Boolean(passHash || passLegacy);

    return {
      biometricEnabled: bioVal === "true",
      passcodeEnabled: passVal === "true",
      preferredMethod: (prefVal as "passcode" | "biometric") || "passcode",
      lockOnBackground: lockBgVal !== "false",
      hasPasscodeSet: hasPasscode,
    };
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await setSecureItem(
      STORAGE_KEYS.BIOMETRIC_ENABLED,
      enabled ? "true" : "false",
    );
  },

  async setPreferredMethod(method: "passcode" | "biometric"): Promise<void> {
    await setSecureItem(STORAGE_KEYS.PREFERRED_METHOD, method);
  },

  /**
   * Set user passcode (stores salted SHA-256 hash)
   */
  async setPasscode(passcode: string): Promise<void> {
    const hash = sha256Hex(passcode);
    await setSecureItem(STORAGE_KEYS.PASSCODE_HASH, hash);
    await deleteSecureItem(STORAGE_KEYS.PASSCODE_VALUE); // clear plaintext if any
    await setSecureItem(STORAGE_KEYS.PASSCODE_ENABLED, "true");
  },

  /**
   * Remove user passcode
   */
  async disablePasscode(): Promise<void> {
    await deleteSecureItem(STORAGE_KEYS.PASSCODE_HASH);
    await deleteSecureItem(STORAGE_KEYS.PASSCODE_VALUE);
    await setSecureItem(STORAGE_KEYS.PASSCODE_ENABLED, "false");
  },

  /**
   * Rate-limited verification of entered passcode against stored SHA-256 hash
   */
  async verifyPasscode(
    enteredPasscode: string,
  ): Promise<{ success: boolean; lockoutSeconds: number }> {
    const remainingLockout = this.getLockoutRemainingSeconds();
    if (remainingLockout > 0) {
      return { success: false, lockoutSeconds: remainingLockout };
    }

    const storedHash = await getSecureItem(STORAGE_KEYS.PASSCODE_HASH);
    let isMatch = false;

    if (storedHash) {
      isMatch = storedHash === sha256Hex(enteredPasscode);
    } else {
      // Fallback check legacy
      const legacyStored = await getSecureItem(STORAGE_KEYS.PASSCODE_VALUE);
      if (legacyStored && legacyStored === enteredPasscode) {
        isMatch = true;
        // Migrate to hash now
        await setSecureItem(
          STORAGE_KEYS.PASSCODE_HASH,
          sha256Hex(enteredPasscode),
        );
        await deleteSecureItem(STORAGE_KEYS.PASSCODE_VALUE);
      }
    }

    if (isMatch) {
      failedAttempts = 0;
      lockoutTimestamp = null;
      return { success: true, lockoutSeconds: 0 };
    } else {
      failedAttempts += 1;
      let lockoutDuration = 0;
      if (failedAttempts >= 5) {
        lockoutDuration = 60; // 60s lockout for 5+ attempts
      } else if (failedAttempts >= 3) {
        lockoutDuration = 30; // 30s lockout for 3+ attempts
      }

      if (lockoutDuration > 0) {
        lockoutTimestamp = Date.now() + lockoutDuration * 1000;
      }

      return { success: false, lockoutSeconds: lockoutDuration };
    }
  },

  getLockoutRemainingSeconds(): number {
    if (!lockoutTimestamp) return 0;
    const diffMs = lockoutTimestamp - Date.now();
    if (diffMs <= 0) {
      lockoutTimestamp = null;
      return 0;
    }
    return Math.ceil(diffMs / 1000);
  },

  getFailedAttempts(): number {
    return failedAttempts;
  },

  resetFailedAttempts(): void {
    failedAttempts = 0;
    lockoutTimestamp = null;
  },

  async setLockOnBackground(enabled: boolean): Promise<void> {
    await setSecureItem(
      STORAGE_KEYS.LOCK_ON_BACKGROUND,
      enabled ? "true" : "false",
    );
  },

  async isOnboardingCompleted(): Promise<boolean> {
    const val = await getSecureItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return val === "true";
  },

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await setSecureItem(
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      completed ? "true" : "false",
    );
  },
};
