import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, CheckCircle2 } from 'lucide-react-native';
import {
  EnvelopeVaultIllustration,
  KhataLedgerIllustration,
  DailySettlementIllustration,
} from '../components/ui/LargeIllustrations';
import { useAppTheme } from '../context/theme-context';
import { triggerHaptic } from '../constants/theme';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
  highlights: string[];
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const slides: OnboardingSlide[] = [
    {
      id: 'control',
      badge: 'OFFLINE-FIRST VAULT',
      badgeColor: colors.matchaLime,
      title: 'Take Control\nof Your Money',
      subtitle:
        'Track spending, plan multi-budget envelopes, and reconcile daily cash flows — 100% offline with zero cloud tracking.',
      illustration: <EnvelopeVaultIllustration size={SCREEN_WIDTH * 0.72} />,
      highlights: [
        'Dynamic multi-budget envelopes without rigid caps',
        '100% sandboxed on-device SQLite database',
        'Zero mandatory login, ads, or data harvesting',
      ],
    },
    {
      id: 'khata',
      badge: 'SMART INSTALLMENTS',
      badgeColor: colors.mossSage,
      title: 'Smarter Ledgers,\nEvery Rupee.',
      subtitle:
        'Full installment audit trails for receivables & payables. Direct 1-tap WhatsApp payment reminders with polite templates.',
      illustration: <KhataLedgerIllustration size={SCREEN_WIDTH * 0.72} />,
      highlights: [
        'Granular partial repayment tracking',
        'Directional receivables & payable ledger',
        '1-Tap pre-formatted polite WhatsApp reminders',
      ],
    },
    {
      id: 'settle',
      badge: 'EVENING RECONCILIATION',
      badgeColor: colors.goldenHoney,
      title: 'Evenings Reconciled\nIn 30 Seconds.',
      subtitle:
        'Know physical cash in counter vs. digital UPI in bank at a single glance. 3-second quick action presets and printable slips.',
      illustration: <DailySettlementIllustration size={SCREEN_WIDTH * 0.72} />,
      highlights: [
        'Cash vs. UPI vs. Bank daily split',
        'Quick action presets (<3s entry chips)',
        'Shareable PDF bills & direct thermal printing',
      ],
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
      triggerHaptic('light');
    }
  };

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
    setActiveIndex(index);
    triggerHaptic('light');
  };

  const handleNext = async () => {
    if (activeIndex < slides.length - 1) {
      goToSlide(activeIndex + 1);
    } else {
      triggerHaptic('success');
      router.push('/profile-setup');
    }
  };

  const handleSkip = async () => {
    triggerHaptic('medium');
    router.push('/profile-setup');
  };

  return (
    <Animated.View
      entering={FadeIn.duration(320)}
      exiting={FadeOut.duration(200)}
      style={{
        flex: 1,
        backgroundColor: colors.bgPrimary,
        paddingTop: Math.max(insets.top + 8, 36),
      }}
    >
      {/* Top Bar: Brand & Skip */}
      <View className="flex-row items-center justify-between px-6 pb-2">
        <View className="flex-row items-center gap-2">
          <View
            style={{
              backgroundColor: 'rgba(206, 240, 74, 0.16)',
              borderColor: colors.borderMedium,
            }}
            className="w-8 h-8 rounded-xl items-center justify-center border"
          >
            <Text style={{ color: colors.matchaLime }} className="font-black text-base">
              দ
            </Text>
          </View>
          <Text style={{ color: colors.textPrimary }} className="font-black text-xl tracking-tight">
            Dinlipi.
          </Text>
        </View>

        {activeIndex < slides.length - 1 && (
          <TouchableOpacity
            onPress={handleSkip}
            style={{
              backgroundColor: colors.cardSecondary,
              borderColor: colors.borderSubtle,
            }}
            className="px-4 py-1.5 rounded-full border active:opacity-70"
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        className="flex-1"
      >
        {slides.map((slide) => (
          <View
            key={slide.id}
            style={{ width: SCREEN_WIDTH }}
            className="flex-1 px-7 justify-between py-2"
          >
            {/* Visual Hero */}
            <View className="items-center justify-center my-auto py-2">
              {slide.illustration}
            </View>

            {/* Slide Content */}
            <View className="mb-4">
              {/* Badge */}
              <View
                style={{
                  backgroundColor: `${slide.badgeColor}20`,
                  borderColor: `${slide.badgeColor}40`,
                }}
                className="self-start px-3.5 py-1 rounded-full border mb-3"
              >
                <Text
                  style={{ color: slide.badgeColor }}
                  className="text-[11px] font-extrabold tracking-wider"
                >
                  {slide.badge}
                </Text>
              </View>

              {/* Title & Subtitle */}
              <Text
                style={{ color: colors.textPrimary }}
                className="text-3xl font-black leading-tight tracking-tight mb-2"
              >
                {slide.title}
              </Text>
              <Text
                style={{ color: colors.textSecondary }}
                className="text-sm leading-relaxed mb-4"
              >
                {slide.subtitle}
              </Text>

              {/* Highlights Box */}
              <View
                style={{
                  backgroundColor: colors.cardPrimary,
                  borderColor: colors.borderSubtle,
                }}
                className="space-y-2 p-4 rounded-[28px] border"
              >
                {slide.highlights.map((highlight, hIdx) => (
                  <View key={hIdx} className="flex-row items-center gap-2.5">
                    <CheckCircle2 size={16} color={slide.badgeColor} />
                    <Text
                      style={{ color: colors.textPrimary }}
                      className="text-xs font-semibold flex-1"
                    >
                      {highlight}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Bar: Step Indicator & High-Contrast Pill Button (Pillar/Luna Inspired) */}
      <View
        style={{
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          backgroundColor: colors.bgPrimary,
          paddingBottom: Math.max(insets.bottom + 16, 28),
        }}
        className="px-7 pt-4"
      >
        <View className="flex-row items-center justify-between">
          {/* Step Tracker Indicator */}
          <View className="flex-row items-center gap-2">
            {slides.map((_, idx) => {
              const isActive = activeIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => goToSlide(idx)}
                  activeOpacity={0.7}
                  style={{
                    width: isActive ? 28 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isActive
                      ? colors.matchaLime
                      : colors.borderMedium,
                  }}
                />
              );
            })}
          </View>

          {/* Action Button: Pillar-Style Pill Button */}
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: colors.matchaLime,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
            }}
            className="flex-row items-center gap-2.5 px-7 h-13 rounded-full active:opacity-85"
            activeOpacity={0.85}
          >
            <Text style={{ color: '#141715', fontWeight: '900', fontSize: 14 }}>
              {activeIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <ArrowRight size={18} color="#141715" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
