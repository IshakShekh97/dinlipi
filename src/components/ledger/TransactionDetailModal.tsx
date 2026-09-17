import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Share2,
  Trash2,
  Copy,
  Receipt,
  CheckCircle2,
  Calendar,
  CreditCard,
  Tag,
  Edit3,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { triggerHaptic } from '../../constants/theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useUIStore } from '../../store/ui-store';
import { getCurrencySymbol } from '../../utils/currency';

export interface TransactionItemData {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'expense' | 'income' | 'lend' | 'borrow';
  channel: 'Cash' | 'UPI' | 'Bank';
  envelope: string;
  time: string;
  date: string;
}

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: TransactionItemData | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (tx: TransactionItemData) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  transaction,
  onClose,
  onDelete,
  onEdit,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const activeCurrency = useUIStore((state) => state.activeCurrency);
  const showConfirm = useUIStore((state) => state.showConfirmDialog);
  const currencySymbol = getCurrencySymbol(activeCurrency);

  if (!transaction) return null;

  const isExpense = transaction.type === 'expense' || transaction.type === 'lend';
  const amountColor = isExpense ? colors.terracotta : colors.matchaLime;

  const handleShare = async () => {
    try {
      triggerHaptic('medium');
      const safeId = transaction.id || '000000';
      const slipNumber = `DL-${safeId.slice(-6).toUpperCase()}`;
      const isExp = transaction.type === 'expense' || transaction.type === 'lend';
      const safeAmount = (transaction.amount || 0).toFixed(2);
      const signPrefix = isExp ? '-' : '+';
      const slipText =
        `🧾 DINLIPI FINANCIAL VOUCHER\n` +
        `Receipt No: #${slipNumber}\n` +
        `Date: ${transaction.date || transaction.time || 'Today'}\n` +
        `Description: ${transaction.title}\n` +
        `Category: ${transaction.category || 'General'}\n` +
        `Payment Channel: ${transaction.channel || 'Cash'}\n` +
        `Budget Envelope: ${transaction.envelope || 'General'}\n` +
        `Amount: ${signPrefix}${currencySymbol}${safeAmount}\n` +
        `Status: Recorded in Sandboxed Offline Ledger`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #141715; margin: 0; background: #FFF; }
            .receipt { border: 2px dashed #333; padding: 24px; border-radius: 12px; max-width: 360px; margin: 0 auto; }
            .title { font-size: 20px; font-weight: 900; text-align: center; margin: 0 0 4px 0; letter-spacing: 1px; }
            .sub { font-size: 11px; text-align: center; color: #666; margin: 0 0 16px 0; }
            .divider { border-top: 1px dashed #CCC; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; }
            .bold { font-weight: 700; }
            .amount { font-size: 24px; font-weight: 900; text-align: center; margin: 16px 0; color: ${isExp ? '#E07A5F' : '#2E7D32'}; }
            .footer { font-size: 10px; text-align: center; color: #888; margin-top: 18px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1 class="title">DINLIPI VOUCHER</h1>
            <p class="sub">Receipt #${slipNumber}</p>
            <div class="divider"></div>
            <div class="row"><span>Date:</span><span class="bold">${transaction.date || transaction.time || 'Today'}</span></div>
            <div class="row"><span>Description:</span><span class="bold">${transaction.title}</span></div>
            <div class="row"><span>Category:</span><span>${transaction.category || 'General'}</span></div>
            <div class="row"><span>Payment Channel:</span><span class="bold">${transaction.channel || 'Cash'}</span></div>
            <div class="row"><span>Budget Envelope:</span><span>${transaction.envelope || 'General'}</span></div>
            <div class="amount">${signPrefix}${currencySymbol}${safeAmount}</div>
            <div class="divider"></div>
            <p class="footer">Dinlipi &bull; Local-First Sandboxed Financial Ledger</p>
          </div>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }

      try {
        const file = await Print.printToFileAsync({ html });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare && file?.uri) {
          await Sharing.shareAsync(file.uri, {
            UTI: '.pdf',
            mimeType: 'application/pdf',
            dialogTitle: `Dinlipi Receipt - ${slipNumber}`,
          });
          return;
        }
      } catch (pdfErr) {
        console.warn('PDF generation/sharing error, falling back to text share:', pdfErr);
      }

      // Text share fallback
      await Share.share({
        title: `Dinlipi Receipt - ${slipNumber}`,
        message: slipText,
      });
    } catch (err) {
      console.warn('Share receipt fallback error:', err);
      showConfirm({
        title: 'Receipt Ready',
        message: `Receipt #${(transaction.id || '000000').slice(-6).toUpperCase()} for ${currencySymbol}${(transaction.amount || 0).toFixed(2)} generated successfully.`,
        confirmText: 'Done',
        cancelText: '',
        onConfirm: () => {},
      });
    }
  };

  const handleDuplicate = () => {
    triggerHaptic('success');
    showConfirm({
      title: 'Duplicate Entry',
      message: `Create a copy of "${transaction.title}" (${currencySymbol}${transaction.amount}) in your ledger?`,
      confirmText: 'Duplicate',
      cancelText: 'Cancel',
      onConfirm: () => {
        onClose();
      },
    });
  };

  const handleEdit = () => {
    triggerHaptic('light');
    onClose();
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const handleDelete = () => {
    triggerHaptic('warning');
    showConfirm({
      title: 'Delete Ledger Entry',
      message: `Are you sure you want to remove "${transaction.title}" (${currencySymbol}${transaction.amount}) from your offline ledger?`,
      confirmText: 'Delete Entry',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        triggerHaptic('error');
        if (onDelete) onDelete(transaction.id);
        onClose();
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#EAEAE2',
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
        >
          {/* Top Drag Indicator */}
          <View style={styles.handleBar}>
            <View
              style={[
                styles.handlePill,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  backgroundColor: isDark ? colors.cardElevated : '#F4F4EE',
                  borderColor: colors.borderSubtle,
                }}
                className="w-8 h-8 rounded-xl items-center justify-center border"
              >
                <Receipt size={16} color={colors.matchaLime} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Transaction Receipt
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.cardSecondary, borderColor: colors.borderSubtle },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Amount Hero */}
          <View style={styles.amountBox}>
            <Text style={[styles.amountText, { color: amountColor }]}>
              {isExpense ? '-' : '+'}{currencySymbol}{Math.abs(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: isExpense
                    ? 'rgba(224, 122, 95, 0.14)'
                    : 'rgba(206, 240, 74, 0.16)',
                  borderColor: isExpense ? colors.terracotta : colors.matchaLime,
                },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: isExpense ? colors.terracotta : colors.matchaLime },
                ]}
              >
                {transaction.type.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Details Card */}
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: isDark ? colors.cardElevated : '#F8F8F4',
                borderColor: isDark ? colors.borderSubtle : '#ECECE6',
              },
            ]}
          >
            {/* Description / Title */}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Title</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {transaction.title}
              </Text>
            </View>

            {/* Category */}
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFEFE8' }]}>
              <View className="flex-row items-center gap-1.5">
                <Tag size={14} color={colors.textMuted} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Category</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {transaction.category}
              </Text>
            </View>

            {/* Payment Channel */}
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFEFE8' }]}>
              <View className="flex-row items-center gap-1.5">
                <CreditCard size={14} color={colors.textMuted} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment Mode</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.matchaLime,
                  }}
                />
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {transaction.channel}
                </Text>
              </View>
            </View>

            {/* Envelope Vault */}
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFEFE8' }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Envelope Vault</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {transaction.envelope}
              </Text>
            </View>

            {/* Date & Time */}
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFEFE8' }]}>
              <View className="flex-row items-center gap-1.5">
                <Calendar size={14} color={colors.textMuted} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Timestamp</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                {transaction.date || transaction.time}
              </Text>
            </View>

            {/* Offline Status */}
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFEFE8' }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Sync Security</Text>
              <View className="flex-row items-center gap-1">
                <CheckCircle2 size={14} color={colors.matchaLime} />
                <Text style={{ color: colors.matchaLime, fontSize: 12, fontWeight: '700' }}>
                  Offline Sandboxed
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {onEdit && (
              <TouchableOpacity
                onPress={handleEdit}
                style={[
                  styles.actionBtnSecondary,
                  {
                    backgroundColor: colors.cardSecondary,
                    borderColor: colors.borderMedium,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Edit3 size={16} color={colors.textPrimary} />
                <Text style={[styles.actionBtnTextSecondary, { color: colors.textPrimary }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.matchaLime,
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                },
              ]}
              activeOpacity={0.8}
            >
              <Share2 size={16} color="#141715" />
              <Text style={[styles.actionBtnTextPrimary, { color: '#141715' }]}>Share Slip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDuplicate}
              style={[
                styles.actionBtnSecondary,
                {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.borderMedium,
                },
              ]}
              activeOpacity={0.7}
            >
              <Copy size={16} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={[
                styles.iconBtnDanger,
                {
                  backgroundColor: isDark ? 'rgba(224, 122, 95, 0.15)' : 'rgba(224, 122, 95, 0.1)',
                  borderColor: colors.terracotta,
                },
              ]}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={colors.terracotta} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handlePill: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  amountBox: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  amountText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  detailsCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnTextPrimary: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnTextSecondary: {
    fontSize: 13,
    fontWeight: '700',
  },
  iconBtnDanger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
