import { useEffect, useState, type FormEvent } from 'react';
import type { Channel, Client, ClientStatus } from '../types';
import { CHANNEL_META, STATUS_META, STATUS_ORDER, TYPE_LABEL } from '../lib/constants';
import { addDays, formatDate, relativeLabel, todayISO } from '../lib/dates';
import { urgencyOf } from '../lib/sorting';
import { getFollowUpProvider, type FollowUpSuggestion } from '../ai/followUp';
import type { NewInteraction } from '../data/useClients';
import { Avatar, budgetLabel } from './ui';

const provider = getFollowUpProvider();

interface Props {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<Client>) => void;
  onAddInteraction: (input: NewInteraction) => void;
  onDeleteInteraction: (interactionId: string) => void;
}

export function ClientDetail({
  client,
  onClose,
  onEdit,
  onDelete,
  onUpdate,
  onAddInteraction,
  onDeleteInteraction,
}: Props) {
  const today = todayISO();
  const urgency = urgencyOf(client, today);

  return (
    <aside className="detail" aria-label={`${client.name} 상세`}>
      <header className="detail-head">
        <button className="icon-btn back" onClick={onClose} aria-label="닫기">
          ←
        </button>
        <Avatar name={client.name} />
        <div className="detail-title">
          <h2>{client.name}</h2>
          <div className="sub">
            {TYPE_LABEL[client.type]}
            {client.source && ` · ${client.source}`}
          </div>
        </div>
        <button className="btn ghost sm" onClick={onEdit}>
          수정
        </button>
      </header>

      <div className="detail-body">
        <div className="quick-actions">
          {client.phone && (
            <>
              <a className="btn soft sm" href={`tel:${client.phone}`}>
                📞 전화
              </a>
              <a className="btn soft sm" href={`sms:${client.phone}`}>
                💬 문자
              </a>
            </>
          )}
          {client.email && (
            <a className="btn soft sm" href={`mailto:${client.email}`}>
              ✉️ 이메일
            </a>
          )}
        </div>

        <section className="card">
          <div className="status-picker" role="radiogroup" aria-label="상태">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={client.status === s}
                className={`chip tone-${STATUS_META[s].tone} ${client.status === s ? 'on' : ''}`}
                onClick={() => onUpdate({ status: s as ClientStatus })}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>

          <dl className="facts">
            <div>
              <dt>다음 컨택</dt>
              <dd className={`urgency-text-${urgency}`}>
                <input
                  type="date"
                  className="inline-date"
                  value={client.nextContactDate ?? ''}
                  onChange={(e) => onUpdate({ nextContactDate: e.target.value || null })}
                />
                <span className="rel">{client.nextContactDate && relativeLabel(client.nextContactDate, today)}</span>
                <div className="snooze">
                  {[1, 3, 7, 14, 30].map((n) => (
                    <button key={n} className="mini" onClick={() => onUpdate({ nextContactDate: addDays(today, n) })}>
                      +{n < 7 ? `${n}일` : n === 30 ? '1달' : `${n / 7}주`}
                    </button>
                  ))}
                </div>
              </dd>
            </div>
            <div>
              <dt>마지막 컨택</dt>
              <dd>
                {formatDate(client.lastContactDate)}
                <span className="rel">{client.lastContactDate && relativeLabel(client.lastContactDate, today)}</span>
              </dd>
            </div>
            <div>
              <dt>구매 예정일</dt>
              <dd>
                <input
                  type="date"
                  className="inline-date"
                  value={client.targetPurchaseDate ?? ''}
                  onChange={(e) => onUpdate({ targetPurchaseDate: e.target.value || null })}
                />
                <span className="rel">
                  {client.targetPurchaseDate && relativeLabel(client.targetPurchaseDate, today)}
                </span>
              </dd>
            </div>
            {(client.budgetMin != null || client.budgetMax != null) && (
              <div>
                <dt>예산</dt>
                <dd>{budgetLabel(client.budgetMin, client.budgetMax)}</dd>
              </div>
            )}
            {client.areas && (
              <div>
                <dt>희망 지역</dt>
                <dd>{client.areas}</dd>
              </div>
            )}
            {client.phone && (
              <div>
                <dt>전화</dt>
                <dd>{client.phone}</dd>
              </div>
            )}
            {client.email && (
              <div>
                <dt>이메일</dt>
                <dd className="break">{client.email}</dd>
              </div>
            )}
          </dl>
          {client.notes && <p className="notes">{client.notes}</p>}
        </section>

        <FollowUpCard
          key={client.id}
          client={client}
          onApply={(s) => onUpdate({ nextContactDate: s.nextContactDate })}
        />

        <section className="card">
          <h3>대화 기록</h3>
          <InteractionForm onSubmit={onAddInteraction} />
          {client.interactions.length === 0 ? (
            <p className="muted small">아직 기록된 대화가 없어요.</p>
          ) : (
            <ol className="timeline">
              {client.interactions.map((i) => (
                <li key={i.id}>
                  <span className="tl-icon" title={CHANNEL_META[i.channel].label}>
                    {CHANNEL_META[i.channel].icon}
                  </span>
                  <div className="tl-body">
                    <div className="tl-meta">
                      {formatDate(i.date)} · {CHANNEL_META[i.channel].label}
                      <button
                        className="mini danger"
                        onClick={() => confirm('이 기록을 삭제할까요?') && onDeleteInteraction(i.id)}
                        aria-label="기록 삭제"
                      >
                        삭제
                      </button>
                    </div>
                    <p>{i.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <button
          className="btn ghost danger full"
          onClick={() => confirm(`${client.name} 님을 삭제할까요? 되돌릴 수 없습니다.`) && onDelete()}
        >
          손님 삭제
        </button>
      </div>
    </aside>
  );
}

function InteractionForm({ onSubmit }: { onSubmit: (input: NewInteraction) => void }) {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [channel, setChannel] = useState<Channel>('call');
  const [summary, setSummary] = useState('');
  const [next, setNext] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    onSubmit({ date, channel, summary, nextContactDate: next ? next : undefined });
    setSummary('');
    setNext('');
    setDate(today);
  };

  return (
    <form className="ix-form" onSubmit={submit}>
      <div className="channel-picker">
        {(Object.keys(CHANNEL_META) as Channel[]).map((ch) => (
          <button
            type="button"
            key={ch}
            className={`chip ${channel === ch ? 'on' : ''}`}
            onClick={() => setChannel(ch)}
          >
            {CHANNEL_META[ch].icon} {CHANNEL_META[ch].label}
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="어떤 이야기를 나눴나요? (원하는 조건, 다음 단계, 특이사항…)"
      />
      <div className="ix-row">
        <label className="inline-field">
          <span>날짜</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || today)} />
        </label>
        <label className="inline-field">
          <span>다음 컨택</span>
          <input type="date" value={next} onChange={(e) => setNext(e.target.value)} />
        </label>
        <button className="btn primary" disabled={!summary.trim()}>
          기록 추가
        </button>
      </div>
    </form>
  );
}

function FollowUpCard({ client, onApply }: { client: Client; onApply: (s: FollowUpSuggestion) => void }) {
  const [suggestion, setSuggestion] = useState<FollowUpSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [suggestion]);

  const run = async () => {
    setLoading(true);
    try {
      setSuggestion(await provider.suggest(client));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!suggestion) return;
    try {
      await navigator.clipboard.writeText(suggestion.draftMessage);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="card ai-card">
      <div className="ai-head">
        <h3>✨ 팔로업 제안</h3>
        <button className="btn soft sm" onClick={run} disabled={loading}>
          {loading ? '생성 중…' : suggestion ? '다시 생성' : '제안 받기'}
        </button>
      </div>
      {!suggestion ? (
        <p className="muted small">상태·대화 기록·구매 예정일을 바탕으로 다음 연락 시점과 메시지 초안을 만들어 드려요.</p>
      ) : (
        <div className="ai-result">
          <p className="small">{suggestion.reason}</p>
          <div className="ai-next">
            추천 컨택일 <strong>{formatDate(suggestion.nextContactDate)}</strong> ·{' '}
            {CHANNEL_META[suggestion.channel].icon} {CHANNEL_META[suggestion.channel].label}
          </div>
          <blockquote>{suggestion.draftMessage}</blockquote>
          <div className="ai-actions">
            <button className="btn soft sm" onClick={copy}>
              {copied ? '복사됨 ✓' : '메시지 복사'}
            </button>
            <button className="btn primary sm" onClick={() => onApply(suggestion)}>
              컨택일로 설정
            </button>
          </div>
          <p className="tiny muted">{suggestion.source === 'ai' ? 'AI 생성' : '규칙 기반 제안 · AI 연동 시 자동 업그레이드'}</p>
        </div>
      )}
    </section>
  );
}
