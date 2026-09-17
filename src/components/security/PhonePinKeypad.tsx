/* eslint-disable react-hooks/immutability */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Delete, Fingerprint } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';

interface KeyConfig {
  key: string;
  sub: string;
}

const PHONE_KEYS: KeyConfig[] = [
  { key: '1', sub: '' },
  { key: '2', sub: 'A B C' },
  { key: '3', sub: 'D E F' },
  { key: '4', sub: 'G H I' },
  { key: '5', sub: 'J K L' },
  { key: '6', sub: 'M N O' },
  { key: '7', sub: 'P Q R S' },
  { key: '8', sub: 'T U V' },
  { key: '9', sub: 'W X Y Z' },
];

interface AnimatedKeyProps {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  bg?: string;
  borderColor?: string;
}

function AnimatedKey({ onPress, disabled, children, bg, borderColor }: AnimatedKeyProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(0.91, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 220 });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={styles.keyTouchArea}
    >
      <Animated.View
        style={[
          styles.keyCircle,
          {
            backgroundColor: bg || 'rgba(255, 255, 255, 0.06)',
            borderColor: borderColor || 'transparent',
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

interface PhonePinKeypadProps {
  onKeyPress: (val: string) => void;
  onDelete: () => void;
  onBiometricPress?: () => void;
  showBiometric?: boolean;
  disabled?: boolean;
}

export function PhonePinKeypad({
  onKeyPress,
  onDelete,
  onBiometricPress,
  showBiometric = false,
  disabled = false,
}: PhonePinKeypadProps) {
  const { colors, isDark } = useAppTheme();

  const keyBg = isDark ? '#1C1F1D' : '#FFFFFF';
  const keyBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(18,20,19,0.08)';
  const textColor = colors.textPrimary;
  const subColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(18,20,19,0.4)';

  return (
    <View style={styles.grid}>
      {PHONE_KEYS.map((item) => (
        <AnimatedKey
          key={item.key}
          onPress={() => {
            triggerHaptic('light');
            onKeyPress(item.key);
          }}
          disabled={disabled}
          bg={keyBg}
          borderColor={keyBorder}
        >
          <Text style={[styles.numberText, { color: textColor }]}>{item.key}</Text>
          {item.sub ? (
            <Text style={[styles.subText, { color: subColor }]}>{item.sub}</Text>
          ) : (
            <View style={{ height: 10 }} />
          )}
        </AnimatedKey>
      ))}

      {/* Row 4: Biometric / Empty, '0', Delete */}
      {showBiometric && onBiometricPress ? (
        <AnimatedKey
          onPress={() => {
            triggerHaptic('medium');
            onBiometricPress();
          }}
          bg={'rgba(206, 240, 74, 0.14)'}
          borderColor={'rgba(206, 240, 74, 0.3)'}
        >
          <Fingerprint size={28} color={colors.matchaLime} strokeWidth={2.2} />
        </AnimatedKey>
      ) : (
        <View style={styles.keyTouchArea} />
      )}

      <AnimatedKey
        onPress={() => {
          triggerHaptic('light');
          onKeyPress('0');
        }}
        disabled={disabled}
        bg={keyBg}
        borderColor={keyBorder}
      >
        <Text style={[styles.numberText, { color: textColor }]}>0</Text>
        <Text style={[styles.subText, { color: subColor }]}>+</Text>
      </AnimatedKey>

      <AnimatedKey
        onPress={() => {
          triggerHaptic('light');
          onDelete();
        }}
        bg={keyBg}
        borderColor={keyBorder}
      >
        <Delete size={24} color={textColor} strokeWidth={1.8} />
      </AnimatedKey>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
    gap: 16,
    alignSelf: 'center',
  },
  keyTouchArea: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  numberText: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  subText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 1,
  },
});
