// Core domain model. Dates are stored as ISO date strings ("YYYY-MM-DD")
// so they serialize cleanly to localStorage now and to a backend later.

export type ClientStatus =
  | 'new' // 신규 리드
  | 'active' // 상담/투어 진행 중
  | 'hot' // 오퍼 준비 / 매우 적극적
  | 'under_contract' // 계약 진행 중 (escrow)
  | 'closed' // 거래 완료
  | 'nurture' // 장기 관리
  | 'lost'; // 종료/이탈

export type ClientType = 'buyer' | 'seller' | 'both' | 'renter';

export type Channel = 'call' | 'text' | 'email' | 'meeting' | 'showing' | 'other';

export interface Interaction {
  id: string;
  date: string; // YYYY-MM-DD
  channel: Channel;
  summary: string; // 대화 내용
  createdAt: string; // ISO timestamp
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: ClientType;
  status: ClientStatus;
  source: string; // 유입 경로 (Zillow, 지인 소개 ...)
  budgetMin: number | null;
  budgetMax: number | null;
  areas: string; // 희망 지역
  lastContactDate: string | null;
  nextContactDate: string | null;
  targetPurchaseDate: string | null; // 집 구매(또는 매도) 예정일
  notes: string; // 고정 메모 (선호 조건 등)
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
}

export type ClientDraft = Omit<Client, 'id' | 'interactions' | 'createdAt' | 'updatedAt'>;
