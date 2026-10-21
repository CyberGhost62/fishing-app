export type DateFieldProps = {
  value: Date;
  onChange: (d: Date) => void;
};

export const QUICK_DAYS = [
  { label: '오늘', daysAgo: 0 },
  { label: '어제', daysAgo: 1 },
  { label: '그저께', daysAgo: 2 },
];

/** 같은 시각을 유지한 채 날짜만 n일 전으로 옮깁니다. 미래가 되면 지금으로 맞춥니다. */
export function shiftToDaysAgo(value: Date, daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(value.getHours(), value.getMinutes(), 0, 0);
  return clampToNow(d);
}

export function clampToNow(d: Date) {
  const now = new Date();
  return d > now ? now : d;
}

export function daysAgoOf(value: Date) {
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((start(new Date()) - start(value)) / 86400000);
}
