import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Header } from '../components/ui';
import { SPECIES_BY_ID } from '../data/species';
import { addCatch } from '../lib/dex';
import { identifyFish } from '../lib/identify';
import type { Nav } from '../navigation';
import { colors } from '../theme';
import type { Candidate, IdentifyResult } from '../types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; result: IdentifyResult };

export function ResultScreen({ nav, photoUri, base64 }: { nav: Nav; photoUri: string; base64: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    identifyFish(base64).then(
      (result) => !cancelled && setState({ status: 'done', result }),
      (e: unknown) =>
        !cancelled && setState({ status: 'error', message: e instanceof Error ? e.message : '식별에 실패했어요.' }),
    );
    return () => {
      cancelled = true;
    };
  }, [base64, attempt]);

  async function save(c: Candidate) {
    if (!c.speciesId) return;
    try {
      await addCatch({ speciesId: c.speciesId, photoUri });
      setSavedId(c.speciesId);
    } catch (e) {
      Alert.alert('저장하지 못했어요', e instanceof Error ? e.message : '');
    }
  }

  return (
    <View style={styles.container}>
      <Header title="식별 결과" onBack={nav.back} />
      <ScrollView contentContainerStyle={styles.body}>
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />

        {state.status === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.muted}>어떤 물고기인지 살펴보는 중이에요…</Text>
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.center}>
            <Text style={styles.error}>{state.message}</Text>
            <Button label="다시 시도" onPress={() => setAttempt((n) => n + 1)} />
          </View>
        )}

        {state.status === 'done' && !state.result.isFish && (
          <Text style={styles.muted}>사진에서 물고기를 찾지 못했어요. 물고기가 화면에 크게 나오게 다시 찍어 주세요.</Text>
        )}

        {state.status === 'done' &&
          state.result.candidates.map((c, i) => {
            const species = c.speciesId ? SPECIES_BY_ID[c.speciesId] : undefined;
            return (
              <View key={`${c.name}-${i}`} style={[styles.card, i === 0 && styles.cardTop]}>
                <Pressable
                  disabled={!species}
                  onPress={() => species && nav.push({ name: 'species', speciesId: species.id })}
                >
                  <View style={styles.row}>
                    <Text style={styles.name}>
                      {i + 1}. {species?.name ?? c.name}
                      {species?.aliases.length ? <Text style={styles.alias}> ({species.aliases[0]})</Text> : null}
                    </Text>
                    <Text style={styles.confidence}>{Math.round(c.confidence * 100)}%</Text>
                  </View>
                  <Text style={styles.muted}>{c.reason}</Text>
                  {species ? (
                    <Text style={styles.link}>손질법 · 서식지 · 미끼 보기 ›</Text>
                  ) : (
                    <Text style={styles.muted}>아직 도감에 없는 어종이에요.</Text>
                  )}
                </Pressable>
                {species && (
                  <Button
                    label={savedId === species.id ? '도감에 저장됨 ✓' : '이 물고기로 도감에 저장'}
                    onPress={() => save(c)}
                    variant={i === 0 ? 'primary' : 'secondary'}
                    disabled={savedId !== null}
                  />
                )}
              </View>
            );
          })}

        {state.status === 'done' && state.result.note ? (
          <Text style={styles.note}>💡 {state.result.note}</Text>
        ) : null}

        <Text style={styles.disclaimer}>
          AI 판별은 틀릴 수 있어요. 금어기와 금지체장은 출조 전 해양수산부 고시로 꼭 확인하세요.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: colors.border },
  center: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.warn, fontSize: 15, textAlign: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { borderColor: colors.primary, borderWidth: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text, flexShrink: 1 },
  alias: { fontSize: 15, fontWeight: '400', color: colors.muted },
  confidence: { fontSize: 16, fontWeight: '700', color: colors.primary },
  link: { color: colors.primary, marginTop: 6, fontSize: 14 },
  note: { backgroundColor: colors.warnBg, color: colors.warn, padding: 12, borderRadius: 10, lineHeight: 20 },
  disclaimer: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
