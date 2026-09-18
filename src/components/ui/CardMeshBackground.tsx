import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
  Polygon,
} from 'react-native-svg';
import { CURATED_MESH_PRESETS, ShapePatternType } from '../../utils/meshGenerator';

export type CardThemeVariant =
  | 'palmLeaf'
  | 'blueSlate'
  | 'tangerine'
  | 'oxidizedIron'
  | 'obsidian'
  | 'tangerineAurora'
  | 'blueNordic'
  | 'oxidizedSunset'
  | 'palmAurora'
  | 'obsidianGlass'
  | 'terracottaDawn'
  | 'slateMist'
  | 'ironFlame'
  | 'matchaLime'
  | 'terracotta'
  | 'mossSage'
  | 'goldenHoney'
  | 'darkGraphite'
  | 'porcelain'
  | 'custom'
  | string;

export type { ShapePatternType };

interface CardMeshBackgroundProps {
  variant?: CardThemeVariant;
  customGradient?: [string, string, string];
  shapePattern?: ShapePatternType;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  glassSheen?: boolean;
}

export const CardMeshBackground: React.FC<CardMeshBackgroundProps> = ({
  variant = 'tangerineAurora',
  customGradient,
  shapePattern,
  width = '100%',
  height = '100%',
  borderRadius = 28,
  glassSheen = true,
}) => {
  // Check if variant matches one of the curated mesh presets
  const matchedPreset = CURATED_MESH_PRESETS.find((p) => p.id === variant);

  // Effective gradient: customGradient > matchedPreset.gradient > fallback
  const effectiveGradient: [string, string, string] = customGradient
    ? customGradient
    : matchedPreset
    ? matchedPreset.gradient
    : variant === 'blueSlate'
    ? ['#326273', '#5D99B0', '#142B33']
    : variant === 'tangerine'
    ? ['#E39774', '#F5B495', '#A84E29']
    : variant === 'oxidizedIron'
    ? ['#B02E0C', '#E65832', '#541000']
    : variant === 'obsidian'
    ? ['#263038', '#12181C', '#020202']
    : variant === 'palmLeaf'
    ? ['#899D78', '#A2B591', '#4A5B3B']
    : variant === 'terracotta'
    ? ['#E39774', '#B02E0C', '#661601']
    : variant === 'mossSage'
    ? ['#899D78', '#326273', '#16282F']
    : ['#E39774', '#326273', '#020202']; // Default Tangerine Aurora

  const effectiveShape: ShapePatternType = shapePattern
    ? shapePattern
    : matchedPreset
    ? matchedPreset.shape
    : 'waves';

  const fallbackBaseBg = effectiveGradient[0] || '#020202';

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { borderRadius, overflow: 'hidden' },
      ]}
      pointerEvents="none"
    >
      <Svg width={width} height={height} viewBox="0 0 400 240" preserveAspectRatio="none">
        <Defs>
          {/* Glass Specular Sheen Gradient with soft angle and specular reflection */}
          <LinearGradient id="glassSpecular" x1="0%" y1="0%" x2="100%" y2="80%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.10" />
            <Stop offset="65%" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
          </LinearGradient>

          {/* Dynamic Mesh Linear Background Base */}
          <LinearGradient id="bgMeshBase" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={effectiveGradient[0]} />
            <Stop offset="55%" stopColor={effectiveGradient[1]} />
            <Stop offset="100%" stopColor={effectiveGradient[2]} />
          </LinearGradient>

          {/* Primary Top-Left Ambient Orb */}
          <RadialGradient id="meshRadial1" cx="20%" cy="25%" rx="70%" ry="70%">
            <Stop offset="0%" stopColor={effectiveGradient[0]} stopOpacity="0.85" />
            <Stop offset="65%" stopColor={effectiveGradient[1]} stopOpacity="0.30" />
            <Stop offset="100%" stopColor={effectiveGradient[1]} stopOpacity="0" />
          </RadialGradient>

          {/* Secondary Bottom-Right Ambient Orb */}
          <RadialGradient id="meshRadial2" cx="85%" cy="80%" rx="70%" ry="70%">
            <Stop offset="0%" stopColor={effectiveGradient[2]} stopOpacity="0.85" />
            <Stop offset="70%" stopColor={effectiveGradient[2]} stopOpacity="0" />
          </RadialGradient>

          {/* Aurora Glow Gradient */}
          <LinearGradient id="auroraBeam" x1="20%" y1="0%" x2="80%" y2="100%">
            <Stop offset="0%" stopColor={effectiveGradient[0]} stopOpacity="0.6" />
            <Stop offset="50%" stopColor={effectiveGradient[1]} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={effectiveGradient[2]} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* 0. Fallback Base Fill: Ensures zero missing or transparent card backdrops */}
        <Rect x="0" y="0" width="400" height="240" fill={fallbackBaseBg} />

        {/* 1. Base Gradient Foundation */}
        <Rect x="0" y="0" width="400" height="240" fill="url(#bgMeshBase)" />

        {/* 2. Procedural Mesh Shapes based on shape pattern */}
        {effectiveShape === 'aurora' && (
          <>
            <Path
              d="M -40 80 Q 90 -20 220 70 T 440 20 L 440 260 L -40 260 Z"
              fill={effectiveGradient[1]}
              opacity={0.42}
            />
            <Path
              d="M -30 160 Q 140 70 280 170 T 440 130 L 440 260 L -30 260 Z"
              fill={effectiveGradient[2]}
              opacity={0.45}
            />
            <Circle cx="330" cy="45" r="110" fill="url(#meshRadial1)" opacity={0.7} />
            <Circle cx="70" cy="200" r="100" fill="url(#meshRadial2)" opacity={0.65} />
          </>
        )}

        {effectiveShape === 'waves' && (
          <>
            <Path
              d="M -20 120 Q 110 40 220 130 T 420 70 L 420 260 L -20 260 Z"
              fill={effectiveGradient[1]}
              opacity={0.36}
            />
            <Path
              d="M -20 170 Q 140 100 270 190 T 420 160 L 420 260 L -20 260 Z"
              fill={effectiveGradient[2]}
              opacity={0.46}
            />
            <Circle cx="320" cy="50" r="95" fill="url(#meshRadial2)" opacity={0.7} />
          </>
        )}

        {effectiveShape === 'fluid' && (
          <>
            <Path
              d="M -30 20 C 100 120, 160 -40, 290 80 S 430 40, 440 160 L 440 260 L -30 260 Z"
              fill={effectiveGradient[1]}
              opacity={0.38}
            />
            <Circle cx="310" cy="180" r="120" fill="url(#meshRadial2)" opacity={0.75} />
            <Circle cx="90" cy="60" r="120" fill="url(#meshRadial1)" opacity={0.8} />
          </>
        )}

        {effectiveShape === 'orbs' && (
          <>
            <Circle cx="85" cy="65" r="150" fill="url(#meshRadial1)" />
            <Circle cx="320" cy="180" r="140" fill="url(#meshRadial2)" />
            <Circle cx="220" cy="110" r="80" fill={effectiveGradient[0]} opacity={0.38} />
            <Circle cx="320" cy="45" r="50" fill="#FFFFFF" opacity={0.20} />
          </>
        )}

        {effectiveShape === 'geometry' && (
          <>
            <Polygon points="160,-20 420,160 420,-20" fill={effectiveGradient[1]} opacity={0.34} />
            <Polygon points="-20,110 180,260 -20,260" fill={effectiveGradient[2]} opacity={0.40} />
            <Polygon points="210,110 260,60 310,110 260,160" fill={effectiveGradient[0]} opacity={0.30} />
            <Circle cx="340" cy="190" r="70" fill="url(#meshRadial2)" opacity={0.6} />
          </>
        )}

        {effectiveShape === 'arcs' && (
          <>
            <Circle cx="370" cy="40" r="90" stroke={effectiveGradient[1]} strokeWidth="26" fill="none" opacity={0.34} />
            <Circle cx="370" cy="40" r="145" stroke={effectiveGradient[2]} strokeWidth="18" fill="none" opacity={0.25} />
            <Circle cx="40" cy="200" r="115" stroke={effectiveGradient[0]} strokeWidth="32" fill="none" opacity={0.28} />
            <Circle cx="90" cy="70" r="110" fill="url(#meshRadial1)" opacity={0.55} />
          </>
        )}

        {effectiveShape === 'ribbons' && (
          <>
            <Path
              d="M -30 40 Q 120 10 240 120 T 430 130 L 430 190 Q 240 180 120 70 T -30 100 Z"
              fill={effectiveGradient[1]}
              opacity={0.38}
            />
            <Path
              d="M 50 -20 Q 200 80 300 30 T 440 80 L 440 130 Q 300 80 200 130 T 50 30 Z"
              fill={effectiveGradient[2]}
              opacity={0.34}
            />
            <Circle cx="70" cy="180" r="95" fill="url(#meshRadial1)" opacity={0.55} />
          </>
        )}

        {/* 3. Glassmorphic Specular Highlight Overlay */}
        {glassSheen && (
          <Rect x="0" y="0" width="400" height="240" fill="url(#glassSpecular)" />
        )}
      </Svg>
    </View>
  );
};
