import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import type { Catch, Coords } from '../types';

const STORAGE_KEY = 'dex/catches/v1';

// 기록은 화면 여러 곳에서 함께 쓰므로 메모리에 한 벌 두고, 바뀌면 구독한 화면을 다시 그립니다.
let catches: Catch[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function load() {
  loading ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      catches = raw ? (JSON.parse(raw) as Catch[]).sort(byCaughtAtDesc) : [];
    })
    .catch(() => {
      catches = [];
    })
    .finally(() => {
      loaded = true;
      emit();
    });
  return loading;
}

// 잡은 날짜를 고칠 수 있어 저장할 때마다 잡은 시각 기준 최신순으로 정렬합니다.
const byCaughtAtDesc = (a: Catch, b: Catch) => b.caughtAt.localeCompare(a.caughtAt);

async function save(next: Catch[]) {
  catches = [...next].sort(byCaughtAtDesc);
  emit();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(catches));
}

// 촬영한 사진은 캐시 폴더에 있어 지워질 수 있으니 앱 문서 폴더로 복사해 둡니다.
// 웹에는 앱 문서 폴더가 없어 받은 주소를 그대로 씁니다.
async function persistPhoto(uri: string, id: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  const dir = new Directory(Paths.document, 'catches');
  dir.create({ intermediates: true, idempotent: true });
  const dest = new File(dir, `${id}.jpg`);
  await new File(uri).copy(dest);
  return dest.uri;
}

function deletePhoto(uri: string) {
  if (Platform.OS === 'web') return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // 사진이 이미 없으면 기록만 지웁니다.
  }
}

export type CatchInput = {
  speciesId: string;
  photoUri: string;
  memo?: string;
  place?: string;
  lengthCm?: number;
  location?: Coords;
  caughtAt?: string; // ISO 8601, 없으면 지금
};

export async function addCatch(input: CatchInput) {
  await load();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const photoUri = await persistPhoto(input.photoUri, id);
  const entry: Catch = {
    id,
    speciesId: input.speciesId,
    photoUri,
    caughtAt: input.caughtAt ?? new Date().toISOString(),
    memo: input.memo ?? '',
    place: input.place,
    lengthCm: input.lengthCm,
    location: input.location,
  };
  await save([entry, ...catches]);
  return entry;
}

export async function updateCatch(id: string, patch: Partial<Pick<Catch, 'memo' | 'place' | 'lengthCm' | 'speciesId' | 'location' | 'caughtAt'>>) {
  await load();
  await save(catches.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export async function deleteCatch(id: string) {
  await load();
  const target = catches.find((c) => c.id === id);
  await save(catches.filter((c) => c.id !== id));
  if (target) deletePhoto(target.photoUri);
}

/** 위치 동의를 철회하면서 저장된 좌표를 모두 지울 때 씁니다. */
export async function clearAllLocations() {
  await load();
  await save(catches.map(({ location: _location, ...rest }) => rest));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getCatches = () => catches;
const getLoaded = () => loaded;

/** 모든 기록 (최신순). */
export function useCatches() {
  useEffect(() => {
    load();
  }, []);
  const list = useSyncExternalStore(subscribe, getCatches, getCatches);
  const ready = useSyncExternalStore(subscribe, getLoaded, getLoaded);
  return { catches: list, ready };
}
