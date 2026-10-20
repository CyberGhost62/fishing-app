import type { IdentifyResult } from '../types';

// 식별 서버 주소. 휴대폰에서 테스트할 땐 localhost 대신 PC의 내부 IP를 넣으세요.
const IDENTIFY_URL = process.env.EXPO_PUBLIC_IDENTIFY_URL ?? 'http://localhost:8787/identify';

export async function identifyFish(imageBase64: string): Promise<IdentifyResult> {
  const res = await fetch(IDENTIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // expo-image-picker의 base64는 항상 JPEG 데이터입니다.
    body: JSON.stringify({ imageBase64, mediaType: 'image/jpeg' }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `식별 요청이 실패했습니다 (${res.status}).`);
  }
  return body as IdentifyResult;
}
