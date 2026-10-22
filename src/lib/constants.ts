import type { Channel, ClientStatus, ClientType } from '../types';

export const STATUS_META: Record<ClientStatus, { label: string; tone: string }> = {
  new: { label: '신규', tone: 'blue' },
  active: { label: '진행 중', tone: 'teal' },
  hot: { label: 'Hot', tone: 'red' },
  under_contract: { label: '계약 진행', tone: 'purple' },
  closed: { label: '거래 완료', tone: 'green' },
  nurture: { label: '장기 관리', tone: 'amber' },
  lost: { label: '종료', tone: 'gray' },
};

export const STATUS_ORDER: ClientStatus[] = [
  'hot',
  'under_contract',
  'active',
  'new',
  'nurture',
  'closed',
  'lost',
];

export const TYPE_LABEL: Record<ClientType, string> = {
  buyer: '매수',
  seller: '매도',
  both: '매수+매도',
  renter: '임대',
};

export const CHANNEL_META: Record<Channel, { label: string; icon: string }> = {
  call: { label: '전화', icon: '📞' },
  text: { label: '문자', icon: '💬' },
  email: { label: '이메일', icon: '✉️' },
  meeting: { label: '미팅', icon: '☕' },
  showing: { label: '쇼잉', icon: '🏠' },
  other: { label: '기타', icon: '📝' },
};

/** Default follow-up cadence (days) by status, used to suggest the next contact date. */
export const FOLLOW_UP_CADENCE: Record<ClientStatus, number> = {
  new: 2,
  hot: 2,
  under_contract: 3,
  active: 5,
  nurture: 30,
  closed: 90,
  lost: 180,
};
