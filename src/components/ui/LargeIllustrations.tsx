import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface IllustrationProps {
  size?: number;
}

/**
 * Slide 1: Multi-Budget Envelope System & 100% Offline Vault
 */
export const EnvelopeVaultIllustration: React.FC<IllustrationProps> = ({ size = 280 }) => {
  const coinY = useSharedValue(0);
  const coinRotate = useSharedValue(0);
  const cardFloat = useSharedValue(0);
  const badgePulse = useSharedValue(1);

  useEffect(() => {
    coinY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    coinRotate.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 2800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    cardFloat.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 2600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    badgePulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.98, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [badgePulse, cardFloat, coinRotate, coinY]);

  const animatedCoinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: coinY.value },
      { rotate: `${coinRotate.value}deg` },
    ],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardFloat.value }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgePulse.value }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background Layer (Cards & Ambient) */}
      <Animated.View style={[{ width: size, height: size, position: 'absolute' }, animatedCardStyle]}>
        <Svg width={size} height={size} viewBox="0 0 320 320" fill="none">
          <Defs>
            <RadialGradient id="amberBgGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#CEF04A" stopOpacity="0.2" />
              <Stop offset="70%" stopColor="#F2CC8F" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#121413" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="envelopeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#252927" />
              <Stop offset="100%" stopColor="#181B1A" />
            </LinearGradient>
            <LinearGradient id="envelopeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#2E3331" />
              <Stop offset="100%" stopColor="#1F2321" />
            </LinearGradient>
            <LinearGradient id="cardAccentAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#CEF04A" />
              <Stop offset="100%" stopColor="#A8D21E" />
            </LinearGradient>
            <LinearGradient id="cardAccentIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#CEF04A" />
              <Stop offset="100%" stopColor="#81B29A" />
            </LinearGradient>
          </Defs>

          {/* Ambient Glow */}
          <Circle cx="160" cy="160" r="140" fill="url(#amberBgGlow)" />

          {/* Back Envelope Card */}
          <G transform="translate(45, 60) rotate(-6)">
            <Rect
              x="0"
              y="0"
              width="210"
              height="115"
              rx="18"
              fill="url(#envelopeGrad1)"
              stroke="rgba(206, 240, 74, 0.2)"
              strokeWidth="1.5"
            />
            <Rect x="16" y="16" width="32" height="32" rx="10" fill="#CEF04A" fillOpacity="0.25" />
            <Path d="M26 32h12M32 26v12" stroke="#CEF04A" strokeWidth="2" strokeLinecap="round" />
            <Rect x="58" y="20" width="80" height="10" rx="5" fill="#3D4441" />
            <Rect x="58" y="36" width="50" height="8" rx="4" fill="#2D3230" />
            <SvgText x="190" y="32" fill="#CEF04A" fontSize="11" fontWeight="700" textAnchor="end">
              Shop / Work
            </SvgText>
          </G>

          {/* Front Envelope Card (Daily Living) */}
          <G transform="translate(65, 115) rotate(3)">
            <Rect
              x="0"
              y="0"
              width="220"
              height="125"
              rx="20"
              fill="url(#envelopeGrad2)"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1.5"
            />
            {/* Accent Ribbon */}
            <Rect x="0" y="0" width="6" height="125" rx="3" fill="url(#cardAccentAmber)" />
            
            <Rect x="20" y="20" width="36" height="36" rx="12" fill="#F59E0B" fillOpacity="0.2" />
            <Path
              d="M32 44V34a6 6 0 0 1 12 0v10"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <Circle cx="38" cy="34" r="2" fill="#FBBF24" />

            <SvgText x="68" y="34" fill="#FFFFFF" fontSize="15" fontWeight="700">
              Daily Living
            </SvgText>
            <SvgText x="68" y="49" fill="#A0AEC0" fontSize="11" fontWeight="500">
              Monthly Cap: ₹25,000
            </SvgText>

            {/* Progress bar inside card */}
            <Rect x="20" y="72" width="180" height="8" rx="4" fill="#14182B" />
            <Rect x="20" y="72" width="125" height="8" rx="4" fill="url(#cardAccentAmber)" />

            <SvgText x="20" y="104" fill="#FBBF24" fontSize="12" fontWeight="700">
              ₹15,400 spent
            </SvgText>
            <SvgText x="198" y="104" fill="#A0AEC0" fontSize="11" fontWeight="500" textAnchor="end">
              40% left
            </SvgText>
          </G>
        </Svg>
      </Animated.View>

      {/* Floating Animated Coin */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: size * 0.18,
            right: size * 0.12,
            width: 54,
            height: 54,
          },
          animatedCoinStyle,
        ]}
      >
        <Svg width={54} height={54} viewBox="0 0 54 54" fill="none">
          <Defs>
            <LinearGradient id="amberGoldCoin" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FDE68A" />
              <Stop offset="50%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#D97706" />
            </LinearGradient>
          </Defs>
          <Circle cx="27" cy="27" r="25" fill="url(#amberGoldCoin)" />
          <Circle cx="27" cy="27" r="21" stroke="#FEF3C7" strokeWidth="1.5" fill="none" />
          <SvgText
            x="27"
            y="35"
            fill="#78350F"
            fontSize="22"
            fontWeight="800"
            textAnchor="middle"
          >
            ₹
          </SvgText>
        </Svg>
      </Animated.View>

      {/* Floating Animated 100% Offline Vault Badge */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: size * 0.12,
            left: size * 0.08,
          },
          animatedBadgeStyle,
        ]}
      >
        <Svg width={160} height={46} viewBox="0 0 160 46" fill="none">
          <Defs>
            <LinearGradient id="shieldAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#D97706" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="156"
            height="44"
            rx="22"
            fill="#141930"
            stroke="rgba(245, 158, 11, 0.45)"
            strokeWidth="1.5"
          />
          <Circle cx="23" cy="22" r="13" fill="url(#shieldAmber)" />
          <Path
            d="M19 22l3 3 5-6"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <SvgText x="44" y="26" fill="#FFFFFF" fontSize="11" fontWeight="700">
            100% Offline Vault
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
};

