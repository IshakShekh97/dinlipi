import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { useAppTheme } from '../../context/theme-context';

interface SadEmptyAnimationProps {
  size?: number;
  variant?: 'sad' | 'empty' | 'search';
}

export function SadEmptyAnimation({ size = 110, variant = 'empty' }: SadEmptyAnimationProps) {
  const { colors, isDark } = useAppTheme();

  // Floating bounce & gentle sway
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const tearOpacity = useSharedValue(0.2);
  const tearTranslateY = useSharedValue(0);

  useEffect(() => {
    // 1. Gentle floating motion
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(4, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // 2. Subtle rotation sway
    rotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // 3. Tear drop drip/pulse
    tearTranslateY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(14, { duration: 1800, easing: Easing.in(Easing.quad) })
      ),
      -1,
      false
    );
    tearOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 400 }),
        withTiming(0, { duration: 1800, easing: Easing.out(Easing.quad) })
      ),
      -1,
      false
    );
  }, [rotate, tearOpacity, tearTranslateY, translateY]);

  const animatedBodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const animatedTearStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tearTranslateY.value }],
    opacity: tearOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Floating Soft Shadow */}
      <View
        style={[
          styles.groundShadow,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(50, 98, 115, 0.1)',
            width: size * 0.7,
          },
        ]}
      />

      <Animated.View style={[styles.bodyWrapper, animatedBodyStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            {/* Claymorphic Surface Gradient */}
            <LinearGradient id="clayBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop
                offset="0%"
                stopColor={isDark ? '#242E35' : '#FFFFFF'}
                stopOpacity="1"
              />
              <Stop
                offset="100%"
                stopColor={isDark ? '#141A1E' : '#E8EEF1'}
                stopOpacity="1"
              />
            </LinearGradient>

            {/* Specular Highlight */}
            <LinearGradient id="clayHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDark ? '0.22' : '0.7'} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Clay Character Body */}
          <Rect
            x="12"
            y="14"
            width="76"
            height="72"
            rx="28"
            fill="url(#clayBodyGrad)"
            stroke={isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(50, 98, 115, 0.15)'}
            strokeWidth="1.5"
          />

          {/* Top Specular Inner Rim */}
          <Rect
            x="14"
            y="16"
            width="72"
            height="26"
            rx="20"
            fill="url(#clayHighlight)"
          />

          {/* Drooping expressive sad eyes */}
          {variant === 'search' ? (
            // Curious / searching eyes
            <>
              <Circle cx="36" cy="46" r="5" fill={colors.blueSlate} />
              <Circle cx="64" cy="46" r="5" fill={colors.blueSlate} />
              <Circle cx="38" cy="44" r="2" fill="#FFFFFF" />
              <Circle cx="66" cy="44" r="2" fill="#FFFFFF" />
              {/* Neutral small question mouth */}
              <Circle cx="50" cy="62" r="3.5" fill={colors.blueSlate} />
            </>
          ) : (
            // Sympathetic drooping eyes
            <>
              <Path
                d="M 30 46 Q 36 41 42 46"
                stroke={colors.blueSlate}
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M 58 46 Q 64 41 70 46"
                stroke={colors.blueSlate}
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Gentle down-turned mouth */}
              <Path
                d="M 44 65 Q 50 59 56 65"
                stroke={colors.blueSlate}
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Soft Blushing Cheeks in Tangerine Dream */}
              <Circle cx="26" cy="54" r="4.5" fill={colors.tangerineDream} opacity={0.4} />
              <Circle cx="74" cy="54" r="4.5" fill={colors.tangerineDream} opacity={0.4} />
            </>
          )}
        </Svg>

        {/* Animated single tear drop */}
        {variant !== 'search' && (
          <Animated.View style={[styles.tearDrop, animatedTearStyle]}>
            <View
              style={[
                styles.tearPill,
                { backgroundColor: colors.blueSlate },
              ]}
            />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  groundShadow: {
    position: 'absolute',
    bottom: 2,
    height: 10,
    borderRadius: 5,
  },
  bodyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tearDrop: {
    position: 'absolute',
    left: 28,
    top: 50,
  },
  tearPill: {
    width: 4,
    height: 7,
    borderRadius: 3.5,
  },
});
