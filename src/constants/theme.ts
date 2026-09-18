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
  // Modern Glassmorphism FinTech palette directly from reference design
  // Reference Swatches: Black (#020202), Blue Slate (#326273), Tangerine Dream (#E39774), Oxidized Iron (#B02E0C), Palm Leaf (#899D78)
  dark: {
    bgPrimary: '#020202', // Obsidian black from reference palette
    bgSecondary: '#0C1013', // Deep slate-obsidian void
    cardPrimary: '#12181C',
    cardSecondary: '#182025',
    cardElevated: '#1F2B32',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderMedium: 'rgba(255, 255, 255, 0.14)',
    borderActive: '#326273', // Blue Slate

    // Frosted Glassmorphism Tokens
    glassBg: 'rgba(12, 16, 19, 0.78)',
    glassCard: 'rgba(255, 255, 255, 0.05)',
    glassCardElevated: 'rgba(255, 255, 255, 0.09)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassSpecular: 'rgba(255, 255, 255, 0.22)',

    // Ambient Diffuse Glow Tones (Tangerine Dream, Blue Slate, Palm Leaf diffuse lighting)
    ambientWarm: 'rgba(227, 151, 116, 0.22)',
    ambientHoney: 'rgba(227, 151, 116, 0.18)',
    ambientTerracotta: 'rgba(176, 46, 12, 0.20)',
    ambientViolet: 'rgba(50, 98, 115, 0.24)',
    ambientSlate: 'rgba(50, 98, 115, 0.22)',
    ambientPalm: 'rgba(137, 157, 120, 0.18)',

    // Palette Tokens (Exact User Reference Swatches)
    black: '#020202',
    blueSlate: '#326273',
    tangerineDream: '#E39774',
    oxidizedIron: '#B02E0C',
    palmLeaf: '#899D78',

    // Semantic roles & backward compatibility aliases
    matchaLime: '#899D78', // Palm Leaf Primary
    terracotta: '#E39774', // Tangerine Dream
    goldenHoney: '#E39774',
    mossSage: '#899D78', // Palm Leaf
    coralRose: '#B02E0C', // Oxidized Iron
    darkGraphite: '#020202', // Black
    electricViolet: '#326273', // Blue Slate
    electricMagenta: '#E39774',

    accentPrimary: '#326273', // Blue Slate
    accentSecondary: '#E39774', // Tangerine Dream
    accentSuccess: '#899D78', // Palm Leaf
    accentDanger: '#B02E0C', // Oxidized Iron
    accentWarning: '#E39774', // Tangerine Dream
    glowAmber: 'rgba(227, 151, 116, 0.16)',
    glowIndigo: 'rgba(50, 98, 115, 0.18)',
    glowCyan: 'rgba(50, 98, 115, 0.16)',
    glowCoral: 'rgba(176, 46, 12, 0.16)',
    glowMint: 'rgba(137, 157, 120, 0.14)',

    textPrimary: '#FFFFFF',
    textSecondary: '#9EAFB8', // Sleek Slate Silver
    textMuted: '#637682',
    keypadBg: '#12181C',
    keypadKey: '#182025',
    dockBg: 'rgba(12, 16, 19, 0.88)',
    dockBorder: 'rgba(255, 255, 255, 0.10)',
  },
  light: {
    bgPrimary: '#FFFFFF', // Pure White Root Background
    bgSecondary: '#F4F7F9',
    cardPrimary: '#FFFFFF',
    cardSecondary: '#EDF2F5',
    cardElevated: '#FFFFFF',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    borderMedium: 'rgba(50, 98, 115, 0.20)',
    borderActive: '#326273',

    // Frosted Glassmorphism Tokens
    glassBg: 'rgba(255, 255, 255, 0.86)',
    glassCard: 'rgba(255, 255, 255, 0.92)',
    glassCardElevated: 'rgba(255, 255, 255, 0.98)',
    glassBorder: 'rgba(0, 0, 0, 0.07)',
    glassSpecular: 'rgba(255, 255, 255, 0.95)',

    // Ambient Diffuse Glow Tones
    ambientWarm: 'rgba(227, 151, 116, 0.24)',
    ambientHoney: 'rgba(227, 151, 116, 0.20)',
    ambientTerracotta: 'rgba(176, 46, 12, 0.18)',
    ambientViolet: 'rgba(50, 98, 115, 0.18)',
    ambientSlate: 'rgba(50, 98, 115, 0.16)',
    ambientPalm: 'rgba(137, 157, 120, 0.18)',

    // Palette Tokens
    black: '#020202',
    blueSlate: '#326273',
    tangerineDream: '#E39774',
    oxidizedIron: '#B02E0C',
    palmLeaf: '#899D78',

    // Semantic roles & backward compatibility aliases (tuned for contrast against white)
    matchaLime: '#546846', // Deep Palm Leaf Green for crisp contrast on white
    terracotta: '#D46D42', // Tangerine Dream
    goldenHoney: '#D46D42',
    mossSage: '#546846', // Deep Palm Leaf
    coralRose: '#B02E0C', // Oxidized Iron
    darkGraphite: '#020202', // Black
    electricViolet: '#326273', // Blue Slate
    electricMagenta: '#D46D42',

    accentPrimary: '#326273', // Blue Slate
    accentSecondary: '#D46D42', // Tangerine Dream
    accentSuccess: '#546846', // Deep Palm Leaf
    accentDanger: '#B02E0C', // Oxidized Iron
    accentWarning: '#D46D42', // Tangerine Dream
    glowAmber: 'rgba(227, 151, 116, 0.14)',
    glowIndigo: 'rgba(50, 98, 115, 0.12)',
    glowCyan: 'rgba(50, 98, 115, 0.14)',
    glowCoral: 'rgba(176, 46, 12, 0.14)',
    glowMint: 'rgba(137, 157, 120, 0.14)',

    textPrimary: '#020202', // Black from reference palette for crisp readability
    textSecondary: '#4E5F69',
    textMuted: '#7A8C96',
    keypadBg: '#F4F7F9',
    keypadKey: '#FFFFFF',
    dockBg: 'rgba(255, 255, 255, 0.92)',
    dockBorder: 'rgba(0, 0, 0, 0.08)',
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
