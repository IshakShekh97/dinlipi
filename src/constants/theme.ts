import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const THEME = {
  // Cozy, comfy, elegant pastel FinTech palette inspired directly by reference designs
  // Neutral dark gray in Dark Mode, pure white in Light Mode, zero blue/violet undertones.
  dark: {
    bgPrimary: '#121413',
    bgSecondary: '#181A19',
    cardPrimary: '#1E2120',
    cardSecondary: '#262928',
    cardElevated: '#2F3331',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderMedium: 'rgba(206, 240, 74, 0.22)',
    borderActive: '#CEF04A',

    // Cozy Pastel Accents
    matchaLime: '#CEF04A',
    terracotta: '#E07A5F',
    goldenHoney: '#F2CC8F',
    mossSage: '#81B29A',
    coralRose: '#E76F51',
    darkGraphite: '#262928',

    // Semantic roles
    accentPrimary: '#CEF04A',
    accentSecondary: '#E07A5F',
    accentSuccess: '#81B29A',
    accentDanger: '#E76F51',
    accentWarning: '#F2CC8F',
    glowAmber: 'rgba(206, 240, 74, 0.14)',
    glowIndigo: 'rgba(255, 255, 255, 0.05)',
    glowCyan: 'rgba(206, 240, 74, 0.14)',
    glowCoral: 'rgba(224, 122, 95, 0.14)',
    glowMint: 'rgba(129, 178, 154, 0.14)',

    textPrimary: '#FFFFFF',
    textSecondary: '#A2A6A3',
    textMuted: '#6D716E',
    keypadBg: '#181A19',
    keypadKey: '#222524',
    dockBg: 'rgba(26, 29, 28, 0.96)',
    dockBorder: 'rgba(255, 255, 255, 0.08)',
  },
  light: {
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F7F7F4',
    cardPrimary: '#FFFFFF',
    cardSecondary: '#F5F5F0',
    cardElevated: '#EFEFE9',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    borderMedium: 'rgba(0, 0, 0, 0.12)',
    borderActive: '#1A1D1C',

    // Cozy Pastel Accents
    matchaLime: '#A2C216',
    terracotta: '#E07A5F',
    goldenHoney: '#E2B772',
    mossSage: '#5E8C76',
    coralRose: '#D65A3D',
    darkGraphite: '#1C1F1E',

    // Semantic roles
    accentPrimary: '#1A1D1C',
    accentSecondary: '#E07A5F',
    accentSuccess: '#5E8C76',
    accentDanger: '#D65A3D',
    accentWarning: '#E2B772',
    glowAmber: 'rgba(162, 194, 22, 0.12)',
    glowIndigo: 'rgba(0, 0, 0, 0.04)',
    glowCyan: 'rgba(162, 194, 22, 0.12)',
    glowCoral: 'rgba(224, 122, 95, 0.12)',
    glowMint: 'rgba(94, 140, 118, 0.12)',

    textPrimary: '#141715',
    textSecondary: '#5E6360',
    textMuted: '#939895',
    keypadBg: '#F5F5F0',
    keypadKey: '#FFFFFF',
    dockBg: 'rgba(255, 255, 255, 0.98)',
    dockBorder: 'rgba(0, 0, 0, 0.07)',
  },
  borderRadius: {
    sm: 12,
    md: 18,
    lg: 26,
    xl: 34,
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
