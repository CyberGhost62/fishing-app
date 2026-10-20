import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Header } from '../components/ui';
import { SPECIES } from '../data/species';
import { useCatches } from '../lib/dex';
import type { Nav } from '../navigation';
import { colors } from '../theme';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.6,
  base64: true,
};

export function HomeScreen({ nav }: { nav: Nav }) {
  const { catches } = useCatches();
  const [busy, setBusy] = useState(false);
  const caughtSpecies = new Set(catches.map((c) => c.speciesId)).size;

  async function pick(source: 'camera' | 'library') {
    setBusy(true);
    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('권한이 필요해요', source === 'camera' ? '카메라 접근을 허용해 주세요.' : '사진 접근을 허용해 주세요.');
        return;
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      const asset = result.canceled ? null : result.assets[0];
      if (asset?.base64) {
        nav.push({ name: 'result', photoUri: asset.uri, base64: asset.base64 });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="물고기 도감" />
      <View style={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🎣</Text>
          <Text style={styles.heroText}>잡은 물고기를 찍으면{'\n'}어떤 종인지 알려드려요</Text>
        </View>
        <Button label="📷 사진 찍기" onPress={() => pick('camera')} disabled={busy} />
        <Button label="🖼️ 앨범에서 고르기" onPress={() => pick('library')} variant="secondary" disabled={busy} />
        <View style={styles.dexCard}>
          <Text style={styles.dexCount}>
            {caughtSpecies} / {SPECIES.length}종 수집
          </Text>
          <Button label="내 도감 보기" onPress={() => nav.push({ name: 'dex' })} variant="secondary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, gap: 12 },
  hero: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  heroEmoji: { fontSize: 64 },
  heroText: { fontSize: 18, textAlign: 'center', color: colors.text, lineHeight: 26 },
  dexCard: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dexCount: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
