import type { Client, ClientStatus } from '../types';
import { daysBetween, todayISO } from './dates';
import { STATUS_ORDER } from './constants';

export type SortKey = 'smart' | 'nextContact' | 'lastContact' | 'targetDate' | 'name' | 'updated';

export const SORT_LABEL: Record<SortKey, string> = {
  smart: '스마트 정렬',
  nextContact: '다음 컨택일',
  lastContact: '마지막 컨택일',
  targetDate: '구매 예정일',
  name: '이름',
  updated: '최근 수정',
};

export type Urgency = 'overdue' | 'today' | 'soon' | 'later' | 'none';

const INACTIVE: ClientStatus[] = ['closed', 'lost'];

export function isActive(c: Client): boolean {
  return !INACTIVE.includes(c.status);
}

export function urgencyOf(c: Client, today: string = todayISO()): Urgency {
  if (!c.nextContactDate) return 'none';
  const diff = daysBetween(today, c.nextContactDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 7) return 'soon';
  return 'later';
}

/**
 * Priority score for "smart" sorting — higher means "deal with this first".
 * Combines how overdue the follow-up is, the pipeline stage, how close the
 * purchase date is, and how long it's been since the last touch.
 */
export function priorityScore(c: Client, today: string = todayISO()): number {
  if (!isActive(c)) return -1000 + (c.nextContactDate ? -daysBetween(today, c.nextContactDate) : -500);

  let score = 0;

  if (c.nextContactDate) {
    const diff = daysBetween(today, c.nextContactDate);
    if (diff < 0) score += 100 + Math.min(-diff, 30) * 2; // overdue: the more, the higher
    else if (diff === 0) score += 90;
    else score += Math.max(0, 60 - diff * 4); // tomorrow ≈ 56, a week ≈ 32, 15d+ ≈ 0
  } else {
    score += 40; // no plan yet → needs a decision
  }

  const stageBonus: Partial<Record<ClientStatus, number>> = {
    hot: 30,
    under_contract: 25,
    new: 20,
    active: 10,
    nurture: 0,
  };
  score += stageBonus[c.status] ?? 0;

  if (c.targetPurchaseDate) {
    const d = daysBetween(today, c.targetPurchaseDate);
    if (d >= 0 && d <= 30) score += 20;
    else if (d > 30 && d <= 90) score += 10;
  }

  if (c.lastContactDate) {
    const since = daysBetween(c.lastContactDate, today);
    if (since > 30) score += 10;
  } else {
    score += 10;
  }

  return score;
}

/** Compare nullable ISO dates, always putting empty values last. */
function cmpDate(a: string | null, b: string | null, dir: 1 | -1): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -dir : dir;
}

export function sortClients(clients: Client[], key: SortKey, today: string = todayISO()): Client[] {
  const list = [...clients];
  const byName = (a: Client, b: Client) => a.name.localeCompare(b.name, 'ko');

  switch (key) {
    case 'smart': {
      const scores = new Map(list.map((c) => [c.id, priorityScore(c, today)]));
      return list.sort((a, b) => scores.get(b.id)! - scores.get(a.id)! || byName(a, b));
    }
    case 'nextContact':
      return list.sort((a, b) => cmpDate(a.nextContactDate, b.nextContactDate, 1) || byName(a, b));
    case 'lastContact':
      // Oldest touch first — those are the people slipping through the cracks.
      return list.sort((a, b) => cmpDate(a.lastContactDate, b.lastContactDate, 1) || byName(a, b));
    case 'targetDate':
      return list.sort((a, b) => cmpDate(a.targetPurchaseDate, b.targetPurchaseDate, 1) || byName(a, b));
    case 'name':
      return list.sort(byName);
    case 'updated':
      return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export function statusRank(s: ClientStatus): number {
  return STATUS_ORDER.indexOf(s);
}
