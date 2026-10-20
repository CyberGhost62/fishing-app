import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Section } from '../components/ui';
import { SPECIES_BY_ID } from '../data/species';
import { useCatches } from '../lib/dex';
import type { Nav } from '../navigation';
import { colors } from '../theme';

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

export function SpeciesScreen({ nav, speciesId }: { nav: Nav; speciesId: string }) {
  const species = SPECIES_BY_ID[speciesId];
  const mine = useCatches().catches.filter((c) => c.speciesId === speciesId);
  if (!species) return null;

  return (
    <View style={styles.container}>
      <Header title={species.name} onBack={nav.back} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.meta}>
          {species.water} · <Text style={styles.italic}>{species.scientificName}</Text>
          {species.aliases.length ? ` · ${species.aliases.join(', ')}` : ''}
        </Text>
        <Text style={styles.summary}>{species.summary}</Text>

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

        <Section title={`📸 내 기록 (${mine.length})`}>
          {mine.length === 0 ? (
            <Text style={styles.item}>아직 잡은 기록이 없어요.</Text>
          ) : (
            <View style={styles.photos}>
              {mine.map((c) => (
                <View key={c.id} style={styles.photoWrap}>
                  <Image source={{ uri: c.photoUri }} style={styles.photo} />
                  <Text style={styles.date}>{new Date(c.caughtAt).toLocaleDateString('ko-KR')}</Text>
                </View>
              ))}
            </View>
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  meta: { color: colors.muted, fontSize: 14 },
  italic: { fontStyle: 'italic' },
  summary: { color: colors.text, fontSize: 16, lineHeight: 24 },
  item: { color: colors.text, fontSize: 15, lineHeight: 22 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrap: { width: '31%' },
  photo: { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: colors.border },
  date: { fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
});
