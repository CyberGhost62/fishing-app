import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { Coords } from '../types';

// 위치는 사용자가 앱 안에서 먼저 동의하고, 그다음 운영체제 권한까지 허용해야만 씁니다.
// 동의 기록은 기기에만 저장합니다.
const CONSENT_KEY = 'settings/location-consent/v1';

type Consent = { agreedAt: string } | null;

let consent: Consent = null;
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function load() {
  loading ??= AsyncStorage.getItem(CONSENT_KEY)
    .then((raw) => {
      consent = raw ? (JSON.parse(raw) as Consent) : null;
    })
    .catch(() => {
      consent = null;
    })
    .finally(() => {
      loaded = true;
      emit();
    });
  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getConsent = () => consent;
const getLoaded = () => loaded;

export type PermissionState = 'granted' | 'denied' | 'undetermined';

/** 앱 안 동의 여부. 운영체제 권한과는 별개입니다. */
export function useLocationConsent() {
  useEffect(() => {
    load();
  }, []);
  const value = useSyncExternalStore(subscribe, getConsent, getConsent);
  const ready = useSyncExternalStore(subscribe, getLoaded, getLoaded);
  return { agreed: value !== null, agreedAt: value?.agreedAt ?? null, ready };
}

/** 운영체제 위치 권한 상태. 설정 앱에서 바뀔 수 있어 화면에 들어올 때 refresh로 읽습니다. */
export function useLocationPermission() {
  const [state, setState] = useState<PermissionState | null>(null);
  const refresh = useCallback(async () => {
    try {
      const res = await Location.getForegroundPermissionsAsync();
      setState(res.granted ? 'granted' : res.canAskAgain ? 'undetermined' : 'denied');
    } catch {
      setState('denied');
    }
  }, []);
  return { permission: state, refresh };
}

/** 사용자가 동의 화면에서 동의했을 때만 부릅니다. 동의를 저장하고 운영체제 권한을 요청합니다. */
export async function agreeAndRequestPermission(): Promise<PermissionState> {
  await load();
  consent = { agreedAt: new Date().toISOString() };
  emit();
  await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  const res = await Location.requestForegroundPermissionsAsync();
  return res.granted ? 'granted' : res.canAskAgain ? 'undetermined' : 'denied';
}

export async function revokeConsent() {
  await load();
  consent = null;
  emit();
  await AsyncStorage.removeItem(CONSENT_KEY);
}

/**
 * 동의와 권한이 모두 있을 때만 현재 좌표를 돌려줍니다. 그 밖에는 null.
 * 위치를 못 잡아도 기록 저장은 막지 않도록 오류도 null로 돌립니다.
 */
export async function getCurrentCoords(): Promise<Coords | null> {
  await load();
  if (!consent) return null;
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
    ]);
    if (pos) return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    const last = await Location.getLastKnownPositionAsync();
    return last ? { latitude: last.coords.latitude, longitude: last.coords.longitude } : null;
  } catch {
    return null;
  }
}
