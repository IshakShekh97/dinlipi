import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  User,
  Phone,
  Coins,
  QrCode,
  Plus,
  Share2,
  Trash2,
  Maximize2,
  CreditCard,
  Users,
  Shield,
  ChevronRight,
  Camera,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '../context/theme-context';
import { FONTS, triggerHaptic } from '../constants/theme';
import { AmbientGlowBackground } from '../components/ui/AmbientGlowBackground';
import { UserAvatar } from '../components/ui/UserAvatar';
import { AvatarPickerModal } from '../components/ui/AvatarPickerModal';
import { CurrencyPickerModal } from '../components/settings/CurrencyPickerModal';
import { AppButton } from '../components/ui/AppButton';
import { CozyModal } from '../components/ui/CozyModal';
import {
  useUserLive,
  usePaymentQRsLive,
  useBudgetCardsLive,
  usePeopleLive,
  updateUserProfile,
  addPaymentQR,
  deletePaymentQR,
  setDefaultPaymentQR,
} from '../db/queries';
import { useUIStore } from '../store/ui-store';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  // Live Database data
  const { data: dbUsers = [] } = useUserLive();
  const { data: dbPaymentQRs = [] } = usePaymentQRsLive();
  const { data: dbCards = [] } = useBudgetCardsLive();
  const { data: dbPeople = [] } = usePeopleLive();

  const user = dbUsers[0];

  // User form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'avatar_matcha_fox');
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');

  // Sync state if dbUser updates
  const [lastUserLoaded, setLastUserLoaded] = useState(user?.id);
  if (user && user.id !== lastUserLoaded) {
    setLastUserLoaded(user.id);
    setName(user.name);
    setPhone(user.phone || '');
    setAvatar(user.avatar || 'avatar_matcha_fox');
  }

  // QR Management state
  const [addQRModalVisible, setAddQRModalVisible] = useState(false);
  const [qrTitle, setQrTitle] = useState('');
  const [qrUpiId, setQrUpiId] = useState('');
  const [qrImageUri, setQrImageUri] = useState<string | null>(null);
  const [qrIsDefault, setQrIsDefault] = useState(false);

  // Fullscreen QR Modal state
  const [fullscreenQR, setFullscreenQR] = useState<{
    title: string;
    imageUri: string;
    upiId?: string;
  } | null>(null);

  // Save profile info
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showConfirm({
        title: 'Name Required',
        message: 'Please provide a display name for your daybook account.',
        confirmText: 'Understood',
        cancelText: '',
        onConfirm: () => {},
      });
      return;
    }

    setIsSavingProfile(true);
    triggerHaptic('success');
    await updateUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      avatar,
      currency: user?.currency || activeCurrency,
    });
    setIsSavingProfile(false);
    setProfileSuccessMessage('Profile saved successfully!');
    setTimeout(() => setProfileSuccessMessage(''), 2500);
  };

  // Pick payment QR image from device
  const handlePickQRImage = async () => {
    triggerHaptic('light');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showConfirm({
          title: 'Photo Library Permission Required',
          message: 'Please allow access to your photos to pick a QR code from your device.',
          confirmText: 'OK',
          cancelText: 'Cancel',
          onConfirm: () => {},
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setQrImageUri(result.assets[0].uri);
        if (!qrTitle.trim()) {
          setQrTitle('UPI Payment QR');
        }
      }
    } catch (err) {
      console.warn('[ProfileScreen] Error picking QR image:', err);
    }
  };

  // Save payment QR code
  const handleSaveQR = async () => {
    if (!qrImageUri) {
      showConfirm({
        title: 'QR Code Image Required',
        message: 'Please select a QR code screenshot or image from your device.',
        confirmText: 'OK',
        cancelText: '',
        onConfirm: () => {},
      });
      return;
    }

    triggerHaptic('success');
    await addPaymentQR({
      title: qrTitle.trim() || 'Payment QR',
      upiId: qrUpiId.trim(),
      imageUri: qrImageUri,
      isDefault: qrIsDefault || dbPaymentQRs.length === 0,
    });

    setAddQRModalVisible(false);
    setQrTitle('');
    setQrUpiId('');
    setQrImageUri(null);
    setQrIsDefault(false);
  };

  // Share QR code image
  const handleShareQR = async (imageUri: string, title: string) => {
    triggerHaptic('light');
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          dialogTitle: `Share ${title}`,
          mimeType: 'image/jpeg',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this platform.');
      }
    } catch (err) {
      console.warn('[ProfileScreen] Share error:', err);
    }
  };

  // Delete QR code
  const handleDeleteQR = (id: string, title: string) => {
    triggerHaptic('warning');
    showConfirm({
      title: 'Delete QR Code',
      message: `Are you sure you want to remove "${title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await deletePaymentQR(id);
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      {/* Ambient Diffuse Background Glow directly from Reference Images */}
      <AmbientGlowBackground glowHeight={400} />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)',
            },
          ]}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Profile & Payments
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Identity & UPI QR Vault
          </Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* SECTION 1: USER IDENTITY                                 */}
        {/* ======================================================== */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(25, 34, 29, 0.82)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.07)',
            },
          ]}
        >
          <View style={styles.avatarRow}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setAvatarPickerVisible(true);
              }}
              activeOpacity={0.85}
              style={styles.avatarPressable}
            >
              <UserAvatar avatarIdOrUri={avatar} name={name || 'User'} size="lg" showRing />
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.palmLeaf },
                ]}
              >
                <Camera size={13} color="#141715" />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.avatarSectionTitle, { color: colors.textPrimary }]}>
                {name || 'Account Holder'}
              </Text>
              <Text style={[styles.avatarSectionSub, { color: colors.textSecondary }]}>
                Tap avatar to customize look
              </Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: isDark ? 'rgba(137, 157, 120, 0.16)' : '#EEF5EA' },
                  ]}
                >
                  <Text style={[styles.tagBadgeText, { color: colors.palmLeaf }]}>
                    Offline Vault
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Form Fields */}
          <View style={{ gap: 14, marginTop: 18 }}>
            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Display Name
              </Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: isDark ? colors.cardSecondary : '#F7F9F6',
                    borderColor: isDark ? colors.borderSubtle : '#E2E8DE',
                  },
                ]}
              >
                <User size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Shekhor, Cyber Cafe Owner"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.inputText, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Phone Number / Contact
              </Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: isDark ? colors.cardSecondary : '#F7F9F6',
                    borderColor: isDark ? colors.borderSubtle : '#E2E8DE',
                  },
                ]}
              >
                <Phone size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  style={[styles.inputText, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            {/* Currency Selector Row */}
            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Primary Currency
              </Text>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  setCurrencyModalVisible(true);
                }}
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: isDark ? colors.cardSecondary : '#F7F9F6',
                    borderColor: isDark ? colors.borderSubtle : '#E2E8DE',
                    justifyContent: 'space-between',
                  },
                ]}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Coins size={16} color={colors.palmLeaf} style={{ marginRight: 10 }} />
                  <Text style={[styles.inputText, { color: colors.textPrimary }]}>
                    {user?.currency || activeCurrency}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.palmLeaf,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: '#141715', fontFamily: FONTS.sansBold, fontSize: 11 }}>
                    Change
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {profileSuccessMessage ? (
              <View
                style={{
                  backgroundColor: 'rgba(137, 157, 120, 0.16)',
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.palmLeaf,
                }}
              >
                <Text style={{ color: colors.palmLeaf, fontFamily: FONTS.sansBold, textAlign: 'center', fontSize: 12 }}>
                  {profileSuccessMessage}
                </Text>
              </View>
            ) : null}

            <AppButton
              title="Save Profile"
              onPress={handleSaveProfile}
              variant="primary"
              size="md"
              loading={isSavingProfile}
            />
          </View>
        </View>

        {/* ======================================================== */}
        {/* SECTION 2: ONLINE PAYMENT QR CODES (USER REQUEST)        */}
        {/* ======================================================== */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <QrCode size={18} color={colors.blueSlate} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Payment QR Codes
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              Store UPI QR for customer scanning & instant payments
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setAddQRModalVisible(true);
            }}
            style={[
              styles.addPillBtn,
              { backgroundColor: colors.blueSlate },
            ]}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addPillText}>Add QR</Text>
          </TouchableOpacity>
        </View>

        {dbPaymentQRs.length === 0 ? (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('medium');
              setAddQRModalVisible(true);
            }}
            style={[
              styles.emptyQRBox,
              {
                backgroundColor: isDark ? 'rgba(25, 34, 29, 0.65)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.emptyQRIcon,
                { backgroundColor: 'rgba(50, 98, 115, 0.15)' },
              ]}
            >
              <QrCode size={28} color={colors.blueSlate} />
            </View>
            <Text style={[styles.emptyQRTitle, { color: colors.textPrimary }]}>
              No Payment QR Codes Stored
            </Text>
            <Text style={[styles.emptyQRSub, { color: colors.textSecondary }]}>
              Download or screenshot your QR from PhonePe, Google Pay, or Paytm and store it here. Show it to customers on full screen for fast scanning!
            </Text>
            <AppButton
              title="+ Add Payment QR Code"
              onPress={() => setAddQRModalVisible(true)}
              variant="accent"
              size="sm"
              style={{ marginTop: 8 }}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 14 }}>
            {dbPaymentQRs.map((item) => {
              return (
                <View
                  key={item.id}
                  style={[
                    styles.qrCard,
                    {
                      backgroundColor: isDark ? 'rgba(25, 34, 29, 0.85)' : '#FFFFFF',
                      borderColor: item.isDefault ? colors.palmLeaf : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <View style={styles.qrCardTop}>
                    {/* QR Thumbnail */}
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('medium');
                        setFullscreenQR({
                          title: item.title,
                          imageUri: item.imageUri,
                          upiId: item.upiId || undefined,
                        });
                      }}
                      activeOpacity={0.85}
                      style={[styles.qrThumbWrap, { backgroundColor: '#FFFFFF' }]}
                    >
                      <Image source={{ uri: item.imageUri }} style={styles.qrThumbImage} resizeMode="contain" />
                      <View style={styles.qrThumbOverlay}>
                        <Maximize2 size={12} color="#000000" />
                      </View>
                    </TouchableOpacity>

                    {/* QR Details */}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>
                          {item.title}
                        </Text>
                        {item.isDefault ? (
                          <View style={[styles.defaultBadge, { backgroundColor: colors.palmLeaf }]}>
                            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => setDefaultPaymentQR(item.id)}
                            style={[styles.setDefaultBtn, { borderColor: colors.borderSubtle }]}
                          >
                            <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: FONTS.sansMedium }}>
                              Set Default
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {Boolean(item.upiId) && (
                        <Text style={[styles.qrUpiId, { color: colors.blueSlate }]}>
                          UPI: {item.upiId}
                        </Text>
                      )}

                      <Text style={[styles.qrDate, { color: colors.textMuted }]}>
                        Tap image to expand for customers
                      </Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.qrActionsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('medium');
                        setFullscreenQR({
                          title: item.title,
                          imageUri: item.imageUri,
                          upiId: item.upiId || undefined,
                        });
                      }}
                      style={[
                        styles.qrActionPill,
                        {
                          backgroundColor: colors.palmLeaf,
                          flex: 1,
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <Maximize2 size={14} color="#141715" strokeWidth={2.5} />
                      <Text style={[styles.qrActionPillText, { color: '#141715' }]}>
                        Show to Customer
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleShareQR(item.imageUri, item.title)}
                      style={[
                        styles.iconActionBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F5F0',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E2E8DE',
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Share2 size={15} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteQR(item.id, item.title)}
                      style={[
                        styles.iconActionBtn,
                        {
                          backgroundColor: 'rgba(176, 46, 12, 0.12)',
                          borderColor: 'rgba(176, 46, 12, 0.25)',
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Trash2 size={15} color={colors.oxidizedIron} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ======================================================== */}
        {/* SECTION 3: ACCOUNT STATS & SHORTCUTS                     */}
        {/* ======================================================== */}
        <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Account Statistics
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              Offline database storage overview
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? 'rgba(25, 34, 29, 0.82)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <CreditCard size={18} color={colors.palmLeaf} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {dbCards.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Budget Envelopes
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? 'rgba(25, 34, 29, 0.82)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <Users size={18} color={colors.tangerineDream} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {dbPeople.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Khata Contacts
            </Text>
          </View>
        </View>

        {/* Security Shortcut */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/settings' as any);
          }}
          style={[
            styles.settingsShortcutCard,
            {
              backgroundColor: isDark ? 'rgba(25, 34, 29, 0.82)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.shortcutIconWrap,
              { backgroundColor: 'rgba(137, 157, 120, 0.16)' },
            ]}
          >
            <Shield size={18} color={colors.palmLeaf} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.shortcutTitle, { color: colors.textPrimary }]}>
              Security & Privacy
            </Text>
            <Text style={[styles.shortcutSub, { color: colors.textSecondary }]}>
              Manage passcode and fingerprint unlock
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={avatarPickerVisible}
        currentAvatar={avatar}
        onSelectAvatar={(newAvatar) => {
          setAvatar(newAvatar);
          setAvatarPickerVisible(false);
        }}
        onClose={() => setAvatarPickerVisible(false)}
      />

      {/* Currency Picker Modal */}
      <CurrencyPickerModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
      />

      {/* Add QR Code Modal */}
      <CozyModal
        visible={addQRModalVisible}
        onClose={() => {
          setAddQRModalVisible(false);
          setQrImageUri(null);
        }}
        title="Add Payment QR Code"
        subtitle="Store your UPI QR code image from PhonePe, GPay, Paytm, or bank app"
        icon={<QrCode size={18} color={colors.blueSlate} />}
      >
        <View style={{ gap: 14, paddingBottom: 16 }}>
          {/* Image Picker Box */}
          <TouchableOpacity
            onPress={handlePickQRImage}
            style={[
              styles.qrPickBox,
              {
                backgroundColor: isDark ? colors.cardSecondary : '#F4F7F2',
                borderColor: qrImageUri ? colors.palmLeaf : isDark ? colors.borderSubtle : '#D4DDD1',
              },
            ]}
            activeOpacity={0.8}
          >
            {qrImageUri ? (
              <View style={{ alignItems: 'center' }}>
                <Image source={{ uri: qrImageUri }} style={styles.qrPreviewImage} resizeMode="contain" />
                <Text style={{ color: colors.palmLeaf, fontFamily: FONTS.sansBold, fontSize: 12, marginTop: 8 }}>
                  ✓ QR Code Selected (Tap to change)
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(50, 98, 115, 0.16)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <QrCode size={26} color={colors.blueSlate} />
                </View>
                <Text style={{ color: colors.textPrimary, fontFamily: FONTS.sansBold, fontSize: 15, marginBottom: 4 }}>
                  Choose QR Image from Gallery
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', maxWidth: 240 }}>
                  Select the screenshot or downloaded QR from PhonePe, Google Pay, or Paytm.
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* QR Title */}
          <View>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              QR Title / Nickname *
            </Text>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? colors.cardSecondary : '#F7F9F6',
                  borderColor: isDark ? colors.borderSubtle : '#E2E8DE',
                },
              ]}
            >
              <TextInput
                value={qrTitle}
                onChangeText={setQrTitle}
                placeholder="e.g. Cyber Cafe PhonePe, Counter GPay"
                placeholderTextColor={colors.textMuted}
                style={[styles.inputText, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          {/* UPI ID (Optional) */}
          <View>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              UPI ID (Optional)
            </Text>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? colors.cardSecondary : '#F7F9F6',
                  borderColor: isDark ? colors.borderSubtle : '#E2E8DE',
                },
              ]}
            >
              <TextInput
                value={qrUpiId}
                onChangeText={setQrUpiId}
                placeholder="e.g. yourshop@okhdfcbank"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                style={[styles.inputText, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          {/* Default Toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 6,
            }}
          >
            <View>
              <Text style={{ color: colors.textPrimary, fontFamily: FONTS.sansBold, fontSize: 14 }}>
                Set as Primary QR
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Show as default payment card on profile
              </Text>
            </View>
            <Switch
              value={qrIsDefault}
              onValueChange={setQrIsDefault}
              trackColor={{ false: '#3A3F3C', true: colors.palmLeaf }}
              thumbColor="#FFFFFF"
            />
          </View>

          <AppButton
            title="Save Payment QR"
            onPress={handleSaveQR}
            variant="primary"
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>
      </CozyModal>

      {/* Fullscreen QR Customer Scanner Modal */}
      <Modal
        visible={Boolean(fullscreenQR)}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenQR(null)}
      >
        <View style={styles.fullscreenBackdrop}>
          <View style={[styles.fullscreenCard, { backgroundColor: '#FFFFFF' }]}>
            {/* Header */}
            <View style={styles.fullscreenHeader}>
              <View>
                <Text style={styles.fullscreenTitle}>
                  {fullscreenQR?.title || 'Scan & Pay'}
                </Text>
                <Text style={styles.fullscreenSub}>
                  Scan using Google Pay, PhonePe, Paytm, BHIM
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFullscreenQR(null)}
                style={styles.fullscreenCloseBtn}
                activeOpacity={0.8}
              >
                <X size={20} color="#141715" />
              </TouchableOpacity>
            </View>

            {/* Huge QR Code Image */}
            <View style={styles.fullscreenImageWrap}>
              {fullscreenQR?.imageUri ? (
                <Image
                  source={{ uri: fullscreenQR.imageUri }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>

            {/* UPI ID Footer */}
            {Boolean(fullscreenQR?.upiId) && (
              <View style={styles.fullscreenFooterUpi}>
                <Text style={styles.fullscreenUpiLabel}>UPI ID:</Text>
                <Text style={styles.fullscreenUpiVal}>{fullscreenQR?.upiId}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setFullscreenQR(null)}
              style={styles.fullscreenDoneBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.fullscreenDoneText}>Done Scanning</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    marginTop: 1,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPressable: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarSectionTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  avatarSectionSub: {
    fontFamily: FONTS.sansRegular,
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
  },
  inputLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputText: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    marginTop: 2,
  },
  addPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  addPillText: {
    color: '#FFFFFF',
    fontFamily: FONTS.sansBold,
    fontSize: 12,
  },
  emptyQRBox: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyQRIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyQRTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyQRSub: {
    fontFamily: FONTS.sansRegular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  qrCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  qrCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrThumbWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrThumbImage: {
    width: '100%',
    height: '100%',
  },
  qrThumbOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    padding: 3,
  },
  qrTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
  },
  defaultBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    color: '#141715',
    fontFamily: FONTS.sansBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  setDefaultBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  qrUpiId: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    marginTop: 3,
  },
  qrDate: {
    fontFamily: FONTS.sansRegular,
    fontSize: 11,
    marginTop: 3,
  },
  qrActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  qrActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
    gap: 6,
  },
  qrActionPillText: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontFamily: FONTS.sansBold,
    fontSize: 22,
  },
  statLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
  },
  settingsShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    gap: 14,
  },
  shortcutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 14,
  },
  shortcutSub: {
    fontFamily: FONTS.sansRegular,
    fontSize: 12,
    marginTop: 1,
  },
  qrPickBox: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    padding: 16,
  },
  qrPreviewImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullscreenCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
  },
  fullscreenTitle: {
    fontFamily: FONTS.sansBold,
    fontSize: 18,
    color: '#141715',
  },
  fullscreenSub: {
    fontFamily: FONTS.sansRegular,
    fontSize: 11,
    color: '#656D67',
    marginTop: 2,
  },
  fullscreenCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF0ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImageWrap: {
    width: 250,
    height: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenFooterUpi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: '#F3F6F1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  fullscreenUpiLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
    color: '#326273',
  },
  fullscreenUpiVal: {
    fontFamily: FONTS.monoBold,
    fontSize: 13,
    color: '#141715',
  },
  fullscreenDoneBtn: {
    backgroundColor: '#899D78',
    width: '100%',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  fullscreenDoneText: {
    color: '#141715',
    fontFamily: FONTS.sansBold,
    fontSize: 14,
  },
});
