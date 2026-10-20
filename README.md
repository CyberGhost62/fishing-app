# 물고기 도감 (프로토타입)

물고기 사진을 찍으면 어종을 알려주고, 손질법·서식지·추천 미끼를 보여주고, 잡은 물고기를 내 도감에 모으는 앱입니다. 한국 인기 어종 30종(바다 25, 민물 5)으로 시작합니다.

## 구성

| 경로 | 내용 |
|---|---|
| `App.tsx`, `src/` | Expo(React Native) 앱. 홈 → 식별 결과 → 어종 상세 → 내 도감 |
| `src/data/species.ts` | 30종 어종 데이터 (초안, 출처 검수 전) |
| `server/identify-server.ts` | 사진을 Claude 비전 모델로 식별하는 작은 Node 서버. API 키를 앱에 넣지 않으려고 분리 |

## 실행 방법

1. 식별 서버
   ```bash
   cd server
   npm install
   ANTHROPIC_API_KEY=sk-ant-... npm start   # http://localhost:8787/identify
   ```
2. 앱
   ```bash
   npm install
   EXPO_PUBLIC_IDENTIFY_URL=http://<PC 내부 IP>:8787/identify npx expo start
   ```
   휴대폰에 Expo Go를 설치하고 QR 코드를 찍으면 실행됩니다.

## 식별 방식

- 앱이 사진(JPEG base64)을 서버로 보내면, 서버가 지원 어종 30종 목록을 함께 넘겨 Claude(`claude-opus-5-5`, effort `low`)에게 후보 3개와 신뢰도를 JSON으로 받습니다.
- 목록 밖 어종은 이름만 보여주고 도감 저장은 막습니다.
- 모델이 요청을 거절하면 서버 쪽 기본 대체 모델로 다시 시도하도록 `fallbacks: "default"`를 켰습니다.

## 알려진 한계 / 다음 단계

- 어종 데이터는 일반 낚시 상식으로 쓴 초안입니다. 국립수산과학원, 국립생물자원관 자료로 검수가 필요합니다.
- 금어기·금지체장은 해마다 바뀔 수 있어 데이터에 넣지 않았습니다.
- 어종 사진(대표 이미지)이 아직 없습니다.
- 도감 기록은 기기에만 저장됩니다(AsyncStorage + 앱 문서 폴더). 계정·동기화는 없습니다.
- 위치 기록, 지도, 오프라인 식별(자체 분류기)은 이후 단계입니다.
