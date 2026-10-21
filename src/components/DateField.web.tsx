import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { clampToNow, daysAgoOf, QUICK_DAYS, shiftToDaysAgo, type DateFieldProps } from '../lib/dates';
import { Chip } from './ui';

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// 웹에는 기기 날짜 선택기가 없어 브라우저의 datetime-local 입력을 씁니다.
export function DateField({ value, onChange }: DateFieldProps) {
  const ago = daysAgoOf(value);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>잡은 날짜·시간</Text>
      <View style={styles.chips}>
        {QUICK_DAYS.map((q) => (
          <Chip key={q.label} label={q.label} on={ago === q.daysAgo} onPress={() => onChange(shiftToDaysAgo(value, q.daysAgo))} />
        ))}
      </View>
      {createElement('input', {
        type: 'datetime-local',
        value: toLocalInput(value),
        max: toLocalInput(new Date()),
        'aria-label': '잡은 날짜·시간',
        onChange: (e: { target: { value: string } }) => {
          const d = new Date(e.target.value);
          if (!Number.isNaN(d.getTime())) onChange(clampToNow(d));
        },
        style: {
          fontSize: 16,
          padding: '12px 14px',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.card,
          color: colors.text,
          fontFamily: 'inherit',
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', gap: 8 },
});
