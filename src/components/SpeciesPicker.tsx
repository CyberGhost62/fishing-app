import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPECIES } from '../data/species';
import { SPECIES_PHOTOS } from '../data/speciesPhotos';
import { matches } from '../lib/format';
import { colors } from '../theme';
import type { Water } from '../types';
import { Chip, EmptyState, SearchBox } from './ui';

const FILTERS: (Water | '전체')[] = ['전체', '바다', '민물'];

/** 어종 목록에서 하나를 고르는 전체 화면 모달. */
export function SpeciesPicker({
  visible,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체');
  const list = SPECIES.filter(
    (s) => (filter === '전체' || s.water === filter) && matches(query, s.name, ...s.aliases),
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.head}>
          <Text style={styles.title}>어종 고르기</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.controls}>
          <SearchBox value={query} onChangeText={setQuery} placeholder="이름이나 별명으로 찾기 (예: 우럭)" />
          <View style={styles.filters}>
            {FILTERS.map((f) => (
              <Chip key={f} label={f} on={filter === f} onPress={() => setFilter(f)} />
            ))}
          </View>
        </View>
        <FlatList
          data={list}
          keyExtractor={(s) => s.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="fish-outline" title="찾는 어종이 없어요" message="다른 이름으로 검색해 보세요. 지금은 30종을 기록할 수 있어요." />
          }
          renderItem={({ item }) => {
            const on = item.id === selectedId;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
                style={({ pressed }) => [styles.item, on && styles.itemOn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                {SPECIES_PHOTOS[item.id] ? (
                  <Image source={SPECIES_PHOTOS[item.id]!.source} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Ionicons name="fish" size={20} color={colors.border} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.water}
                    {item.aliases.length ? ` · ${item.aliases.join(', ')}` : ''}
                  </Text>
                </View>
                {on ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  controls: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  filters: { flexDirection: 'row', gap: 8 },
  list: { padding: 16, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.border },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
