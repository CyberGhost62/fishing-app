import { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Header } from '../components/ui';
import { SPECIES } from '../data/species';
import { useCatches } from '../lib/dex';
import type { Nav } from '../navigation';
import { colors } from '../theme';
import type { Catch, Water } from '../types';

const FILTERS: (Water | '전체')[] = ['전체', '바다', '민물'];

export function DexScreen({ nav }: { nav: Nav }) {
  const { catches } = useCatches();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체');

  // 어종별 가장 최근 기록 (catches는 최신순으로 저장됨)
  const latest = new Map<string, Catch>();
  for (const c of catches) if (!latest.has(c.speciesId)) latest.set(c.speciesId, c);

  const list = SPECIES.filter((s) => filter === '전체' || s.water === filter);

  return (
    <View style={styles.container}>
      <Header title={`내 도감 ${latest.size}/${SPECIES.length}`} onBack={nav.back} />
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipOn]}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>{f}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={list}
        keyExtractor={(s) => s.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 8 }}
        renderItem={({ item }) => {
          const c = latest.get(item.id);
          return (
            <Pressable style={styles.cell} onPress={() => nav.push({ name: 'species', speciesId: item.id })}>
              {c ? (
                <Image source={{ uri: c.photoUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.empty]}>
                  <Text style={styles.question}>?</Text>
                </View>
              )}
              <Text style={[styles.name, !c && styles.nameLocked]} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextOn: { color: colors.primaryText, fontWeight: '600' },
  grid: { padding: 16, gap: 12 },
  cell: { flex: 1 / 3, maxWidth: '32%' },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: colors.border },
  empty: { alignItems: 'center', justifyContent: 'center' },
  question: { fontSize: 28, color: colors.muted },
  name: { marginTop: 4, textAlign: 'center', fontSize: 13, color: colors.text, fontWeight: '600' },
  nameLocked: { color: colors.muted, fontWeight: '400' },
});
