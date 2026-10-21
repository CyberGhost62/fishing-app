export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

/** 한글 검색: 공백을 무시하고 포함 여부로 비교합니다. */
export function matches(query: string, ...fields: string[]) {
  const q = query.replace(/\s+/g, '').toLowerCase();
  if (!q) return true;
  return fields.some((f) => f.replace(/\s+/g, '').toLowerCase().includes(q));
}
