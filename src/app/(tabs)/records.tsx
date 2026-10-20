import { router } from 'expo-router';
import { useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { Button, CatchRow, EmptyState, SearchBox } from '../../components/ui';
import { SPECIES_BY_ID } from '../../data/species';
import { useCatches } from '../../lib/dex';
import { formatMonth, matches } from '../../lib/format';
import { colors } from '../../theme';
import type { Catch } from '../../types';

export default function RecordsScreen() {
  const { catches, ready } = useCatches();
  const [query, setQuery] = useState('');

  const filtered = catches.filter((c) => {
    const s = SPECIES_BY_ID[c.speciesId];
    return matches(query, s?.name ?? '', ...(s?.aliases ?? []), c.place ?? '', c.memo);
  });

  // 월별로 묶기 (catches는 최신순)
  const sections: { title: string; data: Catch[] }[] = [];
  for (const c of filtered) {
    const title = formatMonth(c.caughtAt);
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(c);
    else sections.push({ title, data: [c] });
  }

  if (ready && catches.length === 0) {
    return (
      <EmptyState
        icon="images-outline"
        title="아직 기록이 없어요"
        message="잡은 물고기 사진을 남기면 여기에 날짜별로 모여요."
        action={<Button label="첫 물고기 기록하기" icon="add" onPress={() => router.push('/catch/new')} />}
      />
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <SearchBox value={query} onChangeText={setQuery} placeholder="어종, 장소, 메모로 찾기" />
          <Button label="새 기록" icon="add" variant="secondary" onPress={() => router.push('/catch/new')} />
        </View>
      }
      ListEmptyComponent={
        ready ? <EmptyState icon="search-outline" title="맞는 기록이 없어요" message="다른 검색어로 찾아보세요." /> : undefined
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>
          {section.title} · {section.data.length}마리
        </Text>
      )}
      renderItem={({ item }) => (
        <CatchRow item={item} onPress={() => router.push({ pathname: '/catch/[id]', params: { id: item.id } })} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  header: { gap: 10, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.muted, marginTop: 16, marginBottom: 8 },
});
