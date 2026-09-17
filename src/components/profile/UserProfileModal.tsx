import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Sparkles, Camera, User, Phone } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { UserAvatar } from '../ui/UserAvatar';
import { AvatarPickerModal } from '../ui/AvatarPickerModal';
import { CozyModal } from '../ui/CozyModal';
import { db } from '../../db/client';
import { usersTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '../../utils/currency';
import { useUIStore } from '../../store/ui-store';

export interface UserProfile {
  name: string;
  phone: string;
  avatar: string;
  currency: string;
  updatedAt?: string;
}

interface UserProfileModalProps {
  visible: boolean;
  profile: UserProfile;
  isFirstTime?: boolean;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
}

export function UserProfileModal(props: UserProfileModalProps) {
  const { colors } = useAppTheme();

  return (
    <CozyModal
      visible={props.visible}
      onClose={props.onClose}
      title={props.isFirstTime ? 'Welcome to Dinlipi' : 'Personal Profile'}
      subtitle={
        props.isFirstTime
          ? 'Set up your offline ledger identity'
          : 'Update your name, avatar, and currency'
      }
      icon={<User size={18} color={colors.accentPrimary} />}
    >
      {props.visible ? (
        <UserProfileForm
          key={props.profile.updatedAt || props.profile.name || 'profile_form'}
          {...props}
        />
      ) : null}
    </CozyModal>
  );
}

function UserProfileForm({
  profile,
  isFirstTime = false,
  onSave,
  onClose,
}: UserProfileModalProps) {
  const { colors } = useAppTheme();
  const setActiveCurrency = useUIStore((state) => state.setActiveCurrency);

  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [avatar, setAvatar] = useState(profile.avatar || 'avatar_matcha_fox');
  const [currency, setCurrency] = useState(profile.currency || DEFAULT_CURRENCY);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your name to personalize your ledger.');
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('success');
    const updatedProfile: UserProfile = {
      name: name.trim(),
      phone: phone.trim(),
      avatar,
      currency,
      updatedAt: new Date().toISOString(),
    };

    try {
      const now = new Date().toISOString();
      const existing = db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, 'default_user'))
        .all();

      if (existing.length > 0) {
        db.update(usersTable)
          .set({
            name: updatedProfile.name,
            phone: updatedProfile.phone,
            avatar: updatedProfile.avatar,
            currency: updatedProfile.currency,
            updatedAt: now,
          })
          .where(eq(usersTable.id, 'default_user'))
          .run();
      } else {
        db.insert(usersTable)
          .values({
            id: 'default_user',
            name: updatedProfile.name,
            phone: updatedProfile.phone,
            avatar: updatedProfile.avatar,
            currency: updatedProfile.currency,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    } catch (err) {
      console.warn('[UserProfileModal] DB save error:', err);
    }

    setActiveCurrency(currency);
    onSave(updatedProfile);
    onClose();
  };

  return (
    <>
      <View style={styles.content}>
        {/* Interactive Avatar Hero */}
        <View style={styles.avatarHero}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setAvatarPickerVisible(true);
            }}
            style={styles.avatarWrapper}
            activeOpacity={0.8}
          >
              <UserAvatar avatarIdOrUri={avatar} name={name || 'User'} size="xl" showRing />
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.matchaLime },
                ]}
              >
                <Camera size={16} color="#121413" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setAvatarPickerVisible(true);
              }}
            >
              <Text style={[styles.changeAvatarText, { color: colors.matchaLime }]}>
                Choose Avatar or Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Validation Error Banner */}
          {errorMessage ? (
            <View
              style={{
                backgroundColor: 'rgba(224, 122, 95, 0.15)',
                borderColor: 'rgba(224, 122, 95, 0.35)',
              }}
              className="p-3 rounded-2xl border mb-3"
            >
              <Text style={{ color: '#E07A5F' }} className="text-xs font-bold text-center">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Name Input */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Your Name *</Text>
          <View
            style={[
              styles.inputBox,
              { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
            ]}
          >
            <User size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="e.g. Shekhor Das"
              placeholderTextColor={colors.textMuted}
              style={[styles.inputText, { color: colors.textPrimary }]}
              returnKeyType="next"
            />
          </View>

          {/* Phone Number Input */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            Phone Number (WhatsApp Reminders)
          </Text>
          <View
            style={[
              styles.inputBox,
              { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
            ]}
          >
            <Phone size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              placeholderTextColor={colors.textMuted}
              style={[styles.inputText, { color: colors.textPrimary }]}
              returnKeyType="done"
            />
          </View>

          {/* Currency Selector */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            Primary Currency (Default: ₹ INR)
          </Text>
          <View style={styles.currencyRow}>
            {SUPPORTED_CURRENCIES.slice(0, 5).map((curr) => {
              const isSelected = currency === curr.display;
              return (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => {
                    triggerHaptic('light');
                    setCurrency(curr.display);
                  }}
                  style={[
                    styles.currencyPill,
                    {
                      backgroundColor: isSelected
                        ? colors.matchaLime
                        : colors.cardSecondary,
                      borderColor: isSelected
                        ? colors.matchaLime
                        : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      {
                        color: isSelected ? '#121413' : colors.textPrimary,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {curr.display}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveBtn,
              {
                backgroundColor: colors.matchaLime,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
              },
            ]}
            activeOpacity={0.85}
          >
            <Sparkles size={18} color="#121413" />
            <Text style={styles.saveBtnText}>
              {isFirstTime ? 'Enter Dinlipi Ledger' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={avatarPickerVisible}
        currentAvatar={avatar}
        onSelectAvatar={(newAvatar) => setAvatar(newAvatar)}
        onClose={() => setAvatarPickerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  avatarHero: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changeAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  currencyPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  currencyText: {
    fontSize: 13,
  },
  saveBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 26,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#121413',
    letterSpacing: -0.2,
  },
});
