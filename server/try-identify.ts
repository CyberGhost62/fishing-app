// 식별 서버에 사진 파일들을 보내 결과를 출력합니다.
// 사용: npm start 로 서버를 띄운 뒤  npx tsx try-identify.ts 사진1.jpg 사진2.png ...
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const URL = process.env.IDENTIFY_URL ?? 'http://localhost:8787/identify';
const MEDIA_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

for (const path of process.argv.slice(2)) {
  const mediaType = MEDIA_TYPES[extname(path).toLowerCase()];
  if (!mediaType) {
    console.log(`${path}: 지원하지 않는 형식`);
    continue;
  }
  const imageBase64 = (await readFile(path)).toString('base64');
  const started = Date.now();
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType }),
  });
  const body = await res.json();
  console.log(`\n=== ${path} (${res.status}, ${((Date.now() - started) / 1000).toFixed(1)}s)`);
  console.log(JSON.stringify(body, null, 2));
}
