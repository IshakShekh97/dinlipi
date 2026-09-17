import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Smartphone, Sun, Moon } from 'lucide-react-native';
import { useAppTheme, ThemeMode } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';

export function ThemeSwitcher() {
  const { colors, isDark, themeMode, setThemeMode } = useAppTheme();

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Smartphone }[] = [
    { mode: 'system', label: 'System', icon: Smartphone },
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
  ];

  const handleThemeChange = async (mode: ThemeMode) => {
    triggerHaptic();
    await setThemeMode(mode);
  };

  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        Appearance & Theme
      </Text>

      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
            borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
          },
        ]}
      >
        <Text style={[styles.cardSubText, { color: colors.textSecondary }]}>
          Cozy Pastel Palette (Pure White Light & Dark Neutral Gray)
        </Text>

        <View
          style={[
            styles.themeRow,
            {
              backgroundColor: isDark ? colors.cardElevated : '#F4F4EE',
              borderColor: isDark ? colors.borderSubtle : '#EAEAE2',
            },
          ]}
        >
          {themeOptions.map((opt) => {
            const isActive = themeMode === opt.mode;
            const Icon = opt.icon;
            return (
              <TouchableOpacity
                key={opt.mode}
                onPress={() => handleThemeChange(opt.mode)}
                activeOpacity={0.7}
                style={[
                  styles.themeTab,
                  isActive && {
                    backgroundColor: colors.matchaLime,
                  },
                ]}
              >
                <Icon
                  size={15}
                  color={isActive ? '#141715' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.themeTabText,
                    {
                      color: isActive ? '#141715' : colors.textSecondary,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardSubText: {
    fontSize: 13,
    marginBottom: 14,
  },
  themeRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  themeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  themeTabText: {
    fontSize: 13,
  },
});
