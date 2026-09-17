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

  const PALETTE_SWATCHES = [
    { name: 'Palm Leaf', hex: '#899D78', role: 'Primary Green' },
    { name: 'Blue Slate', hex: '#326273', role: 'Cool Slate' },
    { name: 'Tangerine', hex: '#E39774', role: 'Warm Glow' },
    { name: 'Oxidized', hex: '#B02E0C', role: 'Rich Accent' },
    { name: 'Obsidian', hex: '#020202', role: 'Deep Base' },
  ];

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
          5-Tone Earth & Slate Palette • {isDark ? 'Obsidian Dark' : 'Pure White Light'}
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

        {/* 5-Tone Color Palette Swatch Strip */}
        <View style={styles.paletteSection}>
          <Text style={[styles.paletteHeading, { color: colors.textMuted }]}>
            Active 5-Tone Palette Swatches
          </Text>
          <View style={styles.paletteRow}>
            {PALETTE_SWATCHES.map((swatch) => (
              <View key={swatch.hex} style={styles.paletteCol}>
                <View
                  style={[
                    styles.swatchCircle,
                    {
                      backgroundColor: swatch.hex,
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                    },
                  ]}
                />
                <Text style={[styles.swatchHex, { color: colors.textPrimary }]} numberOfLines={1}>
                  {swatch.hex}
                </Text>
                <Text style={[styles.swatchName, { color: colors.textMuted }]} numberOfLines={1}>
                  {swatch.name}
                </Text>
              </View>
            ))}
          </View>
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
  paletteSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
  },
  paletteHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  paletteCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  swatchCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  swatchHex: {
    fontSize: 9.5,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  swatchName: {
    fontSize: 9,
    fontWeight: '600',
  },
});
