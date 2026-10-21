// assets/species/credits.json 을 읽어 src/data/speciesPhotos.ts 를 만듭니다.
// Metro는 require 경로가 고정 문자열이어야 해서 사진마다 require 줄을 생성합니다.
// 사용: node scripts/gen-species-photos.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const credits = existsSync('assets/species/credits.json')
  ? JSON.parse(readFileSync('assets/species/credits.json', 'utf8'))
  : [];

const lines = credits
  .filter((c) => existsSync(`assets/species/${c.file}`))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map(
    (c) => `  ${JSON.stringify(c.id)}: {
    source: require(${JSON.stringify(`../../assets/species/${c.file}`)}),
    author: ${JSON.stringify(c.author)},
    license: ${JSON.stringify(c.license)},
    licenseUrl: ${JSON.stringify(c.licenseUrl ?? '')},
    sourceUrl: ${JSON.stringify(c.sourceUrl)},
  },`,
  );

writeFileSync(
  'src/data/speciesPhotos.ts',
  `// 자동 생성 파일입니다. scripts/gen-species-photos.mjs 로 다시 만드세요.
// 사진은 Wikimedia Commons의 자유 이용 사진이며, 출처와 라이선스를 앱에 표시합니다.
import type { ImageSourcePropType } from 'react-native';

export type SpeciesPhoto = {
  source: ImageSourcePropType;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export const SPECIES_PHOTOS: Record<string, SpeciesPhoto | undefined> = {
${lines.join('\n')}
};
`,
);
console.log(`species photos: ${lines.length}`);
