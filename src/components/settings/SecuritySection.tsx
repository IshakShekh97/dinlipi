import React from "react";
import { View, Text, TouchableOpacity, Switch, StyleSheet } from "react-native";
import {
  KeyRound,
  Fingerprint,
  ShieldCheck,
  ChevronRight,
} from "lucide-react-native";
import { useAppTheme } from "../../context/theme-context";
import { useSecurity } from "../../context/security-context";
import { triggerHaptic, FONTS } from "../../constants/theme";
import { useUIStore } from "../../store/ui-store";

interface SecuritySectionProps {
  onOpenPasscodeModal: (mode: "create" | "change") => void;
}

export function SecuritySection({ onOpenPasscodeModal }: SecuritySectionProps) {
  const { colors, isDark } = useAppTheme();
  const {
    settings,
    capabilities,
    enableBiometrics,
    disableBiometrics,
    disablePasscode,
    setLockOnBackground,
  } = useSecurity();

  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const handlePasscodeToggle = (value: boolean) => {
    triggerHaptic();
    if (value) {
      onOpenPasscodeModal("create");
    } else {
      showConfirm({
        title: "Disable Passcode",
        message:
          "Are you sure you want to remove passcode protection from your ledger?",
        confirmText: "Disable",
        cancelText: "Cancel",
        isDestructive: true,
        onConfirm: async () => {
          await disablePasscode();
        },
      });
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    triggerHaptic();
    if (value) {
      if (!capabilities.hasHardware) {
        showConfirm({
          title: "Biometrics Unavailable",
          message:
            "Your device does not support biometric authentication hardware.",
          confirmText: "Understood",
          cancelText: "Dismiss",
          onConfirm: () => {},
        });
        return;
      }
      if (!capabilities.isEnrolled) {
        showConfirm({
          title: "No Biometrics Enrolled",
          message:
            "Please register a fingerprint or Face ID in your device system settings first.",
          confirmText: "Understood",
          cancelText: "Dismiss",
          onConfirm: () => {},
        });
        return;
      }

      const res = await enableBiometrics();
      if (!res.success) {
        showConfirm({
          title: "Verification Failed",
          message: res.error || "Could not verify biometric authentication.",
          confirmText: "Try Again",
          cancelText: "Dismiss",
          onConfirm: () => {},
        });
      }
    } else {
      await disableBiometrics();
    }
  };

  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        Security & Authentication
      </Text>

      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: isDark ? colors.cardSecondary : "#FFFFFF",
            borderColor: isDark ? colors.borderSubtle : "#EFEFE8",
          },
        ]}
      >
        {/* Passcode Protection */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconBox,
                { backgroundColor: "rgba(206, 240, 74, 0.16)" },
              ]}
            >
              <KeyRound size={18} color={colors.matchaLime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.settingTitle, { color: colors.textPrimary }]}
              >
                Passcode Protection
              </Text>
              <Text
                style={[styles.settingDesc, { color: colors.textSecondary }]}
              >
                {settings.passcodeEnabled
                  ? "4-digit PIN configured"
                  : "Require a PIN to view ledger"}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.passcodeEnabled}
            onValueChange={handlePasscodeToggle}
            trackColor={{
              false: isDark ? "#333835" : "#D1D5DB",
              true: colors.matchaLime,
            }}
            thumbColor={settings.passcodeEnabled ? "#141715" : "#F9FAFB"}
          />
        </View>

        {/* Change Passcode Button */}
        {settings.passcodeEnabled && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              onOpenPasscodeModal("change");
            }}
            style={[
              styles.settingRow,
              {
                borderTopWidth: 1,
                borderTopColor: isDark ? colors.borderSubtle : "#F0F0E8",
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconBox,
                  { backgroundColor: isDark ? colors.cardElevated : "#F4F4EE" },
                ]}
              >
                <KeyRound size={18} color={colors.textSecondary} />
              </View>
              <Text
                style={[styles.settingTitle, { color: colors.textPrimary }]}
              >
                Change 4-Digit Passcode
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Biometric Unlock */}
        <View
          style={[
            styles.settingRow,
            {
              borderTopWidth: 1,
              borderTopColor: isDark ? colors.borderSubtle : "#F0F0E8",
            },
          ]}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconBox,
                { backgroundColor: "rgba(129, 178, 154, 0.16)" },
              ]}
            >
              <Fingerprint size={18} color={colors.mossSage} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.settingTitle, { color: colors.textPrimary }]}
              >
                Fingerprint Unlock
              </Text>
              <Text
                style={[styles.settingDesc, { color: colors.textSecondary }]}
              >
                {capabilities.hasHardware
                  ? capabilities.isEnrolled
                    ? "Biometric fingerprint authentication"
                    : "Not registered in phone settings"
                  : "Hardware not available"}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.biometricEnabled}
            onValueChange={handleBiometricToggle}
            trackColor={{
              false: isDark ? "#333835" : "#D1D5DB",
              true: colors.matchaLime,
            }}
            thumbColor={settings.biometricEnabled ? "#141715" : "#F9FAFB"}
          />
        </View>

        {/* Lock on Exit */}
        <View
          style={[
            styles.settingRow,
            {
              borderTopWidth: 1,
              borderTopColor: isDark ? colors.borderSubtle : "#F0F0E8",
            },
          ]}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconBox,
                { backgroundColor: isDark ? colors.cardElevated : "#F4F4EE" },
              ]}
            >
              <ShieldCheck size={18} color={colors.matchaLime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.settingTitle, { color: colors.textPrimary }]}
              >
                Lock on Exit
              </Text>
              <Text
                style={[styles.settingDesc, { color: colors.textSecondary }]}
              >
                Re-lock when switching or leaving app
              </Text>
            </View>
          </View>
          <Switch
            value={settings.lockOnBackground}
            onValueChange={(val) => {
              triggerHaptic();
              setLockOnBackground(val);
            }}
            trackColor={{
              false: isDark ? "#333835" : "#D1D5DB",
              true: colors.matchaLime,
            }}
            thumbColor={settings.lockOnBackground ? "#141715" : "#F9FAFB"}
            disabled={!settings.biometricEnabled && !settings.passcodeEnabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardBox: {
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: FONTS.sansSemiBold,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 11,
    fontFamily: FONTS.sansRegular,
  },
});
