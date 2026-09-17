import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../context/theme-context';

interface AnimatedPinDotsProps {
  pinLength: number;
  maxLength?: number;
  hasError?: boolean;
}

function Dot({ isFilled, isLatest }: { isFilled: boolean; isLatest: boolean }) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isLatest) {
      scale.value = withSequence(
        withTiming(1.35, { duration: 90 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    }
  }, [isLatest, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          borderColor: isFilled ? colors.matchaLime : colors.borderMedium,
          backgroundColor: isFilled ? colors.matchaLime : 'transparent',
        },
        animatedStyle,
      ]}
    />
  );
}

export function AnimatedPinDots({
  pinLength,
  maxLength = 4,
  hasError = false,
}: AnimatedPinDotsProps) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (hasError) {
      shakeX.value = withSequence(
        withTiming(-14, { duration: 60 }),
        withTiming(14, { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [hasError, shakeX]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Animated.View style={[styles.dotsRow, containerAnimatedStyle]}>
      {Array.from({ length: maxLength }).map((_, i) => (
        <Dot key={i} isFilled={pinLength > i} isLatest={pinLength === i + 1} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginVertical: 18,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
});
