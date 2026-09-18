import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAppTheme } from '../../context/theme-context';
import { FONTS, triggerHaptic } from '../../constants/theme';

export interface BentoFactorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  variant?: 'sparkline' | 'bars' | 'dots' | 'wave';
  accentColor?: string;
  onPress?: () => void;
  badgeText?: string;
}

export const BentoFactorCard: React.FC<BentoFactorCardProps> = ({
  title,
  value,
  unit,
  icon,
  variant = 'sparkline',
  accentColor,
  onPress,
  badgeText,
}) => {
  const { colors, isDark } = useAppTheme();
  const themeAccent = accentColor || colors.matchaLime;

  const renderVisualizer = () => {
    switch (variant) {
      case 'bars':
        return (
          <Svg width={46} height={20} viewBox="0 0 46 20">
            <Rect x="2" y="14" width="3" height="6" rx="1.5" fill={isDark ? '#444' : '#CCC'} />
            <Rect x="8" y="11" width="3" height="9" rx="1.5" fill={isDark ? '#555' : '#BBB'} />
            <Rect x="14" y="8" width="3" height="12" rx="1.5" fill={isDark ? '#777' : '#999'} />
            <Rect x="20" y="5" width="3" height="15" rx="1.5" fill={themeAccent} />
            <Rect x="26" y="2" width="3" height="18" rx="1.5" fill={themeAccent} />
            <Rect x="32" y="7" width="3" height="13" rx="1.5" fill={themeAccent} />
            <Rect x="38" y="10" width="3" height="10" rx="1.5" fill={isDark ? '#666' : '#AAA'} />
          </Svg>
        );
      case 'dots':
        return (
          <Svg width={40} height={18} viewBox="0 0 40 18">
            <Circle cx="5" cy="5" r="2" fill={isDark ? '#555' : '#CCC'} />
            <Circle cx="13" cy="5" r="2" fill={isDark ? '#555' : '#CCC'} />
            <Circle cx="21" cy="5" r="2.5" fill={themeAccent} />
            <Circle cx="29" cy="5" r="3" fill={themeAccent} />
            <Circle cx="37" cy="5" r="3.5" fill={themeAccent} />
            <Circle cx="5" cy="13" r="2" fill={isDark ? '#444' : '#DDD'} />
            <Circle cx="13" cy="13" r="2.5" fill={themeAccent} />
            <Circle cx="21" cy="13" r="3" fill={themeAccent} />
          </Svg>
        );
      case 'wave':
        return (
          <Svg width={50} height={18} viewBox="0 0 50 18">
            <Path
              d="M2 14 Q 8 6, 14 14 T 26 14 T 38 14 T 48 14"
              stroke={themeAccent}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        );
      case 'sparkline':
      default:
        return (
          <Svg width={48} height={20} viewBox="0 0 48 20">
            <Path
              d="M2 14 L12 11 L22 15 L32 6 L42 10 L46 5"
              stroke={isDark ? '#EFEFE8' : '#141715'}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="46" cy="5" r="2" fill={themeAccent} />
            <Circle cx="32" cy="6" r="1.5" fill={themeAccent} />
          </Svg>
        );
    }
  };

  const cardContent = (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.90)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      {/* Top Row: Circular Icon Badge + Title */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(50, 98, 115, 0.08)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(50, 98, 115, 0.12)',
            },
          ]}
        >
          {icon}
        </View>

        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.titleText, { color: colors.textSecondary }]} numberOfLines={2}>
            {title}
          </Text>
        </View>

        {badgeText && (
          <View style={[styles.badge, { backgroundColor: `${themeAccent}20` }]}>
            <Text style={[styles.badgeText, { color: themeAccent }]}>{badgeText}</Text>
          </View>
        )}
      </View>

      {/* Bottom Row: Big Bold Value + Micro-visualizer */}
      <View style={styles.bottomRow}>
        <View style={styles.valueRow}>
          <Text style={[styles.valueText, { color: colors.textPrimary }]}>
            {value}
          </Text>
          {unit && (
            <Text style={[styles.unitText, { color: colors.textSecondary }]}>
              {unit}
            </Text>
          )}
        </View>

        <View style={styles.visualizerWrap}>
          {renderVisualizer()}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('light');
          onPress();
        }}
        activeOpacity={0.82}
        style={styles.touchableWrap}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchableWrap}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  touchableWrap: {
    flex: 1,
    minWidth: '46%',
  },
  cardContainer: {
    padding: 16,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 124,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: FONTS.sansBold,
    fontSize: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  valueText: {
    fontFamily: FONTS.sansBold,
    fontSize: 26,
    letterSpacing: -0.8,
  },
  unitText: {
    fontFamily: FONTS.sansRegular,
    fontSize: 13,
  },
  visualizerWrap: {
    marginBottom: 4,
  },
});
