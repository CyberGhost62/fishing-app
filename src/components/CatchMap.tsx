import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SPECIES_BY_ID } from '../data/species';
import { formatDate } from '../lib/format';
import { colors } from '../theme';
import type { Catch, Coords } from '../types';

export type CatchMapProps = {
  catches: (Catch & { location: Coords })[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

// 기록이 하나도 없을 때 처음 보여줄 범위 (한반도 전체)
const KOREA = { latitude: 36.3, longitude: 127.8, latitudeDelta: 6, longitudeDelta: 6 };

export function CatchMap({ catches, selectedId, onSelect }: CatchMapProps) {
  const ref = useRef<MapView>(null);
  const selected = catches.find((c) => c.id === selectedId);

  // 고른 기록으로 이동하고, 처음에는 모든 기록이 보이게 맞춥니다.
  useEffect(() => {
    if (selected) {
      ref.current?.animateToRegion({ ...selected.location, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 400);
    }
  }, [selected]);

  function fitAll() {
    if (catches.length > 1 && !selected) {
      ref.current?.fitToCoordinates(
        catches.map((c) => c.location),
        { edgePadding: { top: 80, right: 60, bottom: 220, left: 60 }, animated: false },
      );
    }
  }

  const first = selected ?? catches[0];
  const initialRegion = first ? { ...first.location, latitudeDelta: 0.2, longitudeDelta: 0.2 } : KOREA;

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton
      onMapReady={fitAll}
      onPress={(e) => {
        // 마커를 누를 때도 지도 onPress가 불리는 플랫폼이 있어 마커 탭은 거릅니다.
        if (e.nativeEvent.action !== 'marker-press') onSelect(null);
      }}
    >
      {catches.map((c) => (
        <Marker
          key={c.id}
          identifier={c.id}
          coordinate={c.location}
          title={SPECIES_BY_ID[c.speciesId]?.name ?? '물고기'}
          description={formatDate(c.caughtAt)}
          pinColor={c.id === selectedId ? colors.warn : colors.primary}
          onPress={() => onSelect(c.id)}
        />
      ))}
    </MapView>
  );
}
