import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import { PhonePinKeypad } from './PhonePinKeypad';
import { AnimatedPinDots } from './AnimatedPinDots';

interface PasscodeModalProps {
  visible: boolean;
  title?: string;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  visible,
  title = 'Set 4-Digit Passcode',
  onSuccess,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleReset = () => {
    setStep('enter');
    setPin('');
    setFirstPin('');
    setErrorMessage('');
    setHasError(false);
  };

  const handleClose = () => {
    handleReset();
    onCancel();
  };

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + num;
    setPin(nextPin);
    setErrorMessage('');
    setHasError(false);

    if (nextPin.length === 4) {
      if (step === 'enter') {
        setFirstPin(nextPin);
        setPin('');
        setStep('confirm');
      } else {
        // Confirming
        if (nextPin === firstPin) {
          triggerHaptic('success');
          onSuccess(nextPin);
          handleReset();
        } else {
          triggerHaptic('error');
          setErrorMessage('Passcodes did not match. Please try again.');
          setHasError(true);
          setTimeout(() => {
            setPin('');
            setStep('enter');
            setFirstPin('');
            setHasError(false);
          }, 450);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMessage('');
      setHasError(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bgPrimary,
            paddingTop: Math.max(insets.top + 16, 44),
            paddingBottom: Math.max(insets.bottom + 24, 32),
          },
        ]}
      >
        {/* Header Close Button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={[
              styles.closeBtn,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <X size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: 'rgba(206, 240, 74, 0.16)',
                borderColor: colors.borderMedium,
              },
            ]}
          >
            <ShieldCheck size={32} color={colors.matchaLime} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {step === 'enter' ? title : 'Confirm Your Passcode'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === 'enter'
              ? 'Choose a generic 4-digit PIN for your offline ledger'
              : 'Re-enter the 4-digit PIN to confirm'}
          </Text>

          {errorMessage ? (
            <Text style={[styles.errorText, { color: colors.terracotta }]}>{errorMessage}</Text>
          ) : null}

          {/* Animated PIN Dots */}
          <AnimatedPinDots pinLength={pin.length} maxLength={4} hasError={hasError} />
        </View>

        {/* Generic Phone Keypad with Typing Letters & Animations */}
        <View style={styles.keypadWrapper}>
          <PhonePinKeypad
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            showBiometric={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  keypadWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 16,
  },
});
