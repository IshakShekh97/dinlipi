import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useColorScheme, Appearance, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { THEME } from '../constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  isDark: boolean;
  colors: typeof THEME.dark;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const THEME_STORAGE_KEY = 'dinlipi_theme_mode';

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Load saved preference
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let saved: string | null = null;
        if (Platform.OS === 'web') {
          saved = localStorage.getItem(THEME_STORAGE_KEY);
        } else {
          saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        }

        if (isMounted && saved && (saved === 'system' || saved === 'light' || saved === 'dark')) {
          setThemeModeState(saved as ThemeMode);
          if (saved === 'system') {
            Appearance.setColorScheme('unspecified');
          } else {
            Appearance.setColorScheme(saved);
          }
        }
      } catch (err) {
        console.warn('[ThemeContext] Failed to load theme mode:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } else {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
      }

      if (mode === 'system') {
        Appearance.setColorScheme('unspecified');
      } else {
        Appearance.setColorScheme(mode);
      }
    } catch (err) {
      console.warn('[ThemeContext] Failed to save theme mode:', err);
    }
  }, []);

  const effectiveTheme: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'light') return 'light';
    if (themeMode === 'dark') return 'dark';
    return systemScheme === 'light' ? 'light' : 'dark';
  }, [themeMode, systemScheme]);

  const isDark = effectiveTheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        effectiveTheme,
        isDark,
        colors,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
