import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { useAppTheme } from '../../context/theme-context';
import { FONTS, triggerHaptic } from '../../constants/theme';

export type AppButtonVariant =
  | 'primary'      // Palm Leaf Green
  | 'secondary'    // Subtle Glass/Card Surface
  | 'accent'       // Blue Slate
  | 'danger'       // Oxidized Iron
  | 'warning'      // Tangerine Dream
  | 'pill'         // Capsule Action Pill
  | 'ghost';       // Subtle Borderless

export type AppButtonSize = 'sm' | 'md' | 'lg' | 'pill';

export interface AppButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  hapticFeedback = 'light',
}) => {
  const { colors, isDark } = useAppTheme();
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96, // exact scale prescribed by better-ui
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic(hapticFeedback);
    onPress();
  };

  // Determine variant-specific colors from unified 5-tone theme
  let bgColor = colors.palmLeaf;
  let borderColor = 'transparent';
  let textColor = isDark ? '#020202' : '#FFFFFF';
  let borderWidth = 0;

  switch (variant) {
    case 'primary':
      bgColor = colors.palmLeaf;
      borderColor = colors.palmLeaf;
      textColor = isDark ? '#020202' : '#FFFFFF';
      break;

    case 'secondary':
      bgColor = isDark ? colors.cardSecondary : '#F4F7F2';
      borderColor = isDark ? colors.borderSubtle : '#E1E8DE';
      borderWidth = 1;
      textColor = colors.textPrimary;
      break;

    case 'accent':
      bgColor = colors.blueSlate;
      borderColor = colors.blueSlate;
      textColor = '#FFFFFF';
      break;

    case 'danger':
      bgColor = colors.oxidizedIron;
      borderColor = colors.oxidizedIron;
      textColor = '#FFFFFF';
      break;

    case 'warning':
      bgColor = colors.tangerineDream;
      borderColor = colors.tangerineDream;
      textColor = '#020202';
      break;

    case 'pill':
      bgColor = '#FFFFFF';
      borderColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)';
      borderWidth = 1;
      textColor = '#020202';
      break;

    case 'ghost':
      bgColor = 'transparent';
      borderColor = 'transparent';
      textColor = colors.textPrimary;
      break;
  }

  // Determine sizing tokens
  let height = 46;
  let paddingHorizontal = 18;
  let fontSize = 14;
  let borderRadius = 18;

  switch (size) {
    case 'sm':
      height = 36;
      paddingHorizontal = 12;
      fontSize = 12;
      borderRadius = 12;
      break;
    case 'md':
      height = 46;
      paddingHorizontal = 18;
      fontSize = 14;
      borderRadius = 18;
      break;
    case 'lg':
      height = 54;
      paddingHorizontal = 24;
      fontSize = 15;
      borderRadius = 22;
      break;
    case 'pill':
      height = 50;
      paddingHorizontal = 20;
      fontSize = 14;
      borderRadius = 25; // Capsule shape
      break;
  }

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { width: '100%' },
        style && (style as any).flex !== undefined && { flex: (style as any).flex },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.88}
        disabled={disabled || loading}
        style={[
          styles.baseButton,
          {
            height,
            paddingHorizontal,
            borderRadius,
            backgroundColor: disabled ? (isDark ? '#1C252B' : '#EAECE9') : bgColor,
            borderColor: disabled ? 'transparent' : borderColor,
            borderWidth,
          },
          fullWidth && { width: '100%' },
          style && (style as any).flex !== undefined && { width: '100%', flex: 1 },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <View style={styles.contentRow}>
            {iconLeft ? <View style={styles.iconLeftWrapper}>{iconLeft}</View> : null}
            <Text
              style={[
                styles.baseText,
                {
                  fontSize,
                  color: disabled ? colors.textMuted : textColor,
                },
                textStyle,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {iconRight ? <View style={styles.iconRightWrapper}>{iconRight}</View> : null}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  iconLeftWrapper: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRightWrapper: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