/**
 * Slide 2: People Ledger & Multi-Installment Khata
 */
export const KhataLedgerIllustration: React.FC<IllustrationProps> = ({ size = 280 }) => {
  const cardFloat = useSharedValue(0);
  const waPulse = useSharedValue(1);

  useEffect(() => {
    cardFloat.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    waPulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [cardFloat, waPulse]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardFloat.value }],
  }));

  const animatedWaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waPulse.value }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size, height: size, position: 'absolute' }, animatedCardStyle]}>
        <Svg width={size} height={size} viewBox="0 0 320 320" fill="none">
          <Defs>
            <RadialGradient id="khataAmberGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#81B29A" stopOpacity="0.2" />
              <Stop offset="60%" stopColor="#CEF04A" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#121413" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="mainLedgerCard" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#2A2E2C" />
              <Stop offset="100%" stopColor="#1B1E1D" />
            </LinearGradient>
          </Defs>

          <Circle cx="160" cy="160" r="140" fill="url(#khataAmberGlow)" />

          {/* Main Ledger Card */}
          <G transform="translate(30, 45)">
            <Rect
              x="0"
              y="0"
              width="260"
              height="210"
              rx="24"
              fill="url(#mainLedgerCard)"
              stroke="rgba(206, 240, 74, 0.22)"
              strokeWidth="1.5"
            />

            {/* Contact Avatar Header */}
            <Circle cx="36" cy="38" r="18" fill="#F59E0B" fillOpacity="0.25" />
            <SvgText x="36" y="44" fill="#FBBF24" fontSize="14" fontWeight="800" textAnchor="middle">
              RD
            </SvgText>

            <SvgText x="64" y="35" fill="#FFFFFF" fontSize="15" fontWeight="700">
              Rahul Deb
            </SvgText>
            <SvgText x="64" y="50" fill="#A0AEC0" fontSize="11" fontWeight="500">
              Web Project (Receivable)
            </SvgText>

            {/* Pending Balance Tag */}
            <Rect x="175" y="24" width="72" height="26" rx="13" fill="#F43F5E" fillOpacity="0.2" />
            <SvgText x="211" y="41" fill="#F43F5E" fontSize="12" fontWeight="700" textAnchor="middle">
              Due ₹3,000
            </SvgText>

            {/* Divider */}
            <Rect x="20" y="70" width="220" height="1" fill="rgba(255,255,255,0.06)" />

            {/* Timeline Row 1 */}
            <Circle cx="30" cy="95" r="5" fill="#F43F5E" />
            <Path d="M30 100v30" stroke="#373D5C" strokeWidth="1.5" strokeDasharray="3 3" />
            <SvgText x="46" y="99" fill="#FFFFFF" fontSize="12" fontWeight="600">
              Total Project Due
            </SvgText>
            <SvgText x="238" y="99" fill="#F43F5E" fontSize="12" fontWeight="700" textAnchor="end">
              +₹5,000
            </SvgText>

            {/* Timeline Row 2 */}
            <Circle cx="30" cy="135" r="5" fill="#10B981" />
            <Path d="M30 140v30" stroke="#373D5C" strokeWidth="1.5" strokeDasharray="3 3" />
            <SvgText x="46" y="139" fill="#A0AEC0" fontSize="11" fontWeight="500">
              Partial (UPI • GPay)
            </SvgText>
            <SvgText x="238" y="139" fill="#10B981" fontSize="12" fontWeight="700" textAnchor="end">
              -₹1,000
            </SvgText>

            {/* Timeline Row 3 */}
            <Circle cx="30" cy="175" r="5" fill="#10B981" />
            <SvgText x="46" y="179" fill="#A0AEC0" fontSize="11" fontWeight="500">
              Partial (Cash In Hand)
            </SvgText>
            <SvgText x="238" y="179" fill="#10B981" fontSize="12" fontWeight="700" textAnchor="end">
              -₹1,000
            </SvgText>
          </G>
        </Svg>
      </Animated.View>

      {/* Floating Animated WhatsApp Reminder Pill */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: size * 0.1,
          },
          animatedWaStyle,
        ]}
      >
        <Svg width={210} height={50} viewBox="0 0 210 50" fill="none">
          <Defs>
            <LinearGradient id="waGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#25D366" />
              <Stop offset="100%" stopColor="#128C7E" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="206"
            height="48"
            rx="24"
            fill="#1B1E1D"
            stroke="rgba(37, 211, 102, 0.5)"
            strokeWidth="1.5"
          />
          <Circle cx="25" cy="24" r="14" fill="url(#waGrad)" />
          <Path
            d="M21 21a4 4 0 0 1 7-1 4 4 0 0 1 1 5l-1 2-2-1a4 4 0 0 1-5-5z"
            fill="#FFFFFF"
          />
          <SvgText x="48" y="28" fill="#FFFFFF" fontSize="12" fontWeight="700">
            1-Tap WhatsApp Reminder
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
};

