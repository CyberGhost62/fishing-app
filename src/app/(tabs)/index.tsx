import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, CatchRow, ProgressBar } from '../../components/ui';
import { SPECIES } from '../../data/species';
import { useCatches } from '../../lib/dex';
import { pickPhoto, type PhotoSource } from '../../lib/photo';
import { colors } from '../../theme';

export default function HomeScreen() {
  const { catches } = useCatches();
  const [busy, setBusy] = useState(false);
  const collected = new Set(catches.map((c) => c.speciesId)).size;
  const recent = catches.slice(0, 3);

  async function record(source: PhotoSource) {
    setBusy(true);
    try {
      const photoUri = await pickPhoto(source);
      if (photoUri) router.push({ pathname: '/catch/new', params: { photoUri } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🎣</Text>
        <Text style={styles.heroTitle}>오늘 뭐 잡으셨어요?</Text>
        <Text style={styles.heroText}>사진을 남기고 어종을 고르면 내 도감에 차곡차곡 모여요.</Text>
        <View style={styles.heroButtons}>
          <View style={{ flex: 1 }}>
            <Button label="사진 찍기" icon="camera" onPress={() => record('camera')} disabled={busy} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="앨범에서" icon="images-outline" onPress={() => record('library')} variant="secondary" disabled={busy} />
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => router.navigate('/dex')}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
      >
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>도감 수집</Text>
          <Text style={styles.count}>
            <Text style={styles.countStrong}>{collected}</Text> / {SPECIES.length}종
          </Text>
        </View>
        <ProgressBar value={collected / SPECIES.length} />
        <Text style={styles.muted}>
          {collected === 0
            ? '첫 물고기를 기록하면 도감이 열려요.'
            : collected === SPECIES.length
              ? '모든 어종을 모았어요! 🎉'
              : `${SPECIES.length - collected}종 남았어요. 도감에서 아직 못 잡은 물고기를 확인해 보세요.`}
        </Text>
      </Pressable>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>최근 기록</Text>
        {catches.length > 0 ? (
          <Link href="/records" style={styles.more}>
            전체 보기 ({catches.length})
          </Link>
        ) : null}
      </View>
      {recent.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="fish-outline" size={28} color={colors.muted} />
          <Text style={styles.muted}>아직 기록이 없어요. 위에서 첫 물고기를 남겨 보세요.</Text>
        </View>
      ) : (
        recent.map((c) => (
          <CatchRow key={c.id} item={c} onPress={() => router.push({ pathname: '/catch/[id]', params: { id: c.id } })} />
        ))
      )}

      <Text style={styles.footnote}>사진으로 어종을 알려주는 기능은 준비 중이에요.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  hero: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  heroText: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  heroButtons: { flexDirection: 'row', gap: 8, alignSelf: 'stretch', marginTop: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  count: { fontSize: 15, color: colors.muted },
  countStrong: { fontSize: 22, fontWeight: '800', color: colors.primary },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  more: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footnote: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12 },
});
