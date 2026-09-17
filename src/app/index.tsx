import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSecurity } from '../context/security-context';
import { useAppTheme } from '../context/theme-context';

export default function IndexScreen() {
  const { isLoading, hasCompletedOnboarding } = useSecurity();
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <View
        style={{ backgroundColor: colors.bgPrimary }}
        className="flex-1 items-center justify-center"
      >
        <ActivityIndicator size="large" color={colors.matchaLime} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
