import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip, EmptyState, ProgressBar, SearchBox } from '../../components/ui';
import { SPECIES } from '../../data/species';
import { SPECIES_PHOTOS } from '../../data/speciesPhotos';
import { useCatches } from '../../lib/dex';
import { matches } from '../../lib/format';
import { colors } from '../../theme';
import type { Catch, Water } from '../../types';

const WATER_FILTERS: (Water | '전체')[] = ['전체', '바다', '민물'];

export default function DexScreen() {
  const { catches } = useCatches();
  const [water, setWater] = useState<(typeof WATER_FILTERS)[number]>('전체');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [query, setQuery] = useState('');

  // 어종별 가장 최근 기록과 마릿수 (catches는 최신순)
  const latest = new Map<string, Catch>();
  const counts = new Map<string, number>();
  for (const c of catches) {
    if (!latest.has(c.speciesId)) latest.set(c.speciesId, c);
    counts.set(c.speciesId, (counts.get(c.speciesId) ?? 0) + 1);
  }

  const list = SPECIES.filter(
    (s) =>
      (water === '전체' || s.water === water) &&
      (!onlyMissing || !latest.has(s.id)) &&
      matches(query, s.name, ...s.aliases),
  );

  return (
    <FlatList
      data={list}
      keyExtractor={(s) => s.id}
      numColumns={3}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={{ gap: 8 }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              <Text style={styles.progressStrong}>{latest.size}</Text> / {SPECIES.length}종 수집
            </Text>
            <Text style={styles.percent}>{Math.round((latest.size / SPECIES.length) * 100)}%</Text>
          </View>
          <ProgressBar value={latest.size / SPECIES.length} />
          <SearchBox value={query} onChangeText={setQuery} placeholder="이름이나 별명으로 찾기" />
          <View style={styles.filters}>
            {WATER_FILTERS.map((f) => (
              <Chip key={f} label={f} on={water === f} onPress={() => setWater(f)} />
            ))}
            <View style={styles.divider} />
            <Chip label="못 잡은 것" on={onlyMissing} onPress={() => setOnlyMissing((v) => !v)} />
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon={onlyMissing && !query ? 'trophy-outline' : 'search-outline'}
          title={onlyMissing && !query ? '이 분류는 다 모았어요!' : '찾는 어종이 없어요'}
          message={onlyMissing && !query ? '다른 분류도 확인해 보세요.' : '다른 이름으로 검색해 보세요.'}
        />
      }
      renderItem={({ item }) => {
        const c = latest.get(item.id);
        const n = counts.get(item.id) ?? 0;
        return (
          <Pressable
            style={({ pressed }) => [styles.cell, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: '/species/[id]', params: { id: item.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${c ? `${n}마리 기록` : '아직 못 잡음'}`}
          >
            {c ? (
              <View>
                <Image source={{ uri: c.photoUri }} style={styles.thumb} />
                {n > 1 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>×{n}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={[styles.thumb, styles.locked]}>
                {SPECIES_PHOTOS[item.id] ? (
                  <>
                    <Image source={SPECIES_PHOTOS[item.id]!.source} style={styles.lockedPhoto} resizeMode="cover" />
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={12} color={colors.muted} />
                    </View>
                  </>
                ) : (
                  <Ionicons name="fish" size={30} color={colors.border} />
                )}
              </View>
            )}
            <Text style={[styles.name, !c && styles.nameLocked]} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  grid: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { gap: 10, marginBottom: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressText: { fontSize: 15, color: colors.muted },
  progressStrong: { fontSize: 22, fontWeight: '800', color: colors.primary },
  percent: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  divider: { width: 1, height: 20, backgroundColor: colors.border },
  cell: { flex: 1 / 3, maxWidth: '32%' },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: colors.border },
  locked: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  // 못 잡은 어종은 대표 사진을 흐리게 보여줍니다.
  lockedPhoto: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 },
  lockBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 3,
  },
  badge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(15,31,46,0.75)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  name: { marginTop: 4, textAlign: 'center', fontSize: 13, color: colors.text, fontWeight: '600' },
  nameLocked: { color: colors.muted, fontWeight: '400' },
});
