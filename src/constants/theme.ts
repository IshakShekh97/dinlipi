import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const FONTS = {
  // Primary Modern Geometric Sans
  sansRegular: 'SpaceGrotesk_400Regular',
  sansMedium: 'SpaceGrotesk_500Medium',
  sansSemiBold: 'SpaceGrotesk_600SemiBold',
  sansBold: 'SpaceGrotesk_700Bold',

  // Compatible Luxury Editorial Serif for highlights, subtitles & dates
  serifRegular: 'Newsreader_400Regular',
  serifMedium: 'Newsreader_500Medium',
  serifSemiBold: 'Newsreader_600SemiBold',
  serifBold: 'Newsreader_700Bold',
  serifItalic: 'Newsreader_400Regular_Italic',

  // Compatible Precision Monospace for amounts, voucher codes & tags
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
};

export const THEME = {
  // Relaxed, cozy, modern Apple-like FinTech palette directly from reference design
  // Reference Swatches: Black (#020202), Blue Slate (#326273), Tangerine Dream (#E39774), Oxidized Iron (#B02E0C), Palm Leaf (#899D78)
  dark: {
    bgPrimary: '#020202', // Obsidian black from reference palette
    bgSecondary: '#0C110E',
    cardPrimary: '#121815',
    cardSecondary: '#19221D',
    cardElevated: '#212D27',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderMedium: 'rgba(137, 157, 120, 0.25)',
    borderActive: '#899D78', // Palm Leaf

    // Frosted Glassmorphism Tokens
    glassBg: 'rgba(18, 24, 21, 0.78)',
    glassCard: 'rgba(255, 255, 255, 0.05)',
    glassCardElevated: 'rgba(255, 255, 255, 0.09)',
    glassBorder: 'rgba(255, 255, 255, 0.11)',
    glassSpecular: 'rgba(255, 255, 255, 0.20)',

    // Ambient Diffuse Glow Tones (Warm Apricot / Palm diffuse lighting)
    ambientWarm: 'rgba(227, 151, 116, 0.18)',
    ambientHoney: 'rgba(137, 157, 120, 0.18)',
    ambientTerracotta: 'rgba(227, 151, 116, 0.20)',
    ambientViolet: 'rgba(50, 98, 115, 0.20)',

    // Palette Tokens
    black: '#020202',
    blueSlate: '#3D7285',
    tangerineDream: '#E39774',
    oxidizedIron: '#C83E1A',
    palmLeaf: '#899D78',

    // Semantic roles & backward compatibility aliases
    matchaLime: '#899D78', // Palm Leaf Primary Green
    terracotta: '#E39774', // Tangerine Dream
    goldenHoney: '#E39774',
    mossSage: '#899D78', // Palm Leaf
    coralRose: '#C83E1A', // Oxidized Iron
    darkGraphite: '#020202', // Black
    electricViolet: '#3D7285', // Blue Slate
    electricMagenta: '#E39774',

    accentPrimary: '#899D78', // Palm Leaf Green
    accentSecondary: '#3D7285', // Blue Slate
    accentSuccess: '#899D78', // Palm Leaf
    accentDanger: '#C83E1A', // Oxidized Iron
    accentWarning: '#E39774', // Tangerine Dream
    glowAmber: 'rgba(137, 157, 120, 0.14)',
    glowIndigo: 'rgba(50, 98, 115, 0.14)',
    glowCyan: 'rgba(137, 157, 120, 0.14)',
    glowCoral: 'rgba(227, 151, 116, 0.14)',
    glowMint: 'rgba(137, 157, 120, 0.14)',

    textPrimary: '#FFFFFF',
    textSecondary: '#A8B7AA',
    textMuted: '#68776B',
    keypadBg: '#121815',
    keypadKey: '#19221D',
    dockBg: 'rgba(14, 18, 16, 0.90)',
    dockBorder: 'rgba(255, 255, 255, 0.10)',
  },
  light: {
    bgPrimary: '#FFFFFF', // Pure White Root Background as requested
    bgSecondary: '#F7F9F6',
    cardPrimary: '#FFFFFF',
    cardSecondary: '#F2F5F0',
    cardElevated: '#FFFFFF',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    borderMedium: 'rgba(137, 157, 120, 0.28)',
    borderActive: '#546846',

    // Frosted Glassmorphism Tokens
    glassBg: 'rgba(255, 255, 255, 0.86)',
    glassCard: 'rgba(255, 255, 255, 0.92)',
    glassCardElevated: 'rgba(255, 255, 255, 0.98)',
    glassBorder: 'rgba(0, 0, 0, 0.07)',
    glassSpecular: 'rgba(255, 255, 255, 0.95)',

    // Ambient Diffuse Glow Tones
    ambientWarm: 'rgba(227, 151, 116, 0.22)',
    ambientHoney: 'rgba(137, 157, 120, 0.22)',
    ambientTerracotta: 'rgba(227, 151, 116, 0.20)',
    ambientViolet: 'rgba(50, 98, 115, 0.16)',

    // Palette Tokens
    black: '#020202',
    blueSlate: '#326273',
    tangerineDream: '#E39774',
    oxidizedIron: '#B02E0C',
    palmLeaf: '#899D78',

    // Semantic roles & backward compatibility aliases (tuned for contrast against white)
    matchaLime: '#546846', // Deep Palm Leaf Green for crisp contrast on white
    terracotta: '#CF6F47', // Tangerine Dream
    goldenHoney: '#CF6F47',
    mossSage: '#546846', // Deep Palm Leaf
    coralRose: '#B02E0C', // Oxidized Iron
    darkGraphite: '#020202', // Black
    electricViolet: '#326273', // Blue Slate
    electricMagenta: '#CF6F47',

    accentPrimary: '#546846', // Deep Palm Leaf
    accentSecondary: '#326273', // Blue Slate
    accentSuccess: '#546846', // Deep Palm Leaf
    accentDanger: '#B02E0C', // Oxidized Iron
    accentWarning: '#CF6F47', // Tangerine Dream
    glowAmber: 'rgba(137, 157, 120, 0.14)',
    glowIndigo: 'rgba(50, 98, 115, 0.10)',
    glowCyan: 'rgba(137, 157, 120, 0.14)',
    glowCoral: 'rgba(227, 151, 116, 0.14)',
    glowMint: 'rgba(137, 157, 120, 0.14)',

    textPrimary: '#020202', // Black from reference palette for crisp readability
    textSecondary: '#4D5C52',
    textMuted: '#79877E',
    keypadBg: '#F5F7F4',
    keypadKey: '#FFFFFF',
    dockBg: 'rgba(255, 255, 255, 0.94)',
    dockBorder: 'rgba(0, 0, 0, 0.07)',
  },
  borderRadius: {
    sm: 12,
    md: 18,
    lg: 26,
    xl: 34,
    bento: 28,
    card: 26,
    pill: 24,
    full: 9999,
  },
};

/**
 * Trigger subtle Apple-like haptic feedback safely across platforms.
 */
export const triggerHaptic = (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
) => {
  if (Platform.OS === 'web') return;
  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Haptics safe fallback
  }
};
