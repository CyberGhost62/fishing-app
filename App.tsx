import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { Nav, Route } from './src/navigation';
import { DexScreen } from './src/screens/DexScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SpeciesScreen } from './src/screens/SpeciesScreen';
import { colors } from './src/theme';

export default function App() {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const route = stack[stack.length - 1];

  const nav: Nav = useMemo(
    () => ({
      push: (r) => setStack((s) => [...s, r]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      reset: (r) => setStack([r]),
    }),
    [],
  );

  // 안드로이드 뒤로가기 버튼
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1) return false;
      nav.back();
      return true;
    });
    return () => sub.remove();
  }, [stack.length, nav]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        {route.name === 'home' && <HomeScreen key={stack.length} nav={nav} />}
        {route.name === 'result' && <ResultScreen nav={nav} photoUri={route.photoUri} base64={route.base64} />}
        {route.name === 'species' && <SpeciesScreen key={route.speciesId} nav={nav} speciesId={route.speciesId} />}
        {route.name === 'dex' && <DexScreen nav={nav} />}
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
