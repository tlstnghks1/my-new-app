import type { Client, Interaction } from '../types';
import { addDays, todayISO } from '../lib/dates';
import { newId } from './repository';

/** Demo data shown on first launch so the app doesn't look empty. */
export function sampleClients(today: string = todayISO()): Client[] {
  const now = new Date().toISOString();
  const ix = (offset: number, channel: Interaction['channel'], summary: string): Interaction => ({
    id: newId(),
    date: addDays(today, offset),
    channel,
    summary,
    createdAt: now,
  });

  const base = {
    phone: '',
    email: '',
    source: '',
    budgetMin: null,
    budgetMax: null,
    areas: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };

  return [
    {
      ...base,
      id: newId(),
      name: '김민준 (예시)',
      phone: '(213) 555-0142',
      email: 'minjun@example.com',
      type: 'buyer',
      status: 'hot',
      source: '지인 소개',
      budgetMin: 850000,
      budgetMax: 1000000,
      areas: 'Irvine, Tustin',
      lastContactDate: addDays(today, -4),
      nextContactDate: addDays(today, -1),
      targetPurchaseDate: addDays(today, 45),
      notes: '학군 중요. 방 4개 이상, 차고 2대.',
      interactions: [
        ix(-4, 'showing', 'Irvine 매물 3곳 쇼잉. Woodbury 집 가장 마음에 들어함. 오퍼 고민 중.'),
        ix(-12, 'call', '프리어프루벌 완료. 예산 100만까지 가능.'),
      ],
    },
    {
      ...base,
      id: newId(),
      name: 'Sarah Lee (예시)',
      phone: '(714) 555-0199',
      type: 'seller',
      status: 'under_contract',
      source: 'Zillow',
      areas: 'Fullerton',
      lastContactDate: addDays(today, -2),
      nextContactDate: today,
      targetPurchaseDate: addDays(today, 21),
      notes: '에스크로 30일. 인스펙션 결과 대기.',
      interactions: [ix(-2, 'email', '바이어 측 인스펙션 일정 확정. 결과 나오면 바로 공유하기로.')],
    },
    {
      ...base,
      id: newId(),
      name: '박서연 (예시)',
      type: 'buyer',
      status: 'new',
      source: '오픈하우스',
      areas: 'Buena Park',
      lastContactDate: null,
      nextContactDate: addDays(today, 1),
      targetPurchaseDate: null,
      interactions: [],
    },
    {
      ...base,
      id: newId(),
      name: '최도윤 (예시)',
      type: 'both',
      status: 'nurture',
      source: '기존 고객',
      areas: 'Diamond Bar',
      lastContactDate: addDays(today, -48),
      nextContactDate: addDays(today, 12),
      targetPurchaseDate: addDays(today, 200),
      notes: '내년 봄 아이 학교 맞춰서 이사 고려.',
      interactions: [ix(-48, 'text', '내년 봄쯤 다시 이야기하자고 함. 현재 집 시세 궁금해함.')],
    },
  ];
}
