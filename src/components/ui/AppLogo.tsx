import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useAppTheme } from '../../context/theme-context';

export type LogoVariant = 'full' | 'icon' | 'header' | 'minimal';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface AppLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  color?: string;
  showSubtitle?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<LogoSize, { icon: number; fontSize: number; subtitleSize: number }> = {
  sm: { icon: 28, fontSize: 16, subtitleSize: 10 },
  md: { icon: 38, fontSize: 20, subtitleSize: 11 },
  lg: { icon: 54, fontSize: 26, subtitleSize: 13 },
  xl: { icon: 76, fontSize: 34, subtitleSize: 15 },
};

export function AppLogo({
  variant = 'icon',
  size = 'md',
  color,
  showSubtitle = true,
  style,
}: AppLogoProps) {
  const { colors, isDark } = useAppTheme();
  const dim = SIZE_MAP[size];

  // Dynamic colors
  const primaryBrand = color || colors.tangerineDream;
  const textColor = isDark ? '#FFFFFF' : '#020202';
  const subtextColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(2, 2, 2, 0.55)';
  const containerBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  // SVG Glyphs: Modern geometric interpretation of Bengali "দ" combined with ledger currency loop
  const renderGlyph = (iconSize: number) => {
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 100 100" fill="none">
        <Defs>
          {/* Main 5-Tone Gradient */}
          <LinearGradient id="dinlipiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E39774" />
            <Stop offset="50%" stopColor="#326273" />
            <Stop offset="100%" stopColor="#899D78" />
          </LinearGradient>

          {/* Accent Glow Gradient */}
          <LinearGradient id="glowGrad" x1="20%" y1="10%" x2="80%" y2="90%">
            <Stop offset="0%" stopColor="#E39774" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#326273" stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {/* Soft Background Plate */}
        <Rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="26"
          fill={isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF'}
          stroke={borderColor}
          strokeWidth="1.5"
        />

        {/* Outer subtle glow */}
        <Circle cx="50" cy="50" r="38" fill="url(#glowGrad)" opacity={0.18} />

        {/* The 'দ' Emblem & Cozy Ledger Loop */}
        <G transform="translate(18, 18)">
          {/* Top horizontal ledger bar */}
          <Path
            d="M 6 12 Q 32 10 58 12"
            stroke="url(#dinlipiGrad)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Downward stroke forming the spine of 'দ' */}
          <Path
            d="M 18 12 C 18 28, 22 36, 42 38 C 54 39, 58 46, 52 56 C 45 64, 20 64, 12 50 C 7 42, 10 32, 18 30"
            stroke="url(#dinlipiGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Floating Coin / Dot Accent */}
          <Circle cx="54" cy="22" r="5" fill="#E07A5F" />
          <Circle cx="54" cy="22" r="2.5" fill="#FFFFFF" opacity={0.8} />

          {/* Sparkle micro-indicator */}
          <Circle cx="12" cy="12" r="2" fill="#CEF04A" />
        </G>
      </Svg>
    );
  };

  if (variant === 'minimal') {
    return (
      <View style={style}>
        {renderGlyph(dim.icon)}
      </View>
    );
  }

  if (variant === 'icon') {
    return (
      <View
        style={[
          styles.iconContainer,
          {
            width: dim.icon + 12,
            height: dim.icon + 12,
            borderRadius: (dim.icon + 12) * 0.32,
            backgroundColor: containerBg,
            borderColor: borderColor,
          },
          style,
        ]}
      >
        {renderGlyph(dim.icon)}
      </View>
    );
  }

  if (variant === 'header') {
    return (
      <View style={[styles.headerRow, style]}>
        {renderGlyph(dim.icon)}
        <View style={styles.headerTextCol}>
          <Text style={[styles.headerTitle, { fontSize: dim.fontSize, color: textColor }]}>
            dinlipi
          </Text>
          <Text style={[styles.headerBadge, { color: primaryBrand }]}>khata</Text>
        </View>
      </View>
    );
  }

  // Full Variant
  return (
    <View style={[styles.fullCol, style]}>
      {renderGlyph(dim.icon)}
      <View style={styles.fullTextCol}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { fontSize: dim.fontSize, color: textColor }]}>dinlipi</Text>
          <View style={[styles.pillBadge, { backgroundColor: 'rgba(206, 240, 74, 0.16)' }]}>
            <Text style={[styles.pillText, { color: primaryBrand }]}>PRO</Text>
          </View>
        </View>
        {showSubtitle && (
          <Text style={[styles.subtitle, { fontSize: dim.subtitleSize, color: subtextColor }]}>
            Cozy Offline Ledger
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTextCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fullCol: {
    alignItems: 'center',
    gap: 8,
  },
  fullTextCol: {
    alignItems: 'center',
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
