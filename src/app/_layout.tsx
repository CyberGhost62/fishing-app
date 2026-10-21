import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="species/[id]" options={{ title: '' }} />
        <Stack.Screen name="catch/new" options={{ title: '물고기 기록하기', presentation: 'modal' }} />
        <Stack.Screen name="catch/[id]/index" options={{ title: '기록' }} />
        <Stack.Screen name="catch/[id]/edit" options={{ title: '기록 수정', presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ title: '프리미엄', presentation: 'modal' }} />
        <Stack.Screen name="location-consent" options={{ title: '위치 정보 동의', presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
