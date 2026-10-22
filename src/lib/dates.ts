// Small, dependency-free date helpers working on local "YYYY-MM-DD" strings.

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime();
  return Math.round(ms / 86_400_000);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = parseISODate(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} (${WEEKDAYS[d.getDay()]})`;
}

/** Human friendly relative label, e.g. "오늘", "3일 전", "2주 후". */
export function relativeLabel(iso: string | null, today: string = todayISO()): string {
  if (!iso) return '—';
  const diff = daysBetween(today, iso);
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  if (diff === -1) return '어제';
  const abs = Math.abs(diff);
  const suffix = diff > 0 ? '후' : '전';
  if (abs < 14) return `${abs}일 ${suffix}`;
  if (abs < 60) return `${Math.round(abs / 7)}주 ${suffix}`;
  if (abs < 730) return `${Math.round(abs / 30)}개월 ${suffix}`;
  return `${Math.round(abs / 365)}년 ${suffix}`;
}
