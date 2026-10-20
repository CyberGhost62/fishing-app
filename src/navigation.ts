// 프로토타입이라 라이브러리 없이 간단한 스택으로 화면을 전환합니다.
export type Route =
  | { name: 'home' }
  | { name: 'result'; photoUri: string; base64: string }
  | { name: 'species'; speciesId: string }
  | { name: 'dex' };

export type Nav = {
  push: (route: Route) => void;
  back: () => void;
  reset: (route: Route) => void;
};
