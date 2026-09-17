import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Users,
  PieChart,
  ShieldCheck,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';

export interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  insets?: any;
}

interface AnimatedTabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  options: any;
}

function AnimatedTabItem({
  routeName,
  isFocused,
  onPress,
  options,
}: AnimatedTabItemProps) {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(isFocused ? 1.08 : 1);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.08 : 1, {
      damping: 14,
      stiffness: 180,
    });
  }, [isFocused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getIcon = (name: string, focused: boolean) => {
    const iconColor = focused
      ? (isDark ? '#121413' : '#FFFFFF')
      : colors.textMuted;
    const size = 20;

    switch (name) {
      case 'index':
        return <Home size={size} color={iconColor} strokeWidth={focused ? 2.5 : 1.8} />;
      case 'khata':
        return <Users size={size} color={iconColor} strokeWidth={focused ? 2.5 : 1.8} />;
      case 'analytics':
        return <PieChart size={size} color={iconColor} strokeWidth={focused ? 2.5 : 1.8} />;
      case 'settings':
        return <ShieldCheck size={size} color={iconColor} strokeWidth={focused ? 2.5 : 1.8} />;
      default:
        return <Home size={size} color={iconColor} />;
    }
  };

  const getLabel = (name: string) => {
    switch (name) {
      case 'index':
        return 'Home';
      case 'khata':
        return 'Khata';
      case 'analytics':
        return 'Spending';
      case 'settings':
        return 'Vault';
      default:
        return name;
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.pillWrapper,
          isFocused && [
            styles.activeCapsule,
            {
              backgroundColor: isDark ? '#CEF04A' : '#1A1D1C',
            },
          ],
          animatedStyle,
        ]}
      >
        {getIcon(routeName, isFocused)}
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused
              ? (isDark ? '#CEF04A' : '#1A1D1C')
              : colors.textMuted,
            fontWeight: isFocused ? '700' : '500',
          },
        ]}
      >
        {getLabel(routeName)}
      </Text>
    </TouchableOpacity>
  );
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.dockWrapper,
        {
          bottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 18,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.dockContainer,
          {
            backgroundColor: isDark ? '#1A1C1B' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            triggerHaptic('light');
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AnimatedTabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              options={options}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  pillWrapper: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeCapsule: {
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
  },
});
