import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SPECIES_BY_ID } from '../data/species';
import { formatDate } from '../lib/format';
import { colors } from '../theme';
import type { CatchMapProps } from './CatchMap';

// react-native-maps는 웹을 지원하지 않아, 웹에서는 좌표 목록으로 대신 보여줍니다.
export function CatchMap({ catches, selectedId, onSelect }: CatchMapProps) {
  return (
    <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={styles.body}>
      <View style={styles.notice}>
        <Ionicons name="phone-portrait-outline" size={18} color={colors.muted} />
        <Text style={styles.noticeText}>지도는 휴대폰 앱에서 보여요. 웹에서는 위치가 저장된 기록을 목록으로 보여드려요.</Text>
      </View>
      {catches.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => onSelect(c.id)}
          style={[styles.row, c.id === selectedId && styles.rowOn]}
          accessibilityRole="button"
        >
          <Ionicons name="location" size={20} color={c.id === selectedId ? colors.warn : colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{SPECIES_BY_ID[c.speciesId]?.name ?? '물고기'}</Text>
            <Text style={styles.meta}>
              {formatDate(c.caughtAt)} · {c.location.latitude.toFixed(4)}, {c.location.longitude.toFixed(4)}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingTop: 64, gap: 8, paddingBottom: 220 },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 },
  noticeText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowOn: { borderColor: colors.warn },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
});
