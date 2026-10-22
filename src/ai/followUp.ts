import type { Channel, Client } from '../types';
import { addDays, daysBetween, formatDate, todayISO } from '../lib/dates';
import { FOLLOW_UP_CADENCE, STATUS_META, TYPE_LABEL } from '../lib/constants';

/**
 * AI follow-up layer.
 *
 * The UI only depends on `FollowUpProvider`. Today it uses a rule-based
 * provider that works offline. To plug in a real LLM later:
 *   1. Deploy a small server endpoint that holds the API key (never ship a key
 *      to the browser) and forwards `buildFollowUpPrompt()` to the model.
 *   2. Set VITE_AI_ENDPOINT to that URL — `getFollowUpProvider()` will switch
 *      to `RemoteAIProvider` automatically.
 * Scheduled/automatic follow-ups (e.g. a daily job that drafts messages for
 * every overdue client) can reuse the same provider on the server.
 */

export interface FollowUpSuggestion {
  nextContactDate: string;
  channel: Channel;
  reason: string;
  draftMessage: string;
  source: 'rules' | 'ai';
}

export interface FollowUpProvider {
  suggest(client: Client, today?: string): Promise<FollowUpSuggestion>;
}

export class RuleBasedProvider implements FollowUpProvider {
  async suggest(client: Client, today: string = todayISO()): Promise<FollowUpSuggestion> {
    const cadence = FOLLOW_UP_CADENCE[client.status];
    const firstName = client.name.split(' ')[0] || client.name;
    const last = client.interactions[0]; // newest first
    const sinceLast = client.lastContactDate ? daysBetween(client.lastContactDate, today) : null;
    const toTarget = client.targetPurchaseDate ? daysBetween(today, client.targetPurchaseDate) : null;

    let reason: string;
    let draft: string;
    let channel: Channel = client.status === 'nurture' ? 'text' : 'call';

    if (client.status === 'new') {
      reason = '신규 리드 — 48시간 안에 첫 상담을 잡는 게 전환율이 가장 높습니다.';
      draft = `안녕하세요 ${firstName}님, 문의 주셔서 감사합니다! 원하시는 지역과 예산을 조금 더 여쭤보고 맞춤 매물을 보내드리고 싶은데, 이번 주에 10분 정도 통화 가능하실까요?`;
    } else if (client.status === 'under_contract') {
      reason = '계약 진행 중 — 인스펙션/감정/융자 일정 체크가 필요합니다.';
      draft = `${firstName}님, 진행 상황 공유드려요. 다음 단계 일정 확인하시고 궁금하신 점 있으면 언제든 연락 주세요!`;
    } else if (toTarget !== null && toTarget >= 0 && toTarget <= 60) {
      reason = `구매 예정일(${formatDate(client.targetPurchaseDate)})까지 ${toTarget}일 남았습니다.`;
      draft = `${firstName}님, 계획하신 시점이 다가오고 있어서 연락드려요. ${client.areas ? client.areas + ' 쪽에 ' : ''}새로 나온 매물 몇 개 추려드릴까요?`;
    } else if (sinceLast !== null && sinceLast > 30) {
      reason = `마지막 연락 후 ${sinceLast}일이 지났습니다. 관계 유지를 위한 가벼운 안부 연락을 추천합니다.`;
      channel = 'text';
      draft = `${firstName}님, 잘 지내시죠? 요즘 ${client.areas || '관심 지역'} 시장 분위기 공유드리고 싶어서 연락드렸어요. 계획에 변화 있으시면 편하게 말씀 주세요!`;
    } else if (client.status === 'closed') {
      reason = '거래 완료 고객 — 정기 안부로 리퍼럴을 이어가세요.';
      channel = 'text';
      draft = `${firstName}님, 새 집에서 잘 지내고 계시죠? 필요한 거 있으시면 언제든 연락 주세요. 주변에 집 알아보시는 분 계시면 소개도 환영합니다 😊`;
    } else {
      reason = `${STATUS_META[client.status].label} 상태 기본 주기(${cadence}일)에 맞춘 팔로업입니다.`;
      draft = last
        ? `${firstName}님, 지난번 이야기 나눴던 내용 관련해서 이어서 연락드려요. 혹시 추가로 보고 싶으신 매물이나 궁금하신 점 있으신가요?`
        : `${firstName}님, 안녕하세요! 집 알아보시는 건 잘 되고 계신지 궁금해서 연락드렸어요.`;
    }

    // Next contact: never in the past; use cadence from today.
    return {
      nextContactDate: addDays(today, cadence),
      channel,
      reason,
      draftMessage: draft,
      source: 'rules',
    };
  }
}

/** Prompt for an LLM — kept here so the server side can reuse it verbatim. */
export function buildFollowUpPrompt(client: Client, today: string = todayISO()): string {
  const history = client.interactions
    .slice(0, 10)
    .map((i) => `- ${i.date} [${i.channel}] ${i.summary}`)
    .join('\n');

  return [
    'You are an assistant for a residential real estate agent.',
    'Suggest the next follow-up for this client. Reply as JSON with keys:',
    'nextContactDate (YYYY-MM-DD), channel (call|text|email|meeting|showing|other), reason, draftMessage.',
    'Write reason and draftMessage in the same language the agent uses in the notes.',
    '',
    `Today: ${today}`,
    `Client: ${client.name} (${TYPE_LABEL[client.type]}, status: ${STATUS_META[client.status].label})`,
    `Budget: ${client.budgetMin ?? '?'} – ${client.budgetMax ?? '?'}`,
    `Areas: ${client.areas || 'n/a'}`,
    `Last contact: ${client.lastContactDate ?? 'never'}`,
    `Planned next contact: ${client.nextContactDate ?? 'none'}`,
    `Target purchase date: ${client.targetPurchaseDate ?? 'unknown'}`,
    `Notes: ${client.notes || 'n/a'}`,
    'Recent conversations (newest first):',
    history || '(none)',
  ].join('\n');
}

export class RemoteAIProvider implements FollowUpProvider {
  constructor(
    private endpoint: string,
    private fallback: FollowUpProvider = new RuleBasedProvider(),
  ) {}

  async suggest(client: Client, today: string = todayISO()): Promise<FollowUpSuggestion> {
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildFollowUpPrompt(client, today), client }),
      });
      if (!res.ok) throw new Error(`AI endpoint returned ${res.status}`);
      const data = (await res.json()) as Omit<FollowUpSuggestion, 'source'>;
      return { ...data, source: 'ai' };
    } catch (err) {
      console.warn('AI follow-up failed, using rules instead', err);
      return this.fallback.suggest(client, today);
    }
  }
}

export function getFollowUpProvider(): FollowUpProvider {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined;
  return endpoint ? new RemoteAIProvider(endpoint) : new RuleBasedProvider();
}
