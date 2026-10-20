import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.6,
};

export type PhotoSource = 'camera' | 'library';

/** 카메라나 앨범에서 사진 한 장을 받아 주소를 돌려줍니다. 취소하면 null. */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  // 웹에는 카메라 앱이 없어 파일 선택으로 대신합니다.
  const useCamera = source === 'camera' && Platform.OS !== 'web';
  const perm = useCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('권한이 필요해요', useCamera ? '설정에서 카메라 접근을 허용해 주세요.' : '설정에서 사진 접근을 허용해 주세요.');
    return null;
  }
  const result = useCamera
    ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
    : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/** 되돌릴 수 없는 동작 전에 한 번 묻습니다. 웹은 Alert 버튼을 지원하지 않아 confirm을 씁니다. */
export function confirmDestructive(title: string, message: string, actionLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n${message}`) ?? false);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel', onPress: () => resolve(false) },
      { text: actionLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
