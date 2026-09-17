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

export type CardThemeVariant =
  | 'palmLeaf'
  | 'blueSlate'
  | 'tangerine'
  | 'oxidizedIron'
  | 'obsidian'
  | 'matchaLime'
  | 'terracotta'
  | 'mossSage'
  | 'goldenHoney'
  | 'darkGraphite'
  | 'porcelain'
  | 'custom'
  | string;

export type ShapePatternType = 'waves' | 'orbs' | 'geometry' | 'arcs' | 'ribbons';

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
  variant = 'palmLeaf',
  customGradient,
  shapePattern = 'waves',
  width = '100%',
  height = '100%',
  borderRadius = 28,
  glassSheen = true,
}) => {
  // Guaranteed base fallback color to prevent missing backdrop
  const getFallbackBaseColor = (): string => {
    if (customGradient && customGradient[0]) return customGradient[0];
    switch (variant) {
      case 'palmLeaf':
        return '#899D78';
      case 'blueSlate':
        return '#326273';
      case 'tangerine':
        return '#E39774';
      case 'oxidizedIron':
        return '#B02E0C';
      case 'obsidian':
        return '#020202';
      case 'matchaLime':
        return '#CEF04A';
      case 'terracotta':
        return '#E07A5F';
      case 'mossSage':
        return '#81B29A';
      case 'goldenHoney':
        return '#F2CC8F';
      case 'darkGraphite':
        return '#252927';
      case 'porcelain':
        return '#F4F4EE';
      default:
        return '#899D78';
    }
  };

  const fallbackBaseBg = getFallbackBaseColor();

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
          {/* Glass Specular Sheen Gradient */}
          <LinearGradient id="glassSpecular" x1="0%" y1="0%" x2="100%" y2="80%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <Stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </LinearGradient>

          {/* PALETTE 1: Palm Leaf Primary Green */}
          <LinearGradient id="bgPalmLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9BB08A" />
            <Stop offset="50%" stopColor="#899D78" />
            <Stop offset="100%" stopColor="#6E825D" />
          </LinearGradient>
          <RadialGradient id="palmMesh1" cx="20%" cy="20%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#BFD3B0" stopOpacity="0.85" />
            <Stop offset="65%" stopColor="#899D78" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#6E825D" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="palmMesh2" cx="85%" cy="85%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#536643" stopOpacity="0.65" />
            <Stop offset="100%" stopColor="#536643" stopOpacity="0" />
          </RadialGradient>

          {/* PALETTE 2: Blue Slate */}
          <LinearGradient id="bgBlueSlate" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#41788C" />
            <Stop offset="50%" stopColor="#326273" />
            <Stop offset="100%" stopColor="#204452" />
          </LinearGradient>
          <RadialGradient id="blueSlateMesh1" cx="80%" cy="25%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#5D99B0" stopOpacity="0.8" />
            <Stop offset="70%" stopColor="#326273" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blueSlateMesh2" cx="15%" cy="80%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#142B33" stopOpacity="0.7" />
            <Stop offset="70%" stopColor="#142B33" stopOpacity="0" />
          </RadialGradient>

          {/* PALETTE 3: Tangerine Dream */}
          <LinearGradient id="bgTangerine" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F5B495" />
            <Stop offset="50%" stopColor="#E39774" />
            <Stop offset="100%" stopColor="#C9734D" />
          </LinearGradient>
          <RadialGradient id="tangerineMesh1" cx="20%" cy="25%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#FFE0D1" stopOpacity="0.8" />
            <Stop offset="70%" stopColor="#E39774" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="tangerineMesh2" cx="85%" cy="80%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#A84E29" stopOpacity="0.6" />
            <Stop offset="70%" stopColor="#A84E29" stopOpacity="0" />
          </RadialGradient>

          {/* PALETTE 4: Oxidized Iron */}
          <LinearGradient id="bgOxidizedIron" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#C73E1B" />
            <Stop offset="50%" stopColor="#B02E0C" />
            <Stop offset="100%" stopColor="#7E1C03" />
          </LinearGradient>
          <RadialGradient id="oxidizedMesh1" cx="80%" cy="20%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#E65832" stopOpacity="0.75" />
            <Stop offset="70%" stopColor="#B02E0C" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="oxidizedMesh2" cx="20%" cy="85%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#541000" stopOpacity="0.8" />
            <Stop offset="70%" stopColor="#541000" stopOpacity="0" />
          </RadialGradient>

          {/* PALETTE 5: Obsidian Black */}
          <LinearGradient id="bgObsidian" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1E2321" />
            <Stop offset="50%" stopColor="#0F1211" />
            <Stop offset="100%" stopColor="#020202" />
          </LinearGradient>
          <RadialGradient id="obsidianMesh1" cx="25%" cy="25%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#38403C" stopOpacity="0.6" />
            <Stop offset="70%" stopColor="#020202" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="obsidianMesh2" cx="85%" cy="85%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.9" />
            <Stop offset="70%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>

          {/* Matcha Lime */}
          <LinearGradient id="bgMatcha" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#D9F854" />
            <Stop offset="45%" stopColor="#CEF04A" />
            <Stop offset="100%" stopColor="#A4CF1E" />
          </LinearGradient>
          <RadialGradient id="matchaMesh1" cx="15%" cy="20%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#FFFF8F" stopOpacity="0.85" />
            <Stop offset="60%" stopColor="#CEF04A" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#CEF04A" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="matchaMesh2" cx="85%" cy="80%" rx="70%" ry="70%">
            <Stop offset="0%" stopColor="#7FB069" stopOpacity="0.6" />
            <Stop offset="60%" stopColor="#5E8D48" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#5E8D48" stopOpacity="0" />
          </RadialGradient>

          {/* Terracotta */}
          <LinearGradient id="bgTerracotta" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#C85232" />
            <Stop offset="55%" stopColor="#E07A5F" />
            <Stop offset="100%" stopColor="#B33E20" />
          </LinearGradient>
          <RadialGradient id="terracottaMesh1" cx="85%" cy="25%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#FFBA82" stopOpacity="0.75" />
            <Stop offset="65%" stopColor="#E07A5F" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#C85232" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="terracottaMesh2" cx="15%" cy="85%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#7E240D" stopOpacity="0.5" />
            <Stop offset="70%" stopColor="#7E240D" stopOpacity="0" />
          </RadialGradient>

          {/* Moss Sage */}
          <LinearGradient id="bgMoss" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4A6B4E" />
            <Stop offset="60%" stopColor="#5D875F" />
            <Stop offset="100%" stopColor="#354E38" />
          </LinearGradient>
          <RadialGradient id="mossMesh1" cx="75%" cy="75%" rx="70%" ry="70%">
            <Stop offset="0%" stopColor="#9BC4A8" stopOpacity="0.6" />
            <Stop offset="65%" stopColor="#81B29A" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#354E38" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="mossMesh2" cx="20%" cy="20%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor="#C2E0C6" stopOpacity="0.35" />
            <Stop offset="60%" stopColor="#5D875F" stopOpacity="0.0" />
          </RadialGradient>

          {/* Golden Honey */}
          <LinearGradient id="bgHoney" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FCDAA2" />
            <Stop offset="50%" stopColor="#F2CC8F" />
            <Stop offset="100%" stopColor="#D49C48" />
          </LinearGradient>
          <RadialGradient id="honeyMesh1" cx="25%" cy="30%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#FFF7E0" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#F2CC8F" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#D49C48" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="honeyMesh2" cx="80%" cy="80%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#B37C22" stopOpacity="0.4" />
            <Stop offset="70%" stopColor="#B37C22" stopOpacity="0" />
          </RadialGradient>

          {/* Dark Graphite */}
          <LinearGradient id="bgGraphite" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#252927" />
            <Stop offset="60%" stopColor="#1B1E1D" />
            <Stop offset="100%" stopColor="#121413" />
          </LinearGradient>
          <RadialGradient id="graphiteMesh1" cx="20%" cy="20%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor="#3E4542" stopOpacity="0.6" />
            <Stop offset="70%" stopColor="#121413" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="graphiteMesh2" cx="85%" cy="85%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#0B0D0C" stopOpacity="0.8" />
            <Stop offset="70%" stopColor="#0B0D0C" stopOpacity="0" />
          </RadialGradient>

          {/* Porcelain */}
          <LinearGradient id="bgPorcelain" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="70%" stopColor="#F8F8F4" />
            <Stop offset="100%" stopColor="#EFEFEA" />
          </LinearGradient>
          <RadialGradient id="porcelainMesh1" cx="20%" cy="20%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="70%" stopColor="#EFEFEA" stopOpacity="0" />
          </RadialGradient>

          {/* Dynamic Custom Palette Mesh */}
          {customGradient && (
            <>
              <LinearGradient id="bgCustom" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={customGradient[0]} />
                <Stop offset="50%" stopColor={customGradient[1]} />
                <Stop offset="100%" stopColor={customGradient[2]} />
              </LinearGradient>
              <RadialGradient id="customMesh1" cx="20%" cy="25%" rx="65%" ry="65%">
                <Stop offset="0%" stopColor={customGradient[0]} stopOpacity="0.8" />
                <Stop offset="70%" stopColor={customGradient[1]} stopOpacity="0.2" />
                <Stop offset="100%" stopColor={customGradient[1]} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="customMesh2" cx="80%" cy="80%" rx="65%" ry="65%">
                <Stop offset="0%" stopColor={customGradient[2]} stopOpacity="0.75" />
                <Stop offset="70%" stopColor={customGradient[2]} stopOpacity="0" />
              </RadialGradient>
            </>
          )}
        </Defs>

        {/* 0. GUARANTEED Fallback Base Rect: Prevents invisible / white missing card backdrops */}
        <Rect x="0" y="0" width="400" height="240" fill={fallbackBaseBg} />

        {/* Base Mesh Shapes */}
        {(variant === 'custom' || customGradient) && customGradient ? (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgCustom)" />

            {/* Procedural Shapes based on shapePattern */}
            {shapePattern === 'waves' && (
              <>
                <Path
                  d="M -20 120 Q 110 40 220 130 T 420 70 L 420 260 L -20 260 Z"
                  fill={customGradient[1]}
                  opacity={0.32}
                />
                <Path
                  d="M -20 170 Q 140 100 270 190 T 420 160 L 420 260 L -20 260 Z"
                  fill={customGradient[2]}
                  opacity={0.42}
                />
                <Circle cx="320" cy="50" r="90" fill="url(#customMesh2)" opacity={0.65} />
              </>
            )}

            {shapePattern === 'orbs' && (
              <>
                <Circle cx="85" cy="65" r="140" fill="url(#customMesh1)" />
                <Circle cx="320" cy="180" r="130" fill="url(#customMesh2)" />
                <Circle cx="220" cy="110" r="75" fill={customGradient[0]} opacity={0.35} />
                <Circle cx="320" cy="45" r="45" fill="#FFFFFF" opacity={0.18} />
              </>
            )}

            {shapePattern === 'geometry' && (
              <>
                <Polygon points="160,-20 420,160 420,-20" fill={customGradient[1]} opacity={0.32} />
                <Polygon points="-20,110 180,260 -20,260" fill={customGradient[2]} opacity={0.38} />
                <Polygon points="210,110 260,60 310,110 260,160" fill={customGradient[0]} opacity={0.28} />
                <Circle cx="340" cy="190" r="60" fill="url(#customMesh2)" opacity={0.55} />
              </>
            )}

            {shapePattern === 'arcs' && (
              <>
                <Circle cx="370" cy="40" r="90" stroke={customGradient[1]} strokeWidth="24" fill="none" opacity={0.32} />
                <Circle cx="370" cy="40" r="140" stroke={customGradient[2]} strokeWidth="16" fill="none" opacity={0.22} />
                <Circle cx="40" cy="200" r="110" stroke={customGradient[0]} strokeWidth="30" fill="none" opacity={0.26} />
                <Circle cx="90" cy="70" r="100" fill="url(#customMesh1)" opacity={0.5} />
              </>
            )}

            {shapePattern === 'ribbons' && (
              <>
                <Path
                  d="M -30 40 Q 120 10 240 120 T 430 130 L 430 190 Q 240 180 120 70 T -30 100 Z"
                  fill={customGradient[1]}
                  opacity={0.36}
                />
                <Path
                  d="M 50 -20 Q 200 80 300 30 T 440 80 L 440 130 Q 300 80 200 130 T 50 30 Z"
                  fill={customGradient[2]}
                  opacity={0.32}
                />
                <Circle cx="70" cy="180" r="90" fill="url(#customMesh1)" opacity={0.5} />
              </>
            )}
          </>
        ) : null}

        {(variant === 'palmLeaf' || (!customGradient && variant !== 'blueSlate' && variant !== 'tangerine' && variant !== 'oxidizedIron' && variant !== 'obsidian' && variant !== 'matchaLime' && variant !== 'terracotta' && variant !== 'mossSage' && variant !== 'goldenHoney' && variant !== 'darkGraphite' && variant !== 'porcelain')) && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgPalmLeaf)" />
            <Circle cx="90" cy="60" r="140" fill="url(#palmMesh1)" />
            <Circle cx="330" cy="190" r="130" fill="url(#palmMesh2)" />
            <Path
              d="M -20 170 Q 140 110 310 210 L 420 260 L -20 260 Z"
              fill="#6E825D"
              opacity={0.35}
            />
          </>
        )}

        {variant === 'blueSlate' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgBlueSlate)" />
            <Circle cx="330" cy="60" r="150" fill="url(#blueSlateMesh1)" />
            <Circle cx="80" cy="180" r="130" fill="url(#blueSlateMesh2)" />
            <Path
              d="M -20 190 Q 150 120 320 220 L 420 260 L -20 260 Z"
              fill="#1B3843"
              opacity={0.4}
            />
          </>
        )}

        {variant === 'tangerine' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgTangerine)" />
            <Circle cx="80" cy="60" r="140" fill="url(#tangerineMesh1)" />
            <Circle cx="330" cy="180" r="130" fill="url(#tangerineMesh2)" />
            <Path
              d="M -20 160 Q 130 90 280 180 L 420 260 L -20 260 Z"
              fill="#B8572D"
              opacity={0.35}
            />
          </>
        )}

        {variant === 'oxidizedIron' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgOxidizedIron)" />
            <Circle cx="330" cy="60" r="150" fill="url(#oxidizedMesh1)" />
            <Circle cx="70" cy="190" r="120" fill="url(#oxidizedMesh2)" />
          </>
        )}

        {variant === 'obsidian' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgObsidian)" />
            <Circle cx="80" cy="60" r="140" fill="url(#obsidianMesh1)" />
            <Circle cx="330" cy="190" r="130" fill="url(#obsidianMesh2)" />
          </>
        )}

        {variant === 'matchaLime' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgMatcha)" />
            <Circle cx="80" cy="50" r="140" fill="url(#matchaMesh1)" />
            <Circle cx="340" cy="190" r="130" fill="url(#matchaMesh2)" />
            <Path
              d="M -20 180 Q 140 120 300 220 L 420 260 L -20 260 Z"
              fill="#9AC419"
              opacity={0.35}
            />
          </>
        )}

        {variant === 'terracotta' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgTerracotta)" />
            <Circle cx="330" cy="60" r="150" fill="url(#terracottaMesh1)" />
            <Circle cx="70" cy="190" r="120" fill="url(#terracottaMesh2)" />
          </>
        )}

        {variant === 'mossSage' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgMoss)" />
            <Circle cx="310" cy="180" r="150" fill="url(#mossMesh1)" />
            <Circle cx="90" cy="50" r="110" fill="url(#mossMesh2)" />
          </>
        )}

        {variant === 'goldenHoney' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgHoney)" />
            <Circle cx="100" cy="70" r="140" fill="url(#honeyMesh1)" />
            <Circle cx="320" cy="180" r="130" fill="url(#honeyMesh2)" />
          </>
        )}

        {variant === 'darkGraphite' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgGraphite)" />
            <Circle cx="80" cy="60" r="140" fill="url(#graphiteMesh1)" />
            <Circle cx="330" cy="190" r="130" fill="url(#graphiteMesh2)" />
          </>
        )}

        {variant === 'porcelain' && !customGradient && (
          <>
            <Rect x="0" y="0" width="400" height="240" fill="url(#bgPorcelain)" />
            <Circle cx="80" cy="50" r="140" fill="url(#porcelainMesh1)" />
            <Circle cx="340" cy="190" r="110" fill="#DCDCD4" opacity={0.3} />
          </>
        )}

        {/* Glassmorphic Specular Highlight Overlay */}
        {glassSheen && (
          <Rect x="0" y="0" width="400" height="240" fill="url(#glassSpecular)" />
        )}
      </Svg>
    </View>
  );
};
