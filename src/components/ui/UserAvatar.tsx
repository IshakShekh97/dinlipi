import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../../context/theme-context';

export interface AvatarPreset {
  id: string;
  name: string;
  category: 'creatures' | 'personas' | 'abstract';
  bgGradient: [string, string];
  emojiOrGlyph: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // Cozy Creatures
  { id: 'avatar_matcha_fox', name: 'Matcha Fox', category: 'creatures', bgGradient: ['#CEF04A', '#81B29A'], emojiOrGlyph: '🦊' },
  { id: 'avatar_sage_owl', name: 'Sage Owl', category: 'creatures', bgGradient: ['#81B29A', '#5D875F'], emojiOrGlyph: '🦉' },
  { id: 'avatar_terracotta_bear', name: 'Honey Bear', category: 'creatures', bgGradient: ['#F2CC8F', '#E07A5F'], emojiOrGlyph: '🐻' },
  { id: 'avatar_terracotta_deer', name: 'Cozy Deer', category: 'creatures', bgGradient: ['#E07A5F', '#B33E20'], emojiOrGlyph: '🦌' },
  { id: 'avatar_mint_bunny', name: 'Mint Bunny', category: 'creatures', bgGradient: ['#CEF04A', '#F2CC8F'], emojiOrGlyph: '🐰' },
  { id: 'avatar_slate_otter', name: 'Slate Otter', category: 'creatures', bgGradient: ['#282C2A', '#81B29A'], emojiOrGlyph: '🦦' },
  { id: 'avatar_amber_lion', name: 'Golden Cub', category: 'creatures', bgGradient: ['#F2CC8F', '#C48E3E'], emojiOrGlyph: '🦁' },
  { id: 'avatar_forest_hedgehog', name: 'Hedgehog', category: 'creatures', bgGradient: ['#81B29A', '#CEF04A'], emojiOrGlyph: '🦔' },

  // Personas
  { id: 'avatar_persona_architect', name: 'Architect', category: 'personas', bgGradient: ['#1C1F1D', '#3E4542'], emojiOrGlyph: '📐' },
  { id: 'avatar_persona_botanist', name: 'Botanist', category: 'personas', bgGradient: ['#CEF04A', '#5D875F'], emojiOrGlyph: '🌿' },
  { id: 'avatar_persona_artisan', name: 'Artisan', category: 'personas', bgGradient: ['#E07A5F', '#F2CC8F'], emojiOrGlyph: '🎨' },
  { id: 'avatar_persona_writer', name: 'Writer', category: 'personas', bgGradient: ['#F2CC8F', '#81B29A'], emojiOrGlyph: '✍️' },
  { id: 'avatar_persona_traveler', name: 'Traveler', category: 'personas', bgGradient: ['#81B29A', '#CEF04A'], emojiOrGlyph: '🧭' },
  { id: 'avatar_persona_barista', name: 'Barista', category: 'personas', bgGradient: ['#E07A5F', '#1C1F1D'], emojiOrGlyph: '☕' },
  { id: 'avatar_persona_astronomer', name: 'Stargazer', category: 'personas', bgGradient: ['#252927', '#F2CC8F'], emojiOrGlyph: '🔭' },
  { id: 'avatar_persona_baker', name: 'Baker', category: 'personas', bgGradient: ['#F2CC8F', '#E07A5F'], emojiOrGlyph: '🥐' },

