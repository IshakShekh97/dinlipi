import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react-native';
import { useAppTheme } from '../../context/theme-context';
import { FONTS, triggerHaptic } from '../../constants/theme';
import { GlassCard } from './GlassCard';

interface CalendarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate?: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  title?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarPickerModal({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  title = 'Select Date',
}: CalendarPickerModalProps) {
  const { colors, isDark } = useAppTheme();

  // Parse initial selected date or fallback to today
  const initialDate = useMemo(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const parts = selectedDate.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  }, [selectedDate]);

  const todayStr = useMemo(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth()); // 0-indexed
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(
    selectedDate || todayStr
  );

  // Month navigation
  const handlePrevMonth = () => {
    triggerHaptic('light');
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    triggerHaptic('light');
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    triggerHaptic('medium');
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setTempSelectedDate(todayStr);
  };

  // Calendar cells generation
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells: {
      dayNumber: number | null;
      dateStr: string | null;
      isCurrentMonth: boolean;
    }[] = [];

    // Empty cells before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNumber: null, dateStr: null, isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const monthFormatted = String(currentMonth + 1).padStart(2, '0');
      const dayFormatted = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;
      cells.push({ dayNumber: d, dateStr, isCurrentMonth: true });
    }

    return cells;
  }, [currentYear, currentMonth]);

  const handleDayPress = (dateStr: string) => {
    triggerHaptic('light');
    setTempSelectedDate(dateStr);
  };

  const handleConfirm = () => {
    triggerHaptic('success');
    onSelectDate(tempSelectedDate);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(15, 20, 18, 0.45)' }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => {
            triggerHaptic('light');
            onClose();
          }}
          activeOpacity={1}
        />

        <View style={styles.modalContent}>
          <GlassCard
            style={styles.calendarCard}
            intensity={55}
            borderRadius={28}
            elevated
          >
            {/* Header with Title & Close */}
            <View style={styles.topHeaderRow}>
              <View style={styles.titleWithIcon}>
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: isDark ? 'rgba(206, 240, 74, 0.12)' : 'rgba(206, 240, 74, 0.18)',
                      borderColor: isDark ? 'rgba(206, 240, 74, 0.25)' : 'rgba(56, 102, 65, 0.15)',
                    },
                  ]}
                >
                  <CalendarIcon size={18} color={colors.matchaLime} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{title}</Text>
                  <Text style={[styles.selectedDatePreview, { color: colors.textSecondary }]}>
                    {tempSelectedDate}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleJumpToday}
                style={[
                  styles.todayPill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F4EE',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.todayPillText, { color: colors.matchaLime }]}>Today</Text>
              </TouchableOpacity>
            </View>

            {/* Month / Year Navigator */}
            <View style={styles.navigatorRow}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={[
                  styles.navBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F5F5F0',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.7}
              >
                <ChevronLeft size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <Text style={[styles.monthYearText, { color: colors.textPrimary }]}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={[
                  styles.navBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F5F5F0',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.7}
              >
                <ChevronRight size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Day Names Headers */}
            <View style={styles.weekdayRow}>
              {WEEKDAY_NAMES.map((w, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.weekdayText,
                    {
                      color: idx === 0 || idx === 6 ? colors.terracotta : colors.textMuted,
                    },
                  ]}
                >
                  {w}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {calendarGrid.map((cell, index) => {
                if (!cell.isCurrentMonth || !cell.dateStr) {
                  return <View key={`empty-${index}`} style={styles.dayCellPlaceholder} />;
                }

                const isSelected = cell.dateStr === tempSelectedDate;
                const isToday = cell.dateStr === todayStr;

                return (
                  <TouchableOpacity
                    key={cell.dateStr}
                    style={[
                      styles.dayCell,
                      isSelected && {
                        backgroundColor: colors.matchaLime,
                      },
                      !isSelected && isToday && {
                        borderColor: colors.matchaLime,
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => handleDayPress(cell.dateStr!)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        {
                          color: isSelected
                            ? '#141715'
                            : isToday
                            ? colors.matchaLime
                            : colors.textPrimary,
                          fontFamily: isSelected || isToday ? FONTS.sansBold : FONTS.sansMedium,
                        },
                      ]}
                    >
                      {cell.dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Actions Row */}
            <View style={styles.bottomActionsRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F5F5F0',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: colors.matchaLime,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Check size={18} color="#141715" strokeWidth={2.5} />
                <Text style={styles.confirmBtnText}>Select Date</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
  },
  calendarCard: {
    padding: 20,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.3,
  },
  selectedDatePreview: {
    fontSize: 12,
    fontFamily: FONTS.mono,
    marginTop: 2,
  },
  todayPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  todayPillText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  navigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 15,
    fontFamily: FONTS.sansBold,
    letterSpacing: -0.3,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayCellPlaceholder: {
    width: 38,
    height: 38,
    marginVertical: 3,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  dayCellText: {
    fontSize: 13,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
  },
  confirmBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 13,
    fontFamily: FONTS.sansBold,
    color: '#141715',
  },
});