/**
 * Slide 3: Multi-Channel Settlement & 3-Second Quick Presets
 */
export const DailySettlementIllustration: React.FC<IllustrationProps> = ({ size = 280 }) => {
  const cardFloat = useSharedValue(0);
  const chipsFloat = useSharedValue(0);

  useEffect(() => {
    cardFloat.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    chipsFloat.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(-3, { duration: 2100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [cardFloat, chipsFloat]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardFloat.value }],
  }));

  const animatedChipsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chipsFloat.value }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size, height: size, position: 'absolute' }, animatedCardStyle]}>
        <Svg width={size} height={size} viewBox="0 0 320 320" fill="none">
          <Defs>
            <RadialGradient id="settleAmberGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#CEF04A" stopOpacity="0.2" />
              <Stop offset="70%" stopColor="#F2CC8F" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#121413" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="reconCard" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#252927" />
              <Stop offset="100%" stopColor="#181B1A" />
            </LinearGradient>
            <LinearGradient id="cashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#CEF04A" />
              <Stop offset="100%" stopColor="#A8D21E" />
            </LinearGradient>
            <LinearGradient id="upiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#F2CC8F" />
              <Stop offset="100%" stopColor="#E07A5F" />
            </LinearGradient>
            <LinearGradient id="bankGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#81B29A" />
              <Stop offset="100%" stopColor="#5E8C76" />
            </LinearGradient>
          </Defs>

          <Circle cx="160" cy="160" r="140" fill="url(#settleAmberGlow)" />

          {/* Evening Reconciliation View */}
          <G transform="translate(35, 40)">
            <Rect
              x="0"
              y="0"
              width="250"
              height="170"
              rx="22"
              fill="url(#reconCard)"
              stroke="rgba(206, 240, 74, 0.22)"
              strokeWidth="1.5"
            />

            <SvgText x="20" y="32" fill="#FFFFFF" fontSize="14" fontWeight="700">
              Evening Reconciliation
            </SvgText>
            <SvgText x="230" y="32" fill="#FBBF24" fontSize="11" fontWeight="700" textAnchor="end">
              Total ₹24,800
            </SvgText>

            {/* Channel 1: Cash in Drawer */}
            <G transform="translate(20, 48)">
              <Circle cx="12" cy="14" r="12" fill="url(#cashGrad)" />
              <SvgText x="12" y="19" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
                C
              </SvgText>
              <SvgText x="32" y="14" fill="#FFFFFF" fontSize="12" fontWeight="600">
                Cash Drawer
              </SvgText>
              <SvgText x="32" y="26" fill="#A0AEC0" fontSize="10" fontWeight="500">
                In wallet / counter
              </SvgText>
              <SvgText x="210" y="19" fill="#10B981" fontSize="13" fontWeight="700" textAnchor="end">
                ₹5,600
              </SvgText>
            </G>

            {/* Channel 2: UPI */}
            <G transform="translate(20, 86)">
              <Circle cx="12" cy="14" r="12" fill="url(#upiGrad)" />
              <SvgText x="12" y="19" fill="#FFFFFF" fontSize="10" fontWeight="800" textAnchor="middle">
                U
              </SvgText>
              <SvgText x="32" y="14" fill="#FFFFFF" fontSize="12" fontWeight="600">
                UPI Payments
              </SvgText>
              <SvgText x="32" y="26" fill="#A0AEC0" fontSize="10" fontWeight="500">
                PhonePe, GPay, QR
              </SvgText>
              <SvgText x="210" y="19" fill="#FBBF24" fontSize="13" fontWeight="700" textAnchor="end">
                ₹14,200
              </SvgText>
            </G>

            {/* Channel 3: Direct Bank */}
            <G transform="translate(20, 124)">
              <Circle cx="12" cy="14" r="12" fill="url(#bankGrad)" />
              <SvgText x="12" y="19" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
                B
              </SvgText>
              <SvgText x="32" y="14" fill="#FFFFFF" fontSize="12" fontWeight="600">
                Bank Transfers
              </SvgText>
              <SvgText x="32" y="26" fill="#A0AEC0" fontSize="10" fontWeight="500">
                IMPS / Netbanking
              </SvgText>
              <SvgText x="210" y="19" fill="#818CF8" fontSize="13" fontWeight="700" textAnchor="end">
                ₹5,000
              </SvgText>
            </G>
          </G>
        </Svg>
      </Animated.View>

      {/* Floating 3-Second Quick Presets Chips */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: size * 0.1,
          },
          animatedChipsStyle,
        ]}
      >
        <Svg width={270} height={42} viewBox="0 0 270 42" fill="none">
          {/* Chip 1 */}
          <G transform="translate(0, 0)">
            <Rect
              x="0"
              y="0"
              width="82"
              height="38"
              rx="19"
              fill="#182040"
              stroke="rgba(245, 158, 11, 0.3)"
              strokeWidth="1.5"
            />
            <SvgText x="41" y="24" fill="#FBBF24" fontSize="11" fontWeight="700" textAnchor="middle">
              ☕ Chai ₹15
            </SvgText>
          </G>

          {/* Chip 2 */}
          <G transform="translate(90, 0)">
            <Rect
              x="0"
              y="0"
              width="90"
              height="38"
              rx="19"
              fill="#182040"
              stroke="rgba(79, 70, 229, 0.35)"
              strokeWidth="1.5"
            />
            <SvgText x="45" y="24" fill="#818CF8" fontSize="11" fontWeight="700" textAnchor="middle">
              ⛽ Fuel ₹200
            </SvgText>
          </G>

          {/* Chip 3 */}
          <G transform="translate(188, 0)">
            <Rect
              x="0"
              y="0"
              width="82"
              height="38"
              rx="19"
              fill="#182040"
              stroke="rgba(16, 185, 129, 0.35)"
              strokeWidth="1.5"
            />
            <SvgText x="41" y="24" fill="#34D399" fontSize="11" fontWeight="700" textAnchor="middle">
              🎨 Slip Bill
            </SvgText>
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
};
