import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../context/theme-context';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number | 'subtle' | 'medium' | 'high';
  borderRadius?: number;
  tint?: 'light' | 'dark' | 'default';
  elevated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 45,
  borderRadius = 26,
  tint,
  elevated = false,
}) => {
  const { isDark } = useAppTheme();
  const effectiveTint = tint || (isDark ? 'dark' : 'light');
  const numericIntensity =
    typeof intensity === 'number'
      ? intensity
      : intensity === 'subtle'
      ? 25
      : intensity === 'high'
      ? 70
      : 45;

  // Specular top light-reflecting border and soft translucent tint
  const fallbackBg = isDark
    ? elevated
      ? 'rgba(38, 42, 40, 0.82)'
      : 'rgba(25, 28, 27, 0.76)'
    : elevated
    ? 'rgba(255, 255, 255, 0.94)'
    : 'rgba(255, 255, 255, 0.84)';

  const borderColor = isDark
    ? elevated
      ? 'rgba(255, 255, 255, 0.16)'
      : 'rgba(255, 255, 255, 0.10)'
    : elevated
    ? 'rgba(255, 255, 255, 0.90)'
    : 'rgba(0, 0, 0, 0.06)';

  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderRadius,
          borderColor,
          backgroundColor: fallbackBg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: elevated ? 6 : 3 },
          shadowOpacity: isDark ? 0.22 : 0.06,
          shadowRadius: elevated ? 16 : 10,
          elevation: elevated ? 4 : 2,
        },
        style,
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'android' ? Math.min(numericIntensity, 30) : numericIntensity}
        tint={effectiveTint}
        style={[styles.blurWrapper, { borderRadius }]}
      >
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  blurWrapper: {
    width: '100%',
  },
});