  // Abstract & Glyphs
  { id: 'avatar_glyph_matcha_coin', name: 'Matcha Coin', category: 'abstract', bgGradient: ['#CEF04A', '#81B29A'], emojiOrGlyph: '৳' },
  { id: 'avatar_glyph_sparkle', name: 'Aura Sparkle', category: 'abstract', bgGradient: ['#CEF04A', '#F2CC8F'], emojiOrGlyph: '✨' },
  { id: 'avatar_glyph_seedling', name: 'Sprout', category: 'abstract', bgGradient: ['#81B29A', '#CEF04A'], emojiOrGlyph: '🌱' },
  { id: 'avatar_glyph_gem', name: 'Emerald', category: 'abstract', bgGradient: ['#81B29A', '#282C2A'], emojiOrGlyph: '💎' },
  { id: 'avatar_glyph_lotus', name: 'Lotus', category: 'abstract', bgGradient: ['#E07A5F', '#F2CC8F'], emojiOrGlyph: '🪷' },
  { id: 'avatar_glyph_shield', name: 'Security Vault', category: 'abstract', bgGradient: ['#1C1F1D', '#CEF04A'], emojiOrGlyph: '🛡️' },
  { id: 'avatar_glyph_sun', name: 'Solstice', category: 'abstract', bgGradient: ['#F2CC8F', '#E07A5F'], emojiOrGlyph: '☀️' },
  { id: 'avatar_glyph_feather', name: 'Quill', category: 'abstract', bgGradient: ['#81B29A', '#F2CC8F'], emojiOrGlyph: '🪶' },
];

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  avatarIdOrUri?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  showRing?: boolean;
}

const SIZE_MAP: Record<AvatarSize, { dimension: number; emojiSize: number; initialSize: number }> = {
  sm: { dimension: 34, emojiSize: 18, initialSize: 13 },
  md: { dimension: 44, emojiSize: 24, initialSize: 16 },
  lg: { dimension: 64, emojiSize: 34, initialSize: 24 },
  xl: { dimension: 88, emojiSize: 48, initialSize: 32 },
};

export function UserAvatar({
  avatarIdOrUri = 'avatar_matcha_fox',
  name = 'User',
  size = 'md',
  style,
  showRing = false,
}: UserAvatarProps) {
  const { colors, isDark } = useAppTheme();
  const config = SIZE_MAP[size];

  // 1. If it's a local file URI or http URI from image picker
  const isImageUri =
    avatarIdOrUri?.startsWith('file://') ||
    avatarIdOrUri?.startsWith('content://') ||
    avatarIdOrUri?.startsWith('http://') ||
    avatarIdOrUri?.startsWith('https://') ||
    avatarIdOrUri?.startsWith('data:image');

  if (isImageUri) {
    return (
      <View
        style={[
          styles.container,
          {
            width: config.dimension,
            height: config.dimension,
            borderRadius: config.dimension / 2,
            borderColor: showRing ? colors.matchaLime : 'transparent',
            borderWidth: showRing ? 2 : 0,
          },
          style,
        ]}
      >
        <Image
          source={{ uri: avatarIdOrUri }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: config.dimension / 2,
          }}
        />
      </View>
    );
  }

  // 2. Check in predefined avatar presets
  const preset = AVATAR_PRESETS.find((p) => p.id === avatarIdOrUri);

  if (preset) {
    return (
      <View
        style={[
          styles.container,
          {
            width: config.dimension,
            height: config.dimension,
            borderRadius: config.dimension / 2,
            borderColor: showRing ? colors.matchaLime : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(18,20,19,0.08)'),
            borderWidth: showRing ? 2 : 1,
          },
          style,
        ]}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`grad_${preset.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={preset.bgGradient[0]} />
              <Stop offset="100%" stopColor={preset.bgGradient[1]} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={config.dimension / 2}
            fill={`url(#grad_${preset.id})`}
          />
        </Svg>
        <Text style={{ fontSize: config.emojiSize }}>{preset.emojiOrGlyph}</Text>
      </View>
    );
  }

  // 3. Fallback Monogram initials
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'D';

  return (
    <View
      style={[
        styles.container,
        {
          width: config.dimension,
          height: config.dimension,
          borderRadius: config.dimension / 2,
          backgroundColor: isDark ? '#1C1F1D' : '#EDECE6',
          borderColor: showRing ? colors.matchaLime : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(18,20,19,0.08)'),
          borderWidth: showRing ? 2 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initialsText,
          {
            fontSize: config.initialSize,
            color: colors.textPrimary,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
