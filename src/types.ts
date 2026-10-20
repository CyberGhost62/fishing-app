export type Water = '바다' | '민물';

export type Species = {
  id: string;
  name: string; // 표준명
  aliases: string[]; // 낚시인들이 부르는 이름, 지역 방언
  scientificName: string;
  water: Water;
  summary: string;
  habitat: string;
  season: string; // 주로 잡히는 시기
  baits: string[];
  methods: string[]; // 낚시 방법, 채비
  cleaning: string[]; // 손질 순서
  dishes: string[];
  cautions: string[];
};

export type Candidate = {
  speciesId: string | null; // 목록에 없는 어종이면 null
  name: string;
  confidence: number; // 0~1
  reason: string;
};

export type IdentifyResult = {
  isFish: boolean;
  candidates: Candidate[];
  note: string;
};

export type Catch = {
  id: string;
  speciesId: string;
  photoUri: string;
  caughtAt: string; // ISO 8601
  memo: string;
};
