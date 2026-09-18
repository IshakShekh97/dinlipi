import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { AppLogo } from './AppLogo';
import { useAppTheme } from '../../context/theme-context';

interface AnimatedSplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export function AnimatedSplashScreen({
  onFinish,
  minDurationMs = 1500,
}: AnimatedSplashScreenProps) {
  const { isDark } = useAppTheme();
  const [isVisible, setIsVisible] = useState(true);

  // Animations
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const auraScale = useSharedValue(0.8);
  const auraOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(16);
  const screenOpacity = useSharedValue(1);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    if (onFinish) {
      onFinish();
    }
  }, [onFinish]);

  useEffect(() => {
    // 1. Entrance animation
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 90,
      mass: 0.8,
    });

    // 2. Aura breathing loop
    auraOpacity.value = withSequence(
      withTiming(0.4, { duration: 500 }),
      withRepeat(
        withSequence(
          withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    auraScale.value = withSequence(
      withTiming(1, { duration: 500 }),
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // 3. Text entrance with slight delay
    textOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
    textTranslateY.value = withDelay(
      400,
      withSpring(0, { damping: 14, stiffness: 100 })
    );

    // 4. Exit transition after minDurationMs
    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(handleComplete)();
        }
      });
    }, minDurationMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDurationMs, handleComplete]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const auraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
    opacity: auraOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  if (!isVisible) return null;

  const bgColor = isDark ? '#020202' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#020202';
  const subtextColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(2,2,2,0.55)';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor },
        screenAnimatedStyle,
      ]}
      pointerEvents="auto"
    >
      {/* Soft radial aura / breathing glow */}
      <Animated.View
        style={[
          styles.aura,
          {
            backgroundColor: isDark ? 'rgba(227, 151, 116, 0.45)' : 'rgba(50, 98, 115, 0.35)',
          },
          auraAnimatedStyle,
        ]}
      />

      {/* Main Logo & Emblem */}
      <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
        <AppLogo variant="icon" size="xl" />
      </Animated.View>

      {/* Brand Name & Tagline */}
      <Animated.View style={[styles.textWrapper, textAnimatedStyle]}>
        <Text style={[styles.brandName, { color: textColor }]}>dinlipi</Text>
        <Text style={[styles.brandTagline, { color: subtextColor }]}>
          mindful khata & cozy ledger
        </Text>
      </Animated.View>

      {/* Cozy offline indicator at bottom */}
      <View style={styles.footer}>
        <View style={styles.dot} />
        <Text style={[styles.footerText, { color: subtextColor }]}>100% Offline & Private</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    filter: 'blur(45px)',
  },
  logoWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CEF04A',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
