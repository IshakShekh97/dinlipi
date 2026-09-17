import '../../global.css';
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
  Newsreader_400Regular_Italic,
} from '@expo-google-fonts/newsreader';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { ThemeProvider, useAppTheme } from '../context/theme-context';
import { SecurityProvider } from '../context/security-context';
import { AuthLockOverlay } from '../components/security/AuthLockOverlay';
import { AnimatedSplashScreen } from '../components/ui/AnimatedSplashScreen';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { initializeDatabase } from '../db/client';

function RootContent() {
  const { isDark, colors } = useAppTheme();
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    Newsreader_400Regular_Italic,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    initializeDatabase();
  }, []);

  if (!fontsLoaded) {
    return (
      <AnimatedSplashScreen onFinish={() => {}} minDurationMs={1500} />
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgPrimary },
          animation: 'fade_from_bottom',
          animationDuration: 300,
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="onboarding"
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 380,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="profile-setup"
          options={{
            animation: 'slide_from_right',
            animationDuration: 300,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="person/[id]"
          options={{
            animation: 'slide_from_right',
            animationDuration: 300,
            gestureEnabled: true,
          }}
        />
      </Stack>
      <ConfirmModal />
      <AuthLockOverlay />
      {showSplash && (
        <AnimatedSplashScreen onFinish={() => setShowSplash(false)} minDurationMs={1200} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SecurityProvider>
          <RootContent />
        </SecurityProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
