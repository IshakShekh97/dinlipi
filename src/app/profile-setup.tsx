import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, ArrowRight, User, Phone, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppTheme } from '../context/theme-context';
import { useSecurity } from '../context/security-context';
import { triggerHaptic } from '../constants/theme';
import { UserAvatar } from '../components/ui/UserAvatar';
import { AvatarPickerModal } from '../components/ui/AvatarPickerModal';
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  CURRENCY_COUNTRY_CODES,
  getCountryCodeForCurrency,
} from '../utils/currency';
import { useUIStore } from '../store/ui-store';
import { db } from '../db/client';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

const STARTER_AVATARS = [
  'avatar_matcha_fox',
  'avatar_terracotta_bear',
  'avatar_sage_owl',
  'avatar_golden_lion',
];

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { completeOnboarding } = useSecurity();
  const setActiveCurrency = useUIStore((state) => state.setActiveCurrency);

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [phone, setPhone] = useState(getCountryCodeForCurrency(DEFAULT_CURRENCY));
  const [avatar, setAvatar] = useState('avatar_matcha_fox');
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCurrencySelect = (newCurrencyDisplay: string) => {
    triggerHaptic('light');
    setCurrency(newCurrencyDisplay);
    const newPrefix = getCountryCodeForCurrency(newCurrencyDisplay);
    // If phone is empty or only had country prefix, replace with newPrefix
    const trimmed = phone.trim();
    const isOnlyCountryCode =
      !trimmed ||
      Object.values(CURRENCY_COUNTRY_CODES).some(
        (code) => trimmed === code.trim() || trimmed === code.replace(/\s+/g, '')
      );

    if (isOnlyCountryCode) {
      setPhone(newPrefix);
    } else if (phone.startsWith('+')) {
      // Replace existing dial code prefix while keeping user-typed digits
      const digitsOnly = phone.replace(/^\+\d+\s*/, '');
      setPhone(`${newPrefix}${digitsOnly}`);
    } else {
      setPhone(`${newPrefix}${phone}`);
    }
  };

  const finishSetup = async (userName: string, userPhone: string, userAvatar: string, userCurrency: string) => {
    try {
      const now = new Date().toISOString();
      const existing = db.select().from(usersTable).where(eq(usersTable.id, 'default_user')).all();

      if (existing.length > 0) {
        db.update(usersTable)
          .set({
            name: userName,
            phone: userPhone,
            avatar: userAvatar,
            currency: userCurrency,
            updatedAt: now,
          })
          .where(eq(usersTable.id, 'default_user'))
          .run();
      } else {
        db.insert(usersTable)
          .values({
            id: 'default_user',
            name: userName,
            phone: userPhone,
            avatar: userAvatar,
            currency: userCurrency,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    } catch (err) {
      console.warn('[ProfileSetup] DB save error:', err);
    }

    setActiveCurrency(userCurrency);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleLaunch = async () => {
    if (!name.trim()) {
      setErrorMessage('Your name is required to initialize your personal ledger.');
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('success');
    await finishSetup(name.trim(), phone.trim(), avatar, currency);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={{
        flex: 1,
        backgroundColor: colors.bgPrimary,
        paddingTop: Math.max(insets.top + 8, 36),
      }}
    >
      {/* Top Bar */}
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

        <View
          style={{
            backgroundColor: 'rgba(206, 240, 74, 0.12)',
            borderColor: 'rgba(206, 240, 74, 0.3)',
          }}
          className="px-3 py-1 rounded-full border"
        >
          <Text style={{ color: colors.matchaLime }} className="text-xs font-bold">
            Step 2 of 2
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom + 32, 48),
          }}
        >
          {/* Header Title */}
          <View className="mb-5">
            <View
              style={{
                backgroundColor: 'rgba(206, 240, 74, 0.14)',
                borderColor: 'rgba(206, 240, 74, 0.35)',
              }}
              className="self-start px-3 py-1 rounded-full border mb-2"
            >
              <Text
                style={{ color: colors.matchaLime }}
                className="text-[11px] font-extrabold tracking-wider"
              >
                PROFILE SETUP
              </Text>
            </View>
            <Text
              style={{ color: colors.textPrimary }}
              className="text-2xl font-black tracking-tight mb-1"
            >
              Create Your Profile
            </Text>
            <Text
              style={{ color: colors.textSecondary }}
              className="text-sm leading-relaxed"
            >
              Set up your offline identity. Your data never leaves this device.
            </Text>
          </View>

          {/* Avatar Selector Hero */}
          <View
            style={{
              backgroundColor: colors.cardPrimary,
              borderColor: colors.borderSubtle,
            }}
            className="p-5 rounded-3xl border items-center mb-5"
          >
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setAvatarPickerVisible(true);
              }}
              activeOpacity={0.8}
              className="mb-3"
            >
              <UserAvatar avatarIdOrUri={avatar} name={name || 'User'} size="xl" showRing />
            </TouchableOpacity>

            <Text style={{ color: colors.textPrimary }} className="text-sm font-bold mb-3">
              Choose an Avatar
            </Text>

            {/* Quick avatar chips */}
            <View className="flex-row items-center gap-3">
              {STARTER_AVATARS.map((avId) => {
                const isSelected = avatar === avId;
                return (
                  <TouchableOpacity
                    key={avId}
                    onPress={() => {
                      triggerHaptic('light');
                      setAvatar(avId);
                    }}
                    style={{
                      borderWidth: 2,
                      borderColor: isSelected ? colors.matchaLime : 'transparent',
                      borderRadius: 24,
                      padding: 2,
                    }}
                    activeOpacity={0.7}
                  >
                    <UserAvatar avatarIdOrUri={avId} name="" size="md" />
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  setAvatarPickerVisible(true);
                }}
                style={{
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.borderSubtle,
                }}
                className="px-3 py-2 rounded-2xl border"
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.matchaLime }} className="text-xs font-black">
                  + More
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Validation Error Message */}
          {errorMessage ? (
            <View
              style={{
                backgroundColor: 'rgba(224, 122, 95, 0.15)',
                borderColor: 'rgba(224, 122, 95, 0.35)',
              }}
              className="p-3.5 rounded-2xl border mb-4"
            >
              <Text style={{ color: '#E07A5F' }} className="text-xs font-bold text-center">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Name Input */}
          <View className="mb-4">
            <Text
              style={{ color: colors.textSecondary }}
              className="text-xs font-bold uppercase tracking-wider mb-2"
            >
              Your Name *
            </Text>
            <View
              style={{
                backgroundColor: colors.cardPrimary,
                borderColor: colors.borderSubtle,
              }}
              className="flex-row items-center h-13 px-4 rounded-2xl border"
            >
              <User size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="e.g. Shekhor Das"
                placeholderTextColor={colors.textMuted}
                style={{ color: colors.textPrimary }}
                className="flex-1 text-base font-semibold"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Currency Selector (Choose first so phone code auto-populates) */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text
                style={{ color: colors.textSecondary }}
                className="text-xs font-bold uppercase tracking-wider"
              >
                Primary Currency (Selects Country Code)
              </Text>
              <View
                style={{
                  backgroundColor: 'rgba(206, 240, 74, 0.16)',
                  borderColor: 'rgba(206, 240, 74, 0.35)',
                }}
                className="px-2 py-0.5 rounded-full border"
              >
                <Text style={{ color: colors.matchaLime }} className="text-[10px] font-black">
                  LOCALIZED
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {SUPPORTED_CURRENCIES.slice(0, 5).map((curr) => {
                const isSelected = currency === curr.display;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    onPress={() => handleCurrencySelect(curr.display)}
                    style={{
                      backgroundColor: isSelected ? colors.matchaLime : colors.cardPrimary,
                      borderColor: isSelected ? colors.matchaLime : colors.borderSubtle,
                    }}
                    className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-2xl border active:opacity-75"
                    activeOpacity={0.75}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#121413' : colors.textPrimary,
                        fontWeight: isSelected ? '900' : '700',
                      }}
                      className="text-sm"
                    >
                      {curr.display}
                    </Text>
                    {isSelected && <Check size={14} color="#121413" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Phone Number Input (Auto-filled with country code based on currency) */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text
                style={{ color: colors.textSecondary }}
                className="text-xs font-bold uppercase tracking-wider"
              >
                Phone Number (Optional)
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-[11px]">
                Pre-filled for WhatsApp reminders
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.cardPrimary,
                borderColor: colors.borderSubtle,
              }}
              className="flex-row items-center h-13 px-4 rounded-2xl border"
            >
              <Phone size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted}
                style={{ color: colors.textPrimary }}
                className="flex-1 text-base font-semibold"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleLaunch}
            style={{
              backgroundColor: colors.matchaLime,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.22,
              shadowRadius: 12,
            }}
            className="flex-row items-center justify-center gap-2.5 h-14 rounded-full active:opacity-85"
            activeOpacity={0.85}
          >
            <Sparkles size={20} color="#141715" />
            <Text style={{ color: '#141715', fontWeight: '900', fontSize: 16 }}>
              Launch Dinlipi Ledger
            </Text>
            <ArrowRight size={18} color="#141715" strokeWidth={2.5} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={avatarPickerVisible}
        currentAvatar={avatar}
        onSelectAvatar={(newAvatar) => setAvatar(newAvatar)}
        onClose={() => setAvatarPickerVisible(false)}
      />
    </Animated.View>
  );
}
