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
  glowHeight = 360,
  topOffset = -60,
  intensity = 1,
}) => {
  const { isDark } = useAppTheme();

  // Reference design palette: warm amber/apricot glow in light, deep sunset ember in dark
  const color1 = glowColor || (isDark ? '#E07A5F' : '#F4A261');
  const color2 = isDark ? '#D97706' : '#F2CC8F';
  const opacity1 = (isDark ? 0.26 : 0.42) * intensity;
  const opacity2 = (isDark ? 0.12 : 0.18) * intensity;

  return (
    <View style={[styles.container, { height: glowHeight, top: topOffset }]} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient
            id="ambientWarmGlow"
            cx="50%"
            cy="25%"
            rx="75%"
            ry="65%"
            fx="50%"
            fy="20%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={color1} stopOpacity={opacity1} />
            <Stop offset="45%" stopColor={color2} stopOpacity={opacity2} />
            <Stop offset="85%" stopColor={color2} stopOpacity="0.04" />
            <Stop offset="100%" stopColor={color1} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={glowHeight} fill="url(#ambientWarmGlow)" />
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
