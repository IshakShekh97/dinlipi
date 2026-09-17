import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic, FONTS } from '../../constants/theme';

interface CozyModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
}

export const CozyModal: React.FC<CozyModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  headerRight,
  children,
  scrollable = true,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.70)' : 'rgba(12, 18, 14, 0.45)' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => {
            triggerHaptic('light');
            onClose();
          }}
          activeOpacity={1}
        />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? 'rgba(25, 29, 27, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
        >
          {/* Top Handle Pill */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handlePill,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)' },
              ]}
            />
          </View>

          {/* Header */}
          {(title || headerRight) && (
            <View style={styles.header}>
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                {icon && (
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: isDark ? '#262928' : '#F4F4F0',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    {icon}
                  </View>
                )}
                <View className="flex-1">
                  {title && (
                    <Text
                      style={[styles.title, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text
                      style={[styles.subtitle, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {subtitle}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                {headerRight}
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: isDark ? '#262928' : '#F5F5F0',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Body Content */}
          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="interactive"
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom + 48, 80) },
              ]}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.staticContent}>{children}</View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 22,
    maxHeight: '90%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handlePill: {
    width: 42,
    height: 4.5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONTS.sansRegular,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  staticContent: {
    paddingBottom: 16,
  },
});
