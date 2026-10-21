import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { clampToNow, daysAgoOf, QUICK_DAYS, shiftToDaysAgo } from '../lib/dates';
import { formatDateTime } from '../lib/format';
import { colors } from '../theme';
import { Chip } from './ui';
import type { DateFieldProps } from '../lib/dates';

// 오늘, 어제, 그저께는 버튼 한 번으로 고르고, 그 밖의 날짜와 시간은 기기 기본 선택기로 고릅니다.
export function DateField({ value, onChange }: DateFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const ago = daysAgoOf(value);

  function openPicker(mode: 'date' | 'time') {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        maximumDate: new Date(),
        is24Hour: false,
        onValueChange: (_e, date) => onChange(clampToNow(date)),
      });
    } else {
      setIosOpen((v) => !v);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>잡은 날짜·시간</Text>
      <View style={styles.chips}>
        {QUICK_DAYS.map((q) => (
          <Chip key={q.label} label={q.label} on={ago === q.daysAgo} onPress={() => onChange(shiftToDaysAgo(value, q.daysAgo))} />
        ))}
      </View>
      <View style={styles.row}>
        <Pressable
          onPress={() => openPicker('date')}
          style={({ pressed }) => [styles.value, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={`잡은 날짜: ${formatDateTime(value.toISOString())}. 바꾸려면 누르세요`}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.valueText}>{formatDateTime(value.toISOString())}</Text>
        </Pressable>
        {Platform.OS === 'android' ? (
          <Pressable onPress={() => openPicker('time')} style={styles.timeButton} accessibilityRole="button">
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.timeText}>시간</Text>
          </Pressable>
        ) : null}
      </View>
      {Platform.OS === 'ios' && iosOpen ? (
        <View style={styles.iosPicker}>
          <DateTimePicker
            value={value}
            mode="datetime"
            display="spinner"
            locale="ko-KR"
            maximumDate={new Date()}
            onValueChange={(_e, date) => onChange(clampToNow(date))}
          />
          <Pressable onPress={() => setIosOpen(false)} style={styles.done} accessibilityRole="button">
            <Text style={styles.doneText}>완료</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  value: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  valueText: { fontSize: 16, color: colors.text },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  timeText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  iosPicker: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  done: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 10 },
  doneText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
