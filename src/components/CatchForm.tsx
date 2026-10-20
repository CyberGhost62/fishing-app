import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SPECIES_BY_ID } from '../data/species';
import { pickPhoto } from '../lib/photo';
import { colors } from '../theme';
import { SpeciesPicker } from './SpeciesPicker';
import { Button } from './ui';

export type CatchFormValues = {
  photoUri: string | null;
  speciesId: string | null;
  place: string;
  length: string;
  memo: string;
};

/** 새 기록과 기록 수정에서 함께 쓰는 입력 폼. */
export function CatchForm({
  initial,
  photoEditable,
  submitLabel,
  onSubmit,
}: {
  initial: CatchFormValues;
  photoEditable: boolean;
  submitLabel: string;
  onSubmit: (values: CatchFormValues & { photoUri: string; speciesId: string; lengthCm?: number }) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CatchFormValues>(key: K, v: CatchFormValues[K]) => setValues((s) => ({ ...s, [key]: v }));

  const species = values.speciesId ? SPECIES_BY_ID[values.speciesId] : undefined;
  const lengthNum = values.length.trim() ? Number(values.length.replace(',', '.')) : undefined;
  const lengthInvalid = lengthNum !== undefined && (!Number.isFinite(lengthNum) || lengthNum <= 0 || lengthNum > 500);
  const missing = !values.photoUri ? '사진을 넣어 주세요' : !species ? '어종을 골라 주세요' : null;

  async function choosePhoto(source: 'camera' | 'library') {
    const uri = await pickPhoto(source);
    if (uri) set('photoUri', uri);
  }

  async function submit() {
    if (!values.photoUri || !values.speciesId || lengthInvalid) return;
    setBusy(true);
    try {
      await onSubmit({
        ...values,
        photoUri: values.photoUri,
        speciesId: values.speciesId,
        lengthCm: lengthNum === undefined ? undefined : Math.round(lengthNum * 10) / 10,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {values.photoUri ? (
          <View>
            <Image source={{ uri: values.photoUri }} style={styles.photo} resizeMode="cover" />
            {photoEditable ? (
              <View style={styles.photoActions}>
                <Pressable style={styles.photoAction} onPress={() => choosePhoto('camera')} accessibilityRole="button">
                  <Ionicons name="camera-outline" size={16} color={colors.primary} />
                  <Text style={styles.photoActionText}>다시 찍기</Text>
                </Pressable>
                <Pressable style={styles.photoAction} onPress={() => choosePhoto('library')} accessibilityRole="button">
                  <Ionicons name="images-outline" size={16} color={colors.primary} />
                  <Text style={styles.photoActionText}>앨범에서 바꾸기</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <Ionicons name="fish-outline" size={40} color={colors.muted} />
            <Text style={styles.muted}>잡은 물고기 사진을 넣어 주세요</Text>
            <View style={styles.photoEmptyButtons}>
              <Button label="사진 찍기" icon="camera-outline" onPress={() => choosePhoto('camera')} />
              <Button label="앨범" icon="images-outline" variant="secondary" onPress={() => choosePhoto('library')} />
            </View>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>어종</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.select, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={species ? `어종: ${species.name}. 바꾸려면 누르세요` : '어종 고르기'}
          >
            <Text style={species ? styles.selectValue : styles.placeholder}>
              {species ? species.name : '어떤 물고기인가요?'}
            </Text>
            {species?.aliases.length ? <Text style={styles.alias}>{species.aliases.join(', ')}</Text> : null}
            <Ionicons name="chevron-down" size={18} color={colors.muted} style={{ marginLeft: 'auto' }} />
          </Pressable>
        </View>

        <View style={styles.row2}>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.label}>잡은 곳 (선택)</Text>
            <TextInput
              value={values.place}
              onChangeText={(v) => set('place', v)}
              placeholder="예: 거제 지세포 방파제"
              placeholderTextColor={colors.muted}
              style={styles.input}
              maxLength={40}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>길이 (선택)</Text>
            <View style={[styles.input, styles.inputWithUnit, lengthInvalid && styles.inputError]}>
              <TextInput
                value={values.length}
                onChangeText={(v) => set('length', v)}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={styles.inputBare}
                maxLength={5}
                accessibilityLabel="길이 (센티미터)"
              />
              <Text style={styles.muted}>cm</Text>
            </View>
          </View>
        </View>
        {lengthInvalid ? <Text style={styles.error}>길이는 0보다 크고 500cm 이하인 숫자로 넣어 주세요.</Text> : null}

        <View style={styles.field}>
          <Text style={styles.label}>메모 (선택)</Text>
          <TextInput
            value={values.memo}
            onChangeText={(v) => set('memo', v)}
            placeholder="채비, 미끼, 물때 등 남기고 싶은 내용"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.memo]}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        <Button label={busy ? '저장하는 중…' : submitLabel} onPress={submit} disabled={busy || !!missing || lengthInvalid} />
        {missing ? <Text style={styles.hint}>{missing}</Text> : null}
      </ScrollView>

      <SpeciesPicker
        visible={pickerOpen}
        selectedId={values.speciesId}
        onSelect={(id) => set('speciesId', id)}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: colors.border },
  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.muted,
    padding: 16,
  },
  photoEmptyButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  photoActions: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 8 },
  photoAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  photoActionText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  field: { gap: 6 },
  row2: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  placeholder: { fontSize: 16, color: colors.muted },
  alias: { fontSize: 14, color: colors.muted, flexShrink: 1 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputWithUnit: { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 },
  inputBare: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 16, color: colors.text },
  inputError: { borderColor: colors.danger },
  memo: { minHeight: 96 },
  muted: { color: colors.muted, fontSize: 14 },
  error: { color: colors.danger, fontSize: 13, marginTop: -8 },
  hint: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: -8 },
});
