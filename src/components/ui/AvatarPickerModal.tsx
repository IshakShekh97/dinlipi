import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Camera, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { AVATAR_PRESETS, UserAvatar } from './UserAvatar';
import { useUIStore } from '../../store/ui-store';

interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatar: string;
  onSelectAvatar: (avatarIdOrUri: string) => void;
  onClose: () => void;
}

export function AvatarPickerModal({
  visible,
  currentAvatar,
  onSelectAvatar,
  onClose,
}: AvatarPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'creatures' | 'personas' | 'abstract'>('all');
  const showConfirm = useUIStore((state) => state.showConfirmDialog);

  const filteredPresets = activeTab === 'all'
    ? AVATAR_PRESETS
    : AVATAR_PRESETS.filter((p) => p.category === activeTab);

  const handlePickFromGallery = async () => {
    triggerHaptic('light');
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showConfirm({
          title: 'Photo Library Access Required',
          message: 'Please allow Dinlipi photo access in your system settings to pick a custom avatar from your gallery.',
          confirmText: 'OK',
          cancelText: '',
          isDestructive: false,
          onConfirm: () => {},
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        triggerHaptic('success');
        onSelectAvatar(result.assets[0].uri);
        onClose();
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      showConfirm({
        title: 'Gallery Error',
        message: 'Could not open photo picker. Please try again.',
        confirmText: 'Dismiss',
        cancelText: '',
        isDestructive: false,
        onConfirm: () => {},
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bgSecondary,
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Choose Avatar</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Pick a cozy character, aura glyph, or custom photo
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
              ]}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Upload Custom Photo Row */}
          <TouchableOpacity
            onPress={handlePickFromGallery}
            activeOpacity={0.8}
            style={[
              styles.uploadCard,
              {
                backgroundColor: colors.cardPrimary,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View
              style={[
                styles.uploadIconBox,
                { backgroundColor: 'rgba(206, 240, 74, 0.16)', borderColor: colors.borderMedium },
              ]}
            >
              <Camera size={24} color={colors.matchaLime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>
                Upload Custom Photo
              </Text>
              <Text style={[styles.uploadSub, { color: colors.textSecondary }]}>
                Select any picture from your device gallery
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Category Tabs */}
          <View style={styles.tabsRow}>
            {(['all', 'creatures', 'personas', 'abstract'] as const).map((tab) => {
              const active = activeTab === tab;
              const labels = {
                all: 'All',
                creatures: 'Cozy Critters',
                personas: 'Personas',
                abstract: 'Aura Glyphs',
              };
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    triggerHaptic('light');
                    setActiveTab(tab);
                  }}
                  style={[
                    styles.tabPill,
                    {
                      backgroundColor: active
                        ? colors.matchaLime
                        : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(18,20,19,0.04)'),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      {
                        color: active ? '#121413' : colors.textSecondary,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {labels[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Presets Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
          >
            {filteredPresets.map((preset) => {
              const isSelected = currentAvatar === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  activeOpacity={0.75}
                  onPress={() => {
                    triggerHaptic('light');
                    onSelectAvatar(preset.id);
                    onClose();
                  }}
                  style={[
                    styles.avatarTile,
                    {
                      borderColor: isSelected ? colors.matchaLime : colors.borderSubtle,
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(206, 240, 74, 0.12)' : 'rgba(206, 240, 74, 0.18)')
                        : colors.cardPrimary,
                    },
                  ]}
                >
                  <UserAvatar avatarIdOrUri={preset.id} size="lg" showRing={isSelected} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.avatarTileName,
                      {
                        color: isSelected ? colors.matchaLime : colors.textPrimary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '86%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    marginBottom: 16,
  },
  uploadIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  uploadSub: {
    fontSize: 12,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  tabPillText: {
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
  avatarTile: {
    width: '30.5%',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  avatarTileName: {
    fontSize: 12,
    textAlign: 'center',
  },
});
