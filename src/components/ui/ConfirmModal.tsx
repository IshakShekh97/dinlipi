import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Trash2, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { useUIStore } from '../../store/ui-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ConfirmModalProps {
  visible?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: () => void | Promise<void>;
  onClose?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible: propVisible,
  title: propTitle,
  message: propMessage,
  confirmText: propConfirmText,
  cancelText: propCancelText,
  isDestructive: propIsDestructive,
  onConfirm: propOnConfirm,
  onClose: propOnClose,
}) => {
  const { colors, isDark } = useAppTheme();
  const storeDialog = useUIStore((state) => state.confirmDialog);
  const closeStoreDialog = useUIStore((state) => state.closeConfirmDialog);

  // Determine if controlled by props or global store
  const isGlobal = propVisible === undefined;
  const isVisible = isGlobal ? storeDialog.visible : Boolean(propVisible);
  const title = isGlobal ? storeDialog.title : (propTitle ?? '');
  const message = isGlobal ? storeDialog.message : (propMessage ?? '');
  const isDestructive = isGlobal ? Boolean(storeDialog.isDestructive) : Boolean(propIsDestructive);
  const confirmText = isGlobal
    ? storeDialog.confirmText
    : (propConfirmText ?? (isDestructive ? 'Delete' : 'Confirm'));
  const cancelText = isGlobal ? storeDialog.cancelText : (propCancelText ?? 'Cancel');

  const handleClose = () => {
    triggerHaptic('light');
    if (isGlobal) {
      closeStoreDialog();
    } else if (propOnClose) {
      propOnClose();
    }
  };

  const handleConfirm = async () => {
    triggerHaptic(isDestructive ? 'error' : 'success');
    const fn = isGlobal ? storeDialog.onConfirm : propOnConfirm;
    handleClose();
    if (fn) {
      try {
        await fn();
      } catch (err) {
        console.warn('[ConfirmModal] Error in onConfirm callback:', err);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(120)}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          activeOpacity={1}
        />

        <Animated.View
          entering={FadeIn.duration(160)}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#191B1A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Badge Icon */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: isDestructive
                  ? 'rgba(224, 122, 95, 0.12)'
                  : 'rgba(206, 240, 74, 0.14)',
                borderColor: isDestructive
                  ? 'rgba(224, 122, 95, 0.25)'
                  : 'rgba(206, 240, 74, 0.25)',
              },
            ]}
          >
            {isDestructive ? (
              <Trash2 size={20} color="#E07A5F" strokeWidth={2} />
            ) : (
              <Sparkles size={20} color={colors.matchaLime} strokeWidth={2} />
            )}
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            {cancelText ? (
              <TouchableOpacity
                onPress={handleClose}
                style={[
                  styles.btn,
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? '#262928' : '#F4F4F0',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.btn,
                styles.confirmBtn,
                {
                  backgroundColor: isDestructive ? '#E07A5F' : colors.matchaLime,
                },
              ]}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.confirmText,
                  { color: isDestructive ? '#FFFFFF' : '#121413' },
                ]}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 48, 360),
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
