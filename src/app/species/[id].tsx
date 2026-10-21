import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, Section } from '../../components/ui';
import { SPECIES_BY_ID } from '../../data/species';
import { SPECIES_PHOTOS } from '../../data/speciesPhotos';
import { useCatches } from '../../lib/dex';
import { formatDate } from '../../lib/format';
import { colors } from '../../theme';

function Bullets({ items, numbered }: { items: string[]; numbered?: boolean }) {
  return (
    <>
      {items.map((item, i) => (
        <Text key={i} style={styles.item}>
          {numbered ? `${i + 1}. ` : '• '}
          {item}
        </Text>
      ))}
    </>
  );
}

export default function SpeciesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const species = SPECIES_BY_ID[id];
  const mine = useCatches().catches.filter((c) => c.speciesId === id);
  if (!species) {
    return <EmptyState icon="fish-outline" title="어종을 찾을 수 없어요" message="도감 목록에서 다시 골라 주세요." />;
  }

  const photo = SPECIES_PHOTOS[species.id];
  const biggest = mine.reduce<number | undefined>(
    (max, c) => (c.lengthCm && (!max || c.lengthCm > max) ? c.lengthCm : max),
    undefined,
  );

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: species.name }} />
      {photo ? (
        <View>
          <Image source={photo.source} style={styles.hero} resizeMode="cover" accessibilityLabel={`${species.name} 대표 사진`} />
          <Pressable onPress={() => Linking.openURL(photo.sourceUrl)} accessibilityRole="link" hitSlop={6}>
            <Text style={styles.credit} numberOfLines={2}>
              사진: {photo.author} · {photo.license} · Wikimedia Commons
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.titleBlock}>
        <View style={styles.tags}>
          <Text style={[styles.tag, species.water === '민물' && styles.tagFresh]}>{species.water}</Text>
          {mine.length > 0 ? <Text style={[styles.tag, styles.tagCaught]}>✓ {mine.length}마리 잡음</Text> : null}
        </View>
        <Text style={styles.meta}>
          <Text style={styles.italic}>{species.scientificName}</Text>
          {species.aliases.length ? ` · ${species.aliases.join(', ')}` : ''}
        </Text>
        <Text style={styles.summary}>{species.summary}</Text>
      </View>

      <Section title="🔪 손질법">
        <Bullets items={species.cleaning} numbered />
      </Section>
      <Section title="🌊 서식지">
        <Text style={styles.item}>{species.habitat}</Text>
        <Text style={styles.item}>제철·시즌: {species.season}</Text>
      </Section>
      <Section title="🪱 추천 미끼">
        <Bullets items={species.baits} />
      </Section>
      <Section title="🎣 낚시 방법">
        <Bullets items={species.methods} />
      </Section>
      <Section title="🍽️ 요리">
        <Text style={styles.item}>{species.dishes.join(' · ')}</Text>
      </Section>
      {species.cautions.length > 0 && (
        <Section title="⚠️ 주의">
          <Bullets items={species.cautions} />
        </Section>
      )}

      <Section
        title={`📸 내 기록 (${mine.length})`}
        right={biggest ? <Text style={styles.best}>최대 {biggest}cm</Text> : null}
      >
        {mine.length === 0 ? (
          <Text style={styles.muted}>아직 잡은 기록이 없어요.</Text>
        ) : (
          <View style={styles.photos}>
            {mine.map((c) => (
              <Pressable
                key={c.id}
                style={styles.photoWrap}
                onPress={() => router.push({ pathname: '/catch/[id]', params: { id: c.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${formatDate(c.caughtAt)} 기록 보기`}
              >
                <Image source={{ uri: c.photoUri }} style={styles.photo} />
                <Text style={styles.date}>{formatDate(c.caughtAt)}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <View style={{ marginTop: 8 }}>
          <Button
            label={mine.length ? '한 마리 더 기록하기' : '이 물고기 기록하기'}
            icon="add"
            variant={mine.length ? 'secondary' : 'primary'}
            onPress={() => router.push({ pathname: '/catch/new', params: { speciesId: species.id } })}
          />
        </View>
      </Section>

      <Text style={styles.disclaimer}>
        정보는 일반적인 낚시 상식을 정리한 초안이에요. 금어기와 금지체장은 출조 전 해양수산부 고시로 꼭 확인하세요.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { width: '100%', aspectRatio: 3 / 2, borderRadius: 12, backgroundColor: colors.border },
  credit: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'right' },
  titleBlock: { gap: 6 },
  tags: { flexDirection: 'row', gap: 6 },
  tag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tagFresh: { color: '#2E7D32', backgroundColor: '#E8F5E9' },
  tagCaught: { color: colors.text, backgroundColor: colors.border },
  meta: { color: colors.muted, fontSize: 14 },
  italic: { fontStyle: 'italic' },
  summary: { color: colors.text, fontSize: 16, lineHeight: 24 },
  item: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 14 },
  best: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrap: { width: '31%' },
  photo: { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: colors.border },
  date: { fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
  disclaimer: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
