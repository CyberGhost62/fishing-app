import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { useCallback, useEffect, useState } from 'react';
import type { Catch } from '../types';

const STORAGE_KEY = 'dex/catches/v1';

async function loadCatches(): Promise<Catch[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Catch[]) : [];
}

// 촬영한 사진은 캐시 폴더에 있어 지워질 수 있으니 앱 문서 폴더로 복사해 둡니다.
async function persistPhoto(uri: string, id: string): Promise<string> {
  const dir = new Directory(Paths.document, 'catches');
  dir.create({ intermediates: true, idempotent: true });
  const dest = new File(dir, `${id}.jpg`);
  await new File(uri).copy(dest);
  return dest.uri;
}

export async function addCatch(input: { speciesId: string; photoUri: string; memo?: string }) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const photoUri = await persistPhoto(input.photoUri, id);
  const entry: Catch = {
    id,
    speciesId: input.speciesId,
    photoUri,
    caughtAt: new Date().toISOString(),
    memo: input.memo ?? '',
  };
  const catches = await loadCatches();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...catches]));
  return entry;
}

export function useCatches() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const reload = useCallback(() => {
    loadCatches().then(setCatches, () => setCatches([]));
  }, []);
  useEffect(reload, [reload]);
  return { catches, reload };
}
