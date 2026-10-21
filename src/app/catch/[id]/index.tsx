import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, Section } from '../../../components/ui';
import { SPECIES, SPECIES_BY_ID } from '../../../data/species';
import { deleteCatch, useCatches } from '../../../lib/dex';
import { formatDateTime } from '../../../lib/format';
import { useLocationConsent } from '../../../lib/location';
import { confirmDestructive } from '../../../lib/photo';
import { colors } from '../../../theme';

export default function CatchDetailScreen() {
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const { catches, ready } = useCatches();
  const [deleting, setDeleting] = useState(false);
  const { agreed: locationAgreed } = useLocationConsent();
  const item = catches.find((c) => c.id === id);

  if (!ready || deleting) return null;
  if (!item) {
    return <EmptyState icon="alert-circle-outline" title="기록을 찾을 수 없어요" message="이미 지운 기록일 수 있어요." />;
  }

  const species = SPECIES_BY_ID[item.speciesId];
  const sameSpecies = catches.filter((c) => c.speciesId === item.speciesId);
  const collected = new Set(catches.map((c) => c.speciesId)).size;
  // 방금 저장했고 이 어종의 첫 기록이면 도감에 새로 올라간 것
  const firstOfSpecies = saved === '1' && sameSpecies.length === 1;

  async function remove() {
    const ok = await confirmDestructive('기록을 지울까요?', '사진과 메모가 함께 지워지고 되돌릴 수 없어요.', '지우기');
    if (!ok || !item) return;
    setDeleting(true);
    await deleteCatch(item.id);
    if (router.canGoBack()) router.back();
    else router.replace('/records');
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: species?.name ?? '기록' }} />

      {saved === '1' ? (
        <View style={styles.banner}>
          <Ionicons name={firstOfSpecies ? 'sparkles' : 'checkmark-circle'} size={20} color={colors.primary} />
          <Text style={styles.bannerText}>
            {firstOfSpecies
              ? `새 어종을 도감에 올렸어요! (${collected}/${SPECIES.length}종)`
              : `기록을 저장했어요. ${species?.name ?? ''} ${sameSpecies.length}번째 기록이에요.`}
          </Text>
        </View>
      ) : null}

      <Image source={{ uri: item.photoUri }} style={styles.photo} resizeMode="cover" />

      <View style={styles.facts}>
        <Fact icon="calendar-outline" text={formatDateTime(item.caughtAt)} />
        {item.place ? <Fact icon="location-outline" text={item.place} /> : null}
        {item.lengthCm ? <Fact icon="resize-outline" text={`${item.lengthCm}cm`} /> : null}
      </View>

      {item.location && locationAgreed ? (
        <Pressable
          onPress={() => router.navigate({ pathname: '/map', params: { focus: item.id } })}
          style={({ pressed }) => [styles.mapLink, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Ionicons name="map-outline" size={18} color={colors.primary} />
          <Text style={styles.mapLinkText}>잡은 곳 지도에서 보기</Text>
        </Pressable>
      ) : null}

      <Section title="메모">
        <Text style={item.memo ? styles.memo : styles.muted}>{item.memo || '남긴 메모가 없어요.'}</Text>
      </Section>

      {species ? (
        <Pressable
          onPress={() => router.push({ pathname: '/species/[id]', params: { id: species.id } })}
          style={({ pressed }) => [styles.speciesCard, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.speciesName}>{species.name} 알아보기</Text>
            <Text style={styles.muted}>손질법 · 서식지 · 추천 미끼</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button
            label="수정"
            icon="create-outline"
            variant="secondary"
            onPress={() => router.push({ pathname: '/catch/[id]/edit', params: { id: item.id } })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="지우기" icon="trash-outline" variant="danger" onPress={remove} />
        </View>
      </View>
    </ScrollView>
  );
}

function Fact({ icon, text }: { icon: ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.factText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: 12,
  },
  bannerText: { flex: 1, color: colors.primary, fontSize: 15, fontWeight: '600' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: colors.border },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  factText: { color: colors.text, fontSize: 14 },
  memo: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 14 },
  speciesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speciesName: { fontSize: 16, fontWeight: '700', color: colors.primary },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  mapLinkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
