import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CatchMap } from '../../components/CatchMap';
import { Button, EmptyState } from '../../components/ui';
import { SPECIES_BY_ID } from '../../data/species';
import { clearAllLocations, useCatches } from '../../lib/dex';
import { formatDate } from '../../lib/format';
import { agreeAndRequestPermission, revokeConsent, useLocationConsent, useLocationPermission } from '../../lib/location';
import { confirmDestructive } from '../../lib/photo';
import { colors } from '../../theme';
import type { Catch, Coords } from '../../types';

export default function MapScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const { agreed, ready } = useLocationConsent();
  const { permission, refresh } = useLocationPermission();
  const { catches } = useCatches();
  const [selectedId, setSelectedId] = useState<string | null>(focus ?? null);

  // 설정 앱에서 권한을 바꾸고 돌아올 수 있어 화면에 들어올 때마다 다시 확인합니다.
  useFocusEffect(
    useCallback(() => {
      refresh();
      if (focus) setSelectedId(focus);
    }, [refresh, focus]),
  );

  const located = catches.filter((c): c is Catch & { location: Coords } => !!c.location);
  const unlocated = catches.length - located.length;
  const selected = located.find((c) => c.id === selectedId);

  async function revoke() {
    const ok = await confirmDestructive(
      '위치 동의를 철회할까요?',
      '지도와 위치 기록 기능이 꺼져요. 휴대폰의 위치 권한은 설정 앱에서 따로 끌 수 있어요.',
      '철회',
    );
    if (!ok) return;
    await revokeConsent();
    if (located.length > 0) {
      const wipe = await confirmDestructive(
        '저장된 위치도 지울까요?',
        `기록 ${located.length}개에 저장된 좌표를 지워요. 기록과 사진은 그대로 남아요.`,
        '위치 지우기',
      );
      if (wipe) await clearAllLocations();
    }
  }

  if (!ready || (agreed && permission === null)) return null;

  if (!agreed) {
    return (
      <EmptyState
        icon="map-outline"
        title="잡은 곳을 지도에서 보세요"
        message="위치 사용에 동의하면 내 위치와 물고기를 잡은 자리를 지도에 표시해요. 동의하기 전에는 위치를 전혀 쓰지 않아요."
        action={<Button label="위치 사용 동의하기" icon="checkmark-circle-outline" onPress={() => router.push('/location-consent')} />}
      />
    );
  }

  if (permission !== 'granted') {
    return (
      <EmptyState
        icon="location-outline"
        title="위치 권한이 꺼져 있어요"
        message={
          permission === 'denied'
            ? '휴대폰 설정에서 이 앱의 위치 접근을 허용하면 지도를 쓸 수 있어요.'
            : '위치 사용에 동의하셨지만 아직 위치 권한을 허용하지 않았어요.'
        }
        action={
          <View style={{ gap: 10 }}>
            {permission === 'denied' ? (
              <Button label="설정 열기" icon="settings-outline" onPress={() => Linking.openSettings()} />
            ) : (
              <Button
                label="위치 권한 허용하기"
                icon="location-outline"
                onPress={async () => {
                  await agreeAndRequestPermission();
                  refresh();
                }}
              />
            )}
            <Button label="위치 동의 철회" variant="secondary" onPress={revoke} />
          </View>
        }
      />
    );
  }

  const species = selected ? SPECIES_BY_ID[selected.speciesId] : undefined;

  return (
    <View style={styles.container}>
      <CatchMap catches={located} selectedId={selectedId} onSelect={setSelectedId} />

      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.pill}>
          <Ionicons name="fish" size={14} color={colors.primary} />
          <Text style={styles.pillText}>
            지도에 {located.length}마리{unlocated > 0 ? ` · 위치 없는 기록 ${unlocated}개` : ''}
          </Text>
        </View>
        <Pressable onPress={revoke} style={styles.pill} accessibilityRole="button" accessibilityLabel="위치 동의 철회">
          <Ionicons name="settings-outline" size={14} color={colors.text} />
          <Text style={styles.pillText}>동의 철회</Text>
        </Pressable>
      </View>

      {selected ? (
        <Pressable
          style={styles.card}
          onPress={() => router.push({ pathname: '/catch/[id]', params: { id: selected.id } })}
          accessibilityRole="button"
        >
          <Image source={{ uri: selected.photoUri }} style={styles.cardThumb} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.cardTitle}>{species?.name ?? '물고기'}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {[formatDate(selected.caughtAt), selected.place, selected.lengthCm ? `${selected.lengthCm}cm` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Text style={styles.cardLink}>기록 보기 ›</Text>
          </View>
        </Pressable>
      ) : located.length === 0 ? (
        <View style={styles.card}>
          <Ionicons name="information-circle-outline" size={22} color={colors.muted} />
          <Text style={[styles.cardMeta, { flex: 1 }]}>
            이제부터 물고기를 기록하면 잡은 자리가 지도에 표시돼요.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 1,
  },
  pillText: { fontSize: 13, color: colors.text, fontWeight: '600', flexShrink: 1 },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cardThumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.border },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  cardLink: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2 },
});
