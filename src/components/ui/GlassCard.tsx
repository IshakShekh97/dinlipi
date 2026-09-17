import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAppTheme } from '../../context/theme-context';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  intensity?: 'subtle' | 'medium' | 'high';
  borderGlowColor?: string;
}

export function GlassCard({
  children,
  style,
  borderRadius = 24,
  intensity = 'medium',
  borderGlowColor,
}: GlassCardProps) {
  const { isDark } = useAppTheme();

  // Glass opacity based on intensity
  const bgOpacity = {
    subtle: isDark ? 0.45 : 0.65,
    medium: isDark ? 0.72 : 0.85,
    high: isDark ? 0.88 : 0.95,
  }[intensity];

  const bgColor = isDark
    ? `rgba(28, 31, 29, ${bgOpacity})`
    : `rgba(255, 255, 255, ${bgOpacity})`;

  const borderColor = borderGlowColor || (isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(18, 20, 19, 0.08)');

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          backgroundColor: bgColor,
          borderColor,
        },
        style,
      ]}
    >
      {/* Specular Frosted Highlight Gradient */}
      <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="glassSheen" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop
                offset="0%"
                stopColor={isDark ? '#FFFFFF' : '#FFFFFF'}
                stopOpacity={isDark ? 0.08 : 0.45}
              />
              <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#glassSheen)" />
        </Svg>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
});
