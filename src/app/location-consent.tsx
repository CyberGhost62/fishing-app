import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { agreeAndRequestPermission, type PermissionState } from '../lib/location';
import { colors } from '../theme';

const POINTS: { icon: ComponentProps<typeof Ionicons>['name']; title: string; body: string }[] = [
  {
    icon: 'navigate-outline',
    title: '무엇을 쓰나요',
    body: '지도에 내 위치를 보여주고, 물고기를 기록할 때 그 자리의 좌표를 함께 저장해요.',
  },
  {
    icon: 'phone-portrait-outline',
    title: '어디에 저장되나요',
    body: '좌표는 이 휴대폰에만 저장되고 서버로 보내지 않아요. 앱을 쓰는 동안에만 위치를 확인해요.',
  },
  {
    icon: 'close-circle-outline',
    title: '언제든 철회할 수 있어요',
    body: '지도 화면의 설정에서 동의를 철회하고, 저장된 위치를 모두 지울 수 있어요. 동의하지 않아도 기록과 도감은 그대로 쓸 수 있어요.',
  },
];

export default function LocationConsentScreen() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PermissionState | null>(null);

  async function agree() {
    setBusy(true);
    try {
      const state = await agreeAndRequestPermission();
      if (state === 'granted') router.back();
      else setResult(state);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.hero}>
        <Ionicons name="map" size={48} color={colors.primary} />
        <Text style={styles.title}>위치 정보 사용에 동의해 주세요</Text>
        <Text style={styles.lead}>지도 기능은 위치 사용에 동의한 경우에만 쓸 수 있어요.</Text>
      </View>

      {POINTS.map((p) => (
        <View key={p.title} style={styles.point}>
          <Ionicons name={p.icon} size={22} color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.pointTitle}>{p.title}</Text>
            <Text style={styles.pointBody}>{p.body}</Text>
          </View>
        </View>
      ))}

      {result ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            {result === 'denied'
              ? '휴대폰 설정에서 위치 권한이 꺼져 있어요. 설정에서 이 앱의 위치 접근을 허용해 주세요.'
              : '위치 권한을 허용하지 않았어요. 지도를 쓰려면 다시 시도해 주세요.'}
          </Text>
          {result === 'denied' ? (
            <Button label="설정 열기" icon="settings-outline" variant="secondary" onPress={() => Linking.openSettings()} />
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button label={busy ? '확인하는 중…' : '동의하고 위치 허용하기'} onPress={agree} disabled={busy} />
        <Button label="동의하지 않음" variant="secondary" onPress={() => router.back()} disabled={busy} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  lead: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  point: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pointTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  pointBody: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  notice: { backgroundColor: colors.warnBg, borderRadius: 12, padding: 12, gap: 10 },
  noticeText: { color: colors.warn, fontSize: 14, lineHeight: 20 },
  actions: { gap: 10, marginTop: 8 },
});
