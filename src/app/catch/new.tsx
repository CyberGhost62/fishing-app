import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { CatchForm } from '../../components/CatchForm';
import { addCatch } from '../../lib/dex';

export default function NewCatchScreen() {
  const { photoUri, speciesId } = useLocalSearchParams<{ photoUri?: string; speciesId?: string }>();

  return (
    <CatchForm
      initial={{ photoUri: photoUri ?? null, speciesId: speciesId ?? null, place: '', length: '', memo: '' }}
      photoEditable
      submitLabel="도감에 저장"
      onSubmit={async (v) => {
        try {
          const entry = await addCatch({
            speciesId: v.speciesId,
            photoUri: v.photoUri,
            place: v.place.trim() || undefined,
            lengthCm: v.lengthCm,
            memo: v.memo.trim(),
          });
          router.replace({ pathname: '/catch/[id]', params: { id: entry.id, saved: '1' } });
        } catch (e) {
          Alert.alert('저장하지 못했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
        }
      }}
    />
  );
}
