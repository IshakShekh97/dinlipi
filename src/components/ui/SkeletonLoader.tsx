import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '../../context/theme-context';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonBoxProps) {
  const { isDark } = useAppTheme();
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const baseColor = isDark ? '#262A28' : '#E8E7E0';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * Skeleton for Transaction Row
 */
export function SkeletonTransactionRow() {
  const { isDark, colors } = useAppTheme();

  return (
    <View
      style={[
        styles.rowContainer,
        {
          backgroundColor: isDark ? colors.cardPrimary : '#FFFFFF',
          borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
        },
      ]}
    >
      <SkeletonBox width={42} height={42} borderRadius={21} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox width="60%" height={14} borderRadius={6} />
        <SkeletonBox width="35%" height={10} borderRadius={4} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <SkeletonBox width={64} height={15} borderRadius={6} />
        <SkeletonBox width={40} height={9} borderRadius={4} />
      </View>
    </View>
  );
}

/**
 * Skeleton for Hero Budget Card
 */
export function SkeletonHeroCard() {
  const { isDark, colors } = useAppTheme();

  return (
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: isDark ? colors.cardSecondary : '#F2F1EC',
          borderColor: isDark ? colors.borderSubtle : '#E8E7E0',
        },
      ]}
    >
      <View style={styles.heroTop}>
        <SkeletonBox width={100} height={12} borderRadius={6} />
        <SkeletonBox width={32} height={32} borderRadius={16} />
      </View>
      <View style={{ gap: 10, marginVertical: 14 }}>
        <SkeletonBox width="70%" height={36} borderRadius={10} />
        <SkeletonBox width="45%" height={14} borderRadius={6} />
      </View>
      <SkeletonBox width="100%" height={8} borderRadius={4} />
    </View>
  );
}

/**
 * Skeleton for Khata Contact Card
 */
export function SkeletonContactCard() {
  const { isDark, colors } = useAppTheme();

  return (
    <View
      style={[
        styles.contactCard,
        {
          backgroundColor: isDark ? colors.cardPrimary : '#FFFFFF',
          borderColor: isDark ? colors.borderSubtle : '#EFEFE8',
        },
      ]}
    >
      <SkeletonBox width={48} height={48} borderRadius={24} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBox width="55%" height={15} borderRadius={6} />
        <SkeletonBox width="38%" height={11} borderRadius={4} />
        <SkeletonBox width="90%" height={6} borderRadius={3} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <SkeletonBox width={55} height={16} borderRadius={6} />
        <SkeletonBox width={36} height={10} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  heroCard: {
    height: 190,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
  },
});
