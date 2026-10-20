import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { CatchForm } from '../../../components/CatchForm';
import { EmptyState } from '../../../components/ui';
import { updateCatch, useCatches } from '../../../lib/dex';

export default function EditCatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { catches, ready } = useCatches();
  const item = catches.find((c) => c.id === id);
  if (!ready) return null;
  if (!item) return <EmptyState icon="alert-circle-outline" title="기록을 찾을 수 없어요" message="이미 지운 기록일 수 있어요." />;

  return (
    <CatchForm
      initial={{
        photoUri: item.photoUri,
        speciesId: item.speciesId,
        place: item.place ?? '',
        length: item.lengthCm ? String(item.lengthCm) : '',
        memo: item.memo,
        keepLocation: !!item.location,
      }}
      photoEditable={false}
      locationMode={item.location ? 'edit-saved' : 'edit-none'}
      submitLabel="수정 완료"
      onSubmit={async (v) => {
        try {
          await updateCatch(item.id, {
            speciesId: v.speciesId,
            place: v.place.trim() || undefined,
            lengthCm: v.lengthCm,
            memo: v.memo.trim(),
            location: v.keepLocation ? item.location : undefined,
          });
          router.back();
        } catch (e) {
          Alert.alert('수정하지 못했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
        }
      }}
    />
  );
}
