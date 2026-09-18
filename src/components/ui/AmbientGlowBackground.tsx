import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '../../context/theme-context';

const { width } = Dimensions.get('window');

interface AmbientGlowProps {
  glowColor?: string;
  glowHeight?: number;
  topOffset?: number;
  intensity?: number;
}

export const AmbientGlowBackground: React.FC<AmbientGlowProps> = ({
  glowColor,
  glowHeight = 420,
  topOffset = -50,
  intensity = 1,
}) => {
  const { isDark } = useAppTheme();

  // Unified 5-Tone Glassmorphism Palette:
  // Tangerine Dream (#E39774), Blue Slate (#326273), Palm Leaf (#899D78)
  const tangerine = '#E39774';
  const slate = '#326273';
  const palmLeaf = '#899D78';

  const opTangerine = (isDark ? 0.26 : 0.36) * intensity;
  const opSlate = (isDark ? 0.22 : 0.28) * intensity;
  const opPalm = (isDark ? 0.14 : 0.20) * intensity;

  return (
    <View style={[styles.container, { height: glowHeight, top: topOffset }]} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          {/* Top-right warm luminous Tangerine Dream aura */}
          <RadialGradient
            id="ambientTangerine"
            cx="80%"
            cy="18%"
            rx="65%"
            ry="60%"
            fx="80%"
            fy="12%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={glowColor || tangerine} stopOpacity={opTangerine} />
            <Stop offset="50%" stopColor={glowColor || tangerine} stopOpacity={opTangerine * 0.4} />
            <Stop offset="100%" stopColor={glowColor || tangerine} stopOpacity="0" />
          </RadialGradient>

          {/* Top-left cool Blue Slate aura */}
          <RadialGradient
            id="ambientSlate"
            cx="15%"
            cy="22%"
            rx="65%"
            ry="60%"
            fx="15%"
            fy="15%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={slate} stopOpacity={opSlate} />
            <Stop offset="55%" stopColor={slate} stopOpacity={opSlate * 0.35} />
            <Stop offset="100%" stopColor={slate} stopOpacity="0" />
          </RadialGradient>

          {/* Center-bottom soft Palm Leaf mist */}
          <RadialGradient
            id="ambientPalm"
            cx="50%"
            cy="65%"
            rx="60%"
            ry="45%"
            fx="50%"
            fy="55%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={palmLeaf} stopOpacity={opPalm} />
            <Stop offset="55%" stopColor={palmLeaf} stopOpacity={opPalm * 0.3} />
            <Stop offset="100%" stopColor={palmLeaf} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width={width} height={glowHeight} fill="url(#ambientSlate)" />
        <Rect x="0" y="0" width={width} height={glowHeight} fill="url(#ambientTangerine)" />
        <Rect x="0" y="0" width={width} height={glowHeight} fill="url(#ambientPalm)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: -1,
  },
});
