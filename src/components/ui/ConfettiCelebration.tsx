import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useUIStore } from '../../store/ui-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#E39774', // Tangerine Dream
  '#326273', // Blue Slate
  '#899D78', // Palm Leaf
  '#B02E0C', // Oxidized Iron
  '#FFFFFF', // Pure Specular White
  '#F5B495', // Tangerine Tint
  '#5D99B0', // Slate Frost
];

const NUM_CONFETTI = 45;

interface ParticleConfig {
  startX: number;
  driftX: number;
  targetY: number;
  color: string;
  size: number;
  isCircle: boolean;
  delay: number;
  duration: number;
  rotateDeg: number;
}

// Pre-compute static particle positions & trajectories to guarantee pure component renders
const STATIC_PARTICLES: ParticleConfig[] = Array.from({ length: NUM_CONFETTI }).map((_, i) => {
  const seed1 = ((i * 37 + 13) % 100) / 100;
  const seed2 = ((i * 59 + 23) % 100) / 100;
  const seed3 = ((i * 71 + 47) % 100) / 100;
  const seed4 = ((i * 83 + 61) % 100) / 100;
  const seed5 = ((i * 97 + 79) % 100) / 100;

  return {
    startX: (seed1 * 0.8 + 0.1) * SCREEN_WIDTH,
    driftX: (seed2 - 0.5) * 180,
    targetY: SCREEN_HEIGHT * (0.65 + seed3 * 0.35),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 7 + seed4 * 7,
    isCircle: i % 3 === 0,
    delay: seed5 * 300,
    duration: 1800 + seed1 * 800,
    rotateDeg: (seed2 - 0.5) * 1080,
  };
});

interface ParticleProps {
  config: ParticleConfig;
  active: boolean;
}

function ConfettiParticle({ config, active }: ParticleProps) {
  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(config.startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (active) {
      translateY.value = -40;
      translateX.value = config.startX;
      rotation.value = 0;
      opacity.value = 1;

      translateY.value = withDelay(
        config.delay,
        withTiming(config.targetY, { duration: config.duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      );
      translateX.value = withDelay(
        config.delay,
        withTiming(config.startX + config.driftX, { duration: config.duration, easing: Easing.inOut(Easing.quad) })
      );
      rotation.value = withDelay(
        config.delay,
        withTiming(config.rotateDeg, { duration: config.duration, easing: Easing.linear })
      );
      opacity.value = withDelay(
        config.delay + config.duration * 0.6,
        withTiming(0, { duration: config.duration * 0.4, easing: Easing.out(Easing.quad) })
      );
    }
  }, [active, config, opacity, rotation, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (!active) return null;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.isCircle ? config.size : config.size * 1.6,
          borderRadius: config.isCircle ? config.size / 2 : 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function ConfettiCelebration() {
  const confettiTrigger = useUIStore((state) => state.confettiTrigger);
  const [activeTrigger, setActiveTrigger] = useState(0);

  useEffect(() => {
    if (confettiTrigger > 0) {
      const timer1 = setTimeout(() => {
        setActiveTrigger(confettiTrigger);
      }, 0);
      const timer2 = setTimeout(() => {
        setActiveTrigger(0);
      }, 3000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [confettiTrigger]);

  if (activeTrigger === 0) return null;

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STATIC_PARTICLES.map((config, i) => (
        <ConfettiParticle key={`confetti-${activeTrigger}-${i}`} config={config} active={activeTrigger > 0} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
});
